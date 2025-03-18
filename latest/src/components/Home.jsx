import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const DOWNLOAD_URL = import.meta.env.VITE_DOWNLOAD_URL;
const AD_CLIENT = import.meta.env.VITE_AD_CLIENT;
const AD_SLOT = import.meta.env.VITE_AD_SLOT;

const GoogleAd = ({ adClient, adSlot }) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
      AD_CLIENT;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={AD_CLIENT}
      data-ad-slot={AD_SLOT}
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
  
    fetch(`${BACKEND_URL}/session`, {
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
    const file = event.target.files[0];
  
    if (file) {
      const allowedTypes = [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];
  
      if (!allowedTypes.includes(file.type)) {
        alert("Only .doc and .docx files are allowed.");
        event.target.value = ""; // Reset input field
        return;
      }
  
      const newFileList = [...fileList];
      newFileList[index] = file;
      setFileList(newFileList);
    }
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
      const response = await axios.post(`${DOWNLOAD_URL}/upload`, formData, {
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
                <div>
                <input
                  type="file"
                  id={`doc-upload-${index + 1}`}
                  name="doc-upload"
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => handleFileChange(event, index)}
                  ref={(el) => (fileInputRefs.current[index] = el)}
                />
                {file && (
                  <button type="button" className="remove-file-btn" onClick={() => handleFileRemove(index)}>
                    ❌
                  </button>
                )}
              </div>
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
          Our platform is here to help you easily compare questions from different question papers. 
          It quickly finds similar questions, saving you valuable time and effort. Whether you're a teacher, 
          student, or researcher, this tool can make your work much easier and more organized.  
        </p>
        <p>
          If you're preparing for exams, creating new tests, or working on educational research, 
          our tool simplifies the process of analyzing question papers. It ensures you can focus on what truly 
          matters while leaving the tedious comparisons to us.  
        </p>
        <p>Start exploring today and experience how effortless academic tasks can become!</p>
      </div>
      
      {/* Google Ad Section */}
      <GoogleAd />
      </div>
  );
};

export default Home;