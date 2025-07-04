import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }



  try {
    const token = localStorage.getItem('access_token');
    console.log('hubtoken đasdsdsfss',token); 
    const response = await axios.post(
      'https://gdrive.nexce.io/connect-platform-app/application/connect-gg-driver',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,  // Add Authorization header with Bearer token
        },
      }
    );

    res.status(response.status).json(req.body);
  } catch (error) {
    console.error('Proxy error:', error?.response?.data || error.message);

    if (error.response) {
      // Lỗi từ server (ví dụ 404, 500...)
      res
        .status(error.response.status)
        .json({ error: error.response.data || 'Server Error' });
    } else {
      // Lỗi kết nối
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
