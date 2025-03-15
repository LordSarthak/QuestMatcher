import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from docx import Document
from sentence_transformers import SentenceTransformer, util
import io
from docx.shared import RGBColor, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

from dotenv import load_dotenv
from waitress import serve

# Load environment variables
load_dotenv()

# Get FLASK_PORT from .env
FLASK_PORT = os.getenv("FLASK_PORT")  # Default to 5001 if not set

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Load NLP models
nlp = SentenceTransformer('all-MiniLM-L6-v2')

# List of interrogative words and question-related keywords
INTERROGATIVE_WORDS = ["what", "who", "why", "how", "where", "when", "which", "whom", "do", "does", "did", "has", "have", "had", "is", "was", "are", "were", "am", "will", "would", "can", "could", "shall", "should", "may", "might"]
QUESTION_KEYWORDS = ["explain", "define", "describe", "justify", "discuss", "state the", "analyze", "compare", "elaborate", "_______", "of the passage", "by the passage", "from the passage", "in the passage", "is the passage", "write", "find", "evaluate"]

def preprocess_question(question):
    """
    Preprocesses a question by stripping whitespace and converting to lowercase.
    """
    return question.strip().lower()

def extract_questions_from_docx(file_path):
    """
    Extracts questions from a .docx file.
    """
    document = Document(file_path)
    questions = []

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()
        if not text:
            continue  # Skip empty lines

        # Check for heuristic-based questions
        if text.endswith(("?", ":", ":-", "is", "was", "are", "were", "because", "from", "among", "has", "have", "had", 
                        "that", "which", "to", "_______", "as", "means", "mean", "meant", "will", "would", "can", 
                        "could", "shall", "should", "may", "might")):
            questions.append(text)

        # Use NLP model for additional checks
        embeddings = nlp.encode([text.lower()])
        
        if embeddings.any():
            # Check if the first word is an interrogative word
            if (text.split()[0].lower() in INTERROGATIVE_WORDS and not text.endswith("!") and not text.endswith(".")):
                questions.append(text)

            # Check for question-related keywords in the sentence
            if (any(keyword in text.lower() for keyword in QUESTION_KEYWORDS) and not text.endswith("!")):
                questions.append(text)    
                    
    return questions

def find_similar_questions(reference_questions, all_questions, all_embeddings=None, threshold=0.60):
    """
    Finds similar questions in all_questions for each question in reference_questions,
    ensuring results are in their original form and without duplicates.
    """
    results = {}
    ref_embeddings = nlp.encode(reference_questions, convert_to_tensor=True)
    all_embeddings = nlp.encode(all_questions, convert_to_tensor=True) if all_embeddings is None else all_embeddings

    seen_questions = set()  # Track already processed questions to avoid duplicates

    for i, ref_question in enumerate(reference_questions):
        similarities = util.pytorch_cos_sim(ref_embeddings[i], all_embeddings)[0]
        similar_questions = []

        for j, similarity in enumerate(similarities):
            if similarity >= threshold and all_questions[j] != ref_question:
                original_question = all_questions[j]  # Use the original question text
                if original_question not in seen_questions:
                    similar_questions.append({
                        "question": original_question,  # Append original form
                        "score": float(similarity)
                    })
                    seen_questions.add(original_question)  # Mark as seen

        if similar_questions:
            results[reference_questions[i]] = similar_questions  # Use original reference question

    return results

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_files():
    if 'doc-upload' not in request.files:
        return jsonify({'error': 'No files provided'}), 400

    files = request.files.getlist('doc-upload')
    if len(files) < 2:
        return jsonify({'error': 'At least two files are required'}), 400

    file_paths = []
    for file in files:
        if file.filename.endswith(('.docx', '.doc')):
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(file_path)
            file_paths.append(file_path)

    if not file_paths:
        return jsonify({'error': 'No valid .docx files uploaded'}), 400

    # Process files
    all_questions = []
    file_mappings = []

    for i, file_path in enumerate(file_paths):
        questions = extract_questions_from_docx(file_path)
        all_questions.extend(questions)  # Use the original questions
        file_mappings.extend([f"Paper {i + 1}"] * len(questions))

    reference_questions = extract_questions_from_docx(file_paths[0])  # Keep original form for reference

    # Find similar questions from the reference paper across other papers
    threshold = 0.5  # Start with a lower threshold
    results = find_similar_questions(reference_questions, all_questions, threshold=threshold)

    return jsonify(results)

@app.route('/download', methods=['POST'])
def download_docx():
    data = request.json  # Expecting JSON input with results
    
    # Create a new Word document
    document = Document()
    heading = document.add_heading(level=1)
    heading_run = heading.add_run('Similar Questions Report')
    heading_run.font.color.rgb = RGBColor(0, 0, 0)  # Set text color to a custom blue
    heading_run.font.size = Pt(20)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    document.add_paragraph()

    for ref_question, similar_questions in data.items():
        # Add Reference Question with a different color
        ref_para = document.add_paragraph()
        ref_run = ref_para.add_run(f"Reference Question -  {ref_question}")
        ref_run.bold = True
        ref_run.font.color.rgb = RGBColor(150, 75, 0)  # Set text color to blue
        ref_run.font.size = Pt(13)  # Set font size to 14 points

        # Add "Similar Questions" heading
        similar_heading = document.add_paragraph("Similar Questions:", style='Heading 2')
        for run in similar_heading.runs:
            run.font.color.rgb = RGBColor(255, 0, 0)  # Set text color to red
            run.font.size = Pt(14)

        # Add similar questions as a bulleted list
        for i, match in enumerate(similar_questions, start=1):
            document.add_paragraph(
                f"{i}. {match['question']}",  #(Question Matches {match['score']*100:.0f}%)",
            )
        document.add_paragraph()

    # Save document to an in-memory file
    file_stream = io.BytesIO()
    document.save(file_stream)
    file_stream.seek(0)

    return send_file(
        file_stream,
        as_attachment=True,
        download_name='similar_questions.docx',
        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )

if __name__ == "__main__":
    serve(app, host="127.0.0.1", port=int(FLASK_PORT))