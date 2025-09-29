import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login attempt:', formData);
    // Redirect to dashboard after successful login
    navigate('/app/dashboard');
  };

  const handleGoogleLogin = () => {
    // Handle Google login logic here
    console.log('Google login attempt');
    navigate('/app/dashboard');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-brand">HYDRO INDEX</h1>
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Log in to your account to continue</p>
        </div>

        {/* Google Login Button */}
        <button 
          type="button" 
          className="google-auth-button"
          onClick={handleGoogleLogin}
        >
          <svg className="google-icon" width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="email" className="auth-label">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="auth-form-group">
            <div className="auth-label-wrapper">
              <label htmlFor="password" className="auth-label">Password</label>
              
            </div>
            
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="auth-input"
              placeholder="Enter your password"
              required
            />
          </div>
          <Link to="/forgot-password" className="auth-forgot-link">
                Forgot password?
              </Link>
          <button type="submit" className="auth-button primary">
            Log in
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
          </p>
          <Link to="/" className="auth-back-link">← Back to home</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;