const mongoose = require("mongoose");

const yjsDocumentSchema = new mongoose.Schema({
  roomName: { type: String, required: true, unique: true },
  state: { type: Buffer, required: true },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("YjsDocument", yjsDocumentSchema);