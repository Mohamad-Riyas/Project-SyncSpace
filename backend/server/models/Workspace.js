const mongoose = require("mongoose");
const crypto = require("crypto");

function generateInviteCode() {
  return crypto.randomBytes(5).toString("hex").toUpperCase();
}
function generateRoomId() {
  return `room-${crypto.randomBytes(9).toString("hex")}`;
}

const collaboratorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "member"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    kind: { type: String, enum: ["general", "interview"], default: "general" },
    type: { type: String, default: "Code + Whiteboard" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    collaborators: { type: [collaboratorSchema], default: [] },
    inviteCode: { type: String, unique: true, index: true, default: generateInviteCode },
    roomId: { type: String, unique: true, index: true, default: generateRoomId },
    status: { type: String, enum: ["Active", "Offline"], default: "Active" },
  },
  { timestamps: true }
);

workspaceSchema.statics.generateUniqueInviteCode = async function () {
  for (let i = 0; i < 10; i += 1) {
    const code = generateInviteCode();
    if (!(await this.exists({ inviteCode: code }))) return code;
  }
  throw new Error("Could not generate a unique workspace invite code");
};

module.exports = mongoose.model("Workspace", workspaceSchema);
