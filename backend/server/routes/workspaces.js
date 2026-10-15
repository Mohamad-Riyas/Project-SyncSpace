const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Workspace = require("../models/Workspace");
const WorkspaceFile = require("../models/WorkspaceFile");
const YjsDocument = require("../models/YjsDocument");
const AuditLog = require("../models/AuditLog");
const { requireAuth, requireAuthOrGuest } = require("../middleware/auth");
const { writeAudit, broadcastWorkspaceActivity } = require("../utils/audit");

const router = express.Router();

function serialize(ws, { hideEmails = false } = {}) {
  return {
    id: String(ws._id),
    name: ws.name,
    description: ws.description,
    kind: ws.kind,
    type: ws.type,
    code: ws.inviteCode,
    inviteCode: ws.inviteCode,
    roomId: ws.roomId,
    owner: ws.owner?._id ? String(ws.owner._id) : String(ws.owner),
    ownerName: ws.owner?.name || null,
    collaborators: ws.collaborators?.length || 0,
    collaboratorList: (ws.collaborators || []).map((c) => ({
      id: String(c.user?._id || c.user),
      name: c.user?.name || "Member",
      email: hideEmails ? "" : c.user?.email || "",
      role: c.role,
    })),
    status: ws.status,
    createdAt: ws.createdAt,
    updatedAt: ws.updatedAt,
  };
}

function canAccess(ws, userId) {
  return String(ws.owner?._id || ws.owner) === String(userId) ||
    (ws.collaborators || []).some((c) => String(c.user?._id || c.user) === String(userId));
}

function canManage(ws, user) {
  return user.role === "admin" ||
    String(ws.owner?._id || ws.owner) === String(user.userId) ||
    (ws.collaborators || []).some((c) =>
      String(c.user?._id || c.user) === String(user.userId) && c.role === "owner"
    );
}

function hasAccess(ws, user) {
  if (user.guest) return String(ws._id) === String(user.workspaceId);
  return user.role === "admin" || canAccess(ws, user.userId);
}

async function findAccessibleWorkspace(req, res) {
  const ws = await Workspace.findById(req.params.id);
  if (!ws) {
    res.status(404).json({ message: "Workspace not found" });
    return null;
  }
  if (!hasAccess(ws, req.user)) {
    res.status(403).json({ message: "You do not have access to this workspace" });
    return null;
  }
  return ws;
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, description, kind, type } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Workspace name is required" });
    if (kind === "interview" && !["interviewer", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only interviewers and admins can create interview workspaces" });
    }
    const inviteCode = await Workspace.generateUniqueInviteCode();
    const ws = await Workspace.create({
      name: name.trim(),
      description: description || "",
      kind: kind === "interview" ? "interview" : "general",
      type: type || "Code + Whiteboard",
      owner: req.user.userId,
      inviteCode,
      collaborators: [{ user: req.user.userId, role: "owner" }],
    });
    await ws.populate("owner", "name email");
    await ws.populate("collaborators.user", "name email");
    const activity = await writeAudit(req, "workspace.created", "workspace", ws._id, { name: ws.name, inviteCode });
    await broadcastWorkspaceActivity(req, ws, activity);
    const io = req.app.get("io");
    io?.to(`workspace:${ws._id}`).emit("workspace:updated", serialize(ws, { hideEmails: true }));
    res.status(201).json({ workspace: serialize(ws) });
  } catch (err) {
    console.error("Create workspace error:", err.message);
    res.status(500).json({ message: "Server error creating workspace" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const filter = req.user.role === "admin"
      ? {}
      : { $or: [{ owner: req.user.userId }, { "collaborators.user": req.user.userId }] };
    const workspaces = await Workspace.find(filter)
      .populate("owner", "name email")
      .populate("collaborators.user", "name email")
      .sort({ updatedAt: -1 });
    res.json({ workspaces: workspaces.map(serialize) });
  } catch (err) {
    res.status(500).json({ message: "Server error loading workspaces" });
  }
});

router.get("/code/:code", requireAuth, async (req, res) => {
  try {
    const ws = await Workspace.findOne({ inviteCode: String(req.params.code).toUpperCase() })
      .populate("owner", "name email")
      .populate("collaborators.user", "name email");
    if (!ws) return res.status(404).json({ message: "Workspace not found" });
    res.json({ workspace: serialize(ws) });
  } catch (err) {
    res.status(500).json({ message: "Server error finding workspace" });
  }
});

router.post("/:code/join", requireAuth, async (req, res) => {
  try {
    const ws = await Workspace.findOne({ inviteCode: String(req.params.code).toUpperCase() });
    if (!ws) return res.status(404).json({ message: "Workspace not found" });
    if (!canAccess(ws, req.user.userId)) {
      ws.collaborators.push({ user: req.user.userId, role: "member" });
      await ws.save();
      const activity = await writeAudit(req, "workspace.joined", "workspace", ws._id, { name: ws.name, inviteCode: ws.inviteCode });
      await broadcastWorkspaceActivity(req, ws, activity);
    }
    await ws.populate("owner", "name email");
    await ws.populate("collaborators.user", "name email");
    const workspace = serialize(ws);
    req.app.get("io")?.to(`workspace:${ws._id}`).emit("workspace:updated", serialize(ws, { hideEmails: true }));
    res.json({ workspace });
  } catch (err) {
    res.status(500).json({ message: "Server error joining workspace" });
  }
});

const guestAttempts = new Map();
function guestRateLimited(ip) {
  const now = Date.now();
  const recent = (guestAttempts.get(ip) || []).filter((time) => now - time < 10 * 60 * 1000);
  recent.push(now);
  guestAttempts.set(ip, recent);
  return recent.length > 30;
}

// Public: anyone holding the share link can enter a general workspace as a named guest.
router.post("/:code/guest", async (req, res) => {
  try {
    if (guestRateLimited(req.ip)) return res.status(429).json({ message: "Too many attempts. Try again later." });
    const name = String(req.body.name || "").trim().replace(/\s+/g, " ").slice(0, 40);
    if (!name) return res.status(400).json({ message: "Enter a name to continue as a guest" });
    const ws = await Workspace.findOne({ inviteCode: String(req.params.code).toUpperCase() });
    if (!ws || ws.kind === "interview") return res.status(404).json({ message: "Workspace not found" });
    const guestId = `guest-${crypto.randomBytes(8).toString("hex")}`;
    const token = jwt.sign(
      { userId: guestId, role: "guest", guest: true, name, workspaceId: String(ws._id) },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );
    await ws.populate("owner", "name email");
    await ws.populate("collaborators.user", "name email");
    const activity = await writeAudit({ user: { userId: guestId, guest: true, name, role: "guest" } }, "workspace.guest_joined", "workspace", ws._id, { name });
    await broadcastWorkspaceActivity(req, ws, activity);
    res.json({ token, guest: { id: guestId, name, workspaceId: String(ws._id) }, workspace: serialize(ws, { hideEmails: true }) });
  } catch (err) {
    res.status(500).json({ message: "Server error joining as guest" });
  }
});

router.get("/:id", requireAuthOrGuest, async (req, res) => {
  try {
    const ws = await Workspace.findById(req.params.id)
      .populate("owner", "name email")
      .populate("collaborators.user", "name email");
    if (!ws) return res.status(404).json({ message: "Workspace not found" });
    if (!hasAccess(ws, req.user)) {
      return res.status(403).json({ message: "You do not have access to this workspace" });
    }
    res.json({ workspace: serialize(ws, { hideEmails: Boolean(req.user.guest) }) });
  } catch (err) {
    res.status(500).json({ message: "Server error loading workspace" });
  }
});

router.get("/:id/activity", requireAuthOrGuest, async (req, res) => {
  try {
    const ws = await findAccessibleWorkspace(req, res);
    if (!ws) return;
    const entries = await AuditLog.find({ entityType: "workspace", entityId: String(ws._id) })
      .sort({ createdAt: -1 })
      .limit(300)
      .populate("actor", "name email role");
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ message: "Server error loading workspace activity" });
  }
});

router.post("/:id/activity", requireAuthOrGuest, async (req, res) => {
  try {
    const ws = await findAccessibleWorkspace(req, res);
    if (!ws) return;
    const action = String(req.body.action || "").trim().slice(0, 300);
    if (!action) return res.status(400).json({ message: "Activity description is required" });
    const entry = await writeAudit(req, "workspace.activity", "workspace", ws._id, {
      action,
      source: String(req.body.source || "workspace").slice(0, 40),
      roomId: ws.roomId,
    });
    if (!entry) return res.status(500).json({ message: "Could not save workspace activity" });
    await broadcastWorkspaceActivity(req, ws, entry);
    res.status(201).json({ entry });
  } catch (err) {
    res.status(500).json({ message: "Server error saving workspace activity" });
  }
});

router.patch("/:id/members/:memberId", requireAuth, async (req, res) => {
  try {
    const ws = await Workspace.findById(req.params.id);
    if (!ws) return res.status(404).json({ message: "Workspace not found" });
    if (!canManage(ws, req.user)) return res.status(403).json({ message: "Only workspace owners can manage members" });
    if (String(ws.owner) === req.params.memberId) return res.status(400).json({ message: "The workspace creator's role cannot be changed" });
    await ws.populate("collaborators.user", "name");
    const member = ws.collaborators.find((item) => String(item.user?._id || item.user) === req.params.memberId);
    if (!member) return res.status(404).json({ message: "Workspace member not found" });
    if (!["owner", "member"].includes(req.body.role)) return res.status(400).json({ message: "Role must be owner or member" });
    member.role = req.body.role;
    await ws.save();
    const activity = await writeAudit(req, "workspace.member.role_changed", "workspace", ws._id, {
      memberId: req.params.memberId,
      memberName: member.user?.name || "Member",
      role: member.role,
    });
    await broadcastWorkspaceActivity(req, ws, activity);
    await ws.populate("owner", "name email");
    await ws.populate("collaborators.user", "name email");
    const workspace = serialize(ws);
    req.app.get("io")?.to(`workspace:${ws._id}`).emit("workspace:updated", serialize(ws, { hideEmails: true }));
    res.json({ workspace });
  } catch (err) {
    res.status(500).json({ message: "Server error updating workspace member" });
  }
});

router.delete("/:id/members/:memberId", requireAuth, async (req, res) => {
  try {
    const ws = await Workspace.findById(req.params.id);
    if (!ws) return res.status(404).json({ message: "Workspace not found" });
    if (!canManage(ws, req.user)) return res.status(403).json({ message: "Only workspace owners can manage members" });
    if (String(ws.owner?._id || ws.owner) === req.params.memberId) {
      return res.status(400).json({ message: "The workspace creator cannot be removed" });
    }
    await ws.populate("collaborators.user", "name");
    const memberIndex = ws.collaborators.findIndex((item) => String(item.user?._id || item.user) === req.params.memberId);
    if (memberIndex < 0) return res.status(404).json({ message: "Workspace member not found" });
    const memberName = ws.collaborators[memberIndex].user?.name || "Member";
    ws.collaborators.splice(memberIndex, 1);
    await ws.save();
    const activity = await writeAudit(req, "workspace.member.removed", "workspace", ws._id, { memberId: req.params.memberId, memberName });
    await broadcastWorkspaceActivity(req, ws, activity);
    await ws.populate("owner", "name email");
    await ws.populate("collaborators.user", "name email");
    const workspace = serialize(ws);
    req.app.get("io")?.to(`workspace:${ws._id}`).emit("workspace:updated", serialize(ws, { hideEmails: true }));
    res.json({ workspace });
  } catch (err) {
    res.status(500).json({ message: "Server error removing workspace member" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const ws = await Workspace.findById(req.params.id);
    if (!ws) return res.status(404).json({ message: "Workspace not found" });
    if (!canManage(ws, req.user)) {
      return res.status(403).json({ message: "Only the workspace owner can edit it" });
    }
    const allowed = ["name", "description", "type", "status"];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) ws[key] = req.body[key];
    });
    await ws.save();
    const activity = await writeAudit(req, "workspace.updated", "workspace", ws._id, { changed: allowed.filter((k) => req.body[k] !== undefined) });
    await broadcastWorkspaceActivity(req, ws, activity);
    await ws.populate("owner", "name email");
    await ws.populate("collaborators.user", "name email");
    const io = req.app.get("io");
    io?.to(`workspace:${ws._id}`).emit("workspace:updated", serialize(ws, { hideEmails: true }));
    res.json({ workspace: serialize(ws) });
  } catch (err) {
    res.status(500).json({ message: "Server error updating workspace" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const ws = await Workspace.findById(req.params.id);
    if (!ws) return res.status(404).json({ message: "Workspace not found" });
    if (!canManage(ws, req.user)) {
      return res.status(403).json({ message: "Only the workspace owner can delete it" });
    }

    const activity = await writeAudit(req, "workspace.deleted", "workspace", ws._id, { name: ws.name });
    await broadcastWorkspaceActivity(req, ws, activity);
    await Promise.all([
      WorkspaceFile.deleteMany({ workspace: ws._id }),
      YjsDocument.deleteMany({ roomName: `whiteboard-${ws.roomId}` }),
    ]);
    await ws.deleteOne();
    req.app.get("io")?.to(`workspace:${ws._id}`).emit("workspace:deleted", { id: String(ws._id) });
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete workspace error:", err.message);
    res.status(500).json({ message: "Server error deleting workspace" });
  }
});

module.exports = router;
