import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { hubId, platformName } = req.body; // Extract hubId from the request body	
  console.log(hubId,'hub_id từ api get dữ liệu')

  if (!hubId) {
    return res.status(400).json({ message: 'hubId is required' });
  }

  try {
    const platformNameFinal = platformName || 'google_drive';
    const response = await axios.get(
      `https://gdrive.nexce.io/connect-platform-app/application/get-user-info?hubId=${hubId}&platformName=${platformNameFinal}`, // Dynamic URL with hubId
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
      }
    );

    // Send back the response from the external API
    res.status(response.status).json(response.data); // Send the data received from the external API

  } catch (error) {
    console.error('Proxy error:', error?.response?.data || error.message);

    if (error.response) {
      // Error from the server (e.g., 404, 500...)
      res
        .status(error.response.status)
        .json({ error: error.response.data || 'Server Error' });
    } else {
      // Connection error
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
