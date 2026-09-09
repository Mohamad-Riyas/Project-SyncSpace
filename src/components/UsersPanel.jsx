import { useState } from "react";
import "./UsersPanel.css";

function UsersPanel({ workspace, onAddUser }) {
  const [name, setName] = useState("");
  const storedUsers = workspace.collaboratorList || [];
  const users = storedUsers.some((user) => user.role === "Owner") ? storedUsers : [
    { id: "owner", name: workspace.owner || "You", role: "Owner", status: "online" },
    ...storedUsers,
  ];

  const handleAdd = (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onAddUser({ id: `${Date.now()}`, name: trimmedName, role: "Member", status: "online" });
    setName("");
  };

  return (
    <div className="users-panel">
      <div className="users-header">
        <h2>Users</h2>
        <span>{users.length} collaborators</span>
      </div>

      <form className="add-user-form" onSubmit={handleAdd}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Add collaborator by name" aria-label="Collaborator name" />
        <button type="submit">Add user</button>
      </form>

      <div className="users-list">
        {users.map((user) => (
          <div className="user-card" key={user.id}>
            <div className="user-avatar">
              {user.name.charAt(0)}
            </div>

            <div className="user-info">
              <div className="user-name">
                {user.name}

                {user.role === "Owner" && (
                  <span className="you-label">
                    You
                  </span>
                )}
              </div>

              <div className="user-role">
                {user.role}
              </div>
            </div>

            <div
              className={`user-status ${
                  user.status !== "offline"
                  ? "online"
                  : "offline"
              }`}
            >
              <span className="status-dot"></span>

              {user.status !== "offline"
                ? "Online"
                : "Offline"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UsersPanel;