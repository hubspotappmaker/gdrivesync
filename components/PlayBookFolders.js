import React, { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/dist/client/router';
import axios from "axios";
import config from "../config.json";
import handleAccessTokenExpiration from "./HandleAccessTokenExpiration";
import Link from 'next/link';

const PlayBookFolders = () => {
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
      {/* Folder listing as grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "20px",
        padding: "20px"
      }}>
        {results.map(result => (
          <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }} key={result.id}>
            <Link
              href={{
                pathname: `/list/[fid]`,
                query: { fid: result.id },
              }}
              as={`/list/${result.id}`}
            >
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #ddd",
                  padding: "20px",
                  textAlign: "center",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  borderRadius: "8px"
                }}
                onClick={() => {
                  const container = document.querySelector('.searchContainer');
                  if (container) {
                    container.innerHTML = '';
                  }
                }}
              >
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>{result.name}</h3>
              </div>
            </Link>

            {/* Close button */}
            <button
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "transparent",
                border: "none",
                fontSize: "18px",
                color: "#ff4d4f",
                cursor: "pointer",
                transition: "color 0.3s"
              }}
              onClick={(e) => {
                e.stopPropagation();  // Prevent the card click event from firing
                // Handle the close action here, if needed (e.g., delete folder, hide card, etc.)
              }}
            >
              X
            </button>
          </div>
        ))}
      </div>

      {/* Error & loading */}
      {loading && <div style={{ display: "none" }}>Loading...</div>}
      {error && <div>{error.message}</div>}
    </div>
  );
};

export default PlayBookFolders;
