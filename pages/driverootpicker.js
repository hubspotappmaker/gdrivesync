// pages/drive-picker.js
import React, { useEffect, useState } from 'react';
import { Table, Button, message, Switch, Space, Card, Typography, Input, Row, Col } from 'antd';
import { FolderAddOutlined, AppstoreOutlined, UnorderedListOutlined, SearchOutlined } from '@ant-design/icons';

const { Title } = Typography;

const App = () => {
    const [folders, setFolders] = useState([]);
    const [filteredFolders, setFilteredFolders] = useState([]);
    const [view, setView] = useState('grid');
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const showMessage = (msg) => message.info(msg);

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
            const newFolder = res.result;
            const updatedFolders = [...folders, newFolder];
            setFolders(updatedFolders);
            handleSearch(searchTerm, updatedFolders);
            showMessage(`✅ Created: ${res.result.name}`);
        } catch (err) {
            showMessage('❌ Failed to create folder');
        }
    };

    const handleSelect = (folderId) => {
        window.location.href = `/fe/authsuccess?folder_id=${folderId}`;
    };

    const handleSearch = (value, list = folders) => {
        setSearchTerm(value);
        const filtered = list.filter(folder => folder.name.toLowerCase().includes(value.toLowerCase()));
        setFilteredFolders(filtered);
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
        <div
            style={{
                minHeight: '100vh',
                padding: '2rem',
                background: 'linear-gradient(to bottom, #e0f2ff, #ffffff)',
            }}
        >
            <div
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    background: '#ffffff',
                    borderRadius: '10px',
                    padding: '2rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
            >
                <Title level={2} style={{ color: '#1677ff' }}>
                    <FolderAddOutlined style={{ marginRight: 8 }} /> Select a Folder
                </Title>

                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col span={12}>
                        <Input
                            placeholder="Search folders"
                            prefix={<SearchOutlined />}
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col>
                        <Space>
                            <Button type="primary" icon={<FolderAddOutlined />} onClick={createFolder}>
                                Create Folder
                            </Button>
                            <Switch
                                checkedChildren={<AppstoreOutlined />}
                                unCheckedChildren={<UnorderedListOutlined />}
                                checked={view === 'grid'}
                                onChange={(checked) => setView(checked ? 'grid' : 'list')}
                            />
                        </Space>
                    </Col>
                </Row>

                {view === 'list' ? (
                    <Table
                        dataSource={filteredFolders.map(f => ({ ...f, key: f.id }))}
                        loading={loading}
                        pagination={false}
                        columns={[
                            {
                                title: 'Folder Name',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Action',
                                render: (_, record) => (
                                    <Button type="primary" onClick={() => handleSelect(record.id)}>Select</Button>
                                ),
                            },
                        ]}
                    />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                        {filteredFolders.map(folder => (
                            <Card
                                key={folder.id}
                                title={folder.name}
                                actions={[<Button type="primary" onClick={() => handleSelect(folder.id)}>Select</Button>]}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
