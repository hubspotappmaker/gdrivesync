import { useEffect, useState } from 'react';
import {
  Layout,
  Menu,
  Breadcrumb,
  Card,
  Row,
  Col,
  Typography,
  Dropdown,
  Spin,
  Button,
  Switch,
  Space,
  Select,
  Table,
  Avatar
} from 'antd';
import {
  FolderOpenOutlined,
  FileOutlined,
  UploadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  DownOutlined,
  InfoCircleOutlined,
  MoreOutlined,
  ShareAltOutlined,
  FileTextOutlined,
  FileImageOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import axios from 'axios';
import config from '../config.json';
import handleAccessTokenExpiration from './HandleAccessTokenExpiration';

const { Header, Content } = Layout;
const { Title } = Typography;

const getMenuItems = (record) => [
  {
    key: 'view',
    label: 'Xem',
  },
  {
    key: 'download',
    label: 'Tải xuống',
  },
  {
    key: 'share',
    label: 'Chia sẻ',
  },
  {
    type: 'divider',
  },
  {
    key: 'delete',
    label: 'Xóa',
    danger: true,
  },
];

const columns = [
  {
    title: 'Tên',
    dataIndex: 'name',
    key: 'name',
    sorter: true,
    render: (text, record) => (
        <Space>
          {record.icon}
          <Typography.Text>{text}</Typography.Text>
          {record.shared && <ShareAltOutlined style={{ color: '#1890ff', fontSize: '12px' }} />}
        </Space>
    ),
  },
  {
    title: 'Chủ sở hữu',
    dataIndex: 'owner',
    key: 'owner',
    width: 150,
    render: (text) => <Typography.Text>{text}</Typography.Text>,
  },
  {
    title: 'Sửa đổi lần cuối',
    dataIndex: 'modifiedTime',
    key: 'modifiedTime',
    width: 180,
    sorter: true,
  },
  {
    title: 'Kích cỡ tệp',
    dataIndex: 'size',
    key: 'size',
    width: 120,
    sorter: true,
  },
  {
    title: '',
    key: 'action',
    width: 50,
    render: (_, record) => (
        <Dropdown
            menu={{
              items: getMenuItems(record),
              onClick: ({ key }) => {
                console.log(`Action ${key} for file ${record.name}`);
              },
            }}
            trigger={['click']}
            placement="bottomRight"
        >
          <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
              style={{ color: '#8c8c8c' }}
          />
        </Dropdown>
    ),
  },
];

export default function PlayBookFiles() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gridView, setGridView] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      const accessToken = localStorage.getItem("access_token");
      const targetFolderId = config.directory.target_folder;
      const teamDriveId = config.directory.team_drive;
      const corpora = teamDriveId ? "teamDrive" : "allDrives";

      try {
        const res = await axios.get("https://www.googleapis.com/drive/v3/files", {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            corpora,
            includeTeamDriveItems: true,
            supportsAllDrives: true,
            teamDriveId,
            fields: "files(id,name,mimeType,owners,modifiedTime,size)",
            q: `trashed = false and parents in '${targetFolderId}'`
          }
        });

        const files = res.data.files.map(file => ({
          ...file,
          key: file.id,
          icon: file.mimeType === 'application/vnd.google-apps.folder'
              ? <FolderOpenOutlined style={{ color: '#1890ff' }} />
              : file.mimeType.startsWith('image/')
                  ? <FileImageOutlined style={{ color: '#52c41a' }} />
                  : file.mimeType.startsWith('video/')
                      ? <VideoCameraOutlined style={{ color: '#722ed1' }} />
                      : file.mimeType.includes('document')
                          ? <FileTextOutlined style={{ color: '#fa8c16' }} />
                          : <FileOutlined style={{ color: '#595959' }} />, // default icon
          owner: file.owners?.[0]?.displayName || 'Không rõ',
          shared: false // API không lấy field này mặc định
        }));

        setResults(files);
      } catch (err) {
        if (err.response?.status === 401) {
          handleAccessTokenExpiration();
        } else {
          console.error("Lỗi tải dữ liệu:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content className="p-6">
          <Spin spinning={loading}>
            <div style={{ backgroundColor: '#fff', padding: '16px 0', borderBottom: '1px solid #f0f0f0', marginBottom: '24px' }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Space align="center">
                    <Typography.Text style={{ fontSize: '22px', fontWeight: 400, color: '#5f6368' }}>
                      Drive của tôi
                    </Typography.Text>
                    <DownOutlined style={{ fontSize: '12px', color: '#5f6368' }} />
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Button.Group>
                      <Button icon={<UnorderedListOutlined />} type={!gridView ? 'primary' : 'default'} onClick={() => setGridView(false)} />
                      <Button icon={<AppstoreOutlined />} type={gridView ? 'primary' : 'default'} onClick={() => setGridView(true)} />
                    </Button.Group>
                  </Space>
                </Col>
              </Row>
            </div>

            {gridView ? (
                <Row gutter={[16, 16]}>
                  {results.map((file) => (
                      <Col key={file.id} xs={24} sm={12} md={8} lg={6} xl={4}>
                        <Card
                            hoverable
                            bodyStyle={{ padding: 12, textAlign: 'center' }}
                            actions={[
                              <Dropdown
                                  key="menu"
                                  trigger={["click"]}
                                  menu={{ items: getMenuItems(file) }}
                              >
                                <Button size="small">⋮</Button>
                              </Dropdown>,
                            ]}
                        >
                          <div style={{ fontSize: 40 }}>{file.icon}</div>
                          <div style={{ marginTop: 8 }}>{file.name}</div>
                        </Card>
                      </Col>
                  ))}
                </Row>
            ) : (
                <Table
                    columns={columns}
                    dataSource={results}
                    pagination={false}
                    showHeader={true}
                    size="middle"
                    rowSelection={null}
                    rowClassName="file-row"
                />
            )}
          </Spin>
        </Content>
      </Layout>
  );
}
