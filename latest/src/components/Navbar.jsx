import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import websiteLogo from '../assets/website-logo.png';
import loginImage from '../assets/login-image.png';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Navbar = ({ isAuthenticated, setIsAuthenticated, userName, setUserName, setEmail }) => {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false); // Ensure authentication is checked before rendering
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // New state for mobile menu
  const navigate = useNavigate();
  const dropdownRef = useRef(null); // ✅ Ref to track dropdown container
  const location = useLocation(); // Get current route
  const sidebarRef = useRef(null);

  useEffect(() => {
    setAccountMenuOpen(false); // Close dropdown on route change
  }, [location]); // Runs whenever the route changes

  // Close mobile menu if user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    // ✅ Read authentication state from localStorage first
    const storedAuth = localStorage.getItem('isAuthenticated') === 'true';
    const storedUserName = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('email');

    if (storedAuth && storedUserName) {
      setIsAuthenticated(true);
      setUserName(storedUserName);
      setEmail(storedEmail || "");
    }

    // ✅ Verify session with backend
    axios
      .get(`${BACKEND_URL}/session`, { withCredentials: true })
      .then((response) => {
        if (response.status === 200 && response.data.user) {
          const { username, email } = response.data.user; // ✅ Corrected destructuring
          setIsAuthenticated(true);
          setUserName(username);
          setEmail(email);
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userName', username);
          localStorage.setItem('email', email);
        } else {
          setIsAuthenticated(false);
          setUserName('');
          setEmail('');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('userName');
          localStorage.removeItem('email');
          localStorage.clear();
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUserName('');
        setEmail('');

        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userName');
        localStorage.removeItem('email');
        localStorage.clear();
      })
      .finally(() => setAuthChecked(true)); // ✅ Authentication check complete
  }, [setIsAuthenticated, setUserName, setEmail]);

  useEffect(() => {
    // ✅ Function to handle clicks outside the dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };

    // ✅ Add event listener when the dropdown is open
    if (accountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // ✅ Cleanup event listener when dropdown closes
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [accountMenuOpen]);

  const handleLogout = () => {
    axios
      .post(`${BACKEND_URL}/logout`, {}, { withCredentials: true })
      .then(() => {
        setIsAuthenticated(false);
        setUserName('');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userName');
        localStorage.removeItem('email');
        localStorage.clear();

        alert('Logged out successfully!');
        navigate('/');
        // Refresh the page
        window.location.reload();
      })
      .catch(() => alert('Failed to log out'));
  };

  // ✅ Prevent flickering by ensuring authentication check is complete before rendering
  if (!authChecked) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <nav>
        <div className="left-section">
          <NavLink to="/">
            <img src={websiteLogo} alt="Website Logo" className="website-name-logo" />
          </NavLink>
          <NavLink className={(e) => (e.isActive ? 'red' : '')} to="/">
            <li>Home</li>
          </NavLink>
        </div>
        <div className="right-links">
          <NavLink className={(e) => (e.isActive ? 'red' : '')} to="/contact">
            <li>📞 Contact Us</li>
          </NavLink>
          <NavLink className={(e) => (e.isActive ? 'red' : '')} to="/help">
            <li>❓ Help</li>
          </NavLink>
          {isAuthenticated ? (
            <div className="account-container">
              <div onClick={() => setAccountMenuOpen(!accountMenuOpen)} className="account-name">
                <img src={loginImage} alt="login-image" className="login-image" />
                <i className={`dropdown-icon ${accountMenuOpen ? 'open' : ''}`}></i>
              </div>
              {accountMenuOpen && (
                <div ref={dropdownRef} className="account-dropdown">
                  <p className="account-email">{userName}</p>
                  <NavLink to="/accountinfo" className="dropdown-item">
                    <i className="icon">👤</i> Account Information
                  </NavLink>
                  <NavLink to="/contact" className="dropdown-item">
                    <i className="icon">📞</i> Contact Us
                  </NavLink>
                  <NavLink to="/help" className="dropdown-item">
                    <i className="icon">❓</i> Help
                  </NavLink>
                  <button className="logout-button" onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/signUp" className={(e) => (e.isActive ? 'red' : '')}>
                <li>Sign Up</li>
              </NavLink>
              <NavLink to="/login" className={(e) => (e.isActive ? 'red' : '')}>
                <li>Login</li>
              </NavLink>
            </>
          )}
        </div>
        {/* Mobile Menu */}
        <div className="mobile-menu">
  {/* Hamburger Menu */}
  <div 
    className={`hamburger-menu ${mobileMenuOpen ? 'open' : ''}`} 
    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
  >
    <span></span>
    <span></span>
    <span></span>
    </div>
    <br/>
    <br/>
    <br/>
    {/* Sidebar Menu */}
  <div ref={sidebarRef} className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
    <ul className="mobile-nav-links">
      {isAuthenticated ? (
        <>
          <p className="close-btn" onClick={() => setMobileMenuOpen(false)}>✖</p>
          <br/>
          <p className="account-email">{userName || "User"}</p>
          <NavLink to="/accountinfo" className="dropdown-item" onClick={() => setMobileMenuOpen(false)}>
            <li>👤 Account Information</li>
          </NavLink>
          <NavLink to="/contact" className="dropdown-item" onClick={() => setMobileMenuOpen(false)}>
            <li>📞 Contact Us</li>
          </NavLink>
          <NavLink to="/help" className="dropdown-item" onClick={() => setMobileMenuOpen(false)}>
            <li>❓ Help</li>
          </NavLink>
          <button className="logout-button" onClick={handleLogout}>
            Log out
          </button>
        </>
      ) : (
        <>
          <p className="close-btn" onClick={() => setMobileMenuOpen(false)}>✖</p>
          <NavLink to="/signUp" className="dropdown-item"  onClick={() => setMobileMenuOpen(false)}>
            <li>👤 Sign Up</li>
          </NavLink>
          <NavLink to="/login" className="dropdown-item"  onClick={() => setMobileMenuOpen(false)}>
            <li>👤 Login</li>
          </NavLink>
          <NavLink to="/contact" className="dropdown-item" onClick={() => setMobileMenuOpen(false)}>
            <li>📞 Contact Us</li>
          </NavLink>
          <NavLink to="/help" className="dropdown-item" onClick={() => setMobileMenuOpen(false)}>
            <li>❓ Help</li>
          </NavLink>
        </>
      )}
    </ul>
  </div>
</div>
      </nav>
    </div>
  );
};

export default Navbar;
