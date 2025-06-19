import React, { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import axios from "axios";
import config from "../config.json";
import handleAccessTokenExpiration from "./HandleAccessTokenExpiration";
import handleGoogleDriveShortcutLink from "./HandleGoogleDriveShortcutLink";

const PlayBookFiles = () => {
  const router = useRouter();
  const fid = router.query.fid || 'null';

  const teamDriveId = config.directory.team_drive;
  const corpora = teamDriveId ? "teamDrive" : "allDrives";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch("/api/token");
        const data = await res.json();
        setAccessToken(data.access_token);
      } catch (err) {
        console.error("Failed to retrieve access token:", err);
      }
    };
    fetchToken();
  }, []);

  const getFiles = async () => {
    if (!accessToken || fid === "null") return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await axios.get("https://www.googleapis.com/drive/v3/files", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          corpora,
          includeTeamDriveItems: true,
          supportsAllDrives: true,
          teamDriveId,
          q: `mimeType!='application/vnd.google-apps.folder' and trashed = false and '${fid}' in parents`,
        },
      });
      setResults(res.data.files);
    } catch (err) {
      if (err.response?.status === 401) {
        handleAccessTokenExpiration();
      } else {
        setError(err);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!router.isReady || !accessToken) return;

    if (fid === 'null') {
      if (!sessionStorage.getItem("reloadedForNullFid")) {
        sessionStorage.setItem("reloadedForNullFid", "true");
        window.location.reload();
      }
      return;
    }

    sessionStorage.removeItem("reloadedForNullFid");
    getFiles();
  }, [router.isReady, fid, accessToken]);

  const getFileIcon = (mimeType) => {
    if (mimeType.includes("spreadsheet")) return "📊";
    if (mimeType.includes("document")) return "📄";
    if (mimeType.includes("presentation")) return "📽️";
    if (mimeType === "application/pdf") return "📕";
    if (mimeType.startsWith("image/")) return "🖼️";
    return "📁";
  };

  const getFileUrl = (file) => {
    const mime = file.mimeType;
    const id = file.id;
    if (mime.startsWith("application/vnd.google-apps.")) {
      if (mime.includes("document")) return `https://docs.google.com/document/d/${id}/edit`;
      if (mime.includes("spreadsheet")) return `https://docs.google.com/spreadsheets/d/${id}/edit`;
      if (mime.includes("presentation")) return `https://docs.google.com/presentation/d/${id}/edit`;
    }
    return `https://drive.google.com/file/d/${id}/view`;
  };

  const handleRemoveFile = async (fileId) => {
   // if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      await axios.delete(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { supportsAllDrives: true },
      });
      setResults(prev => prev.filter(file => file.id !== fileId));
      alert("File deleted.");
    } catch (err) {
      alert("Failed to delete file.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || fid === "null") return;

    const metadata = {
      name: file.name,
      parents: [fid],
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", file);

    setUploadProgress(0);
    setUploadSuccess(false);

    try {
      await axios.post(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
        form,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / e.total);
            setUploadProgress(percent);
          },
        }
      );

      setUploadProgress(null);
      await getFiles();
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      setUploadProgress(null);
      if (err.response?.status === 401) {
        handleAccessTokenExpiration();
      }
      alert("Upload failed.");
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial' }}>
      <input type="file" onChange={handleFileUpload} />
     
      {uploadProgress !== null && (
        <div style={{ marginTop: 16 }}>
          <progress value={uploadProgress} max="100" />
          <span> {uploadProgress}%</span>
        </div>
      )}

      {uploadSuccess && (
        <div style={{ color: "green", marginTop: 10 }}>
          ✅ File uploaded successfully!
        </div>
      )}

      {error && (
        <div style={{ color: "red", marginTop: 10 }}>
          {error.message}
        </div>
      )}

      <table border="1" cellPadding="10" style={{ width: '100%', marginTop: 24 }}>
        <thead>
          <tr>
            <th>#</th>
            <th>File Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="3">Loading...</td></tr>
          ) : results.length === 0 ? (
            <tr><td colSpan="3">No files found.</td></tr>
          ) : (
            results.map((file, index) => (
              <tr key={file.id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td>
                  <a
                    href={getFileUrl(file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleGoogleDriveShortcutLink}
                  >
                    <span style={{ marginRight: 8 }}>{getFileIcon(file.mimeType)}</span>
                    {file.name}
                  </a>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button onClick={() => handleRemoveFile(file.id)} style={{ color: 'red' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PlayBookFiles;
