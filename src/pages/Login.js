import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = ({ setUserProfile }) => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formFadeOut, setFormFadeOut] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [shake, setShake] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const [loginError, setLoginError] = useState('');

  const particlesRef = useRef(null);

  // Generate particles on mount
  useEffect(() => {
    if (particlesRef.current) {
      particlesRef.current.innerHTML = '';
      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particlesRef.current.appendChild(particle);
      }
    }
  }, []);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const showError = (field, message, withShake = true) => {
    setErrors(prev => ({ ...prev, [field]: message }));
    if (withShake) {
      setShake(prev => ({ ...prev, [field]: true }));
      setTimeout(() => {
        setShake(prev => ({ ...prev, [field]: false }));
      }, 500);
    }
  };

  const clearError = (field) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Real-time validation (without shake)
    if (name === 'email' && value !== '') {
      if (!emailRegex.test(value)) {
        showError('email', 'Please enter a valid email address', false);
      } else {
        clearError('email');
      }
    }

    if (name === 'password' && value !== '') {
      if (value.length < 6) {
        showError('password', 'Password must be at least 6 characters', false);
      } else {
        clearError('password');
      }
    }

    if (name === 'name' && value !== '') {
      clearError('name');
    }

    if (name === 'confirmPassword' && value !== '') {
      clearError('confirmPassword');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;
    setLoginError('');

    // Validate Name (sign-up only)
    if (isSignUp && formData.name.trim().length < 2) {
      showError('name', 'Please enter your full name', false);
      hasError = true;
    }

    // Validate Email
    if (!emailRegex.test(formData.email)) {
      showError('email', 'Please enter a valid email address', false);
      hasError = true;
    }

    // Validate Password
    if (formData.password.length < 6) {
      showError('password', 'Password must be at least 6 characters', false);
      hasError = true;
    }

    // Validate Confirm Password (sign-up only)
    if (isSignUp && formData.confirmPassword !== formData.password) {
      showError('confirmPassword', 'Passwords do not match', false);
      hasError = true;
    }

    if (hasError) return;

    // Start loading
    setLoading(true);

    const API_URL = 'http://localhost:8000';

    if (isSignUp) {
      // SIGN UP: Call Flask API
      try {
        const response = await fetch(`${API_URL}/api/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          setLoading(false);
          setLoginError(data.message || 'An account with this email already exists. Please login.');
          return;
        }

        // Update user profile
        if (setUserProfile) {
          setUserProfile(prev => ({
            ...prev,
            fullName: formData.name,
            email: formData.email,
            jobTitle: '',
            department: '',
            timezone: ''
          }));
        }

        setLoading(false);
        setFormFadeOut(true);

        // Show success checkmark
        setTimeout(() => {
          setShowSuccess(true);
        }, 500);

        // After success, switch to login mode
        setTimeout(() => {
          setShowSuccess(false);
          setFormFadeOut(false);
          setIsSignUp(false);
          setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            rememberMe: false
          });
          setLoginError('Account created successfully! Please login.');
        }, 2500);

      } catch (error) {
        setLoading(false);
        setLoginError('Server error. Please try again later.');
        console.error('Signup error:', error);
      }

    } else {
      // LOGIN: Call Flask API
      try {
        const response = await fetch(`${API_URL}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          setLoading(false);
          setLoginError(data.message || 'Incorrect email or password. Please try again.');
          showError('email', '', false);
          showError('password', '', false);
          return;
        }

        // Update user profile with logged in user's data
        if (setUserProfile) {
          setUserProfile(prev => ({
            ...prev,
            fullName: data.user.name,
            email: data.user.email
          }));
        }

        setLoading(false);
        setLoginError('Login successful! Redirecting...');
        setFormFadeOut(true);

        // Show success checkmark
        setTimeout(() => {
          setShowSuccess(true);
        }, 500);

        // Navigate to overview after success animation
        setTimeout(() => {
          navigate('/overview');
        }, 2500);

      } catch (error) {
        setLoading(false);
        setLoginError('Server error. Please try again later.');
        console.error('Login error:', error);
      }
    }
  };

  const toggleMode = (e) => {
    e.preventDefault();
    setIsSignUp(!isSignUp);
    setLoginError('');
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      rememberMe: false
    });
    setErrors({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="login-page">
      {/* Animated Background */}
      <div className="bg-animation">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
      </div>

      {/* Particles */}
      <div className="particles" ref={particlesRef}></div>

      {/* Main Card */}
      <div className={`glass-card ${showSuccess ? 'success-glow' : ''}`}>
        {/* Decorative line at top */}
        <div className="decorative-line"></div>

        <h1 className="form-title">{isSignUp ? 'Sign Up' : 'Login'}</h1>

        {/* Login Error/Success Message */}
        {loginError && (
          <div className={`login-message ${loginError.includes('successful') ? 'success' : 'error'}`}>
            {loginError}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {/* Name Input (Sign Up only) */}
          <div className={`input-group ${isSignUp ? 'visible-field' : 'hidden-field'} form-element ${formFadeOut ? 'fade-out' : ''}`}>
            <input
              type="text"
              name="name"
              className={`input-field ${errors.name ? 'has-error' : ''}`}
              placeholder=" "
              value={formData.name}
              onChange={handleInputChange}
            />
            <label className="input-label">Full Name</label>
            <User className="input-icon" />
            <div className={`error-message ${errors.name ? 'visible' : ''}`}>{errors.name}</div>
          </div>

          {/* Email Input */}
          <div className={`input-group form-element ${formFadeOut ? 'fade-out' : ''}`}>
            <input
              type="email"
              name="email"
              className={`input-field ${errors.email ? 'has-error' : ''}`}
              placeholder=" "
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <label className="input-label">Email</label>
            <Mail className="input-icon" />
            <div className={`error-message ${errors.email ? 'visible' : ''}`}>{errors.email}</div>
          </div>

          {/* Password Input */}
          <div className={`input-group form-element ${formFadeOut ? 'fade-out' : ''}`}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              className={`input-field ${errors.password ? 'has-error' : ''}`}
              placeholder=" "
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <label className="input-label">Password</label>
            <Lock className="input-icon" />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <div className={`error-message ${errors.password ? 'visible' : ''}`}>{errors.password}</div>
          </div>

          {/* Confirm Password Input (Sign Up only) */}
          <div className={`input-group ${isSignUp ? 'visible-field' : 'hidden-field'} form-element ${formFadeOut ? 'fade-out' : ''}`}>
            <input
              type="password"
              name="confirmPassword"
              className={`input-field ${errors.confirmPassword ? 'has-error' : ''}`}
              placeholder=" "
              value={formData.confirmPassword}
              onChange={handleInputChange}
            />
            <label className="input-label">Confirm Password</label>
            <Lock className="input-icon" />
            <div className={`error-message ${errors.confirmPassword ? 'visible' : ''}`}>{errors.confirmPassword}</div>
          </div>

          {/* Remember Me & Forgot Password (Login only) */}
          <div className={`remember-forgot ${isSignUp ? 'hidden-field' : ''} form-element ${formFadeOut ? 'fade-out' : ''}`}>
            <label className="remember-label">
              <input
                type="checkbox"
                className="custom-checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
              />
              <span>Remember me</span>
            </label>
            <button type="button" className="link-hover">Forgot Password?</button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`login-btn form-element ${loading ? 'loading' : ''} ${formFadeOut ? 'fade-out' : ''}`}
          >
            <span>{isSignUp ? 'Create Account' : 'Login'}</span>
          </button>

          {/* Divider */}
          <div className={`divider form-element ${formFadeOut ? 'fade-out' : ''}`}>
            <div className="divider-line"></div>
            <span className="divider-text">or continue with</span>
            <div className="divider-line"></div>
          </div>

          {/* Social Login Buttons */}
          <div className={`social-buttons form-element ${formFadeOut ? 'fade-out' : ''}`}>
            <button type="button" className="social-btn" onClick={() => window.location.href = 'http://localhost:8000/auth/google'}>
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>

            <button type="button" className="social-btn" onClick={() => window.location.href = 'http://localhost:8000/auth/github'}>
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>

          {/* Toggle Link */}
          <div className={`toggle-container form-element ${formFadeOut ? 'fade-out' : ''}`}>
            <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
            <button type="button" className="link-hover toggle-link" onClick={toggleMode}>
              {isSignUp ? 'Login' : 'Register'}
            </button>
          </div>
        </form>

        {/* Success Checkmark */}
        <div className={`success-checkmark ${showSuccess ? 'visible' : ''}`}>
          <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Login;
