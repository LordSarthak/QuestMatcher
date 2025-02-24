import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Results.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const DOWNLOAD_URL = import.meta.env.VITE_DOWNLOAD_URL;

const Results = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const results = state?.results || null;
  const shouldDownload = state?.shouldDownload || false; // Indicates if the download was intended
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Check session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/session`, {
          withCredentials: true,
        });
        if (response.status === 200) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Session check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setHasCheckedAuth(true); // Session check complete
      }
    };

    checkSession();
  }, []);

  // Trigger download if user is authenticated and intended to download
  useEffect(() => {
    if (isAuthenticated && shouldDownload) {
      handleDownload();
    }
  }, [isAuthenticated, shouldDownload]); // Runs when auth or shouldDownload changes

  const handleDownload = async () => {
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      navigate("/login", {
        state: { redirectTo: "/result", shouldDownload: true, results },
      });
      return;
    }

    try {
      const response = await axios.post(
        `${DOWNLOAD_URL}/download`,
        results,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "similar_questions.docx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  // Redirect to home if no results
  useEffect(() => {
    if (!results && hasCheckedAuth) {
      console.warn("No results found. Redirecting to home.");
      navigate("/");
    }
  }, [results, navigate, hasCheckedAuth]);

  // Render loading state until session is checked
  if (!hasCheckedAuth) {
    return <p>Loading...</p>;
  }

  return (
    <div className="results-container">
      <h2>Similar Questions:</h2>
      {results ? (
        Object.entries(results).map(([question, similars], i) => (
          <div key={i}>
            <h3>{question}</h3>
            <ol>
              {similars.map((similar, j) => (
                <li key={j}>{similar.question}</li>
              ))}
            </ol>
          </div>
        ))
      ) : (
        <p>No results available</p>
      )}
      <button onClick={handleDownload}>Download Report</button>
      <button onClick={() => navigate("/")}>Back to Home</button>
    </div>
  );
};

export default Results;
