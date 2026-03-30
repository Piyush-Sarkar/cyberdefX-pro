import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthCallback = ({ provider, setUserProfile }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (code) {
      // Send code to Flask backend to exchange for tokens
      fetch(`http://localhost:8000/api/auth/${provider}/callback?code=${code}`, {
        method: 'GET',
        credentials: 'include',
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Update user profile
            if (setUserProfile) {
              setUserProfile(prev => ({
                ...prev,
                fullName: data.user.name,
                email: data.user.email
              }));
            }
            setStatus('Login successful! Redirecting...');
            setTimeout(() => navigate('/overview'), 1000);
          } else {
            setStatus('Login failed: ' + data.message);
            setTimeout(() => navigate('/login'), 2000);
          }
        })
        .catch(error => {
          console.error('OAuth callback error:', error);
          setStatus('Login failed. Redirecting...');
          setTimeout(() => navigate('/login'), 2000);
        });
    } else {
      setStatus('No authorization code received');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [searchParams, provider, navigate, setUserProfile]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
      color: 'white',
      fontSize: '1.5rem'
    }}>
      {status}
    </div>
  );
};

export default OAuthCallback;
