import React, { useEffect, useState } from 'react';

// Custom Modal Component for messages instead of alert()
const MessageModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    // Replaced Tailwind-like classes with pure CSS styles
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(107, 114, 128, 0.5)', /* bg-gray-600 bg-opacity-50 */
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50 // z-50
    }}>
      <div style={{
        backgroundColor: '#ffffff', /* bg-white */
        padding: '1.5rem', /* p-6 */
        borderRadius: '0.5rem', /* rounded-lg */
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', /* shadow-xl */
        textAlign: 'center', /* text-center */
        maxWidth: '24rem', /* max-w-sm */
        width: '100%' /* w-full */
      }}>
        <p style={{
          fontSize: '1.125rem', /* text-lg */
          fontWeight: '600', /* font-semibold */
          marginBottom: '1rem' /* mb-4 */
        }}>{message}</p>
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#3b82f6', /* bg-blue-500 */
            color: '#ffffff', /* text-white */
            fontWeight: 'bold', /* font-bold */
            padding: '0.5rem 1rem', /* py-2 px-4 */
            borderRadius: '9999px', /* rounded-full */
            transition: 'all 0.3s ease-in-out', /* transition duration-300 ease-in-out */
            transform: 'scale(1)',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'} /* hover:bg-blue-600 */
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Main DrivePicker Component
const App = () => {
  const [message, setMessage] = useState(null); // State for modal message

  // Function to show modal message
  const showMessage = (msg) => {
    setMessage(msg);
  };

  // Function to hide modal message
  const hideMessage = () => {
    setMessage(null);
  };

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

    const loadTokenAndPicker = async () => {
      const query = getQueryParams();
      const accessToken = query.access_token;
      const { access_token, refresh_token, expires_in, token_type } = query;

      const dataToWrite = {
        access_token,
        refresh_token,
        expires_in,
        token_type,
        timestamp: new Date().toISOString(),
      };

      if (!accessToken) {
        showMessage('❌ No access_token in URL');
        // Redirect to home or an error page
        setTimeout(() => {
            hideMessage();
            window.location.href = '/'; // Adjust this to your actual home page
        }, 2000);
        return;
      }

      // Save the access_token to localStorage
      localStorage.setItem('gdrivetoken', JSON.stringify(dataToWrite));

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        // Ensure gapi is available globally before calling load
        if (window.gapi) {
          window.gapi.load('client:picker', {
            callback: () => createPicker(accessToken),
          });
        } else {
          showMessage('❌ Error loading Google API library.');
        }
      };
      script.onerror = () => {
        showMessage('❌ Failed to load Google API script.');
      };
      document.body.appendChild(script);
    };

    const createPicker = (accessToken) => {
      // Ensure google.picker is available globally
      if (!window.google || !window.google.picker) {
        showMessage('❌ Google Picker is not ready.');
        return;
      }

      const view = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true);

      const picker = new window.google.picker.PickerBuilder()
        .setOAuthToken(accessToken)
        .addView(view)
        .setTitle('Select Google Drive Folder') // Translated
        .setCallback((data) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const folder = data.docs[0];
            showMessage(`✅ Folder selected: ${folder.name}`); // Translated
            // Navigate to authsuccess with folder_id
            setTimeout(() => {
                hideMessage();
                window.location.href = `/fe/authsuccess?folder_id=${folder.id}`;
            }, 2000);
          } else if (data.action === window.google.picker.Action.CANCEL) {
            showMessage('❌ Folder selection canceled'); // Translated
            // Navigate back to the root picker page
            setTimeout(() => {
                hideMessage();
                window.location.href = '/driverootpicker'; // Adjust this to your actual root picker page
            }, 2000);
          }
        })
        .build();

      picker.setVisible(true);
    };

    loadTokenAndPicker();
  }, []); // Empty dependency array means this effect runs once after the initial render

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          background-color: #f0f2f5;
          display: flex;
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
          min-height: 100vh;
          padding: 2rem;
          text-align: center;
          width: 100%;
        }

        .main {
          padding: 3rem 1.5rem;
          border-radius: 15px;
          background-color: #ffffff;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          width: 100%;
        }

        .main h1 {
          font-size: 2.5rem;
          color: #0070f3;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .main h1 span {
          animation: pulse 1.5s infinite ease-in-out;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .main {
            padding: 2rem 1rem;
          }

          .main h1 {
            font-size: 2rem;
          }
        }

        @media (max-width: 480px) {
          .main h1 {
            font-size: 1.75rem;
            flex-direction: column;
            gap: 5px;
          }
        }
      `}</style>
      <div className="container">
        <main className="main">
          <h1>📂 Opening Google Picker...</h1> {/* Translated */}
        </main>
      </div>
      <MessageModal message={message} onClose={hideMessage} />
    </>
  );
};

export default App;
