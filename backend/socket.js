const { io } = require("socket.io-client");

const socket = io(process.env.SOCKET_URL || "http://localhost:5000");
socket.on("connected", (data) => console.log("connected event received:", data));
socket.on("connect", () => {
    socket.emit("join-room", "room1");
});
socket.on("user-joined", (data) => console.log("someone else joined:", data));
