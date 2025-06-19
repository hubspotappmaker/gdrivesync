// /pages/api/gdrive/search-folder.js

import fs from 'fs';
import path from 'path';
import axios from 'axios';

// ✅ Hàm lấy accessToken từ database.json
const getAccessToken = (portalId) => {
  const dbPath = path.join(process.cwd(), 'pages', 'database.json');
  const raw = fs.readFileSync(dbPath, 'utf-8');
  const data = JSON.parse(raw);
  return data.access_token;
};
const ROOT_FOLDER_ID = '1Qa1M9xWTPDbT22f1dNIGk0YsVe2MzXDe';
// ✅ API handler
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { portalId, objectId } = req.query;

  if (!portalId || !objectId) {
    return res.status(400).json({ error: 'Missing portalId or objectId' });
  }

  const accessToken = getAccessToken(portalId);
  if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized - No access token found' });
  }

  try {
    // 🔍 Bước 1: Tìm folder theo objectId
    const folderSearchRes = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        q: `'${ROOT_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false and name = '${objectId}'`,
        supportsAllDrives: true,
        supportsAllDrives: true,
        includeTeamDriveItems: true,
        fields: 'files(id, name)',
      },
    });

    const folders = folderSearchRes.data.files;
    if (!folders || folders.length === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const folder = folders[0];

    // 📁 Bước 2: Lấy danh sách file trong folder đó
    const filesRes = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        q: `'${folder.id}' in parents and trashed = false`,
        supportsAllDrives: true,
        includeTeamDriveItems: true,
        fields: 'files(id, name, mimeType, webViewLink, createdTime)',
      },
    });

    const files = filesRes.data.files || [];

    // ✅ Trả về cả folder và danh sách files
    return res.status(200).json({ folder, files });
  } catch (err) {
    console.error('Lỗi khi tìm folder hoặc lấy file:', err.message);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
