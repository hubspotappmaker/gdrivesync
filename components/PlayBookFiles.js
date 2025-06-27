import React, { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import axios from "axios";

const PlayBookFiles = () => {
  const mockRouter = useRouter();
  const { portalId, folderId: initialFolderId } = mockRouter.query;

  // Mock config values that were previously imported from config.json
  const teamDriveId = null; // Set to null if not using a specific team drive, or a mock ID like 'mockTeamDrive789'
  // Determine corpora based on whether teamDriveId is present
  const corpora = teamDriveId ? "teamDrive" : "allDrives";

  // State variables for managing component data and UI feedback
  const [results, setResults] = useState([]); // Stores the list of files and folders
  const [loading, setLoading] = useState(false); // Indicates if files/folders are being loaded
  const [error, setError] = useState(null); // Stores any error messages
  const [uploadProgress, setUploadProgress] = useState(null); // Tracks file upload progress
  const [uploadSuccess, setUploadSuccess] = useState(false); // Indicates successful file upload
  const [deleteSuccess, setDeleteSuccess] = useState(false); // Indicates successful deletion
  const [accessToken, setAccessToken] = useState(null); // Stores the Google Drive access token
  const [viewMode, setViewMode] = useState('grid'); // Current view mode: 'list' or 'grid'

  // State for file deletion confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [fileToDeleteId, setFileToDeleteId] = useState(null);

  // State for subfolder creation
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false); // Controls folder creation modal visibility
  const [newFolderName, setNewFolderName] = useState(''); // Stores the new subfolder name
  const [createFolderLoading, setCreateFolderLoading] = useState(false); // Indicates if folder is being created
  const [createFolderError, setCreateFolderError] = useState(null); // Stores any folder creation errors
  const [createFolderSuccess, setCreateFolderSuccess] = useState(false); // Indicates successful folder creation

  // State for managing current folder and navigation history
  const [currentFolderId, setCurrentFolderId] = useState(initialFolderId); // The ID of the folder currently being viewed
  const [parentFolderStack, setParentFolderStack] = useState([]); // Stack to keep track of parent folders for "back" navigation

  // Effect to initialize currentFolderId from router query when it becomes available
  // This useEffect now relies solely on mockRouter.isReady and initialFolderId
  // which are always available due to the direct mock object.
  useEffect(() => {
    if (mockRouter.isReady && initialFolderId && initialFolderId !== currentFolderId) {
      setCurrentFolderId(initialFolderId);
    }
  }, [mockRouter.isReady, initialFolderId, currentFolderId]);

  // Mock implementation for handleAccessTokenExpiration (for demonstration)
  const handleAccessTokenExpiration = () => {
    console.warn("Access token expired. In a real app, this would redirect for re-authentication.");
    setError(new Error("Your session has expired. Please refresh the page or re-authenticate."));
    setAccessToken(null); // Clear access token to prevent further API calls
  };

  // Mock implementation for handleGoogleDriveShortcutLink (for demonstration)
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
   * This function makes a real fetch call to a mock API endpoint.
   * @param {string} portalId - The ID of the portal to get credentials for.
   * @returns {Promise<{accessToken: string|null}>} - An object containing the access token.
   */
  const getCredentials = async (portalId) => {
    console.log(`Attempting to get credentials for portalId: ${portalId}`);
    try {
      const res = await fetch('https://gdrive.onextdigital.com/fe/api/db/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hubId: portalId }), // Pass portalId as hubId
      });

      const json = await res.json();
      console.log("Credentials API response:", json);

      // Extract the access_token from the response
      const accessToken = json?.data?.token?.access_token || null;

      if (!accessToken) {
        throw new Error("Failed to retrieve access token from credentials.");
      }
      return { accessToken };

    } catch (error) {
      console.error('Error fetching credentials:', error);
      return { accessToken: null }; // Return null accessToken on error
    }
  };

  // Effect hook to fetch credentials when router is ready and portalId is available
  useEffect(() => {
    const fetchCredentials = async () => {
      if (!portalId) return; // Ensure portalId exists
      const { accessToken } = await getCredentials(portalId);
      setAccessToken(accessToken);
    };

    if (mockRouter.isReady) { // mockRouter.isReady is always true now
      fetchCredentials();
    }
  }, [mockRouter.isReady, portalId]);

  /**
   * Fetches files and folders from Google Drive based on the currentFolderId and accessToken.
   * Sorts results to show folders first, then files, both alphabetically.
   */
  const getFiles = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Ensure currentFolderId is available before making API call
      if (!currentFolderId) {
        setLoading(false);
        return;
      }

      const res = await axios.get("https://www.googleapis.com/drive/v3/files", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          corpora,
          includeTeamDriveItems: true,
          supportsAllDrives: true,
          teamDriveId,
          // Query to fetch both files and folders that are not trashed and are in the current folder
          q: `'${currentFolderId}' in parents and trashed = false`,
        },
      });

      // Separate files and folders and sort them: folders first, then files, then by name
      const fetchedItems = res.data.files.sort((a, b) => {
        const isAFolder = a.mimeType === 'application/vnd.google-apps.folder';
        const isBFolder = b.mimeType === 'application/vnd.google-apps.folder';

        // Folders come before files
        if (isAFolder && !isBFolder) return -1;
        if (!isAFolder && isBFolder) return 1;
        // Sort alphabetically by name for same type (folder vs. file)
        return a.name.localeCompare(b.name);
      });

      setResults(fetchedItems); // Update state with fetched items
    } catch (err) {
      if (err.response?.status === 401) {
        handleAccessTokenExpiration();
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Effect hook to fetch files/folders when accessToken or currentFolderId changes
  useEffect(() => {
    // Only run if access token and currentFolderId are available
    if (!accessToken || !currentFolderId) return;

    getFiles(); // Call getFiles function
  }, [accessToken, currentFolderId]); // Dependencies: re-run if accessToken or currentFolderId changes

  /**
   * Determines the appropriate emoji icon for a given MIME type.
   * @param {string} mimeType - The MIME type of the file.
   * @returns {string} - An emoji representing the file/folder type.
   */
  const getFileIcon = (mimeType) => {
    if (mimeType === "application/vnd.google-apps.folder") return "🗂️"; // Folder icon
    if (mimeType.includes("spreadsheet") || mimeType.includes("sheet")) return "📊";
    if (mimeType.includes("document") || mimeType.includes("wordprocessingml")) return "📄";
    if (mimeType.includes("presentation")) return "📽️";
    if (mimeType === "application/pdf") return "📕";
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎬";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("zip") || mimeType.includes("rar")) return "📦";
    return "📁"; // Default generic file icon for unknown types
  };

  /**
   * Constructs the appropriate Google Drive URL for a given file.
   * For folders, it returns '#' to indicate they are handled by internal navigation.
   * @param {object} item - The file or folder object from Google Drive API.
   * @returns {string} - The URL to view or edit the file, or '#' for folders.
   */
  const getItemUrl = (item) => {
    // If it's a folder, it's not a direct link but an internal navigation
    if (item.mimeType === "application/vnd.google-apps.folder") {
      return "#";
    }

    const mime = item.mimeType;
    const id = item.id;
    // Special handling for Google Workspace (formerly G Suite) files
    if (mime.startsWith("application/vnd.google-apps.")) {
      if (mime.includes("document")) return `https://docs.google.com/document/d/${id}/edit`;
      if (mime.includes("spreadsheet")) return `https://docs.google.com/spreadsheets/d/${id}/edit`;
      if (mime.includes("presentation")) return `https://docs.google.com/presentation/d/${id}/edit`;
      // For other Google Apps files like Forms, Drawings etc., prefer webViewLink
      return item.webViewLink || `https://drive.google.com/file/d/${id}/view`;
    }
    // For non-Google Workspace files, use the direct view link
    return `https://drive.google.com/file/d/${id}/view`;
  };

  /**
   * Handles the removal (trashing) of a file or folder from Google Drive.
   * @param {string} itemId - The ID of the file or folder to remove.
   */
  const handleRemoveItem = (itemId) => {
    setFileToDeleteId(itemId); // Store ID of item to be deleted
    setShowConfirmModal(true); // Show confirmation modal
  };

  /**
   * Confirms and proceeds with the deletion of the stored file/folder ID.
   */
  const confirmDelete = async () => {
    if (!fileToDeleteId) return; // Should not happen if modal is triggered correctly

    try {
      if (accessToken) {
        await axios.delete(`https://www.googleapis.com/drive/v3/files/${fileToDeleteId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { supportsAllDrives: true }, // Ensure support for shared drives
        });
      } else {
        // Fallback to mock deletion if no access token
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      }

      // Filter out the deleted item from the current results state
      setResults(prev => prev.filter(item => item.id !== fileToDeleteId));
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000); // Hide after 3 seconds
      setError(null); // Clear any previous errors
    } catch (err) {
      setError(new Error("Could not delete file/folder. Please try again.")); // Set error message
      setDeleteSuccess(false); // Ensure success message is not displayed
      console.error("Error deleting file/folder:", err);
    } finally {
      setShowConfirmModal(false); // Always close modal
      setFileToDeleteId(null);    // Clear item ID to delete
    }
  };

  /**
   * Cancels file/folder deletion and closes the custom confirmation modal.
   */
  const cancelDelete = () => {
    setShowConfirmModal(false); // Close modal
    setFileToDeleteId(null);    // Clear item ID to delete
  };

  /**
   * Handles the file upload process to Google Drive.
   * @param {Event} e - The change event from the file input.
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    // Do not proceed if no file is selected or currentFolderId is missing
    if (!file || !currentFolderId) return;

    // Metadata for the file to be uploaded, including its name and parent folder
    const metadata = {
      name: file.name,
      parents: [currentFolderId], // Upload to the currently viewed folder
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
        setResults(prev => {
          const updatedResults = [...prev, newMockFile];
          // Re-sort to maintain order (folders first, then files)
          return updatedResults.sort((a, b) => {
            const isAFolder = a.mimeType === 'application/vnd.google-apps.folder';
            const isBFolder = b.mimeType === 'application/vnd.google-apps.folder';
            if (isAFolder && !isBFolder) return -1;
            if (!isAFolder && isBFolder) return 1;
            return a.name.localeCompare(b.name);
          });
        });
      }

      setUploadSuccess(true);  // Set upload success status
      setTimeout(() => setUploadSuccess(false), 3000); // Hide success message after 3 seconds
      setError(null); // Clear any previous errors
      // Re-fetch files to ensure the list is up-to-date with the newly uploaded file (if actual API call)
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

  /**
   * Handles navigation into a subfolder.
   * @param {object} folder - The folder object to navigate into.
   */
  const handleFolderClick = (folder) => {
    // Push the current folder ID onto the stack before navigating
    setParentFolderStack(prev => [...prev, currentFolderId]);
    setCurrentFolderId(folder.id); // Update current folder to the clicked one
    // In a real Next.js app, you'd use mockRouter.push here:
    // mockRouter.push({ query: { ...mockRouter.query, folderId: folder.id } });
  };

  /**
   * Handles the "Back" button click to navigate up to the parent folder.
   */
  const handleBackClick = () => {
    if (parentFolderStack.length > 0) {
      const prevFolderId = parentFolderStack[parentFolderStack.length - 1]; // Get the last folder ID from stack
      setParentFolderStack(prev => prev.slice(0, -1)); // Remove the last item from stack
      setCurrentFolderId(prevFolderId); // Set current folder to the previous one
      // In a real Next.js app, you'd use mockRouter.push here:
      // mockRouter.push({ query: { ...mockRouter.query, folderId: prevFolderId } });
    } else {
      console.log("Already at the initial/root folder.");
      // Optionally, disable the back button or show a message if already at root
    }
  };

  /**
   * Handles the creation of a new subfolder in Google Drive.
   */
  const handleCreateSubfolder = async () => {
    if (!newFolderName.trim()) {
      setCreateFolderError(new Error("Folder name cannot be empty."));
      return;
    }

    setCreateFolderLoading(true);
    setCreateFolderError(null);
    setCreateFolderSuccess(false);

    const folderMetadata = {
      name: newFolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [currentFolderId], // Create inside the currently viewed folder
    };

    try {
      if (accessToken) {
        const response = await axios.post(
          "https://www.googleapis.com/drive/v3/files",
          folderMetadata,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json', // Important for metadata-only requests
            },
            params: { supportsAllDrives: true },
          }
        );
        console.log("Folder created:", response.data);
      } else {
        // Mock creation if no access token
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
        // Add mock folder to results locally
        const newMockFolder = {
          id: `mock-folder-${Date.now()}`,
          name: newFolderName,
          mimeType: 'application/vnd.google-apps.folder',
        };
        setResults(prev => {
          const updatedResults = [...prev, newMockFolder];
          // Re-sort to maintain order (folders first, then files)
          return updatedResults.sort((a, b) => {
            const isAFolder = a.mimeType === 'application/vnd.google-apps.folder';
            const isBFolder = b.mimeType === 'application/vnd.google-apps.folder';
            if (isAFolder && !isBFolder) return -1;
            if (!isAFolder && isBFolder) return 1;
            return a.name.localeCompare(b.name);
          });
        });
      }

      setCreateFolderSuccess(true);
      setTimeout(() => setCreateFolderSuccess(false), 3000);
      setNewFolderName(''); // Clear input
      setShowCreateFolderModal(false); // Close modal
      if (accessToken) {
        await getFiles(); // Re-fetch files to see the newly created folder
      }
    } catch (err) {
      setCreateFolderError(new Error(`Failed to create folder: ${err.message || 'Unknown error'}`));
      setCreateFolderSuccess(false);
      console.error("Error creating folder:", err);
    } finally {
      setCreateFolderLoading(false);
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
        width: '90%', // Adjusted from maxWidth to width for better responsiveness
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        padding: '2.5rem',
        boxSizing: 'border-box'
      }}>

        {/* Navigation and Actions Section */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap', // Allow items to wrap on smaller screens
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem', // Gap between items
          paddingBottom: '1rem',
          borderBottom: '1px solid #e9ecef'
        }}>
          {/* Back Button */}
          {parentFolderStack.length > 0 && (
            <button
              onClick={handleBackClick}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                padding: '0.8rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'background-color 0.3s ease, transform 0.2s ease',
                boxShadow: '0 4px 10px rgba(108, 117, 125, 0.2)',
                outline: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
          )}

          {/* Create Subfolder Button */}
          <button
            onClick={() => setShowCreateFolderModal(true)}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '0.8rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'background-color 0.3s ease, transform 0.2s ease',
              boxShadow: '0 4px 10px rgba(40, 167, 69, 0.2)',
              outline: 'none',
              border: 'none',
              cursor: 'pointer',
              flexGrow: 1, // Allow button to grow
              maxWidth: '200px' // Limit max width
            }}
          >
            Create Subfolder
          </button>

          {/* File Upload Button (repositioned and styled) */}
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
            display: 'inline-block',
            flexGrow: 1, // Allow button to grow
            maxWidth: '200px', // Limit max width
            textAlign: 'center'
          }}>
            Upload File
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileUpload}
            style={{ display: 'none' }} // Hide the default input
          />
        </div>

        {/* Upload/Delete/Create Feedback Area */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: '#e9ecef',
          borderRadius: '8px'
        }}>
          {uploadProgress !== null && (
            <div style={{
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
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  border: 'none',
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
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>✅</span> Deleted successfully!
            </div>
          )}
          {createFolderSuccess && (
            <div style={{
              color: '#28a745',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>✅</span> Folder created successfully!
            </div>
          )}
          {(error || createFolderError) && (
            <div style={{
              color: '#dc3545',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>❌</span> {error?.message || createFolderError?.message}
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
            Loading files and folders...
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
            No files or folders found. Upload or create one to get started!
          </div>
        ) : (
          viewMode === 'list' ? (
            /* Files/Folders Table Section (List View) */
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '0.5rem',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                borderRadius: '8px',
                overflow: 'hidden',
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
                    }}>Name</th>
                    <th style={{
                      padding: '1rem 0.8rem',
                      textAlign: 'center',
                      borderBottom: '1px solid #dee2e6',
                      width: '15%'
                    }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, index) => (
                    <tr key={item.id} style={{
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
                        {item.mimeType === 'application/vnd.google-apps.folder' ? (
                          <a
                            onClick={() => handleFolderClick(item)} // Handle folder click for navigation
                            style={{
                              textDecoration: 'none',
                              color: '#007bff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'color 0.2s ease',
                              fontWeight: '500',
                              cursor: 'pointer' // Indicate clickable
                            }}
                          >
                            <span style={{ fontSize: '1.2rem' }}>{getFileIcon(item.mimeType)}</span>
                            {item.name}
                          </a>
                        ) : (
                          <a
                            href={getItemUrl(item)} // Use getItemUrl for files
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
                            <span style={{ fontSize: '1.2rem' }}>{getFileIcon(item.mimeType)}</span>
                            {item.name}
                          </a>
                        )}
                      </td>
                      <td style={{
                        padding: '1rem 0.8rem',
                        textAlign: 'center',
                        borderBottom: '1px solid #dee2e6'
                      }}>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
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
            /* Files/Folders Grid Section (Grid View) */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', // Responsive grid columns
              gap: '1.5rem',
              marginTop: '0.5rem',
            }}>
              {results.map((item) => (
                <div
                  key={item.id}
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
                    overflow: 'hidden'
                  }}
                >
                  {item.mimeType === 'application/vnd.google-apps.folder' ? (
                    <a
                      onClick={() => handleFolderClick(item)} // Handle folder click for navigation
                      style={{
                        textDecoration: 'none',
                        color: '#007bff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        paddingBottom: '2.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{getFileIcon(item.mimeType)}</span>
                      <span style={{
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        color: '#343a40',
                        wordBreak: 'break-word',
                        width: '100%'
                      }}>
                        {item.name}
                      </span>
                    </a>
                  ) : (
                    <a
                      href={getItemUrl(item)} // Use getItemUrl for files
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
                        paddingBottom: '2.5rem'
                      }}
                    >
                      <span style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{getFileIcon(item.mimeType)}</span>
                      <span style={{
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        color: '#343a40',
                        wordBreak: 'break-word',
                        width: '100%'
                      }}>
                        {item.name}
                      </span>
                    </a>
                  )}

                  <button
                    onClick={() => handleRemoveItem(item.id)}
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

      {/* Confirmation Modal for Deletion */}
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
          zIndex: 1000
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
              Confirm Deletion
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#6c757d',
              marginBottom: '1.5rem'
            }}>
              Are you sure you want to delete this file/folder? This action cannot be undone.
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
                Cancel
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Subfolder Modal */}
      {showCreateFolderModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
            maxWidth: '450px',
            width: '90%',
            boxSizing: 'border-box'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              color: '#343a40',
              marginBottom: '1rem'
            }}>
              Create New Subfolder
            </h3>
            <input
              type="text"
              placeholder="Enter folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              style={{
                width: 'calc(100% - 2rem)', // Account for padding
                padding: '0.8rem 1rem',
                marginBottom: '1.5rem',
                border: '1px solid #ced4da',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
            />
            {createFolderLoading && (
              <p style={{ color: '#007bff', marginBottom: '1rem' }}>Creating folder...</p>
            )}
            {createFolderError && (
              <p style={{ color: '#dc3545', marginBottom: '1rem' }}>{createFolderError.message}</p>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <button
                onClick={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName(''); // Clear input on cancel
                  setCreateFolderError(null); // Clear errors on cancel
                }}
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
                Cancel
              </button>
              <button
                onClick={handleCreateSubfolder}
                disabled={createFolderLoading}
                style={{
                  padding: '0.8rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#28a745',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: createFolderLoading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.3s ease, transform 0.2s ease',
                  boxShadow: '0 4px 10px rgba(40, 167, 69, 0.2)',
                  outline: 'none',
                  opacity: createFolderLoading ? 0.7 : 1
                }}
              >
                {createFolderLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayBookFiles;
