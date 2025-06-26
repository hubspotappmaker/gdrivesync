import React, { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import axios from "axios";

const PlayBookFiles = () => {
  const mockRouter = useRouter();
  const { portalId, folderId } = mockRouter.query;

  // Mock config values that were previously imported from config.json
  const teamDriveId = null; // Set to null if not using a specific team drive, or a mock ID like 'mockTeamDrive789'
  // Determine corpora based on whether teamDriveId is present
  const corpora = teamDriveId ? "teamDrive" : "allDrives";

  // State variables for managing component data and UI feedback
  const [results, setResults] = useState([]); // Stores the list of files
  const [loading, setLoading] = useState(false); // Indicates if files are being loaded
  const [error, setError] = useState(null); // Stores any error messages
  const [uploadProgress, setUploadProgress] = useState(null); // Tracks upload progress
  const [uploadSuccess, setUploadSuccess] = useState(false); // Indicates successful upload
  const [deleteSuccess, setDeleteSuccess] = useState(false); // Indicates successful upload
  const [accessToken, setAccessToken] = useState(null); // Stores the Google Drive access token
  const [viewMode, setViewMode] = useState('grid'); // New state for view mode: 'list' or 'grid' - CHANGED TO 'grid'

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [fileToDeleteId, setFileToDeleteId] = useState(null);

  // Mock implementation for handleAccessTokenExpiration
  const handleAccessTokenExpiration = () => {
    console.warn("Access token expired. In a real app, this would redirect for re-authentication.");
    setError(new Error("Your session has expired. Please refresh the page or re-authenticate."));
    setAccessToken(null); // Clear access token to prevent further API calls
  };

  // Mock implementation for handleGoogleDriveShortcutLink
  const handleGoogleDriveShortcutLink = (e) => {
    // Prevent default anchor behavior to demonstrate that this function is called.
    // In a real app, this might navigate or open a custom viewer.
    e.preventDefault();
    console.log("Mock: Handling Google Drive shortcut link click.");
    // For demonstration, open the link in a new tab manually
    window.open(e.currentTarget.href, '_blank', 'noopener,noreferrer');
  };

  /**
   * Fetches credentials (specifically the access token) for the given portalId.
   * This function is now mocked to prevent "Failed to fetch" errors in isolated environments.
   * In a live environment, you would uncomment the actual fetch call.
   * @param {string} portalId - The ID of the portal to get credentials for.
   * @returns {Promise<{accessToken: string|null}>} - An object containing the access token.
   */
  const getCredentials = async (portalId) => {
    console.log(`Mock: Attempting to get credentials for portalId: ${portalId}`);
    try {
   
      const res = await fetch('https://gdrive.onextdigital.com/fe/api/db/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hubId: portalId }), // Pass portalId as hubId
      });

      const json = await res.json();
      console.log("Credentials API response:", json); // Log the full response for debugging

      // Extract the access_token from the response
      const accessToken = json?.data?.token?.access_token || null;

      if (!accessToken) {
          throw new Error("Failed to retrieve access token from credentials.");
      }
      return { accessToken };
      
    } catch (error) {
      console.error('Lỗi khi lấy credentials (Mocked):', error); // Log error for debugging
      return { accessToken: null }; // Return null accessToken on error
    }
  };

  // Effect hook to fetch credentials when router is ready and portalId is available
  useEffect(() => {
    const fetchCredentials = async () => {
      // Ensure portalId exists before attempting to fetch credentials
      if (!portalId) return;
      const { accessToken } = await getCredentials(portalId);
      setAccessToken(accessToken);
    };

    // Only run if mockRouter is ready (i.e., query parameters are available)
    if (mockRouter.isReady) {
      fetchCredentials();
    }
  }, [mockRouter.isReady, portalId]); // Dependencies: re-run if mockRouter readiness or portalId changes

  /**
   * Fetches files from Google Drive based on the current folderId and accessToken.
   * This function now makes real API calls (if accessToken is valid) or uses mock data.
   * In a live environment, ensure you have a valid access token and folderId to make real API calls.
   */
  const getFiles = async () => {
 

    setLoading(true); // Set loading state to true
    setError(null);    // Clear any previous errors
    setResults([]);    // Clear previous results

    try {
      // Actual axios call to Google Drive API
      const res = await axios.get("https://www.googleapis.com/drive/v3/files", {
        headers: { Authorization: `Bearer ${accessToken}` }, // Authorization header with access token
        params: {
          corpora, // Specifies whether to search in teamDrive or allDrives
          includeTeamDriveItems: true, // Include files from Team Drives
          supportsAllDrives: true,     // Support all drives (shared drives)
          teamDriveId,                 // Specify team drive ID if applicable
          // Query to fetch files that are not folders, not trashed, and are in the current folder
          q: `mimeType!='application/vnd.google-apps.folder' and trashed = false and '${folderId}' in parents`,
        },
      });
      setResults(res.data.files); // Update state with fetched files
    } catch (err) {
      // Handle 401 Unauthorized error (e.g., token expiration)
      if (err.response?.status === 401) {
        handleAccessTokenExpiration(); // Call external handler for token expiration
      } else {
        setError(err); // Set general error state
      }
    } finally {
      setLoading(false); // Always set loading to false after attempt
    }
  };

  // Effect hook to fetch files when router is ready and accessToken is available
  useEffect(() => {
    // Do not run if mockRouter is not ready or access token is missing
    if (!mockRouter.isReady || !accessToken) return;

    getFiles(); // Call getFiles function
  }, [mockRouter.isReady, accessToken, folderId]); // Dependencies: re-run if mockRouter readiness, accessToken, or folderId changes

  /**
   * Determines the appropriate emoji icon for a given MIME type.
   * @param {string} mimeType - The MIME type of the file.
   * @returns {string} - An emoji representing the file type.
   */
  const getFileIcon = (mimeType) => {
    if (mimeType.includes("spreadsheet") || mimeType.includes("sheet")) return "📊";
    if (mimeType.includes("document") || mimeType.includes("wordprocessingml")) return "📄";
    if (mimeType.includes("presentation")) return "📽️";
    if (mimeType === "application/pdf") return "📕";
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎬";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("zip") || mimeType.includes("rar")) return "📦";
    return "📁"; // Default folder icon for unknown types
  };

  /**
   * Constructs the appropriate Google Drive URL for a given file.
   * @param {object} file - The file object from Google Drive API.
   * @returns {string} - The URL to view or edit the file.
   */
  const getFileUrl = (file) => {
    const mime = file.mimeType;
    const id = file.id;
    // Special handling for Google Workspace (formerly G Suite) files
    if (mime.startsWith("application/vnd.google-apps.")) {
      if (mime.includes("document")) return `https://docs.google.com/document/d/${id}/edit`;
      if (mime.includes("spreadsheet")) return `https://docs.google.com/spreadsheets/d/${id}/edit`;
      if (mime.includes("presentation")) return `https://docs.google.com/presentation/d/${id}/edit`;
      // For other Google Apps files like Forms, Drawings etc., prefer webViewLink
      return file.webViewLink || `https://drive.google.com/file/d/${id}/view`;
    }
    // For non-Google Workspace files, use the direct view link
    return `https://drive.google.com/file/d/${id}/view`;
  };

  /**
   * Handles the removal (trashing) of a file from Google Drive.
   * This function now makes a real API call (if accessToken is valid) or uses mock data.
   * @param {string} fileId - The ID of the file to remove.
   */
  const handleRemoveFile = (fileId) => {
    setFileToDeleteId(fileId); // Lưu ID của tệp sẽ bị xóa
    setShowConfirmModal(true); // Hiển thị modal xác nhận
  };
  const confirmDelete = async () => {
    if (!fileToDeleteId) return; // Không được xảy ra nếu modal được kích hoạt đúng cách

    try {
      if (accessToken) {
        await axios.delete(`https://www.googleapis.com/drive/v3/files/${fileToDeleteId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { supportsAllDrives: true }, // Đảm bảo hỗ trợ các ổ đĩa dùng chung
        });
      } else {
        // Quay lại dữ liệu giả lập nếu không có mã truy cập
        await new Promise(resolve => setTimeout(resolve, 500)); // Giả lập độ trễ mạng
      }

      // Lọc tệp đã xóa khỏi trạng thái kết quả hiện tại
      setResults(prev => prev.filter(file => file.id !== fileToDeleteId));
      // Đặt thông báo thành công
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000); // Ẩn sau 3 giây
      setError(null); // Xóa mọi lỗi trước đó
    } catch (err) {
      setError(new Error("Không thể xóa tệp. Vui lòng thử lại.")); // Đặt thông báo lỗi
      setDeleteSuccess(false); // Đảm bảo thông báo thành công không được hiển thị
      console.error("Lỗi khi xóa tệp:", err);
    } finally {
      setShowConfirmModal(false); // Luôn đóng modal
      setFileToDeleteId(null);    // Xóa ID tệp cần xóa
    }
  };

  /**
   * Hủy xóa tệp và đóng modal xác nhận tùy chỉnh.
   */
  const cancelDelete = () => {
    setShowConfirmModal(false); // Đóng modal
    setFileToDeleteId(null);    // Xóa ID tệp cần xóa
  };

  /**
   * Handles the file upload process to Google Drive.
   * This function now makes a real API call (if accessToken is valid) or uses mock data.
   * @param {Event} e - The change event from the file input.
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    // Do not proceed if no file is selected or folderId is missing
    if (!file || !folderId) return;

    // Metadata for the file to be uploaded, including its name and parent folder
    const metadata = {
      name: file.name,
      parents: [folderId],
    };

    // Create a FormData object to send multipart/form-data
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", file);

    setUploadProgress(0);     // Reset upload progress
    setUploadSuccess(false);  // Reset upload success status
    setError(null);           // Clear any previous errors

    try {
      if (accessToken) {
        await axios.post(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
          form,
          {
            headers: { Authorization: `Bearer ${accessToken}` }, // Authorization header
            onUploadProgress: (e) => {
              // Calculate and update upload progress
              const percent = Math.round((e.loaded * 100) / e.total);
              setUploadProgress(percent);
            },
          }
        );
      } else {
        // Fallback to mock upload if no access token
        let currentProgress = 0;
        const progressInterval = setInterval(() => {
          currentProgress += 10;
          if (currentProgress <= 100) {
            setUploadProgress(currentProgress);
          } else {
            clearInterval(progressInterval);
          }
        }, 100);

        await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate upload time

        clearInterval(progressInterval); // Ensure interval is cleared even if promise resolves faster
        setUploadProgress(null); // Clear progress bar after upload completes
        // Add the new file to the results locally for demonstration
        const newMockFile = {
          id: `mock-${Date.now()}`,
          name: file.name,
          mimeType: file.type,
          webViewLink: `https://example.com/uploaded/${file.name}` // Mock link
        };
        setResults(prev => [...prev, newMockFile]);
      }


      setUploadSuccess(true);  // Set upload success status
      setTimeout(() => setUploadSuccess(false), 3000); // Hide success message after 3 seconds
      setError(null); // Clear any previous errors
      // Re-fetch files to ensure the list is up-to-date with the newly uploaded file
      // Only call getFiles if there's an accessToken, otherwise, mock data is already handled.
      if (accessToken) {
          await getFiles();
      }
    } catch (err) {
      setUploadProgress(null); // Clear progress bar on error
      if (err.response?.status === 401) {
        handleAccessTokenExpiration(); // Handle token expiration
      } else {
        setError(new Error(`Upload failed: ${err.message || 'Unknown error'}`)); // Set detailed error message
      }
      setUploadSuccess(false); // Ensure success message is not shown
      console.error("Error uploading file:", err);
    }
  };

  return (
    <div style={{
      fontFamily: 'Inter, sans-serif',
      padding: '2rem',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: '#343a40',
      boxSizing: 'border-box' // Ensure padding doesn't add to total width
    }}>
      <div style={{
        // Changed maxWidth to width: '90%'
        width: '90%',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        padding: '2.5rem',
        boxSizing: 'border-box'
      }}>

        {/* File Upload Section */}
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          border: '2px dashed #ced4da',
          borderRadius: '8px',
          backgroundColor: '#e9ecef',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <label htmlFor="file-upload" style={{
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: 'white',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'background-color 0.3s ease, transform 0.2s ease',
            boxShadow: '0 4px 10px rgba(0, 123, 255, 0.2)',
            outline: 'none',
            border: 'none',
            display: 'inline-block' // Ensures proper sizing
          }}>
            Choose File to Upload
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileUpload}
            style={{ display: 'none' }} // Hide the default input
          />

          {uploadProgress !== null && (
            <div style={{
              marginTop: '1rem',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <progress
                value={uploadProgress}
                max="100"
                style={{
                  width: '80%',
                  height: '10px',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  WebkitAppearance: 'none', // For Safari
                  appearance: 'none',
                  border: 'none',
                  // Styling for the progress bar fill (Webkit/Firefox)
                  // These are pseudo-elements, so they are not directly settable in inline style
                  // For full cross-browser styling, consider a CSS stylesheet or a UI library
                }}
              />
              <span style={{ fontSize: '0.9rem', color: '#495057' }}>
                {Math.round(uploadProgress)}%
              </span>
            </div>
          )}

          {uploadSuccess && (
            <div style={{
              color: '#28a745',
              marginTop: '0.8rem',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>✅</span> File uploaded successfully!
            </div>
          )}
          {deleteSuccess && (
            <div style={{
              color: '#28a745',
              marginTop: '0.8rem',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>✅</span>Deleted successfully!
            </div>
          )}

          {error && (
            <div style={{
              color: '#dc3545',
              marginTop: '0.8rem',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>❌</span> {error.message}
            </div>
          )}
        </div>

        {/* View Mode Toggle Buttons */}
        <div style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem'
        }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: '8px',
              border: `2px solid ${viewMode === 'list' ? '#007bff' : '#ced4da'}`,
              backgroundColor: viewMode === 'list' ? '#007bff' : '#ffffff',
              color: viewMode === 'list' ? 'white' : '#495057',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
              boxShadow: viewMode === 'list' ? '0 4px 10px rgba(0, 123, 255, 0.2)' : 'none',
              outline: 'none'
            }}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: '8px',
              border: `2px solid ${viewMode === 'grid' ? '#007bff' : '#ced4da'}`,
              backgroundColor: viewMode === 'grid' ? '#007bff' : '#ffffff',
              color: viewMode === 'grid' ? 'white' : '#495057',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
              boxShadow: viewMode === 'grid' ? '0 4px 10px rgba(0, 123, 255, 0.2)' : 'none',
              outline: 'none'
            }}
          >
            Grid View
          </button>
        </div>


        {/* Conditional Rendering for List or Grid View */}
        {loading ? (
          <div style={{
            padding: '1.5rem',
            textAlign: 'center',
            color: '#6c757d',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
          }}>
            Loading files...
          </div>
        ) : results.length === 0 ? (
          <div style={{
            padding: '1.5rem',
            textAlign: 'center',
            color: '#6c757d',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
          }}>
            No files found. Upload one to get started!
          </div>
        ) : (
          viewMode === 'list' ? (
            /* Files Table Section (List View) */
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '0.5rem', // Adjusted margin due to toggle buttons
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                borderRadius: '8px',
                overflow: 'hidden', // Ensures rounded corners apply to table content
              }}>
                <thead style={{ backgroundColor: '#007bff', color: 'white' }}>
                  <tr>
                    <th style={{
                      padding: '1rem 0.8rem',
                      textAlign: 'center',
                      borderBottom: '1px solid #dee2e6',
                      width: '5%'
                    }}>#</th>
                    <th style={{
                      padding: '1rem 0.8rem',
                      textAlign: 'left',
                      borderBottom: '1px solid #dee2e6',
                      width: '80%'
                    }}>File Name</th>
                    <th style={{
                      padding: '1rem 0.8rem',
                      textAlign: 'center',
                      borderBottom: '1px solid #dee2e6',
                      width: '15%'
                    }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((file, index) => (
                    <tr key={file.id} style={{
                      backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
                      transition: 'background-color 0.2s ease'
                    }}>
                      <td style={{
                        padding: '1rem 0.8rem',
                        textAlign: 'center',
                        borderBottom: '1px solid #dee2e6',
                        color: '#495057'
                      }}>{index + 1}</td>
                      <td style={{
                        padding: '1rem 0.8rem', 
                        borderBottom: '1px solid #dee2e6'
                      }}>
                        <a
                          href={getFileUrl(file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleGoogleDriveShortcutLink}
                          style={{
                            textDecoration: 'none',
                            color: '#007bff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'color 0.2s ease',
                            fontWeight: '500'
                          }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>{getFileIcon(file.mimeType)}</span>
                          {file.name}
                        </a>
                      </td>
                      <td style={{
                        padding: '1rem 0.8rem',
                        textAlign: 'center',
                        borderBottom: '1px solid #dee2e6'
                      }}>
                        <button
                          onClick={() => handleRemoveFile(file.id)}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            transition: 'background-color 0.3s ease, transform 0.2s ease',
                            boxShadow: '0 2px 5px rgba(220, 53, 69, 0.2)',
                            outline: 'none'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Files Grid Section (Grid View) */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', // Responsive grid columns
              gap: '1.5rem',
              marginTop: '0.5rem', // Adjusted margin due to toggle buttons
            }}>
              {results.map((file) => (
                <div
                  key={file.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden' // Ensure content respects border-radius
                  }}
                >
                  <a
                    href={getFileUrl(file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleGoogleDriveShortcutLink}
                    style={{
                      textDecoration: 'none',
                      color: '#007bff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      paddingBottom: '2.5rem' // Space for delete button
                    }}
                  >
                    <span style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{getFileIcon(file.mimeType)}</span>
                    <span style={{
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      color: '#343a40',
                      wordBreak: 'break-word',
                      width: '100%'
                    }}>
                      {file.name}
                    </span>
                  </a>
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0 0 8px 8px', // Only bottom corners rounded
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      transition: 'background-color 0.3s ease, transform 0.2s ease',
                      boxShadow: '0 -2px 5px rgba(220, 53, 69, 0.2)',
                      outline: 'none',
                      width: '100%',
                      position: 'absolute',
                      bottom: 0,
                      left: 0
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000 // Ensure it's above other content
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
            maxWidth: '400px',
            width: '90%',
            boxSizing: 'border-box'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              color: '#343a40',
              marginBottom: '1rem'
            }}>
              Delete Confirm
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#6c757d',
              marginBottom: '1.5rem'
            }}>
             Are you sure you want to delete this file? This action cannot be undone.
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '0.8rem 1.5rem',
                  borderRadius: '8px',
                  border: '1px solid #ced4da',
                  backgroundColor: '#f1f3f5',
                  color: '#495057',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease, border-color 0.3s ease',
                  outline: 'none'
                }}
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '0.8rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease, transform 0.2s ease',
                  boxShadow: '0 4px 10px rgba(220, 53, 69, 0.2)',
                  outline: 'none'
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayBookFiles;
