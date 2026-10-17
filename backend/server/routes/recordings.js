const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Recording = require("../models/Recording");
const Interview = require("../models/Interview");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");
const { writeAudit } = require("../utils/audit");

const router = express.Router();
const recordingsDir = path.join(__dirname, "..", "uploads", "recordings");
fs.mkdirSync(recordingsDir, { recursive: true });

async function getInterviewAccess(interviewId, user) {
  const interview = await Interview.findById(interviewId);
  if (!interview) return { interview: null, allowed: false };
  const allowed =
    user.role === "admin" ||
    String(interview.interviewer) === String(user.userId);
  return { interview, allowed };
}

router.post("/start", requireAuth, requireRole("interviewer", "admin"), async (req, res) => {
  try {
    const { interviewId, mimeType } = req.body;
    const { interview, allowed } = await getInterviewAccess(interviewId, req.user);
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (!allowed) return res.status(403).json({ message: "You cannot record this interview" });

    const safeMime = String(mimeType || "audio/webm").split(";")[0];
    const extension = safeMime.includes("mp4") ? "mp4" : safeMime.includes("ogg") ? "ogg" : "webm";
    const fileName = `${interview._id}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${extension}`;
    const filePath = path.join(recordingsDir, fileName);
    fs.writeFileSync(filePath, Buffer.alloc(0));

    const recording = await Recording.create({
      interview: interview._id,
      startedBy: req.user.userId,
      fileName,
      mimeType: safeMime,
      filePath,
      status: "recording",
    });
    req.app.get("io")?.to(interview.roomId).emit("recording:status", { status: "recording" });
    await writeAudit(req, "interview.recording_started", "recording", recording._id, { interviewId: interview._id, roomId: interview.roomId });
    res.status(201).json({ recording: { id: recording._id, fileName: recording.fileName, mimeType: recording.mimeType } });
  } catch (err) {
    console.error("Recording start error:", err.message);
    res.status(500).json({ message: "Server error starting recording" });
  }
});

router.post("/:id/chunk", requireAuth, requireRole("interviewer", "admin"), async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id).populate("interview");
    if (!recording) return res.status(404).json({ message: "Recording not found" });
    if (recording.status !== "recording") return res.status(409).json({ message: "Recording is not active" });
    if (req.user.role !== "admin" && String(recording.interview.interviewer) !== String(req.user.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    const base64 = String(req.body?.data || "");
    if (!base64) return res.status(400).json({ message: "Recording chunk is empty" });
    const buffer = Buffer.from(base64, "base64");
    fs.appendFileSync(recording.filePath, buffer);
    recording.sizeBytes += buffer.length;
    await recording.save();
    res.json({ ok: true, sizeBytes: recording.sizeBytes });
  } catch (err) {
    console.error("Recording chunk error:", err.message);
    res.status(500).json({ message: "Server error saving recording chunk" });
  }
});

router.post("/:id/finalize", requireAuth, requireRole("interviewer", "admin"), async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id).populate("interview");
    if (!recording) return res.status(404).json({ message: "Recording not found" });
    if (req.user.role !== "admin" && String(recording.interview.interviewer) !== String(req.user.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    recording.durationSeconds = Math.max(0, Number(req.body?.durationSeconds) || 0);
    recording.status = "ready";
    await recording.save();
    req.app.get("io")?.to(recording.interview.roomId).emit("recording:status", { status: "ready" });
    await writeAudit(req, "interview.recording_completed", "recording", recording._id, {
      interviewId: recording.interview._id,
      durationSeconds: recording.durationSeconds,
      sizeBytes: recording.sizeBytes,
    });
    res.json({ recording: serialize(recording) });
  } catch (err) {
    res.status(500).json({ message: "Server error finalizing recording" });
  }
});

router.delete("/:id", requireAuth, requireRole("interviewer", "admin"), async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id).populate("interview");
    if (!recording) return res.status(404).json({ message: "Recording not found" });
    if (req.user.role !== "admin" && String(recording.interview.interviewer) !== String(req.user.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    if (recording.status !== "recording") return res.status(409).json({ message: "Only an active recording can be discarded" });
    if (fs.existsSync(recording.filePath)) fs.unlinkSync(recording.filePath);
    await recording.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error("Recording discard error:", err.message);
    res.status(500).json({ message: "Server error discarding recording" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const filter = req.user.role === "admin"
      ? {}
      : req.user.role === "interviewer"
        ? { startedBy: req.user.userId }
        : { sharedWith: req.user.userId, status: "ready" };
    const recordings = await Recording.find(filter)
      .populate("interview", "title code roomId interviewer candidate status")
      .populate("startedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ recordings: recordings.map(serialize) });
  } catch (err) {
    res.status(500).json({ message: "Server error loading recordings" });
  }
});

router.post("/:id/share", requireAuth, requireRole("interviewer", "admin"), async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id).populate("interview");
    if (!recording) return res.status(404).json({ message: "Recording not found" });
    if (req.user.role !== "admin" && String(recording.interview.interviewer) !== String(req.user.userId)) {
      return res.status(403).json({ message: "Only the assigned interviewer can share this recording" });
    }
    if (recording.status !== "ready") return res.status(409).json({ message: "Only completed recordings can be shared" });
    const candidateEmails = recording.interview.candidateEmails?.length
      ? recording.interview.candidateEmails
      : recording.interview.candidateEmail ? [recording.interview.candidateEmail] : [];
    const candidatesByEmail = candidateEmails.length
      ? await User.find({ email: { $in: candidateEmails } }).select("_id")
      : [];
    const candidateIds = [
      ...(recording.interview.candidates || []),
      ...(recording.interview.candidate ? [recording.interview.candidate] : []),
      ...candidatesByEmail.map((candidate) => candidate._id),
    ];
    recording.sharedWith = [...new Set([...recording.sharedWith.map(String), ...candidateIds.map(String)])];
    await recording.save();
    await recording.populate("interview", "title");
    recording.sharedWith.forEach((candidateId) => {
      req.app.get("io")?.to(`user:${candidateId}`).emit("interview:recording-shared", {
        id: String(recording._id),
        title: recording.interview.title,
        link: "/recordings",
      });
    });
    res.json({ recording: serialize(recording) });
  } catch (err) {
    console.error("Share recording error:", err.message);
    res.status(500).json({ message: "Server error sharing recording" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id).populate("interview");
    if (!recording) return res.status(404).json({ message: "Recording not found" });
    const allowed =
      req.user.role === "admin" ||
      String(recording.interview.interviewer) === String(req.user.userId) ||
      recording.sharedWith.some((candidateId) => String(candidateId) === String(req.user.userId));
    if (!allowed) return res.status(403).json({ message: "Not allowed" });
    if (!fs.existsSync(recording.filePath)) return res.status(404).json({ message: "Recording file is missing" });
    res.setHeader("Content-Type", recording.mimeType || "audio/webm");
    res.setHeader("Content-Length", fs.statSync(recording.filePath).size);
    fs.createReadStream(recording.filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ message: "Server error streaming recording" });
  }
});

function serialize(r) {
  return {
    id: String(r._id),
    interviewId: String(r.interview?._id || r.interview),
    interviewTitle: r.interview?.title || "Interview",
    fileName: r.fileName,
    mimeType: r.mimeType,
    sizeBytes: r.sizeBytes,
    durationSeconds: r.durationSeconds,
    status: r.status,
    shared: Boolean(r.sharedWith?.length),
    createdAt: r.createdAt,
    startedBy: r.startedBy?.name || r.startedBy?.email || null,
  };
}

module.exports = router;
