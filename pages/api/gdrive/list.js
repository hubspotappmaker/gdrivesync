import axios from 'axios';

// ✅ Hàm async để lấy access_token và folder_id từ endpoint /api/db/get
const getCredentials = async (portalId) => {
  try {
    const res = await fetch('https://gdrive.onextdigital.com/api/db/get', { // 🔁 đổi domain nếu cần khi deploy
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hubId: portalId }),
    });

    const json = await res.json();
    const accessToken = json?.data?.token?.access_token || null;
    const folderId = json?.data?.folder_id || null;

    return { accessToken, folderId };
  } catch (error) {
    console.error('Lỗi khi lấy credentials:', error);
    return { accessToken: null, folderId: null };
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { portalId, objectId } = req.query;

  if (!portalId || !objectId) {
    return res.status(400).json({ error: 'Missing portalId or objectId' });
  }

  const { accessToken, folderId } = await getCredentials(portalId);

  if (!accessToken || accessToken === 'default') {
    return res.status(401).json({ error: 'Unauthorized - No valid access token found' });
  }

  if (!folderId) {
    return res.status(400).json({ error: 'No root folder ID (folder_id) found for this portal' });
  }

  try {
    // 🔍 Bước 1: Tìm folder theo objectId trong folder gốc folderId
    const folderSearchRes = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false and name = '${objectId}'`,
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

    return res.status(200).json({ folder, files });
  } catch (err) {
    console.error('Lỗi khi tìm folder hoặc lấy file:', err.message);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
