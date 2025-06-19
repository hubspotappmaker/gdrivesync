import React, { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/dist/client/router';
import axios from "axios";
import config from "../config.json";
import styles from '../styles/Home.module.css';
import handleAccessTokenExpiration from "./HandleAccessTokenExpiration";
import Link from 'next/link';

const UploadFiles = () => {
 const router = useRouter();
  const targetFolderId = typeof router.query.fid !== 'undefined' ? router.query.fid : config.directory.target_folder;
  const teamDriveId = config.directory.team_drive;
  const corpora = teamDriveId ? "teamDrive" : "allDrives";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const getFiles = async () => {
      setLoading(true);
      setError(null);
      setResults([]);

      const accessToken = localStorage.getItem("access_token");

      try {
        const res = await axios.get("https://www.googleapis.com/drive/v3/files", {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            source: "PlayBookFolders",
            corpora,
            includeTeamDriveItems: true,
            supportsAllDrives: true,
            teamDriveId,
            q: `mimeType='application/vnd.google-apps.folder' and trashed = false and parents in '${targetFolderId}'`
          }
        });

        setResults(res.data.files);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          handleAccessTokenExpiration();
        } else {
          setError(err);
        }
      }

      setLoading(false);
    };

    getFiles();
  }, [targetFolderId]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const accessToken = localStorage.getItem("access_token");

    const metadata = {
      name: file.name,
      parents: [targetFolderId]
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", file);

    try {
      await axios.post(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
        form,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          }
        }
      );

      // Refresh page after successful upload
      router.replace(router.asPath);
    } catch (err) {
      console.error("Upload error:", err);
      if (err.response && err.response.status === 401) {
        handleAccessTokenExpiration();
      } else {
        setError(err);
      }
    }
  };

  return (
    <div style={{ width: "100%", textAlign: "left" }}>
     
      {/* Upload button */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          className={styles.card}
        >
          📁 Upload File
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {/* Error & loading */}
      {loading && <div style={{ display: "none" }}>Loading...</div>}
      {error && <div>{error.message}</div>}
    </div>
  );
};
 

export default UploadFiles;
