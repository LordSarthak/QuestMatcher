import './App.css';
import Navbar from './components/Navbar';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Home from './components/Home';
import Results from './components/Results';
import Help from './components/Help';
import Contact from './components/Contact';
import SignUp from './components/SignUp';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AccountInfo from './components/AccountInfo';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState(""); // ✅ Define setEmail here
  const [loading, setLoading] = useState(true);

  // Check authentication on first load
  useEffect(() => {
    axios.get(`${BACKEND_URL}/session`, { withCredentials: true })
      .then(response => {
        if (response.status === 200 && response.data.user) {
          setIsAuthenticated(true);
          setUserName(response.data.user.username);
          setEmail(response.data.user.email);
        } else {
          setIsAuthenticated(false);
          setUserName('');
          setEmail('');
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUserName('');
        setEmail('');
      })
      .finally(() => setLoading(false));
  }, []);

  const router = createBrowserRouter([
    {
      path: '/',
      element: <><Navbar isAuthenticated={isAuthenticated} userName={userName} email={email} setIsAuthenticated={setIsAuthenticated} setUserName={setUserName} setEmail={setEmail} /><Home /></>,
    },
    {
      path: '/result',
      element: <><Navbar isAuthenticated={isAuthenticated} userName={userName}  email={email} setIsAuthenticated={setIsAuthenticated} setUserName={setUserName} setEmail={setEmail} /><Results /></>,
    },
    { 
      path: '/contact',
      element: <><Navbar isAuthenticated={isAuthenticated} userName={userName}  email={email} setIsAuthenticated={setIsAuthenticated} setUserName={setUserName} setEmail={setEmail} /><Contact /></>,
    },
    { 
      path: '/help',
      element: <><Navbar isAuthenticated={isAuthenticated} userName={userName}  email={email} setIsAuthenticated={setIsAuthenticated} setUserName={setUserName} setEmail={setEmail} /><Help /></>,
    },
    { 
      path: '/signUp',
      element: <><Navbar isAuthenticated={isAuthenticated} userName={userName}  email={email} setIsAuthenticated={setIsAuthenticated} setUserName={setUserName} setEmail={setEmail} /><SignUp /></>,
    },
    { 
      path: '/login',
      element: <><Navbar isAuthenticated={isAuthenticated} userName={userName}  email={email} setIsAuthenticated={setIsAuthenticated} setUserName={setUserName} setEmail={setEmail} /><Login setIsAuthenticated={setIsAuthenticated} setUserName={setUserName} setEmail={setEmail} /></>,
    },
    { 
      path: '/forgot-password',
      element: <><Navbar isAuthenticated={isAuthenticated} userName={userName}  email={email} setIsAuthenticated={setIsAuthenticated} setUserName={setUserName} setEmail={setEmail} /><ForgotPassword /></>,
    },
    {
      path: '/reset-password',
      element: <><Navbar isAuthenticated={isAuthenticated} userName={userName}  email={email} setIsAuthenticated={setIsAuthenticated} setUserName={setUserName} setEmail={setEmail} /><ResetPassword /></>,
    },
    { 
      path: '/accountinfo',
      element: <><Navbar isAuthenticated={isAuthenticated} userName={userName}  email={email} setIsAuthenticated={setIsAuthenticated} setUserName={setUserName} setEmail={setEmail} /><AccountInfo /></>,
    },
  ]);

  if (loading) {
    return <div>Loading...</div>; // Prevent rendering before session check
  }

  return (
    <RouterProvider router={router} />
  );
}

export default App;
