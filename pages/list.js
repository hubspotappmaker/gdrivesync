import Head from 'next/head'
import React, { useState } from 'react';
import styles from '../styles/Home.module.css'
import PlayBookFiles from '../components/PlayBookFiles';

export default function Drilldown() {
  return (
    <div className={styles.container}>
      
        <main className={styles.main}>

          <PlayBookFiles />

        </main>
      
      
    </div>
  )
}
