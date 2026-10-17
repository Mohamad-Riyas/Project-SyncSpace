const express = require("express");
const crypto = require("crypto");
const Interview = require("../models/Interview");
const User = require("../models/User");
const { requireAuth, requireRole, optionalAuth } = require("../middleware/auth");
const { writeAudit } = require("../utils/audit");

const router = express.Router();

/**
 * Create an interview. Interviewer/Admin only.
 * If candidateEmail is provided, validates that a registered User has that email.
 */
router.post("/", requireAuth, requireRole("interviewer", "admin"), async (req, res) => {
  try {
    const { title, candidateEmail, candidateEmails, scheduledAt, expiresAt, questionIds, questions, notes, durationMinutes } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Interview title is required" });
    }

    const emails = [...new Set(
      (Array.isArray(candidateEmails) ? candidateEmails : candidateEmail ? [candidateEmail] : [])
        .map((email) => String(email).trim().toLowerCase())
        .filter(Boolean)
    )];
    const candidateUsers = emails.length ? await User.find({ email: { $in: emails } }).select("_id email") : [];
    const registeredEmails = new Set(candidateUsers.map((user) => user.email));
    const unknownEmail = emails.find((email) => !registeredEmails.has(email));
    if (unknownEmail) {
      return res.status(400).json({ message: `No registered user found with email "${unknownEmail}".` });
    }

    const code = await Interview.generateUniqueCode();
    const roomId = `interview-${code}`;

    const interview = await Interview.create({
      title: title.trim(),
      code,
      roomId,
      interviewer: req.user.userId,
      candidateEmail: emails[0] || undefined,
      candidateEmails: emails,
      candidates: candidateUsers.map((user) => user._id),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      durationMinutes: Math.min(240, Math.max(5, Number(durationMinutes) || 60)),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      questionIds: Array.isArray(questionIds) ? questionIds : [],
      questions: Array.isArray(questions) ? questions.map((q, i) => ({
        title: String(q.title || "").trim(),
        description: String(q.description || ""),
        category: String(q.category || "General"),
        starterCode: String(q.starterCode || ""),
        order: Number(q.order ?? i),
      })).filter((q) => q.title) : [],
      notes: notes || "",
    });

    await interview.populate("candidates", "name email");
    await writeAudit(req, "interview.created", "interview", interview._id, { title: interview.title, roomId: interview.roomId });
    for (const user of candidateUsers) {
      req.app.get("io")?.to(`user:${user._id}`).emit("interview:invitation", {
        id: String(interview._id),
        title: interview.title,
        code: interview.code,
        interviewerName: req.user.name || "Your interviewer",
        link: `/interviews/join?code=${interview.code}`,
      });
    }
    res.status(201).json({ interview: serializeInterview(interview) });
  } catch (err) {
    console.error("Create interview error:", err.message);
    res.status(500).json({ message: "Server error creating interview" });
  }
});

/**
 * List interviews belonging to the authenticated interviewer/admin,
 * or interviews the current candidate has joined.
 */

router.patch("/:id/score", requireAuth, requireRole("interviewer", "admin"), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (String(interview.interviewer) !== String(req.user.userId) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the assigned interviewer or an admin can score this interview" });
    }
    const score = Number(req.body.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) return res.status(400).json({ message: "Score must be between 0 and 100" });
    interview.score = score;
    interview.scoreFeedback = String(req.body.feedback || "").trim();
    interview.scoredAt = new Date();
    await interview.save();
    await writeAudit(req, "interview.scored", "interview", interview._id, { score });
    res.json({ interview: serializeInterview(interview, { includeInterviewer: true }) });
  } catch (err) {
    console.error("Score interview error:", err.message);
    res.status(500).json({ message: "Server error saving interview score" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : req.user.role === "interviewer"
          ? { interviewer: req.user.userId }
          : {
              $or: [
                { candidate: req.user.userId },
                { candidates: req.user.userId },
                { candidateEmail: req.user.email?.toLowerCase() },
                { candidateEmails: req.user.email?.toLowerCase() },
              ],
            };

    const interviews = await Interview.find(filter)
      .populate("candidates", "name email")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ interviews: interviews.map(serializeInterview) });
  } catch (err) {
    console.error("List interviews error:", err.message);
    res.status(500).json({ message: "Server error listing interviews" });
  }
});

/**
 * Look up an interview by its shareable code — used by the candidate's
 * "Join Interview" screen before they've actually joined.
 * optionalAuth: a not-yet-registered candidate can still see basic info,
 * but must be authenticated to actually join (see POST /:code/join).
 */
router.get("/code/:code", optionalAuth, async (req, res) => {
  try {
    const code = String(req.params.code || "").toUpperCase().trim();
    const interview = await Interview.findOne({ code }).populate("interviewer", "name email").populate("candidate", "name email");

    if (!interview) {
      return res.status(404).json({ message: "Interview not found. Check the code and try again." });
    }
    if (interview.status === "cancelled") {
      return res.status(410).json({ message: "This interview has been cancelled." });
    }
    if (interview.status === "ended") {
      return res.status(410).json({ message: "This interview has already ended." });
    }
    if (interview.isExpired()) {
      return res.status(410).json({ message: "This interview link has expired." });
    }

    res.json({ interview: serializeInterview(interview, { includeInterviewer: true }) });
  } catch (err) {
    console.error("Lookup interview error:", err.message);
    res.status(500).json({ message: "Server error looking up interview" });
  }
});

/**
 * Candidate performs the real join operation: validates the interview,
 * attaches the candidate to the record, and returns the room/token info
 * the frontend needs to enter the collaborative workspace.
 * Only the interviewer and explicitly invited candidate accounts can join.
 */
router.post("/:code/join", requireAuth, async (req, res) => {
  try {
    const code = String(req.params.code || "").toUpperCase().trim();
    const interview = await Interview.findOne({ code }).populate("interviewer", "name email");

    if (!interview) {
      return res.status(404).json({ message: "Interview not found. Check the code and try again." });
    }
    if (interview.status === "cancelled" || interview.status === "ended") {
      return res.status(410).json({ message: `This interview has ${interview.status}.` });
    }
    if (interview.isExpired()) {
      return res.status(410).json({ message: "This interview link has expired." });
    }

    const isInterviewer = String(interview.interviewer._id || interview.interviewer) === String(req.user.userId) || req.user.role === "admin";
    const alreadyJoined =
      String(interview.candidate || "") === String(req.user.userId) ||
      interview.candidates.some((candidate) => String(candidate) === String(req.user.userId));
    const assignedEmails = interview.candidateEmails?.length
      ? interview.candidateEmails
      : interview.candidateEmail ? [interview.candidateEmail] : [];
    const isAssignedCandidate = assignedEmails.includes(req.user.email?.toLowerCase());

    if (alreadyJoined) {
      interview.populate("interviewer", "name email");
      await interview.populate("candidates", "name email");
      return res.json({ interview: serializeInterview(interview, { includeInterviewer: true, candidateUserId: req.user.userId }) });
    }

    if (!isInterviewer && !isAssignedCandidate) {
      return res.status(403).json({ message: "This interview was scheduled for a different candidate." });
    }
    if (
      interview.candidate &&
      String(interview.candidate) !== String(req.user.userId) &&
      !interview.candidates.length &&
      !isAssignedCandidate
    ) {
      return res.status(409).json({ message: "This interview has already been joined by another candidate." });
    }

    if (isAssignedCandidate && !alreadyJoined) {
      interview.candidates.addToSet(req.user.userId);
    }
    if (!interview.candidate && isAssignedCandidate) {
      interview.candidate = req.user.userId;
    }
    if (interview.status === "scheduled" && (isAssignedCandidate || isInterviewer)) {
      interview.status = "active";
      interview.startedAt = new Date();
    }
    await interview.save();
    await writeAudit(req, "interview.joined", "interview", interview._id, { roomId: interview.roomId });
    await interview.populate("candidates", "name email");

    res.json({ interview: serializeInterview(interview, { includeInterviewer: true, candidateUserId: req.user.userId }) });
  } catch (err) {
    console.error("Join interview error:", err.message);
    res.status(500).json({ message: "Server error joining interview" });
  }
});

/**
 * Join an unassigned interview as a guest (read-only, limited access).
 * Interviews with explicit candidate invitations require the invited account.
 */
router.post("/:code/guest", async (req, res) => {
  try {
    const jwt = require("jsonwebtoken");
    const code = String(req.params.code || "").toUpperCase().trim();
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Please provide your name to continue as a guest" });
    }

    const interview = await Interview.findOne({ code }).populate("interviewer", "name email");
    if (!interview) {
      return res.status(404).json({ message: "Interview not found. Check the code and try again." });
    }
    if (interview.status === "cancelled" || interview.status === "ended") {
      return res.status(410).json({ message: `This interview has ${interview.status}.` });
    }
    if (interview.isExpired()) {
      return res.status(410).json({ message: "This interview link has expired." });
    }
    if (interview.candidateEmails?.length || interview.candidateEmail) {
      return res.status(403).json({ message: "This interview is limited to candidates invited by the interviewer. Sign in with your registered candidate account." });
    }

    const guestId = `guest-${crypto.randomBytes(8).toString("hex")}`;
    const token = jwt.sign(
      { userId: guestId, role: "guest", guest: true, name: String(name).trim().slice(0, 40), interviewId: String(interview._id) },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    await writeAudit({ user: { userId: guestId, guest: true, name: String(name).trim(), role: "guest" } }, "interview.guest_joined", "interview", interview._id, { guestName: name });
    res.json({ token, guest: { id: guestId, name: String(name).trim(), interviewId: String(interview._id) }, interview: serializeInterview(interview, { includeInterviewer: true }) });
  } catch (err) {
    console.error("Guest join error:", err.message);
    res.status(500).json({ message: "Server error joining as guest" });
  }
});

/**
 * Fetch a single interview by its Mongo ID (used once inside the workspace).
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate("interviewer", "name email")
      .populate("candidate", "name email")
      .populate("candidates", "name email");
    if (!interview) return res.status(404).json({ message: "Interview not found" });

    const isParticipant =
      String(interview.interviewer._id || interview.interviewer) === String(req.user.userId) ||
      String(interview.candidate?._id || interview.candidate) === String(req.user.userId) ||
      interview.candidates.some((candidate) => String(candidate._id || candidate) === String(req.user.userId)) ||
      (interview.candidateEmails || []).includes(req.user.email?.toLowerCase()) ||
      interview.candidateEmail === req.user.email?.toLowerCase() ||
      req.user.role === "admin";

    if (!isParticipant) {
      return res.status(403).json({ message: "You are not a participant in this interview" });
    }

    res.json({ interview: serializeInterview(interview, { includeInterviewer: true, candidateUserId: req.user.userId }) });
  } catch (err) {
    console.error("Get interview error:", err.message);
    res.status(500).json({ message: "Server error fetching interview" });
  }
});

/**
 * Start an interview. Interviewer/admin only.
 */
router.post("/:id/start", requireAuth, requireRole("interviewer", "admin"), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (String(interview.interviewer) !== String(req.user.userId) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the assigned interviewer can start this interview" });
    }
    if (interview.status === "ended" || interview.status === "cancelled") {
      return res.status(409).json({ message: "This interview cannot be started" });
    }
    interview.status = "active";
    interview.startedAt = interview.startedAt || new Date();
    await interview.save();
    await writeAudit(req, "interview.started", "interview", interview._id, { roomId: interview.roomId });
    res.json({ interview: serializeInterview(interview, { includeInterviewer: true }) });
  } catch (err) {
    res.status(500).json({ message: "Server error starting interview" });
  }
});

/**
 * Update the candidate email/assignment (interviewer/admin only).
 * Allows changing which registered email is allowed to join.
 */
router.patch("/:id/candidate", requireAuth, requireRole("interviewer", "admin"), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (String(interview.interviewer) !== String(req.user.userId) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the assigned interviewer can update the candidate" });
    }

    const { candidateEmail } = req.body;
    if (!candidateEmail || !candidateEmail.trim()) {
      return res.status(400).json({ message: "Candidate email is required" });
    }

    const trimmedEmail = candidateEmail.trim().toLowerCase();
    const candidateUser = await User.findOne({ email: trimmedEmail });
    if (!candidateUser) {
      return res.status(404).json({ message: `No user found with email "${candidateEmail}". Please ensure the candidate is registered.` });
    }

    interview.candidateEmail = trimmedEmail;
    interview.candidateEmails = [...new Set([...(interview.candidateEmails || []), trimmedEmail])];
    interview.candidates.addToSet(candidateUser._id);
    await interview.save();
    await interview.populate("candidates", "name email");
    req.app.get("io")?.to(`user:${candidateUser._id}`).emit("interview:invitation", {
      id: String(interview._id),
      title: interview.title,
      code: interview.code,
      interviewerName: req.user.name || "Your interviewer",
      link: `/interviews/join?code=${interview.code}`,
    });
    await writeAudit(req, "interview.candidate_updated", "interview", interview._id, { candidateEmail: trimmedEmail });
    res.json({ interview: serializeInterview(interview, { includeInterviewer: true }) });
  } catch (err) {
    console.error("Update candidate error:", err.message);
    res.status(500).json({ message: "Server error updating candidate" });
  }
});

router.post("/:id/candidates", requireAuth, requireRole("interviewer", "admin"), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (String(interview.interviewer) !== String(req.user.userId) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the assigned interviewer can manage candidates" });
    }
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Candidate email is required" });
    const candidate = await User.findOne({ email }).select("_id email");
    if (!candidate) return res.status(404).json({ message: `No registered user found with email "${email}".` });
    const currentEmails = interview.candidateEmails?.length
      ? interview.candidateEmails
      : interview.candidateEmail ? [interview.candidateEmail] : [];
    if (!currentEmails.includes(email)) {
      interview.candidateEmails = [...currentEmails, email];
      interview.candidates.addToSet(candidate._id);
    }
    if (!interview.candidateEmail) interview.candidateEmail = email;
    await interview.save();
    await writeAudit(req, "interview.candidate_added", "interview", interview._id, { candidateEmail: email });
    req.app.get("io")?.to(`user:${candidate._id}`).emit("interview:invitation", {
      id: String(interview._id),
      title: interview.title,
      code: interview.code,
      interviewerName: req.user.name || "Your interviewer",
      link: `/interviews/join?code=${interview.code}`,
    });
    await interview.populate("candidates", "name email");
    res.status(201).json({ interview: serializeInterview(interview) });
  } catch (err) {
    console.error("Add interview candidate error:", err.message);
    res.status(500).json({ message: "Server error adding candidate" });
  }
});

router.delete("/:id/candidates/:candidateId", requireAuth, requireRole("interviewer", "admin"), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (String(interview.interviewer) !== String(req.user.userId) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the assigned interviewer can manage candidates" });
    }
    const candidate = await User.findById(req.params.candidateId).select("_id email");
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });
    interview.candidateEmails = (interview.candidateEmails || []).filter((email) => email !== candidate.email);
    interview.candidates = interview.candidates.filter((id) => String(id) !== String(candidate._id));
    if (String(interview.candidate || "") === String(candidate._id)) {
      interview.candidate = interview.candidates[0] || null;
    }
    interview.candidateEmail = interview.candidateEmails[0] || undefined;
    await interview.save();
    await writeAudit(req, "interview.candidate_removed", "interview", interview._id, { candidateEmail: candidate.email });
    await interview.populate("candidates", "name email");
    res.json({ interview: serializeInterview(interview) });
  } catch (err) {
    console.error("Remove interview candidate error:", err.message);
    res.status(500).json({ message: "Server error removing candidate" });
  }
});

router.delete("/:id/candidates/by-email/:email", requireAuth, requireRole("interviewer", "admin"), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (String(interview.interviewer) !== String(req.user.userId) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the assigned interviewer can manage candidates" });
    }
    const email = String(req.params.email).trim().toLowerCase();
    const candidate = await User.findOne({ email }).select("_id email");
    interview.candidateEmails = (interview.candidateEmails || []).filter((entry) => entry !== email);
    if (candidate) {
      interview.candidates = interview.candidates.filter((id) => String(id) !== String(candidate._id));
      if (String(interview.candidate || "") === String(candidate._id)) {
        interview.candidate = interview.candidates[0] || null;
      }
    }
    interview.candidateEmail = interview.candidateEmails[0] || undefined;
    await interview.save();
    await writeAudit(req, "interview.candidate_removed", "interview", interview._id, { candidateEmail: email });
    await interview.populate("candidates", "name email");
    res.json({ interview: serializeInterview(interview) });
  } catch (err) {
    console.error("Remove interview candidate error:", err.message);
    res.status(500).json({ message: "Server error removing candidate" });
  }
});

/**
 * Update notes/questions (interviewer/admin only).
 */
router.patch("/:id/notes", requireAuth, requireRole("interviewer", "admin"), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (String(interview.interviewer) !== String(req.user.userId) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the assigned interviewer can edit notes" });
    }
    interview.notes = req.body.notes || "";
    if (Array.isArray(req.body.questions)) {
      interview.questions = req.body.questions.map((q, i) => ({
        title: String(q.title || "").trim(),
        description: String(q.description || ""),
        category: String(q.category || "General"),
        starterCode: String(q.starterCode || ""),
        order: i,
      })).filter((q) => q.title);
    }
    await interview.save();
    await writeAudit(req, "interview.updated", "interview", interview._id, { questionsChanged: Array.isArray(req.body.questions) });
    res.json({ interview: serializeInterview(interview) });
  } catch (err) {
    console.error("Update notes error:", err.message);
    res.status(500).json({ message: "Server error updating notes" });
  }
});

/**
 * End an interview (interviewer/admin only).
 */
router.post("/:id/end", requireAuth, requireRole("interviewer", "admin"), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (String(interview.interviewer) !== String(req.user.userId) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the assigned interviewer can end this interview" });
    }
    interview.status = "ended";
    interview.endedAt = new Date();
    await interview.save();
    await writeAudit(req, "interview.ended", "interview", interview._id, { roomId: interview.roomId });
    res.json({ interview: serializeInterview(interview) });
  } catch (err) {
    console.error("End interview error:", err.message);
    res.status(500).json({ message: "Server error ending interview" });
  }
});

function serializeInterview(interview, { includeInterviewer = false, candidateUserId } = {}) {
  const participantCandidate = candidateUserId
    ? (interview.candidates || []).find((candidate) => String(candidate._id || candidate) === String(candidateUserId))
    : null;
  const firstPopulatedCandidate = (interview.candidates || []).find(
    (candidate) => typeof candidate === "object" && candidate.name
  );
  const candidateInfo = participantCandidate?.name
    ? participantCandidate
    : interview.candidate?.name ? interview.candidate : firstPopulatedCandidate || interview.candidate;
  const out = {
    id: interview._id,
    title: interview.title,
    code: interview.code,
    roomId: interview.roomId,
    status: interview.status,
    candidateEmail: interview.candidateEmail || null,
    candidateEmails: interview.candidateEmails?.length
      ? interview.candidateEmails
      : interview.candidateEmail ? [interview.candidateEmail] : [],
    candidate: interview.candidate?._id || interview.candidate || null,
    candidates: (interview.candidates || []).map((candidate) => (
      typeof candidate === "object"
        ? { id: String(candidate._id), name: candidate.name, email: candidate.email }
        : { id: String(candidate) }
    )),
    candidateInfo: candidateInfo?.name ? { id: candidateInfo._id, name: candidateInfo.name, email: candidateInfo.email } : null,
    questionIds: interview.questionIds || [],
    questions: (interview.questions || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map((q) => ({
      id: String(q._id || q.order),
      title: q.title,
      description: q.description,
      category: q.category,
      starterCode: q.starterCode,
      order: q.order,
    })),
    notes: interview.notes || "",
    score: interview.score,
    scoreFeedback: interview.scoreFeedback || "",
    scoredAt: interview.scoredAt,
    durationMinutes: interview.durationMinutes || 60,
    scheduledAt: interview.scheduledAt,
    expiresAt: interview.expiresAt,
    startedAt: interview.startedAt,
    endedAt: interview.endedAt,
    createdAt: interview.createdAt,
  };
  if (includeInterviewer && interview.interviewer) {
    out.interviewer =
      typeof interview.interviewer === "object"
        ? { id: interview.interviewer._id, name: interview.interviewer.name, email: interview.interviewer.email }
        : { id: interview.interviewer };
  } else {
    out.interviewer = interview.interviewer?._id || interview.interviewer;
  }
  return out;
}

module.exports = router;
