import "./WhiteboardToolbar.css";

function WhiteboardToolbar({
  selectedTool,
  setSelectedTool,
  onUndo,
  onRedo,
  onClear,
  onSave,
}) {
  return (
    <div className="whiteboard-toolbar">

      {/* SELECT */}
      <button
        className={`toolbar-btn ${
          selectedTool === "select" ? "active" : ""
        }`}
        title="Select / Move"
        onClick={() => setSelectedTool("select")}
      >
        🖱️
      </button>

      {/* PEN */}
      <button
        className={`toolbar-btn ${
          selectedTool === "pen" ? "active" : ""
        }`}
        title="Pen"
        onClick={() => setSelectedTool("pen")}
      >
        ✏️
      </button>

      {/* LINE */}
      <button
        className={`toolbar-btn ${
          selectedTool === "line" ? "active" : ""
        }`}
        title="Line"
        onClick={() => setSelectedTool("line")}
      >
        ━
      </button>

      {/* RECTANGLE */}
      <button
        className={`toolbar-btn ${
          selectedTool === "rectangle" ? "active" : ""
        }`}
        title="Rectangle"
        onClick={() => setSelectedTool("rectangle")}
      >
        ▭
      </button>

      {/* CIRCLE */}
      <button
        className={`toolbar-btn ${
          selectedTool === "circle" ? "active" : ""
        }`}
        title="Circle"
        onClick={() => setSelectedTool("circle")}
      >
        ○
      </button>

      {/* TEXT */}
      <button
        className={`toolbar-btn ${
          selectedTool === "text" ? "active" : ""
        }`}
        title="Text"
        onClick={() => setSelectedTool("text")}
      >
        T
      </button>

      {/* ERASER */}
      <button
        className={`toolbar-btn ${
          selectedTool === "eraser" ? "active" : ""
        }`}
        title="Eraser"
        onClick={() => setSelectedTool("eraser")}
      >
        🗑️
      </button>

      {/* DIVIDER */}
      <div className="toolbar-divider"></div>

      {/* UNDO */}
      <button
        className="toolbar-btn"
        title="Undo"
        onClick={onUndo}
      >
        ↶
      </button>

      {/* REDO */}
      <button
        className="toolbar-btn"
        title="Redo"
        onClick={onRedo}
      >
        ↷
      </button>

      {/* CLEAR */}
      <button
        className="clear-btn"
        title="Clear Whiteboard"
        onClick={onClear}
      >
        Clear
      </button>

      <button
        className="save-btn"
        title="Save Whiteboard"
        onClick={onSave}
      >
        Save
      </button>

    </div>
  );
}

export default WhiteboardToolbar;