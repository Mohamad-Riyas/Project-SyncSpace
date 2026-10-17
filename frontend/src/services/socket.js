import { io } from 'socket.io-client';
import { getAccessToken } from '../api/client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Returns a singleton Socket.IO connection, authenticated with the current
 * JWT (if any) so the server can attach a real user identity to signaling
 * events (see server.js `io.use(...)`). Reused across Yjs rooms, the
 * whiteboard, chat, and WebRTC audio signaling rather than opening a new
 * socket per feature.
 */
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      auth: { token: getAccessToken() },
    });
  } else if (socket.auth?.token !== getAccessToken()) {
    socket.auth = { token: getAccessToken() };
    if (socket.connected) socket.disconnect();
    socket.connect();
  }
  return socket;
}
