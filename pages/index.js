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

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const pendingDealid = localStorage.getItem('pending_dealid');
    const parentid = localStorage.getItem('drive_root_folder_id'); // lấy từ database ra
    if (!accessToken) {
      // 👉 Lưu dealid để dùng lại sau khi đăng nhập
      localStorage.setItem('pending_dealid', pendingDealid);
      router.push('/'); // Redirect to login page
      return;
    }
    // Nếu có pending dealid, chuyển hướng đến trang tạo folder
    
    if (pendingDealid) {

      //localStorage.removeItem('pending_dealid');
      if(parentid){
        router.push(`/folder?dealid=${pendingDealid}`);
      }else{
        router.push('/driverootpicker')
      }
    } else {
      router.push('/');
    }

  }, []);

  return (
     <div className={styles.container}>
      <Head>
        <title>Google Drive By Onext Digital</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
          <h1>Hello World.</h1>
        </main>
    </div>
      
  );
}
