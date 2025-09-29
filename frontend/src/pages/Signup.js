import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: ''
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
    // Handle signup logic here
    console.log('Signup attempt:', formData);
    // Redirect to dashboard after successful signup
    navigate('/app/dashboard');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-brand">HYDRO INDEX</h1>
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Join us to start analyzing water quality data</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="username" className="auth-label">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="auth-input"
              placeholder="Choose a username"
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="email" className="auth-label">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="role" className="auth-label">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="auth-input"
              required
            >
              <option value="">Select your role</option>
              <option value="scientist">Scientist</option>
              <option value="policymaker">Policy Maker</option>
              <option value="researcher">Researcher</option>
            </select>
          </div>

          <div className="auth-form-group">
            <label htmlFor="password" className="auth-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="auth-input"
              placeholder="Create a strong password"
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="confirmPassword" className="auth-label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="auth-input"
              placeholder="Confirm your password"
              required
            />
          </div>

          <button type="submit" className="auth-button primary">
            Create Account
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Already have an account? <Link to="/login" className="auth-link">Log in</Link>
          </p>
          <Link to="/" className="auth-back-link">← Back to home</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;