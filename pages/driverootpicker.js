import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function DrivePicker() {
  const router = useRouter();

  useEffect(() => {
    const loadTokenAndPicker = async () => {
      if (!router.isReady) return;

      const accessToken = router.query.access_token;

      if (!accessToken) {
        alert('❌ Không có access_token trong URL');
        router.push('/');
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        gapi.load('client:picker', {
          callback: () => createPicker(accessToken),
        });
      };
      document.body.appendChild(script);
    };

    const createPicker = (accessToken) => {
      const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true);

      const picker = new google.picker.PickerBuilder()
        .setOAuthToken(accessToken)
        .addView(view)
        .setTitle('Chọn thư mục Google Drive')
        .setCallback((data) => {
          if (data.action === google.picker.Action.PICKED) {
            const folder = data.docs[0];
            alert(`✅ Đã chọn thư mục: ${folder.name}`);
            // 👉 Có thể gọi API lưu folder.id + hubspot info vào DB tại đây
            router.push(`/authsuccess?folder_id=${folder.id}`);
          } else if (data.action === google.picker.Action.CANCEL) {
            alert('❌ Đã hủy chọn thư mục');
            router.push('/driverootpicker');
          }
        })
        .build();

      picker.setVisible(true);
    };

    loadTokenAndPicker();
  }, [router.isReady]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Chọn thư mục Google Drive</title>
      </Head>

      <main className={styles.main}>
        <h1>📂 Đang mở Google Picker...</h1>
      </main>
    </div>
  );
}
