// pages/drive-picker.js
import React, { useEffect, useState } from 'react';
import {
    Table,
    Button,
    message,
    Switch,
    Card,
    Typography,
    Input,
    Empty,
    Layout
} from 'antd';
import {
    FolderAddOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    SearchOutlined,
    FolderOpenOutlined,
} from '@ant-design/icons';

const { Title } = Typography;
const { Content } = Layout;

const App = () => {
    const [folders, setFolders] = useState([]);
    const [filteredFolders, setFilteredFolders] = useState([]);
    const [view, setView] = useState('grid');
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [centerMessage, setCenterMessage] = useState(null);

    const showMessage = (msg) => {
        setCenterMessage(msg);
        setTimeout(() => setCenterMessage(null), 1000);
    };

    // const showMessage = (msg) => message.info(msg);

    const getQueryParams = () => {
        const params = {};
        window.location.search
            .substring(1)
            .split('&')
            .forEach((param) => {
                const parts = param.split('=');
                if (parts.length === 2) {
                    params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
                }
            });
        return params;
    };

    const loadGoogleDriveFolders = async () => {
        setLoading(true);
        try {
            const res = await window.gapi.client.drive.files.list({
                q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
                fields: 'files(id, name)',
            });
            setFolders(res.result.files);
            setFilteredFolders(res.result.files);
        } catch (err) {
            showMessage('❌ Failed to load folders');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName) return;
        try {
            const res = await window.gapi.client.drive.files.create({
                resource: {
                    name: newFolderName,
                    mimeType: 'application/vnd.google-apps.folder',
                },
                fields: 'id, name',
            });
            const newFolder = res.result;
            const updatedFolders = [...folders, newFolder];
            setFolders(updatedFolders);
            handleSearch(searchTerm, updatedFolders);
            showMessage(`✅ Created: ${res.result.name}`);
        } catch (err) {
            showMessage('❌ Failed to create folder');
        } finally {
            setNewFolderName('');
            setIsModalOpen(false);
        }
    };

    const handleSelect = (folderId) => {
        window.location.href = `/fe/authsuccess?folder_id=${folderId}`;
    };

    const handleSearch = (value, list = folders) => {
        setSearchTerm(value);
        const filtered = list.filter((folder) =>
            folder.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredFolders(filtered);
    };

    useEffect(() => {
        const { access_token, refresh_token } = getQueryParams();
        if (!access_token) return showMessage('No access_token');
        console.log("check getQueryParams: ", getQueryParams())
        console.log("check refresh_token: ", refresh_token);
        setAccessToken(access_token);

        const dataToWrite = {
            access_token,
            refresh_token
        };

        localStorage.setItem('gdrivetoken', JSON.stringify(dataToWrite));

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
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(to bottom, #e6f0ff, #ffffff)',
                padding: '2rem',
                fontFamily: 'Inter, sans-serif',
            }}
        >
            <div
                style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '2rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                }}
            >
                {centerMessage && (
                    <div
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: '#ffffff',
                            color: '#1677ff',
                            padding: '1rem 2rem',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            fontWeight: 600,
                            zIndex: 9999,
                        }}
                    >
                        {centerMessage}
                    </div>
                )}
                <h2 style={{ color: '#1677ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FolderOpenOutlined /> Select a Google Root Folder
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder="Search folders"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            fontSize: '1rem',
                        }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            style={{
                                background: '#1677ff',
                                color: 'white',
                                padding: '0.5rem 1.2rem',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 600,
                            }}
                        >
                            <FolderAddOutlined /> Create Folder
                        </button>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ cursor: 'pointer', fontSize: '1.25rem' }} onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>
                                {view === 'grid' ? <AppstoreOutlined /> : <UnorderedListOutlined />}
                            </div>
                        </label>
                    </div>
                </div>

                {isModalOpen && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            background: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000,

                        }}
                    >
                        <div
                            style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                minWidth: '300px',
                            }}
                        >
                            <h3 style={{ marginBottom: '1rem', color: '#1677ff' }}>Create New Folder</h3>
                            <input
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 1rem',
                                    marginBottom: '1rem',
                                    fontSize: '1rem',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                }}
                                placeholder="Enter folder name"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '1rem' }}>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    style={{
                                        padding: '0.5rem 1.2rem',
                                        background: '#f0f0f0',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateFolder}
                                    style={{
                                        background: '#1677ff',
                                        color: 'white',
                                        padding: '0.5rem 1.2rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                    }}
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {filteredFolders.length === 0 ? (
                    <Empty description="No folders found." style={{ padding: '2rem 0' }} />
                ) : view === 'list' ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#1677ff', textAlign: 'left' }}>
                                <th style={{ padding: '12px', color: '#fff' }}>📁 Folder Name</th>
                                <th style={{ padding: '12px', textAlign: 'right', color: '#fff' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFolders.map((folder) => (
                                <tr key={folder.id} style={{ borderTop: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}>{folder.name}</td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleSelect(folder.id)}
                                            style={{
                                                background: '#1677ff',
                                                color: '#fff',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Select
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                            gap: '1.2rem',
                            marginTop: '1rem',
                        }}
                    >
                        {filteredFolders.map((folder) => (
                            <div
                                key={folder.id}
                                style={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '12px',
                                    padding: '1.2rem',
                                    background: '#fff',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '120px',
                                }}
                            >
                                <h4 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.75rem' }}>{folder.name}</h4>
                                <button
                                    onClick={() => handleSelect(folder.id)}
                                    style={{
                                        background: '#1677ff',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        alignSelf: 'flex-start',
                                    }}
                                >
                                    Select
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
