import axios from 'axios';
import { decodeToken } from '../../../hellper/decode';

// ✅ Hàm async để lấy access_token và folder_id từ endpoint /api/db/get
const getCredentials = async (portalId) => {
  try {
    const res = await fetch('https://gdrive.nexce.io/fe/api/db/get', { // 🔁 đổi domain nếu cần khi deploy
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hubId: portalId }),
    });

    const json = await res.json();
    const tokenDecoded = JSON.parse(decodeToken((json?.data?.token)))
    const accessToken = tokenDecoded.access_token || null;
    const folderId = tokenDecoded.folder_id || null;
    const driveId = tokenDecoded.driveId || null;
    return { accessToken, folderId, driveId };
  } catch (error) {
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

  const { accessToken, folderId, driveId } = await getCredentials(portalId);

  if (!accessToken || accessToken === 'default') {
    return res.status(401).json({ error: 'Unauthorized - No valid access token found' });
  }

  if (!folderId) {
    return res.status(400).json({ error: 'No root folder ID (folder_id) found for this portal' });
  }

  let folderSearchRes;
  const headers = {
    Authorization: `Bearer ${accessToken}`
  };
  if (driveId) {
    folderSearchRes = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers,
      params: {
        q: `name='${objectId}' and '${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      }
    });
  } else {

    folderSearchRes = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        q: ` mimeType = 'application/vnd.google-apps.folder' and trashed = false and name = '${objectId}'`,
        fields: 'files(id, name)',
        driveId: driveId
      },
    });


  }

  const pointFolder = folderSearchRes?.data?.files[0]?.id


  const folders = folderSearchRes?.data?.files;
  if (!folders || folders.length === 0) {
    return res.status(404).json({ error: 'Folder not found' });
  }

  const folder = folders[0];

  // 📁 Bước 2: Lấy danh sách file trong folder đó
  let filesRes;
  if (driveId) {
    filesRes = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers,
      params: {
        q: `'${pointFolder}' in parents and trashed = false`,
        supportsAllDrives: true,
        includeTeamDriveItems: true,
        fields: 'files(id, name, mimeType, webViewLink, createdTime)',
      },
    });
  } else {
    filesRes = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers,
      params: {
        q: `'${folder.id}' in parents and trashed = false`,
        supportsAllDrives: true,
        includeTeamDriveItems: true,
        fields: 'files(id, name, mimeType, webViewLink, createdTime)',
      },
    });
  }


  const files = filesRes?.data?.files || [];

  return res.status(200).json({ folder, files });

}
