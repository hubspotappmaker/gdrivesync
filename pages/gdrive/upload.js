import axios from "axios";

export async function getServerSideProps(context) {
  const { portalId, objectId } = context.query;

  let access_token = null;
  let rootFolderId = null;

  try {
    const res = await fetch('https://gdrive.nexce.io/fe/api/db/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hubId: portalId }),
    });

    const json = await res.json();
    access_token = json?.data?.token?.access_token || null;
    rootFolderId = json?.data?.folder_id || null;

    if (!access_token || !rootFolderId || access_token === 'default') {
      throw new Error('Thiếu access_token hoặc folder_id hợp lệ');
    }
  } catch (err) {
    console.error('❌ Lỗi khi lấy token/folder_id:', err.message);
    return { notFound: true };
  }

  const headers = {
    Authorization: `Bearer ${access_token}`
  };

  try {
    const folderName = objectId || 'default';

    const searchRes = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers,
      params: {
        q: `'${rootFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)'
      }
    });

    let folderId;

    if (searchRes.data.files.length > 0) {
      folderId = searchRes.data.files[0].id;
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

    return {
      redirect: {
        destination: `https://gdrive.nexce.io/fe/list?folderId=${folderId}&portalId=${portalId}&objectId=${objectId}`,
        permanent: false
      }
    };
  } catch (err) {
    console.error('❌ Lỗi khi xử lý thư mục:', err.message);
    return { notFound: true };
  }
}

// ✅ Default export là một React Component (bắt buộc trong Next.js)
export default function UploadRedirectPage() {
  return null;
}


