const express = require('express');
const Workspace = require('../models/Workspace');
const WorkspaceFile = require('../models/WorkspaceFile');
// Every route here is workspace-scoped, so guest tokens are accepted (checked in getWorkspace).
const { requireAuthOrGuest: requireAuth } = require('../middleware/auth');
const { writeAudit, broadcastWorkspaceActivity } = require('../utils/audit');

const router = express.Router({ mergeParams: true });

async function getWorkspace(req, res) {
  const ws = await Workspace.findById(req.params.workspaceId);
  if (!ws) { res.status(404).json({ message: 'Workspace not found' }); return null; }
  const allowed = req.user.guest
    ? String(ws._id) === String(req.user.workspaceId)
    : String(ws.owner) === String(req.user.userId) ||
      ws.collaborators.some((c) => String(c.user) === String(req.user.userId)) || req.user.role === 'admin';
  if (!allowed) { res.status(403).json({ message: 'You do not have access to this workspace' }); return null; }
  return ws;
}

function serialize(file) {
  return { id: String(file._id), name: file.name, path: file.path, kind: file.kind, language: file.language, content: file.content, parentPath: file.parentPath, updatedAt: file.updatedAt };
}

router.get('/', requireAuth, async (req, res) => {
  try {
    if (!await getWorkspace(req, res)) return;
    const files = await WorkspaceFile.find({ workspace: req.params.workspaceId }).sort({ kind: 1, path: 1 });
    res.json({ files: files.map(serialize) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error loading project files' }); }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const ws = await getWorkspace(req, res); if (!ws) return;
    const name = String(req.body.name || '').trim();
    const kind = req.body.kind === 'folder' ? 'folder' : 'file';
    const parentPath = String(req.body.parentPath || '').trim().replace(/^\/|\/$/g, '');
    if (!name || /[\\/]/.test(name)) return res.status(400).json({ message: 'Enter a valid file or folder name' });
    const path = parentPath ? `${parentPath}/${name}` : name;
    const exists = await WorkspaceFile.findOne({ workspace: ws._id, path });
    if (exists) return res.status(409).json({ message: 'A file or folder with that name already exists' });
    const file = await WorkspaceFile.create({ workspace: ws._id, name, path, kind, parentPath, language: kind === 'file' ? (req.body.language || 'plaintext') : 'plaintext', content: kind === 'file' ? String(req.body.content || '') : '' });
    const activity = await writeAudit(req, 'workspace.file.created', 'workspace', ws._id, { path, kind });
    await broadcastWorkspaceActivity(req, ws, activity);
    res.status(201).json({ file: serialize(file) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error creating project item' }); }
});

router.patch('/:fileId', requireAuth, async (req, res) => {
  try {
    const ws = await getWorkspace(req, res); if (!ws) return;
    const file = await WorkspaceFile.findOne({ _id: req.params.fileId, workspace: ws._id });
    if (!file) return res.status(404).json({ message: 'Project item not found' });
    if (req.body.name !== undefined) file.name = String(req.body.name).trim();
    if (req.body.parentPath !== undefined) file.parentPath = String(req.body.parentPath || '').trim().replace(/^\/|\/$/g, '');
    if (file.name.includes('/') || file.name.includes('\\') || !file.name) return res.status(400).json({ message: 'Invalid name' });
    file.path = file.parentPath ? `${file.parentPath}/${file.name}` : file.name;
    if (req.body.language !== undefined) file.language = String(req.body.language);
    if (req.body.content !== undefined && file.kind === 'file') file.content = String(req.body.content);
    await file.save();
    const activity = await writeAudit(req, 'workspace.file.updated', 'workspace', ws._id, { path: file.path });
    await broadcastWorkspaceActivity(req, ws, activity);
    res.json({ file: serialize(file) });
    const io = req.app.get('io'); io?.to(`workspace:${ws._id}`).emit('workspace:file-updated', serialize(file));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error updating project item' }); }
});

router.delete('/:fileId', requireAuth, async (req, res) => {
  try {
    const ws = await getWorkspace(req, res); if (!ws) return;
    const file = await WorkspaceFile.findOne({ _id: req.params.fileId, workspace: ws._id });
    if (!file) return res.status(404).json({ message: 'Project item not found' });
    const prefix = `${file.path}/`;
    await WorkspaceFile.deleteMany({ workspace: ws._id, $or: [{ _id: file._id }, { path: { $regex: `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` } }] });
    const activity = await writeAudit(req, 'workspace.file.deleted', 'workspace', ws._id, { path: file.path });
    await broadcastWorkspaceActivity(req, ws, activity);
    const io = req.app.get('io'); io?.to(`workspace:${ws._id}`).emit('workspace:file-deleted', { id: String(file._id), path: file.path });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error deleting project item' }); }
});

module.exports = router;
