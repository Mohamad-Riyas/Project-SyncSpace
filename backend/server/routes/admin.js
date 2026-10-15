const express = require("express");
const User = require("../models/User");
const Interview = require("../models/Interview");
const { requireAuth, requireRole } = require("../middleware/auth");
const { writeAudit } = require("../utils/audit");

const router = express.Router();

// Every route in this file is admin-only.
router.use(requireAuth, requireRole("admin"));

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    console.error("Admin list users error:", err.message);
    res.status(500).json({ message: "Server error listing users" });
  }
});

router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "interviewer", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    await writeAudit(req, "admin.user_role_updated", "user", user._id, { role });
    res.json({ user });
  } catch (err) {
    console.error("Admin update role error:", err.message);
    res.status(500).json({ message: "Server error updating role" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.userId)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await writeAudit(req, "admin.user_deleted", "user", req.params.id, {});
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Admin delete user error:", err.message);
    res.status(500).json({ message: "Server error deleting user" });
  }
});

router.get("/interviews", async (req, res) => {
  try {
    const interviews = await Interview.find()
      .populate("interviewer", "name email")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ interviews });
  } catch (err) {
    console.error("Admin list interviews error:", err.message);
    res.status(500).json({ message: "Server error listing interviews" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const [userCount, interviewCount, activeInterviews] = await Promise.all([
      User.countDocuments(),
      Interview.countDocuments(),
      Interview.countDocuments({ status: "active" }),
    ]);
    res.json({ userCount, interviewCount, activeInterviews });
  } catch (err) {
    console.error("Admin stats error:", err.message);
    res.status(500).json({ message: "Server error fetching stats" });
  }
});

module.exports = router;
