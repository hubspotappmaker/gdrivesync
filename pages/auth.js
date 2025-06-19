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


  return (
     <div className={styles.container}>
      <Head>
        <title>Google Drive By Onext Digital</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <SimpleSignOn>
        <main className={styles.main}>
          <h1>🔐 Processing login...</h1>
        </main>

        <footer className={styles.footer}>
          
        </footer>
      
      </SimpleSignOn>
    </div>
      
  );
}
