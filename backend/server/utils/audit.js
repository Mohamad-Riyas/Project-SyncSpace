const AuditLog = require("../models/AuditLog");

async function writeAudit(req, action, entityType = "", entityId = "", details = {}) {
  try {
    return await AuditLog.create({
      actor: req.user?.guest ? null : req.user?.userId || null,
      actorName: req.user?.guest
        ? `${req.user.name} (guest)`
        : req.user?.name || req.user?.email || "",
      actorRole: req.user?.role || "",
      action,
      entityType,
      entityId: entityId ? String(entityId) : "",
      roomId: details.roomId || "",
      details,
    });
  } catch (err) {
    console.error("Audit write failed:", err.message);
    return null;
  }
}

async function broadcastWorkspaceActivity(req, workspace, entry) {
  if (!entry) return null;

  await entry.populate("actor", "name email role");

  req.app
    .get("io")
    ?.to(`workspace:${workspace._id}`)
    .emit("workspace:activity", entry);

  return entry;
}

module.exports = {
  writeAudit,
  broadcastWorkspaceActivity,
};
