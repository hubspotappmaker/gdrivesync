import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
var config = require('../config.json');

const SimpleSignOn = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [currentURL, setCurrentURL] = useState(null);
  const router = useRouter();

  // Retrieve portalId from URL parameters
  const { hubId } = router.query;

  useEffect(() => {
    if (hubId) {
      // Store portalId in localStorage if it's available
      localStorage.setItem('portalId', hubId);
       handleSignOn();
    }
    
    if (!currentURL) {
      setCurrentURL(window.location.href);
    }

    // Automatically trigger the sign-on process
   
  }, [hubId, currentURL]);

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

  const errorStyle = {
    color: '#d93025',
    marginBottom: '15px',
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>Please sign on with Google to continue</div>
      {error && <div style={errorStyle}>An error occurred: {error.message}</div>}
    </div>
  );
};

export default SimpleSignOn;
