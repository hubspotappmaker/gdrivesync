import axios from 'axios';

// Làm mới access_token bằng refresh_token
async function refreshAccessToken(refresh_token, client_id, client_secret) {
  try {
    const res = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id,
        client_secret,
        refresh_token,
        grant_type: 'refresh_token',
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(`Không thể làm mới token: ${JSON.stringify(error.response?.data || error.message)}`);
  }
}

// Lấy token từ DB API
async function getCredentials(portalId) {
  try {
    const res = await fetch('https://gdrive.nexce.io/fe/api/db/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hubId: portalId }),
    });

    const json = await res.json();
    const tokenData = json?.data?.token || {};
    const folderId = json?.data?.folder_id || null;
    const email = json?.data?.email || 'unknown';

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      clientId: "759567949674-r8uiv70eekku45fssl2dco4k4q419ui0.apps.googleusercontent.com",
      clientSecret: "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",
      folderId,
      email
    };
  } catch (error) {
    console.error('Lỗi khi lấy credentials:', error);
    return {};
  }
}

// Gửi lại dữ liệu mới về DB
async function updateCredentials(portalId, accessToken, refreshToken, folderId, email) {
  try {
    const res = await fetch('https://gdrive.nexce.io/connect-platform-app/application/save-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hub_id: portalId,
        email: email,
        installed_date: new Date().toISOString(),
        token: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 'default',
          token_type: 'Bearer',
        },
        folder_id: folderId,
        platform_name: 'google_drive'
      }),
    });

    const result = await res.json();
    console.log('✅ Token mới đã lưu vào DB:', result);
  } catch (err) {
    console.error('❌ Lỗi khi lưu token mới:', err.message);
  }
}

// ✅ API chính
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Phương thức không hỗ trợ' });
  }

  const { portalId } = req.query;
  if (!portalId) {
    return res.status(400).json({ success: false, message: 'Thiếu portalId' });
  }

  try {
    const {
      accessToken,
      refreshToken,
      clientId,
      clientSecret,
      folderId,
      email
    } = await getCredentials(portalId);

    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Không có access_token' });
    }

    try {
      await axios.get(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
      return res.status(200).json({
        success: true,
        valid: true,
        access_token: accessToken,
        folder_id: folderId,
      });
    } catch (err) {
      console.warn('⚠️ Token không hợp lệ, thử làm mới...');
    }


    if (!refreshToken || !clientId || !clientSecret) {
      return res.status(400).json({ success: false, message: 'Không có refresh_token hoặc client credentials' });
    }

    const refreshed = await refreshAccessToken(refreshToken, clientId, clientSecret);
    const newAccessToken = refreshed.access_token;


    // Lưu lại token mới
    await updateCredentials(portalId, newAccessToken, refreshToken, folderId, email);

    return res.status(200).json({
      success: true,
      refreshed: true,
      access_token: newAccessToken,
      folder_id: folderId,
    });

  } catch (err) {
    console.error('❌ Lỗi xử lý:', err.message);
    return res.status(500).json({ success: false, message: 'Lỗi xử lý token', error: err.message });
  }
}
