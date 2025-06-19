const fs = require('fs');
const path = require('path');
const axios = require('axios');

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

export default async function handler(req, res) {
  const dbPath = path.join(process.cwd(), 'pages', 'database.json');
  const configPath = path.join(process.cwd(), 'config.json'); // ngoài thư mục pages

  try {
    if (!fs.existsSync(dbPath)) {
      return res.status(500).json({ success: false, message: 'Không tìm thấy database.json' });
    }
    if (!fs.existsSync(configPath)) {
      return res.status(500).json({ success: false, message: 'Không tìm thấy config.json' });
    }

    const tokenData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    const { access_token, refresh_token } = tokenData;
    const { client_id, client_secret } = configData.api; // 👈 Lấy đúng từ config.api

    if (!access_token) {
      return res.status(400).json({ success: false, message: 'Không có access_token trong file.' });
    }

    try {
      const result = await axios.get(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${access_token}`);
      return res.status(200).json({ success: true, valid: true, data: result.data });
    } catch (err) {
      console.warn('⚠️ Token không hợp lệ, thử làm mới...');
    }

    if (!refresh_token || !client_id || !client_secret) {
      return res.status(400).json({ success: false, message: 'Thiếu refresh_token hoặc client info.' });
    }

    const refreshed = await refreshAccessToken(refresh_token, client_id, client_secret);
    tokenData.access_token = refreshed.access_token;

    fs.writeFileSync(dbPath, JSON.stringify(tokenData, null, 2));

    // Ghi chỗ này vào lại database

    return res.status(200).json({
      success: true,
      refreshed: true,
      access_token: refreshed.access_token,
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi xử lý', error: err.message });
  }
}
