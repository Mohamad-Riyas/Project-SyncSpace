import "./WorkspaceSidebar.css";

function WorkspaceSidebar({
  activeTab,
  setActiveTab,
  visibleTabs,
}) {
  const isVisible = (tab) => visibleTabs.includes(tab);

  return (
    <aside className="workspace-sidebar">

      <button className={`sidebar-item ${activeTab !== "users" && activeTab !== "history" && activeTab !== "settings" ? "active" : ""}`} onClick={() => setActiveTab("workspace")}><span className="sidebar-icon">WS</span><span>Workspace</span></button>
      {isVisible("users") && <button className={`sidebar-item ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}><span className="sidebar-icon">US</span><span>Users</span></button>}
      {isVisible("history") && <button className={`sidebar-item ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}><span className="sidebar-icon">HI</span><span>History</span></button>}
      {isVisible("settings") && <button className={`sidebar-item ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}><span className="sidebar-icon">ST</span><span>Settings</span></button>}

    </aside>
  );
}

export default WorkspaceSidebar;