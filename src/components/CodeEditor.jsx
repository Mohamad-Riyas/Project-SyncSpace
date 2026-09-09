import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { getWorkspaceDocument, saveWorkspaceDocument } from "../data/workspaceStore";

import "./CodeEditor.css";

function CodeEditor({ workspaceId, onActivity }) {

  // =========================
  // FILES
  // =========================

  const [files, setFiles] = useState(() => (getWorkspaceDocument(workspaceId).files || [
    {
      name: "index.js",
      language: "javascript",
      code: `function hello() {
  console.log("Hello SyncSpace!");
}`,
    },
    {
      name: "script.py",
      language: "python",
      code: `def hello():
    print("Hello SyncSpace!")

hello()`,
    },
  ]).filter((file) => file.name !== "Main.java"));
  const filesRef = useRef(files);
  const [folders, setFolders] = useState(() => getWorkspaceDocument(workspaceId).folders || []);
  const foldersRef = useRef(folders);

  // =========================
  // ACTIVE FILE
  // =========================

  const [activeFile, setActiveFile] = useState("index.js");

  // =========================
  // OUTPUT
  // =========================

  const [output, setOutput] = useState(
    "Click Run to execute your code."
  );

  // =========================
  // CURRENT FILE
  // =========================

  const currentFile = files.find(
    (file) => file.name === activeFile
  ) || files[0];

  // =========================
  // CODE CHANGE
  // =========================

  const handleCodeChange = (value) => {
    const nextFiles = filesRef.current.map((file) =>
      file.name === activeFile ? { ...file, code: value || "" } : file
    );

    filesRef.current = nextFiles;
  };

  const handleAddFolder = () => {
    const folderName = window.prompt("Folder name:");
    const trimmedName = folderName?.trim();
    if (!trimmedName || foldersRef.current.includes(trimmedName)) return;
    const nextFolders = [...foldersRef.current, trimmedName];
    foldersRef.current = nextFolders;
    setFolders(nextFolders);
  };

  const handleAddFile = () => {
    const fileName = window.prompt("File name, for example app.ts:");
    const trimmedName = fileName?.trim();
    if (!trimmedName || filesRef.current.some((file) => file.name === trimmedName)) return;

    const language = window.prompt("Language: javascript, typescript, python, java, cpp, html, css, or json", "javascript")?.trim().toLowerCase() || "javascript";
    const folder = foldersRef.current.length > 0
      ? window.prompt(`Folder name (optional):\n${foldersRef.current.join(", ")}`, "")?.trim() || ""
      : "";
    const newFile = { name: trimmedName, language, folder, code: "" };
    const nextFiles = [...filesRef.current, newFile];
    filesRef.current = nextFiles;
    setFiles(nextFiles);
    setActiveFile(trimmedName);
  };

  const handleSave = () => {
    saveWorkspaceDocument(workspaceId, { files: filesRef.current, folders: foldersRef.current });
    onActivity?.(`Saved ${activeFile}`, "code");
  };

  // =========================
  // RUN BUTTON
  // =========================

  const handleRun = () => {

    onActivity?.(`Ran ${currentFile.name}`, "code");

    setOutput(
      `Running ${currentFile.name}...

Output will appear here once the backend code execution is connected.`
    );
  };

  return (
    <div className="editor-container">

      {/* =========================
          FILE TABS
      ========================= */}

      <div className="editor-explorer-bar">
        <span className="explorer-title">Files</span>
        <div className="explorer-actions">
          <button type="button" className="explorer-button" onClick={handleAddFolder}>+ Folder</button>
          <button type="button" className="explorer-button" onClick={handleAddFile}>+ File</button>
        </div>
      </div>

      <div className="editor-tabs">

        {files.map((file) => (
          <button
            key={file.name}
            className={`editor-tab ${
              activeFile === file.name
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveFile(file.name)
            }
          >
            {file.folder ? `${file.folder} / ${file.name}` : file.name}
          </button>
        ))}

      </div>

      {/* =========================
          MONACO EDITOR
      ========================= */}

      <div className="editor-main">

        <Editor
          key={activeFile}
          height="100%"
          language={currentFile.language}
          defaultValue={currentFile.code}
          theme="vs-dark"

          onChange={handleCodeChange}

          options={{
            fontSize: 14,

            minimap: {
              enabled: false,
            },

            automaticLayout: true,

            wordWrap: "on",

            scrollBeyondLastLine: false,

            padding: {
              top: 10,
            },
          }}
        />

      </div>

      {/* =========================
          RUN BAR
      ========================= */}

      <div className="editor-run-bar">

        <span className="language-name">
          {currentFile.language}
        </span>

        <div className="editor-actions">
          <button className="save-button" onClick={handleSave}>
            Save
          </button>
          <button className="run-button" onClick={handleRun}>
            ▶ Run
          </button>
        </div>

      </div>

      {/* =========================
          OUTPUT
      ========================= */}

      <div className="editor-output">

        <div className="output-header">
          OUTPUT
        </div>

        <pre className="output-content">
          {output}
        </pre>

      </div>

    </div>
  );
}

export default CodeEditor;