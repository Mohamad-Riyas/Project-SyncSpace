const express = require("express");
const AuditLog = require("../models/AuditLog");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { actor: req.user.userId };
    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 200, 500))
      .populate("actor", "name email role");
    res.json({ logs });
  } catch (err) {
    console.error("Audit list error:", err.message);
    res.status(500).json({ message: "Server error loading audit logs" });
  }
});

router.get("/admin", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .populate("actor", "name email role");
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: "Server error loading audit logs" });
  }
});

module.exports = router;
