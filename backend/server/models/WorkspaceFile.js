const mongoose = require('mongoose');

const workspaceFileSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  name: { type: String, required: true, trim: true },
  path: { type: String, required: true, trim: true },
  kind: { type: String, enum: ['file', 'folder'], required: true },
  language: { type: String, default: 'plaintext' },
  content: { type: String, default: '' },
  parentPath: { type: String, default: '' },
}, { timestamps: true });

workspaceFileSchema.index({ workspace: 1, path: 1 }, { unique: true });
module.exports = mongoose.model('WorkspaceFile', workspaceFileSchema);
