// pages/drive-picker.js
import React, { useEffect, useState } from 'react';

const App = () => {
    const [folders, setFolders] = useState([]);
    const [view, setView] = useState('grid');
    const [accessToken, setAccessToken] = useState(null);
    const [message, setMessage] = useState('');

    const showMessage = (msg) => setMessage(msg);
    const hideMessage = () => setMessage('');

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

    const loadGoogleDriveFolders = async () => {
        try {
            const res = await window.gapi.client.drive.files.list({
                q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
                fields: 'files(id, name)',
            });
            setFolders(res.result.files);
        } catch (err) {
            showMessage('❌ Failed to load folders');
        }
    };

    const createFolder = async () => {
        const name = prompt('Enter folder name:');
        if (!name) return;
        try {
            const res = await window.gapi.client.drive.files.create({
                resource: {
                    name,
                    mimeType: 'application/vnd.google-apps.folder',
                },
                fields: 'id, name',
            });
            setFolders((prev) => [...prev, res.result]);
            showMessage(`✅ Created: ${res.result.name}`);
        } catch (err) {
            showMessage('❌ Failed to create folder');
        }
    };

    const handleSelect = (folderId) => {
        window.location.href = `/fe/authsuccess?folder_id=${folderId}`;
    };

    useEffect(() => {
        const { access_token } = getQueryParams();
        if (!access_token) return showMessage('No access_token');

        setAccessToken(access_token);
        localStorage.setItem('gdrivetoken', JSON.stringify({ access_token }));

        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = async () => {
            await window.gapi.load('client', async () => {
                await window.gapi.client.load('drive', 'v3');
                await window.gapi.client.setToken({ access_token });
                await loadGoogleDriveFolders();
            });
        };
        document.body.appendChild(script);
    }, []);

    return (
        <div style={{ minHeight: '100vh', padding: '2rem', background: '#f9fafb' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', background: '#fff', borderRadius: '10px', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📁 Select a Folder
                </h1>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <button onClick={createFolder} style={{ background: '#10b981', color: '#fff', fontWeight: 'bold', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>+ Create Folder</button>
                    <div>
                        <button onClick={() => setView('grid')} style={{ marginRight: '0.5rem' }}>🔲 Grid</button>
                        <button onClick={() => setView('list')}>📄 List</button>
                    </div>
                </div>

                {view === 'list' ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Folder Name</th>
                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {folders.map(folder => (
                            <tr key={folder.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.5rem' }}>{folder.name}</td>
                                <td style={{ padding: '0.5rem' }}>
                                    <button onClick={() => handleSelect(folder.id)} style={{ background: '#3b82f6', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '4px', fontWeight: 'bold', border: 'none' }}>Select</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {folders.map(folder => (
                            <div key={folder.id} style={{ border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{folder.name}</span>
                                <button onClick={() => handleSelect(folder.id)} style={{ background: '#3b82f6', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '4px', fontWeight: 'bold', border: 'none' }}>Select</button>
                            </div>
                        ))}
                    </div>
                )}

                {message && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '6px' }}>{message}</div>
                )}
            </div>
        </div>
    );
};

export default App;
