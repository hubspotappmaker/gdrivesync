import React, { useEffect, useState } from 'react';

// Main App Component for Auth Success Display
const App = () => {
  const [folderId, setFolderId] = useState(null);
  const [portalId, setPortalId] = useState(null);
  const [rootFolder, setRootFolder] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [status, setStatus] = useState(''); // Added status state to handle success/failure messages
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const storedPortalId = localStorage.getItem('portalId');
    const storedRootFolder = localStorage.getItem('folder_id');
    const storedAccessToken = localStorage.getItem('gdrivetoken');

    if (storedPortalId) {
      setPortalId(storedPortalId);
    }
    if (storedRootFolder) {
      setRootFolder(storedRootFolder);
    }
    if (storedAccessToken) {
      setAccessToken(storedAccessToken);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token')

    if (portalId && accessToken && folderId && !isSubmitting) {
      setIsSubmitting(true);
      fetch('https://gdrive.nexce.io/fe/api/db/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: portalId,
          token: accessToken,
          folder_id: folderId,
          platform_name: 'google_drive',
          installed_date: '1242343'
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Data submission failed');
          return res.json();
        })
        .then(() => {
          setStatus('success');
          // Don't auto-redirect, wait for user to click Continue
        })
        .catch((err) => {
          console.error('[CLIENT ERROR]', err);
          setStatus('error');
          setIsSubmitting(false);
        });
    }
  }, [portalId, accessToken, folderId, isSubmitting]);

  const handleContinue = () => {
    // Immediate redirect without any delay or notification
    if (window.parent && window.parent !== window) {
      window.parent.location.href = 'https://gdrive.nexce.io/home/source';
    } else {
      window.location.href = 'https://gdrive.nexce.io/home/source';
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #334155;
          line-height: 1.6;
        }

        .container {
          width: 100%;
          max-width: 480px;
          padding: 2rem;
        }

        .card {
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(22, 103, 255, 0.08);
          border: 1px solid rgba(22, 103, 255, 0.1);
          overflow: hidden;
          position: relative;
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #1667ff 0%, #4f8aff 100%);
        }

        .header {
          padding: 3rem 2.5rem 1rem;
          text-align: center;
          position: relative;
        }

        .success-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #1667ff 0%, #4f8aff 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          position: relative;
          animation: scaleIn 0.6s ease-out;
        }

        .success-icon::after {
          content: '📁';
          font-size: 2.5rem;
        }

        @keyframes scaleIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.75rem;
          letter-spacing: -0.025em;
        }

        .subtitle {
          font-size: 1rem;
          color: #64748b;
          font-weight: 400;
        }

        .content {
          padding: 0 2.5rem 2.5rem;
        }

        .info-section {
          margin-bottom: 2rem;
        }

        .info-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 0.75rem;
          transition: all 0.2s ease;
        }

        .info-item:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .info-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .info-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
          font-family: 'Monaco', 'Consolas', monospace;
          background: #ffffff;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-section {
          margin-bottom: 2rem;
        }

        .status-message {
          padding: 1rem 1.25rem;
          border-radius: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .status-success {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .status-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .status-loading {
          background: #eff6ff;
          color: #1667ff;
          border: 1px solid #bfdbfe;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #bfdbfe;
          border-top: 2px solid #1667ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .continue-button {
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #1667ff 0%, #4f8aff 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .continue-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 25px rgba(22, 103, 255, 0.25);
        }

        .continue-button:active {
          transform: translateY(0);
        }

        .continue-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 640px) {
          .container {
            padding: 1rem;
          }

          .header {
            padding: 2rem 1.5rem 1rem;
          }

          .content {
            padding: 0 1.5rem 2rem;
          }

          .title {
            font-size: 1.5rem;
          }

          .info-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .info-value {
            max-width: 100%;
            width: 100%;
          }
        }
      `}</style>

      <div className="container">
        <div className="card">
          <div className="header">
            <div className="success-icon"></div>
            <h1 className="title">Authenticated Successfully!</h1>
            <p className="subtitle">Your Google Drive root folder has been configured</p>
          </div>

          <div className="content">
            <div className="info-section">
              {folderId && (
                <div className="info-item">
                  <span className="info-label">
                    📁 Folder ID
                  </span>
                  <span className="info-value">{folderId}</span>
                </div>
              )}
              {rootFolder && (
                <div className="info-item">
                  <span className="info-label">
                    📂 Root Folder
                  </span>
                  <span className="info-value">{rootFolder}</span>
                </div>
              )}
            </div>

            <div className="status-section">
              {status === 'success' && (
                <div className="status-message status-success">
                  <span>Root folder configuration saved successfully!</span>
                </div>
              )}
              {status === 'error' && (
                <div className="status-message status-error">
                  <span>❌</span>
                  <span>Failed to save configuration. Please try again.</span>
                </div>
              )}
              {isSubmitting && !status && (
                <div className="status-message status-loading">
                  <div className="loading-spinner"></div>
                  <span>Processing configuration...</span>
                </div>
              )}
            </div>

            <button
              className="continue-button"
              onClick={handleContinue}
              disabled={isSubmitting && !status}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;