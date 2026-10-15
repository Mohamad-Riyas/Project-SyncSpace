import "./UsersPanel.css";

function UsersPanel({ workspace, canManage, onRoleChange, onRemoveUser, presence = [], selfId }) {
  const storedUsers = workspace.collaboratorList || [];
  const hasCreator = storedUsers.some((user) => String(user.id) === String(workspace.owner));
  const members = hasCreator || !workspace.ownerName
    ? storedUsers
    : [{ id: workspace.owner, name: workspace.ownerName, role: "owner" }, ...storedUsers];
  const onlineIds = new Set(presence.map((participant) => String(participant.id)));
  const guests = presence.filter((participant) => participant.guest).map((participant) => ({ id: participant.id, name: participant.name || "Guest", role: "guest" }));
  const users = [...members, ...guests];
  const onlineCount = users.filter((user) => onlineIds.has(String(user.id))).length;

  return (
    <div className="users-panel">
      <div className="users-header">
        <h2>Users</h2>
        <span>{onlineCount} online · {users.length} total</span>
      </div>

      <div className="users-list">
        {users.map((workspaceUser) => {
          const isCreator = String(workspaceUser.id) === String(workspace.owner);
          const isOwner = workspaceUser.role?.toLowerCase() === "owner";
          const isGuest = workspaceUser.role === "guest";
          const isOnline = onlineIds.has(String(workspaceUser.id));
          return (
            <div className="user-card" key={workspaceUser.id}>
            <div className="user-avatar">
              {workspaceUser.name.charAt(0)}
            </div>

            <div className="user-info">
              <div className="user-name">
                {workspaceUser.name}

                {(isCreator || isOwner) && (
                  <span className="you-label">
                    {isCreator ? "Creator" : "Owner"}
                  </span>
                )}
              </div>

              <div className="user-role">
                {isCreator ? "Creator" : isOwner ? "Owner" : isGuest ? "Guest" : "Member"}
              </div>
            </div>

            <div className={`user-status ${isOnline ? "online" : "offline"}`}>
              <span className="status-dot"></span>

              {isOnline ? "Online" : "Offline"}{String(workspaceUser.id) === String(selfId) ? " · You" : ""}
            </div>
            {canManage && !isCreator && !isGuest && (
              <div className="member-actions">
                <select
                  aria-label={`Role for ${workspaceUser.name}`}
                  value={isOwner ? "owner" : "member"}
                  onChange={(event) => onRoleChange(workspaceUser, event.target.value)}
                >
                  <option value="member">Member</option>
                  <option value="owner">Owner access</option>
                </select>
                <button type="button" onClick={() => onRemoveUser(workspaceUser)} aria-label={`Remove ${workspaceUser.name}`}>
                  Remove
                </button>
              </div>
            )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default UsersPanel;