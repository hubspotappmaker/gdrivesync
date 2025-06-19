import Head from 'next/head'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css'
import HeaderImage from '../components/HeaderImage';
import GoogleDriveSearch from '../components/GoogleDriveSearch'
import SimpleSignOn from '../components/SimpleSignOn'
import PlayBookFolders from '../components/PlayBookFolders';

export default function Home() {
  const router = useRouter();
  const { folder_id } = router.query;
  const [folderId, setFolderId] = useState(null);

  useEffect(() => {
    if (router.isReady && folder_id) {
      setFolderId(folder_id);
    }
  }, [router.isReady, folder_id]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Google Drive By Onext Digital</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1>✅ Authenticated!</h1>
        {folderId && (
          <p><strong>📁 Folder ID:</strong> {folderId}</p>
        )}
      </main>

      <footer className={styles.footer}>
        {/* Footer content here if needed */}
      </footer>
    </div>
  );
}
