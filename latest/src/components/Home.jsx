import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import axios from "axios";

const GoogleAd = ({ adClient, adSlot }) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
      adClient;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);
  }, [adClient]);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
};

const Home = () => {
  const [fileList, setFileList] = useState([null, null]);
  const [loading, setLoading] = useState(false);
  const fileInputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    
    if (storedAuth === "true") {
      console.log("User is authenticated from localStorage");
      return;
    }
  
    fetch("http://localhost:4000/session", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          throw new Error("Session expired or not found");
        }
      })
      .then((data) => {
        console.log("Session data:", data);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userName", data.user.username);
      })
      .catch((error) => {
        console.log("Error:", error);
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("userName");
      });
  }, [navigate]);

  const addNewFileInput = () => {
    setFileList((prevList) => [...prevList, null]);
  };

  const handleFileChange = (event, index) => {
    const newFileList = [...fileList];
    newFileList[index] = event.target.files[0];
    setFileList(newFileList);
  };

  const handleFileRemove = (index) => {
    const newFileList = [...fileList];
    newFileList[index] = null;
    setFileList(newFileList);

    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const selectedFiles = fileList.filter((file) => file !== null);
    if (selectedFiles.length < 2) {
      alert("Please select at least two files to upload.");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("doc-upload", file);
    });

    setLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLoading(false);
      navigate("/result", { state: { results: response.data } });
    } catch (error) {
      setLoading(false);
      console.error("Upload error:", error);
      alert("Failed to upload: " + (error.response ? error.response.data : "Network Error"));
    }
  };

  return (
    <div className="upload-container">
      <div className="uploadform-container">
        <form id="upload-form" onSubmit={handleSubmit} encType="multipart/form-data">
          <div id="file-inputs">
            {fileList.map((file, index) => (
              <div key={index} className="file-input-group">
                <label htmlFor={`doc-upload-${index + 1}`}>Select DOC to upload:</label>
                <input
                  type="file"
                  id={`doc-upload-${index + 1}`}
                  name="doc-upload"
                  accept=".doc,.docx"
                  onChange={(event) => handleFileChange(event, index)}
                  ref={(el) => (fileInputRefs.current[index] = el)}
                />
                {file && (
                  <button type="button" className="remove-file-btn" onClick={() => handleFileRemove(index)}>
                    ❌
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" id="add-file-btn" onClick={addNewFileInput}>
            ➕ Add Another File
          </button>
          <button type="submit" className="upload-btn" disabled={loading}>
            {loading ? "Processing..." : "Upload DOCs"}
          </button>
        </form>
      </div>

      <div className="welcome-text">
        <h2>Welcome to Question Similarity Finder!</h2>
        <p>
          Our innovative platform is designed to streamline the process of analyzing question
          papers. With advanced algorithms, our website identifies and highlights similar
          questions across multiple question papers, saving time and effort for educators,
          students, and researchers alike.
        </p>
        <p>
          Whether you're preparing for exams, designing new tests, or conducting educational
          research, our tool provides great results and efficiency in question comparison.
        </p>
        <p>Explore now and simplify your academic tasks!</p>
      </div>
      
      {/* Google Ad Section */}
      <GoogleAd adClient="ca-pub-3985590682104919" adSlot="XXXXXXX" />
      </div>
  );
};

export default Home;
