import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function InstalledSuccess() {
  const router = useRouter();
  const { hub_id, user, install_date } = router.query;

  const [userInfo, setUserInfo] = useState(null);
  const [status, setStatus] = useState(null);

  const sendData = async ({ hub_id, user, install_date }) => {
    const decodedUser = decodeURIComponent(user);
    const token = localStorage.getItem('access_token');
    const response = await fetch('https://gdrive.nexce.io/fe/api/db/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        hub_id,
        email: decodedUser,
        installed_date: install_date,
        platform_name: 'hubspot',
        token: {
          access_token: 'default',
          refresh_token: 'default',
          expires_in: 'default',
          token_type: 'default',
          folder_id: 'default',
        },
      }),
    });
    const data = await response.json();
    return { ok: response.ok, data };
  };

  useEffect(() => {
    if (!router.isReady || !hub_id || !user || !install_date) return;

    const readableDate = new Date().toISOString();
    setUserInfo({ hub_id, user: decodeURIComponent(user), install_date: readableDate });
    setStatus('⏳ sending data...');

    sendData({ hub_id, user, install_date })
      .then(({ ok, data }) => {
        if (ok) {
          setStatus(`✅ ${data.message || 'Submit successfully!'}`);
          window.location.href = 'https://gdrive.nexce.io/home';
        } else {
          window.location.href = 'https://gdrive.nexce.io/home/source?error=used';
          setStatus(`❌ ${data.error?.msg || 'Submit failed!'}`);
        }
      })
      .catch(() => {
        setStatus('❌ Can not connect to server');
      });
  }, [router.isReady, hub_id, user, install_date]);


  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>✅ Installation Successful</title>
      </Head>

      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        🎉 Installation Successful!
      </h1>

      {userInfo ? (
        <div>
          <p><strong>👤 User:</strong> {userInfo.user}</p>
          <p><strong>🏢 Hub ID:</strong> {userInfo.hub_id}</p>
          <p><strong>📅 Installation Date:</strong> {userInfo.install_date}</p>
        </div>
      ) : (
        <p>⚠️ User information not found.</p>
      )}

      {status && (
        <p style={{ marginTop: '2rem', color: status.includes('✅') ? 'green' : 'red' }}>
          {status}
        </p>
      )}
    </div>
  );
}
