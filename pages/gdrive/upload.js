import axios from "axios";
import { decodeToken } from "../../hellper/decode";

export async function getServerSideProps(context) {
  const { portalId, objectId } = context.query;

  let access_token = null;
  let rootFolderId = null;
  let driveId = null;

  try {
    const res = await fetch('https://gdrive.nexce.io/fe/api/db/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hubId: portalId }),
    });

    const json = await res.json();
    access_token = json?.data?.token?.access_token || null;




    const tokenDecoded = JSON.parse(decodeToken((json?.data?.token)))

    rootFolderId = tokenDecoded.folder_id
    access_token = tokenDecoded.access_token;
    driveId = tokenDecoded.driveId;
    // //console.log("check rootFolderId: ", rootFolderId)
    // //console.log("check driveId: ", driveId)
  } catch (err) {
    console.error('❌ Lỗi khi lấy token/folder_id:', err.message);
    return { notFound: true };
  }

  const headers = {
    Authorization: `Bearer ${access_token}`
  };

  //console.log("check access_token: ", access_token);
  let searchRes;
  const folderName = objectId || 'default';
  if (driveId) {
    //console.log
    searchRes = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers,
      params: {
        q: `name='${folderName}' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      }
    });
    console.log("check searchRes: ", searchRes);


  } else {
    searchRes = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers,
      params: {
        q: `'${rootFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)'
      }
    });


  }

  let folderId;

  if (searchRes.data.files.length > 0) {
    folderId = searchRes.data.files[0].id;
  } else {
    console.log("check searchRes.data: ", searchRes.data)
    if (driveId) {
      const createRes = await axios.post(
        'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true',
        {
          name: folderName,
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
    } else {
      const createRes = await axios.post(
        'https://www.googleapis.com/drive/v3/files',
        {
          name: folderName,
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

  }

  return {
    redirect: {
      destination: `https://gdrive.nexce.io/fe/list?folderId=${folderId}&portalId=${portalId}&objectId=${objectId}`,
      permanent: false
    }
  };
}

// ✅ Default export là một React Component (bắt buộc trong Next.js)
export default function UploadRedirectPage() {
  return null;
}


