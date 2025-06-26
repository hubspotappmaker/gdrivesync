import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function InstalledSuccess() {
  const router = useRouter();
  const { hub_id, user, install_date } = router.query;

  const [userInfo, setUserInfo] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!router.isReady || !hub_id || !user || !install_date) return;

    const readableDate = new Date().toISOString(); 
    const decodedUser = decodeURIComponent(user);

    const info = {
      hub_id,
      user: decodedUser,
      install_date: readableDate,
    };
    setUserInfo(info);

    setStatus('⏳ Sending data...');
   
    // Send data to backend API route
    fetch('https://gdrive.onextdigital.com/fe/api/db/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hub_id,
        email: decodedUser,
        installed_date: install_date,
        platform_name:'hubspot',
        token: {
          access_token: 'default',
          access_token: 'default',
          refresh_token: 'default',
          expires_in: 'default',
          token_type: 'default',
          folder_id:'default',
        },
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Data submission failed');
        return res.json();
      })
      .then(() =>  {
          setStatus('✅ Data submitted successfully!');
         window.location.href = 'https://gdrive.onextdigital.com/home';

    
        })
      .catch((err) => {
        console.error('[CLIENT ERROR]', err);
        setStatus('❌ Failed to submit data');
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
