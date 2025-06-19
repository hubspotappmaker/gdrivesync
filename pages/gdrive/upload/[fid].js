import fs from 'fs';
import path from 'path';
import axios from 'axios';

export async function getServerSideProps(context) {
  const { fid } = context.params;

  const dbPath = path.join(process.cwd(), 'pages', 'database.json');
  const configPath = path.join(process.cwd(), 'config.json');

  let access_token = null;
  let rootFolderId = null;

  // Đọc access_token từ database.json
  try {
    const tokenRaw = fs.readFileSync(dbPath, 'utf-8');
    const tokenData = JSON.parse(tokenRaw);
    access_token = tokenData.access_token;
  } catch (err) {
    console.error('❌ Không đọc được access_token:', err.message);
    return { notFound: true };
  }

  // Đọc target_folder từ config.json
  try {
    const configRaw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configRaw);
    rootFolderId = config.directory.target_folder;
  } catch (err) {
    console.error('❌ Không đọc được config:', err.message);
    return { notFound: true };
  }

  const headers = {
    Authorization: `Bearer ${access_token}`
  };

  try {
    // Tìm folder con có tên là fid trong rootFolderId
    const searchRes = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers,
      params: {
        q: `'${rootFolderId}' in parents and name='${fid}' and mimeType='application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)'
      }
    });

    let folderId;

    if (searchRes.data.files.length > 0) {
      // Folder đã tồn tại
      folderId = searchRes.data.files[0].id;
    } else {
      // Chưa có → tạo mới folder
      const createRes = await axios.post(
        'https://www.googleapis.com/drive/v3/files',
        {
          name: fid,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [rootFolderId]
        },
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        }
      );
      folderId = createRes.data.id;
    }

    // Redirect đến folder trên Google Drive
    // return {
    //   redirect: {
    //     destination: `https://drive.google.com/drive/folders/${folderId}`,
    //     permanent: false
    //   }
    // };
    return {
      redirect: {
        destination: `/list/${folderId}`,
        permanent: false
      }
    };
  } catch (err) {
    console.error('❌ Lỗi khi xử lý thư mục:', err.message);
    return { notFound: true };
  }
}

export default function RedirectPage() {
  return <div>Đang chuyển hướng đến Google Drive...</div>;
}
