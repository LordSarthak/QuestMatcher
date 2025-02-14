import React, { useState, useEffect } from "react";
import "./Login.css";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import gmailLogo from "../assets/gmail-logo.png";
import facebookLogo from "../assets/facebook-logo.png";
import { Link, useNavigate, useLocation } from "react-router-dom";


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
// const FACEBOOK_APP_ID = "YOUR_FACEBOOK_APP_ID";

function Login({ setIsAuthenticated, setUserName, setEmail, setAccountMenuOpen }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.redirectTo || "/";
  const additionalState = location.state || {};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors

    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
        credentials: "include", // Include session cookies
      });

      const data = await response.json();

      if (response.ok) {
        // alert("Login successful!");
        setIsAuthenticated(true);
        setUserName(data.user.username);
        setEmail(data.user.email); // Store the user's email

        // Redirect back to the intended page with its state
        navigate(redirectTo, { state: { ...additionalState, shouldDownload: true } });

        // Refresh the page
        window.location.reload();
      } else {
        setErrorMessage(data.message || "Invalid username or password!");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="abcd">
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="login-container">
          <h2>Login</h2>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <span className="eye-icon" onClick={togglePasswordVisibility}>
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </span>
              </div>
              <p className="forgot-password">
                <Link to="/forgot-password">Forgot Password?</Link>
              </p>
            </div>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <button type="submit" className="login-button">
              Login
            </button>
          </form>

          <div className="or-divider">
            <hr className="line" />
            <span className="or-text">OR</span>
            <hr className="line" />
          </div>

          <div className="social-login">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                fetch("http://localhost:4000/auth/google", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token: credentialResponse.credential }),
                  credentials: "include",
                })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.token) {
                      // alert("Google login successful!");
                      setIsAuthenticated(true);
                      setUserName(data.user.username);
                      setEmail(data.user.email);
                      
                      //setAccountMenuOpen(true); // Open account menu after Google login
                      navigate(redirectTo, { state: { ...additionalState } });
                      window.location.reload();
                    } else {
                      setErrorMessage("Google login failed!");
                    }
                  })
                  .catch(() => setErrorMessage("An error occurred. Please try again."));
              }}
              onError={() => setErrorMessage("Google Login Failed")}
            />

            {/* <button className="social-button facebook-button" onClick={handleFacebookLogin}>
              <img src={facebookLogo} alt="Facebook Logo" className="social-icon" />
              Log In with Facebook
            </button> */}
          </div>

          <p className="no-account">
            I don't have an account? <Link to="/signUp">Sign Up</Link>
          </p>
        </div>
      </GoogleOAuthProvider>
    </div>
  );
}

export default Login;
