import { useEffect, useState } from "react";

export default function ShareFilePage() {
  const [email, setEmail] = useState(""); // comma-separated string of emails
  const [fileId, setFileId] = useState("");
  const [portalId, setPortalId] = useState("");
  const [permission, setPermission] = useState("reader");
  const [status, setStatus] = useState(null); // {type: "success"|"error"|"warning", message, detailedResults}
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryFileId = urlParams.get("fileId");
    const queryPortalId = urlParams.get("portalId");

    if (queryFileId) setFileId(queryFileId);
    if (queryPortalId) setPortalId(queryPortalId);
  }, []);

  const getCredentials = async (portalId) => {
    try {
      const res = await fetch("https://gdrive.nexce.io/fe/api/db/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hubId: portalId }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Server response error:", res.status, text);
        throw new Error(`Fetch failed: ${res.status}`);
      }

      const json = await res.json();
      const accessToken = json?.data?.token?.access_token || null;
      if (!accessToken) throw new Error("Access token not found");
      return { accessToken };
    } catch (error) {
      console.error("Error fetching token:", error);
      return { accessToken: null };
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const { accessToken } = await getCredentials(portalId);

    if (!accessToken) {
      setStatus({
        type: "error",
        message: "❌ Could not fetch credentials. Please check your Portal ID or contact support.",
      });
      setLoading(false);
      return;
    }

    const emailsToShare = email
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e && e.includes("@"));

    if (emailsToShare.length === 0) {
      setStatus({
        type: "error",
        message: "❌ Please enter at least one valid email address.",
      });
      setLoading(false);
      return;
    }

    const shareResults = [];

    for (const singleEmail of emailsToShare) {
      try {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              role: permission,
              type: "user",
              emailAddress: singleEmail,
            }),
          }
        );

        const data = await res.json();

        if (res.ok) {
          shareResults.push({
            email: singleEmail,
            type: "success",
            message: `✅ Invited ${singleEmail}`,
          });
        } else {
          shareResults.push({
            email: singleEmail,
            type: "error",
            message: `❌ ${singleEmail}: ${data.error?.message || "Failed"}`,
          });
        }
      } catch (err) {
        shareResults.push({
          email: singleEmail,
          type: "error",
          message: `❌ ${singleEmail}: ${err.message}`,
        });
      }
    }

    const successfulShares = shareResults.filter((r) => r.type === "success").length;
    const failedShares = shareResults.filter((r) => r.type === "error").length;

    let overallMessage = "";
    let overallType = "success";

    if (successfulShares === emailsToShare.length) {
      overallMessage = `✅ Successfully invited all ${successfulShares} email(s).`;
    } else if (failedShares === emailsToShare.length) {
      overallMessage = `❌ Failed to invite any email(s). Please check again.`;
      overallType = "error";
    } else {
      overallMessage = `⚠️ Successfully invited ${successfulShares} email(s), ${failedShares} email(s) failed.`;
      overallType = "warning";
    }

    setStatus({
      type: overallType,
      message: overallMessage,
      detailedResults: shareResults,
    });
    setEmail("");
    setLoading(false);
  };

  return (
    <div style={styles.outerContainer}>
      <div style={styles.container}>
        <h1 style={styles.title}>🔗 Share Google Drive File</h1>

        <form onSubmit={handleShare} style={styles.form}>
          <label htmlFor="emailInput" style={styles.label}>
            Email(s) to share (comma-separated):
          </label>
          <input
            id="emailInput"
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            placeholder="user1@example.com, user2@example.com"
          />

          <label htmlFor="permissionSelect" style={styles.label}>
            Permission:
          </label>
          <select
            id="permissionSelect"
            value={permission}
            onChange={(e) => setPermission(e.target.value)}
            style={styles.input}
          >
            <option value="reader">Viewer</option>
            <option value="commenter">Commenter</option>
            <option value="writer">Editor</option>
          </select>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Inviting..." : "📨 Share via Google"}
          </button>
        </form>

        {status && (
          <div
            style={{
              ...styles.statusMessage,
              backgroundColor:
                status.type === "success"
                  ? "#d4edda"
                  : status.type === "error"
                  ? "#f8d7da"
                  : "#fff3cd",
              borderColor:
                status.type === "success"
                  ? "#c3e6cb"
                  : status.type === "error"
                  ? "#f5c6cb"
                  : "#ffeeba",
              color:
                status.type === "success"
                  ? "#155724"
                  : status.type === "error"
                  ? "#721c24"
                  : "#856404",
            }}
          >
            <p>{status.message}</p>
            {status.detailedResults && (
              <ul style={styles.detailedResultsList}>
                {status.detailedResults.map((r, i) => (
                  <li
                    key={i}
                    style={{
                      color: r.type === "success" ? "#155724" : "#721c24",
                    }}
                  >
                    {r.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  outerContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    padding: "20px",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: "550px",
    width: "100%",
    padding: "35px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
    fontFamily: "'Inter', sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
  },
  title: {
    textAlign: "center",
    marginBottom: "1.8rem",
    fontSize: "30px",
    color: "#2c3e50",
    fontWeight: "700",
    letterSpacing: "-0.5px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  label: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#34495e",
    marginBottom: "0.25rem",
  },
  input: {
    padding: "14px 18px",
    fontSize: "1rem",
    borderRadius: "10px",
    border: "1px solid #dcdcdc",
    backgroundColor: "#fefefe",
  },
  button: {
    padding: "15px 25px",
    backgroundColor: "#007bff",
    color: "#ffffff",
    fontWeight: "700",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontSize: "1.1rem",
    marginTop: "1.5rem",
    boxShadow: "0 6px 15px rgba(0, 123, 255, 0.3)",
  },
  statusMessage: {
    marginTop: "2rem",
    padding: "15px 20px",
    borderRadius: "10px",
    textAlign: "center",
    fontSize: "1rem",
    fontWeight: "600",
    border: "1px solid",
  },
  detailedResultsList: {
    listStyleType: "none",
    padding: 0,
    margin: "10px 0 0 0",
    textAlign: "left",
    fontSize: "0.9rem",
    maxHeight: "150px",
    overflowY: "auto",
    borderTop: "1px solid rgba(0,0,0,0.1)",
    paddingTop: "10px",
  },
};
