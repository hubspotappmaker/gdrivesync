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
  const [portalId, setPortalId] = useState(null);
  const [rootFolder, setRootFolder] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [status, setStatus] = useState(''); // Added status state to handle success/failure messages
  const [email, setEmail] = useState(null); // State for email
  const [appId, setAppId] = useState(null); // State for email
  const [installedDate, setInstalledDate] = useState(null); // State for email

  useEffect(() => {
    if (router.isReady && folder_id) {
      setFolderId(folder_id);
    }
    // Retrieve the portalId, root folder, and access_token from localStorage
    const storedPortalId = localStorage.getItem('portalId');
    const storedRootFolder = localStorage.getItem('folder_id');
    const storedAccessToken = localStorage.getItem('gdrivetoken');

    if (storedPortalId) {
      setPortalId(storedPortalId);
    }
    if (storedRootFolder) {
      setRootFolder(storedRootFolder);
    }
    if (storedAccessToken) {
      setAccessToken(storedAccessToken);
    }

    // Fetch the email using the portalId
    if (portalId) {
      fetch('/api/db/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hubId: portalId, // Pass portalId as hubId to get the email
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.data.email) {
            setEmail(data.data.email); // Store the email in state
          }
          if (data.data.installed_date) {
            setAppId(data.data.installed_date); // Store the appId in state
          }
          if (data.data.installed_date) {
            setInstalledDate(data.data.installed_date); // Store the appId in state
          }
        })
        .catch((error) => console.error('Error:', error));
    }
    
    // Send data to backend API route
    if (portalId) {
      fetch('/api/db/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hub_id: portalId,
          app_id: appId,
          installed_date: installedDate,
          email: email, // Send the email fetched from the API
          token: accessToken,
          folder_id: folder_id,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Data submission failed');
          return res.json();
        })
        .then(() => setStatus('✅ Data submitted successfully!'))
        .catch((err) => {
          console.error('[CLIENT ERROR]', err);
          setStatus('❌ Failed to submit data');
        });
    }
  }, [router.isReady, folder_id, portalId, accessToken, rootFolder, email]); // Ensure dependencies are correctly set

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
        {portalId && (
          <p><strong>🔑 Portal ID:</strong> {portalId}</p>
        )}
        {rootFolder && (
          <p><strong>📂 Root Folder:</strong> {rootFolder}</p>
        )}
        {accessToken && (
          <p><strong>🔑 Access Token:</strong> {accessToken}</p>
        )}
        {email && (
          <p><strong>📧 Email:</strong> {email}</p> // Display the email
        )}
        {status && (
          <p>{status}</p> // Display status message
        )}
      </main>

      <footer className={styles.footer}>
        {/* Footer content here if needed */}
      </footer>
    </div>
  );
}
