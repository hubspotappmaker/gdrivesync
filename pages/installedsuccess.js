import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function InstalledSuccess() {
  const router = useRouter();
  const { hub_id, user, install_date } = router.query; // Lấy từ URL

  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    if (hub_id && user && install_date) {
      setUserInfo({
        hub_id,
        user: decodeURIComponent(user),
        install_date: new Date(install_date).toLocaleString(), // Chuyển sang định dạng dễ đọc
      });
    }
  }, [router.isReady, hub_id, user, install_date]);

  return (
    <div style={{ padding: '2rem' }}>
      <Head>
        <title>✅ Install Successfully</title>
      </Head>

      <h1>🎉 Congratulations, Installed Successfully!</h1>

      {userInfo ? (
        <div>
          <p><strong>👤 User:</strong> {userInfo.user}</p>
          <p><strong>🏢 Hub ID:</strong> {userInfo.hub_id}</p>
          <p><strong>📅 Installed Date:</strong> {userInfo.install_date}</p>
        </div>
      ) : (
        <p>Không tìm thấy thông tin người dùng.</p>
      )}
    </div>
  );
}
