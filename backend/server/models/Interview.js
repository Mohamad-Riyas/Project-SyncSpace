const mongoose = require("mongoose");
const crypto = require("crypto");

function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

const interviewSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true, default: generateCode },
    interviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    candidateEmail: { type: String, trim: true, lowercase: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    durationMinutes: { type: Number, default: 60, min: 5, max: 240 },
    status: {
      type: String,
      enum: ["scheduled", "active", "ended", "cancelled"],
      default: "scheduled",
    },
    questionIds: [{ type: String }],
    questions: [{
      title: { type: String, required: true, trim: true },
      description: { type: String, default: "" },
      category: { type: String, default: "General" },
      starterCode: { type: String, default: "" },
      order: { type: Number, default: 0 },
    }],
    notes: { type: String, default: "" },
    score: { type: Number, min: 0, max: 100, default: null },
    scoreFeedback: { type: String, default: "" },
    scoredAt: { type: Date, default: null },
    scheduledAt: { type: Date },
    expiresAt: { type: Date },
    startedAt: { type: Date },
    endedAt: { type: Date },
    roomId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

interviewSchema.statics.generateUniqueCode = async function () {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    const existing = await this.findOne({ code });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique interview code, please retry");
};

interviewSchema.methods.isExpired = function () {
  return Boolean(this.expiresAt) && this.expiresAt.getTime() < Date.now();
};

module.exports = mongoose.model("Interview", interviewSchema);
