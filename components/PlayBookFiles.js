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
  const [results, setResults] = useState([]); // Stores the list of files and folders
  const [loading, setLoading] = useState(false); // Indicates if files/folders are being loaded
  const [error, setError] = useState(null); // Stores any error messages
  const [uploadProgress, setUploadProgress] = useState(null); // Tracks file upload progress
  const [uploadSuccess, setUploadSuccess] = useState(false); // Indicates successful file upload
  const [deleteSuccess, setDeleteSuccess] = useState(false); // Indicates successful deletion
  const [accessToken, setAccessToken] = useState(null); // Stores the Google Drive access token
  const [viewMode, setViewMode] = useState('grid'); // Current view mode: 'list' or 'grid'
  const [userRootFileId,setUserRootFileId] = useState(null)

  // State for file deletion confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [fileToDeleteId, setFileToDeleteId] = useState(null);

  // State for subfolder creation
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false); // Controls folder creation modal visibility
  const [newFolderName, setNewFolderName] = useState(''); // Stores the new subfolder name
  const [createFolderLoading, setCreateFolderLoading] = useState(false); // Indicates if folder is being created
  const [createFolderError, setCreateFolderError] = useState(null); // Stores any folder creation errors
  const [createFolderSuccess, setCreateFolderSuccess] = useState(false); // Indicates successful folder creation
  const [parentFolderId, setParentFolderId] = useState(null);

  
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
      const res = await fetch('https://gdrive.nexce.io/fe/api/db/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hubId: portalId }), // Pass portalId as hubId
      });

      const json = await res.json();
      console.log("Credentials API response:", json);

      // Extract the access_token from the response
      const accessToken = json?.data?.token?.access_token || null;
      const userDriveFolder = json?.data?.token?.folder_id
        setUserRootFileId(userDriveFolder)
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
      if (!folderId) {
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
          q: `'${folderId}' in parents and trashed = false`,
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
    if (!accessToken || !folderId) return;

    getFiles(); // Call getFiles function
  }, [accessToken, folderId]); // Dependencies: re-run if accessToken or currentFolderId changes

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
    if (!file || !folderId) return;

    // Metadata for the file to be uploaded, including its name and parent folder
    const metadata = {
      name: file.name,
      parents: [folderId], // Upload to the currently viewed folder
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



  useEffect(() => {
    if (!folderId || !accessToken) return;

    const fetchParentId = async () => {
      const parentIds = await getLastParentFolderId(folderId, accessToken);
      
      if (parentIds && parentIds.length > 0) {
       
         const grandParentIds = await getLastParentFolderId(parentIds[0], accessToken);
         if (grandParentIds && grandParentIds.length > 0){
             setParentFolderId(parentIds[0]); // ✅ Save ID to state
         }else{
           setParentFolderId(null); // No parent folder
         }

      } else {
        setParentFolderId(null); // No parent folder
      }
    };

    fetchParentId();
  }, [folderId, accessToken]);


  // Function to get parent ID from Google Drive API
  const getLastParentFolderId = async (folderId, accessToken) => {
    if (!accessToken) {
      console.error("❌ Access token is missing");
      return;
    }

    try {
      const response = await axios.get(
        `https://www.googleapis.com/drive/v3/files/${folderId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            fields: 'parents',
            supportsAllDrives: true,
          },
        }
      );

      const parents = response.data.parents;
      return parents && parents.length > 0 ? parents : null;
    } catch (error) {
      console.error('❌ Error getting parent folder:', error);
      return null;
    }
  };

  const handleFolderClick = (folder) => {
    // Push the current folder ID onto the stack before navigating
    window.location.href = `https://gdrive.nexce.io/fe/list?folderId=${folder.id}&portalId=${portalId}`;
    // In a real Next.js app, you'd use mockRouter.push here:
    // mockRouter.push({ query: { ...mockRouter.query, folderId: folder.id } });
  };

  /**
   * Handles the "Back" button click to navigate up to the parent folder.
   * Prevents navigation if current folder is the root folder.
   */
  const handleBackClick = () => {
    console.log(folderId , '<===================folderID')
    console.log(parentFolderId, ' <=============== parentfolderID')
    console.log(userRootFileId ,'<========== user root folder')
    // Check if current folder is the root folder (no parent or parent is the same)
    if (userRootFileId === folderId && folderId === parentFolderId) {
      console.log('Already at root folder, cannot go back');
      return;
    }
    
    window.location.href = `https://gdrive.nexce.io/fe/list?folderId=${parentFolderId}&portalId=${portalId}`;
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
      parents: [folderId], // Create inside the currently viewed folder
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
      backgroundColor: '#f1f3f4', /* Softer background */
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: '#202124', /* Darker gray for text */
      boxSizing: 'border-box'
    }}>
      <style>
        {`
          /* Global styles for Inter font */
          body {
            font-family: 'Inter', sans-serif;
          }

          /* Custom styling for progress bar (for Webkit browsers) */
          progress::-webkit-progress-bar {
            background-color: #e8eaed; /* Lighter gray for bar */
            border-radius: 9999px;
          }
          progress::-webkit-progress-value {
            background-color: #1a73e8; /* Google Blue */
            border-radius: 9999px;
            transition: width 0.3s ease;
          }
          /* Custom styling for progress bar (for Firefox) */
          progress {
            background-color: #e8eaed; /* Default background for Firefox */
            border-radius: 9999px;
          }
          progress::-moz-progress-bar {
            background-color: #1a73e8;
            border-radius: 9999px;
            transition: width 0.3s ease;
          }

          /* Common button styles */
          .button-base {
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 500;
            transition: background-color 0.3s ease, transform 0.2s ease, opacity 0.3s ease, box-shadow 0.2s ease;
            outline: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center; /* Center content for icon-only buttons */
            gap: 0.5rem;
            box-shadow: 0 1px 2px rgba(60,64,67,0.3), 0 1px 3px rgba(60,64,67,0.15); /* Softer shadow */
          }

          /* Specific styles for icon-only buttons */
          .button-icon-only {
              width: 3.5rem;
              height: 3.5rem;
              padding: 0.5rem;
              font-size: 1.5rem;
              text-align: center;
              border: 1px solid #dadce0;
              border-radius: 8px;
              background-color: #fff !important;
              color: #000 !important;
          }
          
          .button-primary {
            background-color: #1a73e8; /* Google Blue */
            color: white;
          }
          .button-primary:hover {
            background-color: #174ea6; /* Darker blue */
            transform: translateY(-1px);
          }
          .button-primary:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .button-secondary {
            background-color: #f1f3f4; /* Light gray from Google */
            color: #202124;
            border: 1px solid #dadce0; /* Subtle border */
            box-shadow: none; /* No shadow */
          }
          .button-secondary:hover {
            background-color: #e8eaed; /* Slightly darker gray */
            transform: translateY(-1px);
          }

          .button-success {
            background-color: #34a853; /* Google Green */
            color: white;
          }
          .button-success:hover {
            background-color: #2e8b46; /* Darker green */
            transform: translateY(-1px);
          }

          .button-danger-link {
            color: #d93025; /* Google Red */
            text-decoration: none;
            background: none;
            border: none;
            padding: 0.5rem 0.8rem;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: color 0.2s ease, text-decoration 0.2s ease;
          }
          .button-danger-link:hover {
            color: #a50e0e; /* Darker red */
            text-decoration: underline;
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.4); /* Softer overlay */
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            padding: 1rem; /* For mobile padding */
          }

          .modal-content {
            background-color: #ffffff;
            padding: 2rem;
            border-radius: 8px; /* Slightly less rounded for modals */
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15); /* Softer modal shadow */
            text-align: center;
            max-width: 450px;
            width: 100%;
            box-sizing: border-box;
          }

          /* Responsive grid for file/folder items */
          .grid-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); /* Adjusted for smaller cards */
            gap: 1.5rem;
            margin-top: 0.5rem;
          }
          @media (min-width: 640px) { /* sm breakpoint */
            .grid-container {
              grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            }
          }
          @media (min-width: 768px) { /* md breakpoint */
            .grid-container {
              grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            }
          }
          @media (min-width: 1024px) { /* lg breakpoint */
            .grid-container {
              grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            }
          }

          .view-toggle-button-group {
            display: flex;
            border: 1px solid #dadce0; /* Google border color */
            border-radius: 8px;
            overflow: hidden;
          }

          .view-toggle-button {
            padding: 0.8rem 1rem;
            border: none;
            background-color: #ffffff;
            color: #5f6368; /* Google gray text */
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease, color 0.2s ease;
            outline: none;
          }

          .view-toggle-button.active {
            background-color: #e8f0fe; /* Light Google blue background */
            color: #1a73e8; /* Google Blue text */
            box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.05);
          }

          .view-toggle-button:hover:not(.active) {
            background-color: #f1f3f4; /* Very light gray on hover */
          }

          .view-toggle-button:first-child {
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
          }
          .view-toggle-button:last-child {
            border-top-right-radius: 8px;
            border-bottom-right-radius: 8px;
          }
        `}
      </style>

      <div style={{
        width: '100%',
        maxWidth: '1024px',
        backgroundColor: '#ffffff',
        borderRadius: '8px', /* Slightly less rounded overall card */
        boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)', /* Google-like shadow */
        padding: '2.5rem',
        boxSizing: 'border-box'
      }}>

        {/* Navigation and Actions Section */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e9ecef' /* Softer border */
        }}>
          {/* Back Button */}

            <button
              onClick={handleBackClick}
              className="button-secondary button-icon-only "
              title="Back" // Added title for accessibility
            >
              ↩
            </button>


          {/* Action Buttons (aligned to the right) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginLeft: 'auto' }}>
            {/* Create Subfolder Button (Icon Only) */}
            <button
              onClick={() => setShowCreateFolderModal(true)}
              className="button-primary button-icon-only"
              title="Create Subfolder" // Added title for accessibility
            >
              ╋
            </button>

            {/* File Upload Button (Icon Only) */}
            <label htmlFor="file-upload" className="button-success button-icon-only" style={{ cursor: 'pointer' }} title="Upload File">
              📤
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {/* View Mode Toggle Buttons (Moved to the right, next to other actions) */}
            <div className="view-toggle-button-group">
              <button
                onClick={() => setViewMode('list')}
                className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                title="List View" // Added title for accessibility
              >
                ☰
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
                title="Grid View" // Added title for accessibility
              >
                ⠿
              </button>
            </div>
          </div>
        </div>

        {/* Upload/Delete/Create Feedback Area */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: '#e8eaed', /* Lighter background for feedback */
          borderRadius: '8px',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' /* Softer inset shadow */
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
              <span style={{ fontSize: '0.9rem', color: '#5f6368' }}>
                {Math.round(uploadProgress)}%
              </span>
            </div>
          )}

          {uploadSuccess && (
            <div style={{
              color: '#1e8e3e', /* Darker green for success */
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
              color: '#1e8e3e',
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
              color: '#1e8e3e',
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
              color: '#d93025', /* Darker red for error */
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


        {/* Conditional Rendering for List or Grid View */}
        {loading ? (
          <div style={{
            padding: '1.5rem',
            textAlign: 'center',
            color: '#5f6368',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            Loading files and folders...
          </div>
        ) : results.length === 0 ? (
          <div style={{
            padding: '1.5rem',
            textAlign: 'center',
            color: '#5f6368',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
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
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)', /* Softer shadow */
                borderRadius: '8px',
                overflow: 'hidden',
              }}>
                <thead style={{ backgroundColor: '#f8f9fa', color: '#5f6368', borderBottom: '1px solid #dadce0' }}>
                  <tr>
                    <th style={{
                      padding: '1rem 0.8rem',
                      textAlign: 'center',
                      borderBottom: '1px solid #dadce0', /* Softer border */
                      width: '5%'
                    }}>#</th>
                    <th style={{
                      padding: '1rem 0.8rem',
                      textAlign: 'left',
                      borderBottom: '1px solid #dadce0',
                      width: '80%'
                    }}>Name</th>
                    <th style={{
                      padding: '1rem 0.8rem',
                      textAlign: 'center',
                      borderBottom: '1px solid #dadce0',
                      width: '15%'
                    }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, index) => (
                    <tr key={item.id} style={{
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa', /* Alternating rows */
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f3f4'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa'; }}
                    >
                      <td style={{
                        padding: '1rem 0.8rem',
                        textAlign: 'center',
                        borderBottom: '1px solid #e9ecef',
                        color: '#5f6368'
                      }}>{index + 1}</td>
                      <td style={{
                        padding: '1rem 0.8rem',
                        borderBottom: '1px solid #e9ecef'
                      }}>
                        {item.mimeType === 'application/vnd.google-apps.folder' ? (
                          <a
                            onClick={() => handleFolderClick(item)} // Handle folder click for navigation
                            style={{
                              textDecoration: 'none',
                              color: '#1a73e8', /* Google blue link */
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'color 0.2s ease',
                              fontWeight: '500',
                              cursor: 'pointer'
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
                              color: '#1a73e8',
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
                        borderBottom: '1px solid #e9ecef'
                      }}>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="button-danger-link"
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
            <div className="grid-container">
              {results.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px', /* Softer rounded corners */
                    boxShadow: '0 1px 2px rgba(60,64,67,0.15), 0 1px 3px 1px rgba(60,64,67,0.05)', /* Softer Google-like shadow */
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
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(60,64,67,0.15), 0 1px 3px 1px rgba(60,64,67,0.05)'; }}
                >
                  {item.mimeType === 'application/vnd.google-apps.folder' ? (
                    <a
                      onClick={() => handleFolderClick(item)} // Handle folder click for navigation
                      style={{
                        textDecoration: 'none',
                        color: '#1a73e8',
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
                        color: '#202124',
                        wordBreak: 'break-word',
                        width: '100%',
                        padding: '0 0.5rem'
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
                        color: '#1a73e8',
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
                        color: '#202124',
                        wordBreak: 'break-word',
                        width: '100%',
                        padding: '0 0.5rem'
                      }}>
                        {item.name}
                      </span>
                    </a>
                  )}

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="button-danger-link"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      borderRadius: '0 0 8px 8px', /* Only bottom corners rounded */
                      boxShadow: '0 -1px 2px rgba(0, 0, 0, 0.05)', /* Softer bottom shadow */
                      padding: '0.5rem 1rem',
                      backgroundColor: 'transparent', // Make background transparent
                      borderTop: '1px solid #e9ecef', // Subtle top border
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{
              fontSize: '1.5rem',
              color: '#202124',
              marginBottom: '1rem'
            }}>
              Confirm Deletion
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#5f6368',
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
                  border: '1px solid #dadce0', /* Subtle border */
                  backgroundColor: '#ffffff',
                  color: '#202124',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease, border-color 0.3s ease',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(60,64,67,0.3), 0 1px 3px rgba(60,64,67,0.15)'
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
                  backgroundColor: '#d93025', /* Google Red */
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease, transform 0.2s ease',
                  boxShadow: '0 1px 2px rgba(60,64,67,0.3), 0 1px 3px rgba(60,64,67,0.15)',
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{
              fontSize: '1.5rem',
              color: '#202124',
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
                width: 'calc(100% - 2rem)',
                padding: '0.8rem 1rem',
                marginBottom: '1.5rem',
                border: '1px solid #dadce0', /* Subtle border */
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#1a73e8'; e.target.style.boxShadow = '0 0 0 1px #1a73e8'; }}
              onBlur={(e) => { e.target.style.borderColor = '#dadce0'; e.target.style.boxShadow = 'none'; }}
            />
            {createFolderLoading && (
              <p style={{ color: '#1a73e8', marginBottom: '1rem' }}>Creating folder...</p>
            )}
            {createFolderError && (
              <p style={{ color: '#d93025', marginBottom: '1rem' }}>{createFolderError.message}</p>
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
                  border: '1px solid #dadce0',
                  backgroundColor: '#ffffff',
                  color: '#202124',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease, border-color 0.3s ease',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(60,64,67,0.3), 0 1px 3px rgba(60,64,67,0.15)'
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
                  backgroundColor: '#34a853', /* Google Green */
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: createFolderLoading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.3s ease, transform 0.2s ease',
                  boxShadow: '0 1px 2px rgba(60,64,67,0.3), 0 1px 3px rgba(60,64,67,0.15)',
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
