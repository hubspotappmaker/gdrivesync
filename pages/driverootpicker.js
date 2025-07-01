import React, { useEffect, useState } from 'react';

const MessageModal = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(107, 114, 128, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
            <div style={{
                backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem',
                boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
                textAlign: 'center', maxWidth: '24rem', width: '100%'
            }}>
                <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>{message}</p>
                <button onClick={onClose} style={{
                    backgroundColor: '#3b82f6', color: '#fff', fontWeight: 'bold',
                    padding: '0.5rem 1rem', borderRadius: '9999px', border: 'none', cursor: 'pointer'
                }}>Close</button>
            </div>
        </div>
    );
};

const App = () => {
    const [message, setMessage] = useState(null);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);

    const showMessage = (msg) => setMessage(msg);
    const hideMessage = () => setMessage(null);

    useEffect(() => {
        const getQueryParams = () => {
            const params = {};
            window.location.search.substring(1).split('&').forEach(param => {
                const [key, val] = param.split('=');
                if (key && val) params[decodeURIComponent(key)] = decodeURIComponent(val);
            });
            return params;
        };

        const loadGoogleApis = () => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = async () => {
                await window.gapi.load('client', async () => {
                    const { access_token } = getQueryParams();
                    if (!access_token) {
                        showMessage('❌ Missing access token');
                        return;
                    }

                    await window.gapi.client.init({
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                    });

                    window.gapi.client.setToken({ access_token });
                    fetchFolders();
                });
            };
            document.body.appendChild(script);
        };

        const fetchFolders = async () => {
            try {
                const res = await window.gapi.client.drive.files.list({
                    q: "mimeType='application/vnd.google-apps.folder' and trashed=false and 'root' in parents",
                    fields: 'files(id, name)',
                });
                setFolders(res.result.files);
                setLoading(false);
            } catch (err) {
                console.error('Fetch error:', err);
                showMessage('❌ Failed to load folders');
            }
        };

        loadGoogleApis();
    }, []);

    const createFolder = async () => {
        const name = prompt('Enter new folder name:');
        if (!name) return;

        try {
            const res = await window.gapi.client.drive.files.create({
                resource: {
                    name,
                    mimeType: 'application/vnd.google-apps.folder',
                },
                fields: 'id, name',
            });
            setFolders([...folders, res.result]);
            showMessage(`✅ Created folder: ${res.result.name}`);
        } catch (err) {
            console.error('Create error:', err);
            showMessage('❌ Failed to create folder');
        }
    };

    const handleSelect = (folderId) => {
        showMessage(`✅ Folder selected: ${folderId}`);
        setTimeout(() => {
            hideMessage();
            window.location.href = `/fe/authsuccess?folder_id=${folderId}`;
        }, 1000);
    };

    return (
        <>
            <div className="container">
                <main className="main">
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>📂 Select a Folder</h1>
                    <button onClick={createFolder} style={{
                        backgroundColor: '#16a34a', color: 'white',
                        padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold', marginBottom: '1rem'
                    }}>➕ Create Folder</button>

                    {loading ? <p>Loading folders...</p> : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {folders.map(folder => (
                                <li key={folder.id} style={{ marginBottom: '1rem' }}>
                                    <span style={{ marginRight: '1rem' }}>{folder.name}</span>
                                    <button onClick={() => handleSelect(folder.id)} style={{
                                        padding: '0.3rem 0.8rem', backgroundColor: '#3b82f6', color: 'white',
                                        borderRadius: '5px', border: 'none', fontWeight: 'bold'
                                    }}>Select</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </main>
            </div>

            <MessageModal message={message} onClose={hideMessage} />

            <style jsx global>{`
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f9fafb;
          margin: 0;
          padding: 0;
        }

        .container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 100vh;
          padding-top: 4rem;
        }

        .main {
          background: white;
          padding: 2rem;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          max-width: 600px;
          width: 100%;
        }
      `}</style>
        </>
    );
};

export default App;
