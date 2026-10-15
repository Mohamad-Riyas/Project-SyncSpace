/**
 * Real WebRTC audio (mesh) built on top of the server's signaling relay
 * (webrtc-offer / webrtc-answer / webrtc-ice-candidate / room-peers /
 * user-joined / user-left in server.js). The server never touches audio —
 * it only forwards SDP/ICE between socket IDs already in the same room.
 *
 * This is intentionally a small mesh (fine for 1:1 interviews / small rooms).
 * For larger rooms this would need an SFU, which is out of scope here.
 */
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export function createAudioMesh(socket, { onRemoteStream, onRemoteLeft, onMicState }) {
  const peers = new Map(); // socketId -> RTCPeerConnection
  let localStream = null;

  const createPeerConnection = (peerId) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peers.set(peerId, pc);

    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', { to: peerId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      onRemoteStream?.(peerId, event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        peers.delete(peerId);
        onRemoteLeft?.(peerId);
      }
    };

    return pc;
  };

  const callPeer = async (peerId) => {
    const pc = createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('webrtc-offer', { to: peerId, offer });
  };

  const handleOffer = async ({ from, offer }) => {
    const pc = createPeerConnection(from);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('webrtc-answer', { to: from, answer });
  };

  const handleAnswer = async ({ from, answer }) => {
    const pc = peers.get(from);
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleIceCandidate = async ({ from, candidate }) => {
    const pc = peers.get(from);
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('Failed to add ICE candidate:', err);
      }
    }
  };

  const handleRoomPeers = ({ peers: existingPeerIds }) => {
    existingPeerIds.forEach((peerId) => callPeer(peerId));
  };

  const handleUserJoined = () => {
    // The newcomer initiates offers to us via room-peers on their end;
    // nothing to do here.
  };

  const handleUserLeft = ({ userId }) => {
    const pc = peers.get(userId);
    if (pc) {
      pc.close();
      peers.delete(userId);
    }
    onRemoteLeft?.(userId);
  };

  const handleMicState = ({ userId, muted }) => {
    onMicState?.(userId, muted);
  };

  socket.on('webrtc-offer', handleOffer);
  socket.on('webrtc-answer', handleAnswer);
  socket.on('webrtc-ice-candidate', handleIceCandidate);
  socket.on('room-peers', handleRoomPeers);
  socket.on('user-joined', handleUserJoined);
  socket.on('user-left', handleUserLeft);
  socket.on('mic-state', handleMicState);

  return {
    async start() {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return localStream;
    },
    getLocalStream() {
      return localStream;
    },
    getRemoteStreams() {
      const streams = [];
      peers.forEach((pc, peerId) => {
        const receiver = pc.getReceivers().find((r) => r.track && r.track.kind === "audio");
        if (receiver?.track) streams.push({ peerId, stream: new MediaStream([receiver.track]) });
      });
      return streams;
    },
    setMuted(muted) {
      if (localStream) {
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = !muted;
        });
      }
      socket.emit('mic-state', { muted });
    },
    destroy() {
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.off('room-peers', handleRoomPeers);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('mic-state', handleMicState);
      peers.forEach((pc) => pc.close());
      peers.clear();
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
        localStream = null;
      }
    },
  };
}
