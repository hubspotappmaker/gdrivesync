// pages/api/token.js

import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'pages', 'database.json');

export default function handler(req, res) {
  // GET: Đọc token
  if (req.method === 'GET') {
    try {
      if (!fs.existsSync(dbPath)) {
        return res.status(404).json({ error: 'File database.json không tồn tại' });
      }

      const raw = fs.readFileSync(dbPath, 'utf-8');
      const data = JSON.parse(raw);

      if (!data.access_token) {
        return res.status(400).json({ error: 'Không tìm thấy access_token trong database.json' });
      }

      return res.status(200).json({ access_token: data.access_token });
    } catch (err) {
      console.error('❌ Lỗi khi đọc token:', err.message);
      return res.status(500).json({ error: 'Lỗi máy chủ khi đọc token', detail: err.message });
    }
  }

  // POST: Ghi token mới
  if (req.method === 'POST') {
    try {
      const { access_token, expires_in, refresh_token } = req.body;

      if (!access_token) {
        return res.status(400).json({ error: 'Thiếu access_token trong yêu cầu' });
      }

      const data = {
        access_token,
        expires_in: expires_in || Date.now() + 3600 * 1000,
        refresh_token: refresh_token || '',
      };

      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');

      return res.status(200).json({ message: '✅ Token đã được lưu thành công' });
    } catch (err) {
      console.error('❌ Lỗi khi ghi token:', err.message);
      return res.status(500).json({ error: 'Lỗi máy chủ khi lưu token', detail: err.message });
    }
  }

  // Phương thức không hỗ trợ
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
