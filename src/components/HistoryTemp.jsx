import "./HistoryPanel.css";

function HistoryPanel({ entries, onClear }) {
  return (
    <div className="history-panel">

      <div className="history-header">
        <div>
          <h2>History</h2>
          <p>Recent workspace activity</p>
        </div>

        <button className="clear-history-btn" onClick={onClear}>
          Clear
        </button>
      </div>

      <div className="history-list">

        {entries.length === 0 ? <p className="history-empty">No activity recorded in this workspace yet.</p> : entries.map((entry) => (
          <div className="history-item" key={entry.id}>
            <div className="history-icon">{entry.source === "code" ? "</>" : "WB"}</div>
            <div className="history-info">
              <div className="history-action">{entry.action}</div>
              <div className="history-time">{new Date(entry.createdAt).toLocaleString()}</div>
            </div>
          </div>
        ))}


      </div>

    </div>
  );
}

export default HistoryPanel;