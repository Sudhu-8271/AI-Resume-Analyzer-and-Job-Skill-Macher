import React, { useEffect, useState } from "react";
import "./AccountPages.css";

const API =
  process.env.REACT_APP_API_URL || "http://localhost:5001";

function api(path, options = {}) {
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem(
        "authToken"
      )}`,
      ...(options.headers || {}),
    },
  });
}

// ============================================================
// TOGGLE
// ============================================================

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? "on" : ""}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span>{checked ? "ON" : "OFF"}</span>
      <i />
    </button>
  );
}

// ============================================================
// SETTING ROW
// ============================================================

function Row({ label, description, children }) {
  return (
    <div className="setting-row">
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>

      {children}
    </div>
  );
}

// ============================================================
// SETTINGS PAGE
// ============================================================

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    aiPreferences: {
      autoAnalyze: true,
      suggestSkills: true,
      suggestRoles: true,
      careerRecommendations: true,
    },

    privacy: {
      allowAiAnalysis: true,
    },

    appearance: "dark",
    language: "en",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  const [showChangePassword, setShowChangePassword] =
    useState(false);

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ============================================================
  // CONFIRMATION MODAL
  // ============================================================

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null,
  });

  // ============================================================
  // LOAD SETTINGS
  // ============================================================

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api("/api/settings");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load settings"
          );
        }

        setSettings((current) => ({
          ...current,
          ...(data.settings || {}),
        }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // ============================================================
  // UPDATE SETTING
  // ============================================================

  const patch = (section, key, value) => {
    setSettings((current) => ({
      ...current,

      [section]: {
        ...current[section],
        [key]: value,
      },
    }));
  };

  // ============================================================
  // SAVE SETTINGS
  // ============================================================

  const save = async () => {
    setSaving(true);

    setMessage("");
    setError("");

    try {
      const response = await api("/api/settings", {
        method: "PUT",

        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save settings"
        );
      }

      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  const changePassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (
      password.newPassword !==
      password.confirmPassword
    ) {
      setError(
        "New password and confirm password do not match."
      );

      return;
    }

    if (password.newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters."
      );

      return;
    }

    try {
      const response = await api(
        "/api/profile/change-password",
        {
          method: "POST",

          body: JSON.stringify(password),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to change password"
        );
      }

      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowChangePassword(false);

      setMessage(
        data.message ||
          "Password changed successfully."
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // ============================================================
  // CANCEL PASSWORD CHANGE
  // ============================================================

  const cancelChangePassword = () => {
    setShowChangePassword(false);

    setPassword({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setError("");
  };

  // ============================================================
  // LOGOUT ALL DEVICES
  // ============================================================

  const logoutAll = async () => {
    try {
      setError("");
      setMessage("");

      const response = await api(
        "/api/profile/logout-all",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to logout"
        );
      }

      setMessage(
        data.message ||
          "Logged out from all devices."
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // ============================================================
  // DELETE ACCOUNT
  // ============================================================

  const deleteAccount = async () => {
    try {
      setError("");
      setMessage("");

      const response = await api(
        "/api/profile/account",
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete account"
        );
      }

      // Remove authentication token
      localStorage.removeItem("authToken");

      // Optional resume data cleanup
      localStorage.removeItem(
        "resumeAnalyzerState"
      );

      // Redirect to login
      window.location.href = "/login";
    } catch (err) {
      setError(err.message);
    }
  };

  // ============================================================
  // DOWNLOAD DATA
  // ============================================================

  const downloadData = async () => {
    try {
      setError("");
      setMessage("");

      const response = await api(
        "/api/settings/download-data"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to download data"
        );
      }

      const blob = new Blob(
        [
          JSON.stringify(
            data.data,
            null,
            2
          ),
        ],
        {
          type: "application/json",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        "resume-analyzer-data.json";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  // ============================================================
  // OPEN CONFIRMATION MODAL
  // ============================================================

  const openConfirmModal = (type) => {
    setError("");
    setMessage("");

    setConfirmModal({
      open: true,
      type,
    });
  };

  // ============================================================
  // CLOSE CONFIRMATION MODAL
  // ============================================================

  const closeConfirmModal = () => {
    setConfirmModal({
      open: false,
      type: null,
    });
  };

  // ============================================================
  // CONFIRM ACTION
  // ============================================================

  const handleConfirmAction = async () => {
    const action = confirmModal.type;

    closeConfirmModal();

    if (action === "logoutAll") {
      await logoutAll();
    }

    if (action === "deleteAccount") {
      await deleteAccount();
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="account-page">
        <div className="loading-state">
          Loading settings...
        </div>
      </main>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="account-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="page-title">
        <div>
          <h1>Settings</h1>
        </div>

        <button
          className="button-primary"
          onClick={save}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "Save Settings"}
        </button>
      </div>

      {/* ======================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {message && (
        <div className="notice success">
          {message}
        </div>
      )}

      {/* ======================================================
          ERROR MESSAGE
      ====================================================== */}

      {error && (
        <div className="notice error">
          {error}
        </div>
      )}

      <div className="settings-layout">

        {/* ====================================================
            LEFT COLUMN
        ==================================================== */}

        <div>

          {/* ==================================================
              AI PREFERENCES
          ================================================== */}

          <section className="account-section">

            <div className="section-heading">
              <h2>AI Preferences</h2>
            </div>

            <Row
              label="Automatically Analyze Resume"
              description="Automatically analyze a newly uploaded resume."
            >
              <Toggle
                checked={
                  settings.aiPreferences
                    ?.autoAnalyze ?? true
                }
                onChange={(value) =>
                  patch(
                    "aiPreferences",
                    "autoAnalyze",
                    value
                  )
                }
              />
            </Row>

            <Row
              label="Suggest Missing Skills"
              description="Allow AI to identify skills missing from your resume."
            >
              <Toggle
                checked={
                  settings.aiPreferences
                    ?.suggestSkills ?? true
                }
                onChange={(value) =>
                  patch(
                    "aiPreferences",
                    "suggestSkills",
                    value
                  )
                }
              />
            </Row>

            <Row
              label="Suggest Job Roles"
              description="Get job role suggestions based on your resume."
            >
              <Toggle
                checked={
                  settings.aiPreferences
                    ?.suggestRoles ?? true
                }
                onChange={(value) =>
                  patch(
                    "aiPreferences",
                    "suggestRoles",
                    value
                  )
                }
              />
            </Row>

            <Row
              label="AI Career Recommendations"
              description="Receive AI-powered career improvement recommendations."
            >
              <Toggle
                checked={
                  settings.aiPreferences
                    ?.careerRecommendations ??
                  true
                }
                onChange={(value) =>
                  patch(
                    "aiPreferences",
                    "careerRecommendations",
                    value
                  )
                }
              />
            </Row>

          </section>

          {/* ==================================================
              APPEARANCE & LANGUAGE
          ================================================== */}

          <section className="account-section">

            <div className="section-heading">
              <h2>
                Appearance & Language
              </h2>
            </div>

            <div className="form-grid">

              {/* THEME */}

              <label className="field">

                <span>Theme</span>

                <select
                  value={
                    settings.appearance ||
                    "dark"
                  }
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      appearance:
                        e.target.value,
                    })
                  }
                >
                  <option value="dark">
                    Dark Mode
                  </option>

                  <option value="light">
                    Light Mode
                  </option>

                  <option value="system">
                    System Default
                  </option>
                </select>

              </label>

              {/* LANGUAGE */}

              <label className="field">

                <span>Language</span>

                <select
                  value={
                    settings.language ||
                    "en"
                  }
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      language:
                        e.target.value,
                    })
                  }
                >
                  <option value="en">
                    English
                  </option>

                  <option value="hi">
                    Hindi
                  </option>

                </select>

              </label>

            </div>

          </section>

          {/* ==================================================
              PRIVACY & SECURITY
          ================================================== */}

          <section className="account-section">

            <div className="section-heading">
              <h2>
                Privacy & Security
              </h2>
            </div>

            <Row
              label="Allow AI to Analyze Resume"
              description="Allow AI to analyze your resume and generate insights."
            >
              <Toggle
                checked={
                  settings.privacy
                    ?.allowAiAnalysis ??
                  true
                }
                onChange={(value) =>
                  patch(
                    "privacy",
                    "allowAiAnalysis",
                    value
                  )
                }
              />
            </Row>

            <button
              className="button-secondary"
              onClick={downloadData}
            >
              Download My Data
            </button>

          </section>

        </div>

        {/* ====================================================
            RIGHT COLUMN
        ==================================================== */}

        <aside>

          {/* ==================================================
              ACCOUNT SECURITY
          ================================================== */}

          <section className="account-section">

            <div className="section-heading">
              <h2>
                Account Security
              </h2>
            </div>

            {/* CHANGE PASSWORD BUTTON */}

            {!showChangePassword && (
              <button
                type="button"
                className="button-secondary change-password-button"
                onClick={() => {
                  setShowChangePassword(
                    true
                  );

                  setError("");
                  setMessage("");
                }}
              >
                Change Password
              </button>
            )}

            {/* PASSWORD FORM */}

            {showChangePassword && (
              <form
                onSubmit={changePassword}
                className="password-form"
              >

                <div className="password-header">
                  <div>
                    <h3>
                      Change Password
                    </h3>
                  </div>
                </div>

                {/* CURRENT PASSWORD */}

                <label className="field">

                  <span>
                    Current Password
                  </span>

                  <input
                    className="full-input"
                    type="password"
                    placeholder="Enter current password"
                    value={
                      password.currentPassword
                    }
                    onChange={(e) =>
                      setPassword({
                        ...password,
                        currentPassword:
                          e.target.value,
                      })
                    }
                    required
                  />

                </label>

                {/* NEW PASSWORD */}

                <label className="field">

                  <span>
                    New Password
                  </span>

                  <input
                    className="full-input"
                    type="password"
                    placeholder="Enter new password"
                    value={
                      password.newPassword
                    }
                    onChange={(e) =>
                      setPassword({
                        ...password,
                        newPassword:
                          e.target.value,
                      })
                    }
                    minLength={8}
                    required
                  />

                </label>

                {/* CONFIRM PASSWORD */}

                <label className="field">

                  <span>
                    Confirm New Password
                  </span>

                  <input
                    className="full-input"
                    type="password"
                    placeholder="Confirm new password"
                    value={
                      password.confirmPassword
                    }
                    onChange={(e) =>
                      setPassword({
                        ...password,
                        confirmPassword:
                          e.target.value,
                      })
                    }
                    minLength={8}
                    required
                  />

                </label>

                {/* PASSWORD ACTIONS */}

                <div className="password-actions">

                  <button
                    className="button-primary"
                    type="submit"
                  >
                    Update Password
                  </button>

                  <button
                    type="button"
                    className="button-secondary"
                    onClick={
                      cancelChangePassword
                    }
                  >
                    Cancel
                  </button>

                </div>

              </form>
            )}

          </section>

          {/* ==================================================
              DANGER ZONE
          ================================================== */}

          <section className="account-section danger-zone">

            <div className="section-heading">
              <h2>
                Danger Zone
              </h2>
            </div>

            {/* LOGOUT ALL */}

            <button
              className="danger-button"
              onClick={() =>
                openConfirmModal(
                  "logoutAll"
                )
              }
            >
              Logout from all devices
            </button>

            {/* DELETE ACCOUNT */}

            <button
              className="danger-button"
              onClick={() =>
                openConfirmModal(
                  "deleteAccount"
                )
              }
            >
              Delete Account
            </button>

          </section>

        </aside>

      </div>

      {/* ======================================================
          BOTTOM SAVE BUTTON
      ====================================================== */}

      <div className="form-actions">

        <button
          className="button-primary"
          onClick={save}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "Save Settings"}
        </button>

      </div>

      {/* ======================================================
          CUSTOM CONFIRMATION MODAL
      ====================================================== */}

      {confirmModal.open && (
        <div
          className="confirm-overlay"
          onClick={closeConfirmModal}
        >

          <div
            className="confirm-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* DELETE ACCOUNT */}

            {confirmModal.type ===
            "deleteAccount" ? (
              <>
                <div className="confirm-icon delete-icon">
                  !
                </div>

                <h2>
                  Delete Account?
                </h2>

                <p>
                  Are you sure you want to
                  permanently delete your
                  account?
                </p>
              </>
            ) : (
              /* LOGOUT ALL */
              <>
                <div className="confirm-icon logout-icon">
                  !
                </div>

                <h2>
                  Logout from all devices?
                </h2>

                <p>
                  You will be logged out
                  from all devices where
                  your account is currently
                  signed in.
                </p>
              </>
            )}

            {/* MODAL ACTIONS */}

            <div className="confirm-actions">

              <button
                type="button"
                className="button-secondary"
                onClick={
                  closeConfirmModal
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  confirmModal.type ===
                  "deleteAccount"
                    ? "confirm-delete-button"
                    : "confirm-logout-button"
                }
                onClick={
                  handleConfirmAction
                }
              >
                {confirmModal.type ===
                "deleteAccount"
                  ? "Delete Account"
                  : "Logout"}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}