import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthSuccess = ({ setUserProfile }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Processing login...');

  useEffect(() => {
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const provider = searchParams.get('provider');
    const error = searchParams.get('error');

    if (error) {
      setStatus(`Login failed: ${error}`);
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (name && email) {
      // Update user profile with OAuth data
      if (setUserProfile) {
        setUserProfile(prev => ({
          ...prev,
          fullName: name,
          email: email
        }));
      }
      
      setStatus('Login successful! Redirecting...');
      setTimeout(() => navigate('/overview'), 1000);
    } else {
      setStatus('Invalid OAuth response');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [searchParams, navigate, setUserProfile]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
      color: 'white',
      fontSize: '1.5rem',
      gap: '1rem'
    }}>
      <div className="loading-spinner" style={{
        width: '50px',
        height: '50px',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTop: '3px solid #00d4ff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {status}
    </div>
  );
};

export default OAuthSuccess;
