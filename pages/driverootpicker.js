// pages/drive-picker.js
import React, { useEffect, useState } from 'react';
import {
    Table,
    Button,
    message,
    Switch,
    Space,
    Card,
    Typography,
    Input,
    Row,
    Col,
    Empty,
    Layout,
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

    const showMessage = (msg) => message.info(msg);

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
        const filtered = list.filter((folder) =>
            folder.name.toLowerCase().includes(value.toLowerCase())
        );
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
        <Layout style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #e6f0ff, #ffffff)' }}>
            <Content style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>
                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        padding: '2rem',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    }}
                >
                    <Title level={3} style={{ color: '#1677ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FolderOpenOutlined /> Select a Folder
                    </Title>

                    <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
                        <Col xs={24} sm={12} md={8}>
                            <Input
                                placeholder="Search folders"
                                prefix={<SearchOutlined />}
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                allowClear
                                style={{ height: 40 }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md="auto" style={{ textAlign: 'right' }}>
                            <Space>
                                <Button
                                    type="primary"
                                    icon={<FolderAddOutlined />}
                                    onClick={createFolder}
                                    style={{ height: 40 }}
                                >
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

                    {filteredFolders.length === 0 ? (
                        <Empty description="No folders found." style={{ padding: '2rem 0' }} />
                    ) : view === 'list' ? (
                        <Table
                            dataSource={filteredFolders.map((f) => ({ ...f, key: f.id }))}
                            loading={loading}
                            pagination={false}
                            bordered
                            rowClassName={() => 'ant-table-row-hover'}
                            columns={[
                                {
                                    title: '📁 Folder Name',
                                    dataIndex: 'name',
                                },
                                {
                                    title: 'Action',
                                    align: 'right',
                                    render: (_, record) => (
                                        <Button type="primary" onClick={() => handleSelect(record.id)}>
                                            Select
                                        </Button>
                                    ),
                                },
                            ]}
                        />
                    ) : (
                        <Row gutter={[16, 16]}>
                            {filteredFolders.map((folder) => (
                                <Col key={folder.id} xs={24} sm={12} md={8} lg={6} xl={4}>
                                    <Card
                                        title={folder.name}
                                        hoverable
                                        actions={[
                                            <Button type="primary" onClick={() => handleSelect(folder.id)}>
                                                Select
                                            </Button>,
                                        ]}
                                        style={{
                                            borderRadius: 12,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                            border: '1px solid #f0f0f0',
                                        }}
                                    />
                                </Col>
                            ))}
                        </Row>
                    )}
                </div>
            </Content>
        </Layout>
    );
};

export default App;
