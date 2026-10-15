import { useState } from "react";
import "./SettingsPanel.css";

function SettingsPanel({
  splitRatio = 50,
  hasBothTools = false,
  onSplitRatioChange = (_value) => {},
  onDownload = () => {},
}) {

  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [fontSize, setFontSize] = useState("14");

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
            onClick={() => setDarkMode(!darkMode)}
            type="button"
            aria-label="Toggle dark mode"
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
            onClick={() => setAutoSave(!autoSave)}
            type="button"
            aria-label="Toggle auto save"
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
            onClick={() => setNotifications(!notifications)}
            type="button"
            aria-label="Toggle notifications"
          >
            <span></span>
          </button>

        </div>

        {hasBothTools && (
          <div className="setting-row setting-slider-row">
            <div>
              <strong>Split View</strong>
              <span>Adjust the whiteboard and code editor layout</span>
            </div>

            <div className="split-control">
              <input
                type="range"
                min="30"
                max="70"
                value={splitRatio}
                onChange={(event) => onSplitRatioChange(Number(event.target.value))}
                aria-label="Adjust workspace split ratio"
              />
              <span>{splitRatio}% / {100 - splitRatio}%</span>
            </div>
          </div>
        )}

        <div className="setting-row action-row">
          <div>
            <strong>Export Workspace</strong>
            <span>Download the current workspace state as JSON</span>
          </div>

          <button className="action-button" type="button" onClick={onDownload}>
            Export
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

          <select value={fontSize} onChange={(event) => setFontSize(event.target.value)}>
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