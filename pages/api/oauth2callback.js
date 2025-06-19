import axios from 'axios';
import config from '../../config.json';
import fs from 'fs'; // ✅ import fs
import path from 'path'; // ✅ import path

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    const redirectUri = config.api.redirect_url;

    const response = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        code: code,
        client_id: config.api.client_id,
        client_secret: config.api.client_secret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token, refresh_token, expires_in, token_type } = response.data;

    // ✅ Ghi token vào file database.json
    const dataToWrite = {
      access_token,
      refresh_token,
      expires_in,
      token_type,
      timestamp: new Date().toISOString(),
    };

    // lưu vào db thay thế nhé 
    
    const dbPath = path.join(process.cwd(), 'pages', 'database.json');
    fs.writeFileSync(dbPath, JSON.stringify(dataToWrite, null, 2), 'utf-8');

    // ✅ Redirect về client với token (hoặc chỉ báo thành công nếu muốn bảo mật hơn)
    const redirectClient = '/driverootpicker';
    const tokenUrl = `${redirectClient}?access_token=${access_token}`;
    res.redirect(tokenUrl);

    // check nếu có folder id trước rồi thì redirect luôn đến success
    // const redirectClient = '/authsuccess';
    // const tokenUrl = `${redirectClient}?access_token=${access_token}`;
    // res.redirect(tokenUrl);

  } catch (error) {
    console.error('OAuth2 error:', error.response?.data || error.message);
    res.status(500).send('OAuth2 callback failed');
  }
}
