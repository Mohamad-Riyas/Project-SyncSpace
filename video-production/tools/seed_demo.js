// One-off: creates clearly-labelled demo users in the DB configured in backend/server/.env
// Run:  node video-production/tools/seed_demo.js   (from repo root)
const path = require("path");
const server = path.resolve(__dirname, "..", "..", "backend", "server");
const req = (m) => require(require.resolve(m, { paths: [server] }));
req("dotenv").config({ path: path.join(server, ".env") });
const mongoose = req("mongoose");
const bcrypt = req("bcryptjs");
const User = require(path.join(server, "models", "User"));

const PASSWORD = "SyncSpaceDemo2026Pass";
const users = [
  { name: "Nivo (Demo)", email: "demo.host@syncspace.local" },
  { name: "Alex (Demo)", email: "demo.member@syncspace.local" },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const hash = await bcrypt.hash(PASSWORD, 12);
  for (const u of users) {
    await User.findOneAndUpdate(
      { email: u.email },
      { ...u, password: hash, role: "user", emailVerified: true, accountStatus: "active" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log("ready:", u.email);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
