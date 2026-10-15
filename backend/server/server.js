require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Y = require("yjs");
const jwt = require("jsonwebtoken");
const authRoutes = require("./routes/auth");
const interviewRoutes = require("./routes/interviews");
const adminRoutes = require("./routes/admin");
const auditRoutes = require("./routes/audit");
const workspaceRoutes = require("./routes/workspaces");
const recordingRoutes = require("./routes/recordings");
const workspaceFileRoutes = require("./routes/workspaceFiles");
const { YSocketIO } = require("y-socket.io/dist/server");
const YjsDocument = require("./models/YjsDocument");
const Workspace = require("./models/Workspace");

const app = express();
app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use("/api/auth", authRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/workspaces/:workspaceId/files", workspaceFileRoutes);
app.use("/api/recordings", recordingRoutes);

app.get("/ping", (req, res) => {
  res.json({ status: "ok", message: "server is alive" });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

const server = http.createServer(app);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.set("io", io);

const ysocketio = new YSocketIO(io);
ysocketio.initialize();

const saveTimers = new Map();

function scheduleSave(doc) {
  const roomName = doc.name;
  if (!roomName) {
    console.warn("Yjs document has no .name property - persistence skipped for this update");
    return;
  }
  if (saveTimers.has(roomName)) clearTimeout(saveTimers.get(roomName));
  const timer = setTimeout(async () => {
    try {
      const state = Buffer.from(Y.encodeStateAsUpdate(doc));
      await YjsDocument.findOneAndUpdate(
        { roomName },
        { roomName, state, updatedAt: new Date() },
        { upsert: true }
      );
      console.log(`Persisted Yjs doc: ${roomName}`);
    } catch (err) {
      console.error(`Failed to persist Yjs doc ${roomName}:`, err.message);
    }
    saveTimers.delete(roomName);
  }, 3000);
  saveTimers.set(roomName, timer);
}

ysocketio.on("document-loaded", async (doc) => {
  console.log("document-loaded fired, room name:", doc.name);
  try {
    const saved = await YjsDocument.findOne({ roomName: doc.name });
    if (saved && saved.state) {
      Y.applyUpdate(doc, new Uint8Array(saved.state));
      console.log(`Restored Yjs doc from MongoDB: ${doc.name}`);
    }
  } catch (err) {
    console.error(`Failed to load Yjs doc ${doc.name}:`, err.message);
  }
});

ysocketio.on("document-update", (doc) => {
  scheduleSave(doc);
});

const rooms = new Map();

// workspaceId -> Map(socketId -> { id, guest, name }); drives the online/offline dots.
const workspacePresence = new Map();

function broadcastPresence(workspaceId) {
  const unique = new Map();
  workspacePresence.get(workspaceId)?.forEach((participant) => unique.set(participant.id, participant));
  io.to(`workspace:${workspaceId}`).emit("workspace:presence", [...unique.values()]);
}

function removePresence(socket, workspaceId) {
  const sockets = workspacePresence.get(workspaceId);
  if (!sockets?.delete(socket.id)) return;
  if (!sockets.size) workspacePresence.delete(workspaceId);
  socket.data.presenceRooms?.delete(workspaceId);
  broadcastPresence(workspaceId);
}

// Attach the authenticated user (if any) to the socket. Sockets used for
// public/anonymous flows (e.g. pre-join mic test) are still allowed to
// connect without a token; but any identity-bearing signaling (e.g. who is
// muted) trusts this decoded token rather than a client-supplied name.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        ...(payload.guest ? { guest: true, name: payload.name, workspaceId: payload.workspaceId } : {}),
      };
    } catch (err) {
      // invalid token: proceed unauthenticated rather than hard-failing the socket,
      // since some rooms (whiteboard demo/test pages) don't require auth
      console.warn("Socket auth token invalid:", err.message);
    }
  }
  next();
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.emit("connected", { socketId: socket.id, user: socket.data.user || null });

  socket.on("join-workspace", async (workspaceId) => {
    if (!workspaceId) return;
    const user = socket.data.user;
    if (!user) {
      socket.emit("workspace:access-denied", { workspaceId });
      return;
    }
    try {
      let allowed;
      if (user.guest) {
        allowed = String(workspaceId) === String(user.workspaceId);
      } else {
        const workspace = await Workspace.findById(workspaceId).select("owner collaborators.user");
        allowed = Boolean(workspace) && (
          String(workspace.owner) === String(user.userId) ||
          workspace.collaborators.some((member) => String(member.user) === String(user.userId)) ||
          user.role === "admin"
        );
      }
      if (!allowed) {
        socket.emit("workspace:access-denied", { workspaceId });
        return;
      }
    } catch (err) {
      socket.emit("workspace:access-denied", { workspaceId });
      return;
    }
    socket.join(`workspace:${workspaceId}`);

    const key = String(workspaceId);
    if (!workspacePresence.has(key)) workspacePresence.set(key, new Map());
    workspacePresence.get(key).set(socket.id, { id: String(user.userId), guest: Boolean(user.guest), name: user.guest ? user.name : undefined });
    if (!socket.data.presenceRooms) socket.data.presenceRooms = new Set();
    socket.data.presenceRooms.add(key);
    broadcastPresence(key);
  });

  socket.on("leave-workspace", (workspaceId) => {
    if (!workspaceId) return;
    socket.leave(`workspace:${workspaceId}`);
    removePresence(socket, String(workspaceId));
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.data.roomId = roomId;

    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId).add(socket.id);

    console.log(`${socket.id} joined room ${roomId}`);

    socket.to(roomId).emit("user-joined", {
      userId: socket.id,
      name: socket.data.user?.email || null,
      role: socket.data.user?.role || null,
    });

    // Tell the newcomer who's already in the room so it can initiate
    // WebRTC offers to each existing peer (mesh signaling).
    const others = [...(rooms.get(roomId) || [])].filter((id) => id !== socket.id);
    socket.emit("room-peers", { peers: others });
  });

  // --- WebRTC signaling relay (audio) ---
  // The server never touches media itself; it only relays SDP/ICE between
  // peers already confirmed to be in the same room. Actual audio flows
  // peer-to-peer once the connection is negotiated.
  socket.on("webrtc-offer", ({ to, offer }) => {
    if (!to || !offer) return;
    io.to(to).emit("webrtc-offer", { from: socket.id, offer });
  });

  socket.on("webrtc-answer", ({ to, answer }) => {
    if (!to || !answer) return;
    io.to(to).emit("webrtc-answer", { from: socket.id, answer });
  });

  socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
    if (!to || !candidate) return;
    io.to(to).emit("webrtc-ice-candidate", { from: socket.id, candidate });
  });

  socket.on("mic-state", ({ muted }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("mic-state", { userId: socket.id, muted: Boolean(muted) });
  });

  // --- Chat (per-room text chat, distinct from the global help chatbox) ---
  socket.on("chat-message", ({ text }) => {
    const roomId = socket.data.roomId;
    if (!roomId || !text) return;
    const message = {
      id: `${socket.id}-${Date.now()}`,
      userId: socket.id,
      name: socket.data.user?.email || "Guest",
      text: String(text).slice(0, 2000),
      sentAt: new Date().toISOString(),
    };
    io.to(roomId).emit("chat-message", message);
  });

  socket.on("leave-room", () => {
    cleanupSocket(socket);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    socket.data.presenceRooms?.forEach((workspaceId) => removePresence(socket, workspaceId));
    cleanupSocket(socket);
  });
});

function cleanupSocket(socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  socket.leave(roomId);
  const roomSet = rooms.get(roomId);
  if (roomSet) {
    roomSet.delete(socket.id);
    if (roomSet.size === 0) rooms.delete(roomId);
  }

  socket.to(roomId).emit("user-left", { userId: socket.id });
  socket.data.roomId = null;
}

process.on("unhandledRejection", (err) => {
  console.error("Unhandled promise rejection:", err);
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));