import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

function RoomTest() {
  const [status, setStatus] = useState("Connecting...");
  const [socketId, setSocketId] = useState("");
  const [roomId, setRoomId] = useState("room1");
  const [joined, setJoined] = useState(false);
  const [log, setLog] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io("http://localhost:5001");
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("Connected");
    });

    socket.on("connected", (data) => {
      setSocketId(data.socketId);
      setLog((prev) => [...prev, `Handshake confirmed: ${data.socketId}`]);
    });

    socket.on("user-joined", (data) => {
      setLog((prev) => [...prev, `Another user joined: ${data.userId}`]);
    });

    socket.on("user-left", (data) => {
      setLog((prev) => [...prev, `User left: ${data.userId}`]);
    });

    socket.on("disconnect", () => {
      setStatus("Disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoin = () => {
    if (!socketRef.current) return;
    socketRef.current.emit("join-room", roomId);
    setJoined(true);
    setLog((prev) => [...prev, `You joined room: ${roomId}`]);
  };

  const handleLeave = () => {
    if (!socketRef.current) return;
    socketRef.current.emit("leave-room");
    setJoined(false);
    setLog((prev) => [...prev, `You left the room`]);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", color: "#fff", background: "#111", minHeight: "100vh" }}>
      <h1>SyncSpace Room Test</h1>
      <p>Status: <strong>{status}</strong></p>
      {socketId && <p>Socket ID: {socketId}</p>}

      <div style={{ margin: "1rem 0" }}>
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Room ID"
          style={{ padding: "0.5rem", marginRight: "0.5rem" }}
        />
        {!joined ? (
          <button onClick={handleJoin} style={{ padding: "0.5rem 1rem" }}>Join Room</button>
        ) : (
          <button onClick={handleLeave} style={{ padding: "0.5rem 1rem" }}>Leave Room</button>
        )}
      </div>

      <h3>Event Log:</h3>
      <ul>
        {log.map((entry, i) => (
          <li key={i}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}

export default RoomTest;