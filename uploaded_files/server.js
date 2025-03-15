require("dotenv").config(); // Load environment variables at the very top

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();

// Load environment variables
const FLASK_PORT = process.env.FLASK_PORT;
const PORT2 = process.env.PORT2; // Ensure PORT2 is properly defined

// Enable CORS for external access
app.use(cors());

// Increase request size limit for large files
app.use(express.json({ limit: "99999mb" }));
app.use(express.urlencoded({ extended: true, limit: "99999mb" }));

// Start Flask server automatically
const isWindows = process.platform === "win32";
const FLASK_SCRIPT = isWindows
    ? `python abcd.py`
    : `gunicorn -w 4 abcd:app --bind 127.0.0.1:${FLASK_PORT}`;
exec(FLASK_SCRIPT, (err, stdout, stderr) => {
    if (err) {
        console.error("❌ Error starting Flask server:", err);
    } else {
        console.log(`✅ Flask server started successfully on port ${FLASK_PORT}`);
    }
});

// Ensure uploads directory exists
const uploadBaseDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadBaseDir)) {
    fs.mkdirSync(uploadBaseDir, { recursive: true });
}

// Middleware to create a single directory for each request
app.use((req, res, next) => {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, ""); // Generate unique folder name
    const dirPath = path.join(__dirname, "uploads", timestamp);

    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true }); // Create directory
        }
        req.submissionDir = dirPath;
        next();
    } catch (err) {
        console.error("❌ Error creating directory:", err);
        res.status(500).send("Error creating upload directory.");
    }
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!req.submissionDir) {
            return cb(new Error("Upload directory not initialized"));
        }
        cb(null, req.submissionDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 99999 * 1024 * 1024 }, // 99999MB limit
});

// File Upload Endpoint
app.post("/upload", upload.array("doc-upload", 100), (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).send("No files uploaded.");
        }

        console.log("✅ Uploaded files:", files);
        res.status(200).json({
            message: "Files uploaded successfully.",
            directory: req.submissionDir ? path.basename(req.submissionDir) : null,
        });
    } catch (err) {
        console.error("❌ Error uploading files:", err);
        res.status(500).send("Error uploading files.");
    }
});

// Serve Uploaded Files
app.use("/uploads", express.static(uploadBaseDir));

// Start Express Server
app.listen(PORT2);