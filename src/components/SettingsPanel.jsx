import { useState } from "react";
import "./SettingsPanel.css";

function SettingsPanel() {

  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="settings-panel">

      <div className="settings-header">
        <div>
          <h2>Settings</h2>
          <p>Manage your workspace preferences</p>
        </div>
      </div>

      {/* APPEARANCE */}

      <div className="settings-section">

        <h3>Appearance</h3>

        <div className="setting-item">

          <div className="setting-text">
            <strong>Dark Mode</strong>
            <span>
              Use a darker interface for the workspace
            </span>
          </div>

          <button
            className={`toggle ${
              darkMode ? "active" : ""
            }`}
            onClick={() =>
              setDarkMode(!darkMode)
            }
          >
            <span></span>
          </button>

        </div>

      </div>

      {/* WORKSPACE */}

      <div className="settings-section">

        <h3>Workspace</h3>

        <div className="setting-item">

          <div className="setting-text">
            <strong>Auto Save</strong>
            <span>
              Automatically save workspace changes
            </span>
          </div>

          <button
            className={`toggle ${
              autoSave ? "active" : ""
            }`}
            onClick={() =>
              setAutoSave(!autoSave)
            }
          >
            <span></span>
          </button>

        </div>

        <div className="setting-item">

          <div className="setting-text">
            <strong>Notifications</strong>
            <span>
              Receive workspace activity notifications
            </span>
          </div>

          <button
            className={`toggle ${
              notifications ? "active" : ""
            }`}
            onClick={() =>
              setNotifications(!notifications)
            }
          >
            <span></span>
          </button>

        </div>

      </div>

      {/* EDITOR */}

      <div className="settings-section">

        <h3>Editor</h3>

        <div className="setting-row">

          <div>
            <strong>Font Size</strong>
            <span>
              Code editor font size
            </span>
          </div>

          <select defaultValue="14">
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
          </select>

        </div>

      </div>

    </div>
  );
}

export default SettingsPanel;