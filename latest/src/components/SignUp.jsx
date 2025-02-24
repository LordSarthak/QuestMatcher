import React, { useState } from 'react';
import './SignUp.css';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import gmailLogo from '../assets/gmail-logo.png';
import facebookLogo from '../assets/facebook-logo.png';
import axios from "axios";  // Make sure to import axios at the top

// const loadGoogleScript = () => {
//   const script = document.createElement('script');
//   script.src = 'https://accounts.google.com/gsi/client';
//   script.async = true;
//   script.defer = true;
//   document.body.appendChild(script);
// };

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.redirectTo || "/";
  const additionalState = location.state || {};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match!');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      if (response.ok) {
        alert('Signup successful!');
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        navigate("/login");
        setErrorMessage('');
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'An error occurred!');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrorMessage('An error occurred while signing up.');
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  // const handleGoogleSignUp = () => {
  //   loadGoogleScript();
  //   window.onload = () => {
  //     window.google.accounts.id.initialize({
  //       client_id: 'YOUR_GOOGLE_CLIENT_ID',
  //       callback: (response) => {
  //         console.log('Google JWT:', response.credential);
  //         alert('Google sign-in successful!');
  //       }
  //     });
  //     window.google.accounts.id.prompt();
  //   };
  // };

  // const handleFacebookSignUp = () => {
  //   alert('Redirecting to Facebook sign-up...');
  //   window.location.href = 'https://www.facebook.com/';
  // };

  return (
    <>
    <div className="abcd">
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <div className="signup-container">
      <h2>Sign Up</h2>
      <form className="signup-form" onSubmit={handleSubmit}>
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
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <div className="password-container">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <span
              className="eye-icon"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </span>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <div className="password-container">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <span
              className="eye-icon"
              onClick={toggleConfirmPasswordVisibility}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </span>
          </div>
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button type="submit" className="signup-button">Sign Up</button>
      </form>
      <div className="or-divider">
        <hr className="line" />
        <span className="or-text">OR</span>
        <hr className="line" />
      </div>
      <div className="social-signup">
      <GoogleLogin
              onSuccess={(credentialResponse) => {
                fetch(`${BACKEND_URL}/auth/google`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token: credentialResponse.credential }),
                  credentials: "include",
                })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.token) {
                      // alert("Google login successful!");
                      // setIsAuthenticated(true);
                      // setUserName(data.user.username);
                      // setAccountMenuOpen(true); // Open account menu after Google login
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
        {/* <button className="social-button email-button" onClick={handleGoogleSignUp}>
          <img src={gmailLogo} alt="Google Logo" className="social-icon" />
          Sign Up with Google
        </button>
        <button className="social-button facebook-button" onClick={handleFacebookSignUp}>
          <img src={facebookLogo} alt="Facebook Logo" className="social-icon" />
          Sign Up with Facebook
        </button> */}
      </div>
      <p className="already-account">
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
    </GoogleOAuthProvider>
    </div>
    </>
  );
}

export default SignUp;
