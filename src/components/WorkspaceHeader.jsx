import "./WorkspaceHeader.css";

function WorkspaceHeader({ roomId, workspaceName, workspaceType, onLeave }) {
  return (
    <header className="workspace-header">

      <div className="header-left">
        <div className="brand-mark">S</div>
        <div className="workspace-heading">
          <h2>{workspaceName || "SyncSpace"}</h2>
          <span>{workspaceType}</span>
        </div>

        <span className="room-id">
          Room: {roomId}
        </span>
      </div>

      <div className="header-right">

        <span className="connection-status">
          <span className="status-dot" /> Connected
        </span>

        <div className="user-avatars">
          <span className="avatar">RS</span><span className="avatar">AM</span><span className="avatar">+1</span>
        </div>

        <button className="leave-btn" onClick={onLeave}>
          Leave workspace
        </button>

      </div>

    </header>
  );
}

export default WorkspaceHeader;