const mongoose = require("mongoose");

const recordingSchema = new mongoose.Schema(
  {
    interview: { type: mongoose.Schema.Types.ObjectId, ref: "Interview", required: true, index: true },
    startedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, default: "audio/webm" },
    filePath: { type: String, required: true },
    sizeBytes: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    status: { type: String, enum: ["recording", "processing", "ready", "failed"], default: "recording" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recording", recordingSchema);
