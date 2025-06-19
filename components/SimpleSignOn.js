import React, { useState, useEffect } from 'react';
import axios from 'axios';
var config = require('../config.json');

const SimpleSignOn = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [currentURL, setCurrentURL] = useState(null);

  useEffect(() => {
    if (!currentURL) {
      setCurrentURL(window.location.href);
    }
  }, [currentURL]);

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSignOn = () => {
    try {
      window.location.href =
        'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent&response_type=code&client_id=' +
        config.api.client_id +
        '&redirect_uri=' +
       config.api.redirect_url +
        '&scope=' +
        config.api.scopes;
    } catch (err) {
      setError(err);
    }
  };

  const handleAccessTokenExpiration = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const config = localStorage.getItem('config');

      const response = await axios.post('https://oauth2.googleapis.com/token', {
        refresh_token: refreshToken,
        client_id: config.api.client_id,
        client_secret: config.api.client_secret,
        grant_type: 'refresh_token',
      });

      const accessToken = response.data.access_token;
      localStorage.setItem('access_token', accessToken);
    } catch (err) {
      console.error(err);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '50px',
    height: '200px',
    backgroundColor: '#f9f9f9',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    textAlign: 'center',
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    fontSize: '16px',
    color: '#fff',
    backgroundColor: '#4285F4',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  };

  const logoStyle = {
    width: '20px',
    height: '20px',
    marginRight: '10px',
    backgroundColor: '#fff',
    borderRadius: '2px',
    padding: '2px',
  };

  const errorStyle = {
    color: '#d93025',
    marginBottom: '15px',
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>Please sign on with Google to continue</div>
      {error && <div style={errorStyle}>An error occurred: {error.message}</div>}
      <button style={buttonStyle} onClick={handleSignOn}>
        <img
          style={logoStyle}
          src="https://www.gstatic.com/images/branding/searchlogo/ico/favicon.ico"
          alt="Google logo"
        />
        Sign On with Google
      </button>
    </div>
  );
};

export default SimpleSignOn;
