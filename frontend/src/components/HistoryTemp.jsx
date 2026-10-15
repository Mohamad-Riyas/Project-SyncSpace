import "./HistoryPanel.css";

function HistoryPanel({ entries = [] }) {
  const contributors = [...entries.reduce((result, entry) => {
    const actorId = entry.actor?._id || entry.actor || entry.actorName || "unknown";
    const actorName = entry.actor?.name || entry.actorName || "Unknown user";
    const current = result.get(String(actorId)) || { id: String(actorId), name: actorName, count: 0 };
    current.count += 1;
    result.set(String(actorId), current);
    return result;
  }, new Map()).values()].sort((left, right) => right.count - left.count);

  const describeActivity = (entry) => {
    if (entry.details?.action) return entry.details.action;
    const path = entry.details?.path;
    if (entry.action === "workspace.file.created") return `Created ${path || "a file"}`;
    if (entry.action === "workspace.file.updated") return `Updated ${path || "a file"}`;
    if (entry.action === "workspace.file.deleted") return `Deleted ${path || "a file"}`;
    if (entry.action === "workspace.joined") return "Joined the workspace";
    if (entry.action === "workspace.guest_joined") return "Joined as a guest";
    if (entry.action === "workspace.member.role_changed") return `Changed ${entry.details?.memberName || "a member"}'s access to ${entry.details?.role || "member"}`;
    if (entry.action === "workspace.member.removed") return `Removed ${entry.details?.memberName || "a workspace member"}`;
    return String(entry.action || "Workspace activity").replace(/^workspace\./, "").replace(/[._]/g, " ");
  };

  return (
    <div className="history-panel">
      <div className="history-header">
        <div>
          <h2>Workspace History</h2>
          <p>Contributors and actions in this workspace</p>
        </div>
      </div>

      {contributors.length > 0 && <section className="contributors-section">
        <h3>Contributors</h3>
        <div className="contributors-list">
          {contributors.map((contributor) => <div className="contributor-item" key={contributor.id}>
            <span className="contributor-avatar">{contributor.name.slice(0, 1).toUpperCase()}</span>
            <span className="contributor-name">{contributor.name}</span>
            <span className="contributor-count">{contributor.count} {contributor.count === 1 ? "activity" : "activities"}</span>
          </div>)}
        </div>
      </section>}

      <section className="history-section">
        <h3>Activity</h3>
        <div className="history-list">
          {entries.length === 0 ? <p className="history-empty">No activity recorded in this workspace yet.</p> : entries.map((entry) => {
            const actorName = entry.actor?.name || entry.actorName || "Unknown user";
            return <article className="history-item" key={entry._id || entry.id}>
              <div className="history-icon">{actorName.slice(0, 1).toUpperCase()}</div>
              <div className="history-info">
                <div className="history-action"><strong>{actorName}</strong> {describeActivity(entry)}</div>
                <div className="history-time">{new Date(entry.createdAt).toLocaleString()}</div>
              </div>
            </article>;
          })}
        </div>
      </section>
    </div>
  );
}

export default HistoryPanel;