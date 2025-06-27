import React, { useEffect, useState } from 'react';

// Main App Component for Auth Success Display
const App = () => {
  const [folderId, setFolderId] = useState(null);
  const [portalId, setPortalId] = useState(null);
  const [rootFolder, setRootFolder] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [status, setStatus] = useState(''); // Added status state to handle success/failure messages

  useEffect(() => {
    // Function to parse URL query parameters
    const getQueryParams = () => {
      const params = {};
      window.location.search.substring(1).split('&').forEach(param => {
        const parts = param.split('=');
        if (parts.length === 2) {
          params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
        }
      });
      return params;
    };

    const query = getQueryParams();

    // Populate state from URL query parameters
    if (query.folder_id) {
      setFolderId(query.folder_id);
    }

    // Retrieve the portalId, root folder, and access_token from localStorage
    // Note: The user's provided code uses 'portalId' and 'folder_id' for localStorage keys.
    const storedPortalId = localStorage.getItem('portalId');
    const storedRootFolder = localStorage.getItem('folder_id'); // This might conflict if folder_id also comes from URL
    const storedAccessToken = localStorage.getItem('gdrivetoken'); // This is stored as a stringified JSON

    if (storedPortalId) {
      setPortalId(storedPortalId);
    }
    if (storedRootFolder) {
      setRootFolder(storedRootFolder); 
    }
    if (storedAccessToken) {
      setAccessToken(storedAccessToken); 
    }

    // Combine current state values and local storage values for subsequent fetches/submissions
    // This effect needs to react to changes in portalId and accessToken for API calls.
    // The dependency array should reflect this.

  }, []); // Run once to get initial URL and localStorage values



  useEffect(() => {
    
    if (portalId && accessToken && folderId) {
      fetch('https://gdrive.nexce.io/fe/api/db/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: portalId,
          token: accessToken,
          folder_id: folderId,
          platform_name: 'google_drive',
          installed_date:'1242343'

        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Data submission failed');
          return res.json();
        })
        .then(() => {
          setStatus('✅ Data submitted successfully!');
          // Redirect to the desired URL after successful data submission
          window.location.href = 'https://gdrive.nexce.io/connect-platform-app/application/connect_google';
        })
        .catch((err) => {
          console.error('[CLIENT ERROR]', err);
          setStatus('❌ Failed to submit data');
        });
    }
    // The dependencies for this effect are crucial to ensure it runs only when needed.
    // It should run when any of the data points required for the API call become available.
  }, [portalId, accessToken, folderId]);


  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          background-color: #e6f3ff; /* Light blue background */
          display: flex;
          flex-direction: column; /* Changed to column for footer */
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          color: #333;
        }

        .container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          flex-grow: 1; /* Allow container to grow and push footer down */
          padding: 2rem;
          text-align: center;
          width: 100%;
        }

        .main {
          padding: 3rem 1.5rem;
          border-radius: 15px;
          background-color: #ffffff;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15); /* More pronounced shadow */
          max-width: 600px;
          width: 100%;
          border: 1px solid #cceeff; /* Light blue border */
          margin-bottom: 20px; /* Space between main content and footer */
        }

        .main h1 {
          font-size: 2.8rem; /* Larger heading */
          color: #28a745; /* Green for success */
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
        }

        .main p {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          background-color: #f9f9f9;
          padding: 0.8rem 1.2rem;
          border-radius: 8px;
          border: 1px solid #eee;
          text-align: left;
          word-wrap: break-word; /* Ensure long IDs wrap */
        }

        .main p strong {
          color: #007bff; /* Blue for labels */
          margin-right: 0.5rem;
        }

        .footer {
          padding: 1rem;
          color: #666;
          font-size: 0.9rem;
          margin-top: auto; /* Push footer to the bottom */
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .main {
            padding: 2rem 1rem;
          }

          .main h1 {
            font-size: 2.2rem;
            flex-direction: column;
            gap: 10px;
          }

          .main p {
            font-size: 1rem;
            padding: 0.7rem 1rem;
          }
        }

        @media (max-width: 480px) {
          .main h1 {
            font-size: 1.8rem;
          }

          .main p {
            font-size: 0.9rem;
          }
        }
      `}</style>
      <div className="container">
        <main className="main">
          <h1>✅ Authenticated!</h1>
          {folderId && (
            <p><strong>📁 Folder ID:</strong> {folderId}</p>
          )}
          {portalId && (
            <p><strong>🔑 Portal ID:</strong> {portalId}</p>
          )}
          {rootFolder && (
            <p><strong>📂 Root Folder:</strong> {rootFolder}</p>
          )}
          {accessToken && (
            <p><strong>🔑 Access Token:</strong> {accessToken}</p>
          )}
          {status && ( 
            <p>{status}</p>
          )}
        </main>

        <footer className="footer">
          {/* Footer content here if needed */}
        </footer>
      </div>
    </>
  );
};

export default App;
