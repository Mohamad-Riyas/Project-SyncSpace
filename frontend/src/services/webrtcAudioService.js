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

export function createAudioMesh(socket, { onRemoteStream, onRemoteLeft, onMicState, onModeratorMute }) {
  const peers = new Map(); // socketId -> RTCPeerConnection
  const remoteStreams = new Map(); // socketId -> combined audio/video stream
  const pendingPeers = new Set();
  let localStream = null;
  let cameraStream = null;

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
    pc.onnegotiationneeded = async () => {
      if (!pc.remoteDescription || pc.signalingState !== 'stable') return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { to: peerId, offer: pc.localDescription });
      } catch (err) {
        console.error('Could not renegotiate interview media:', err);
      }
    };

    pc.ontrack = (event) => {
      let stream = remoteStreams.get(peerId);
      if (!stream) {
        stream = new MediaStream();
        remoteStreams.set(peerId, stream);
      }
      if (!stream.getTracks().some((track) => track.id === event.track.id)) {
        stream.addTrack(event.track);
        event.track.addEventListener('ended', () => {
          stream.removeTrack(event.track);
          onRemoteStream?.(peerId, stream);
        }, { once: true });
      }
      onRemoteStream?.(peerId, stream);
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        peers.delete(peerId);
        remoteStreams.delete(peerId);
        onRemoteLeft?.(peerId);
      }
    };

    return pc;
  };

  const callPeer = async (peerId) => {
    if (!localStream) {
      pendingPeers.add(peerId);
      return;
    }
    pendingPeers.delete(peerId);
    const pc = peers.get(peerId) || createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('webrtc-offer', { to: peerId, offer });
  };

  const handleOffer = async ({ from, offer }) => {
    const pc = peers.get(from) || createPeerConnection(from);
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
    remoteStreams.delete(userId);
    onRemoteLeft?.(userId);
  };

  const handleMicState = ({ userId, muted }) => {
    onMicState?.(userId, muted);
  };
  const handleModeratorMute = () => onModeratorMute?.();

  socket.on('webrtc-offer', handleOffer);
  socket.on('webrtc-answer', handleAnswer);
  socket.on('webrtc-ice-candidate', handleIceCandidate);
  socket.on('room-peers', handleRoomPeers);
  socket.on('user-joined', handleUserJoined);
  socket.on('user-left', handleUserLeft);
  socket.on('mic-state', handleMicState);
  socket.on('moderator-mute', handleModeratorMute);

  return {
    async start() {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const peersToCall = [...pendingPeers];
      await Promise.all(peersToCall.map((peerId) => callPeer(peerId)));
      return localStream;
    },
    async toggleCamera() {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        cameraStream = null;
        peers.forEach((pc) => pc.getSenders().filter((sender) => sender.track?.kind === 'video').forEach((sender) => pc.removeTrack(sender)));
        return null;
      }
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      peers.forEach((pc) => cameraStream.getTracks().forEach((track) => pc.addTrack(track, cameraStream)));
      return cameraStream;
    },
    getCameraStream() {
      return cameraStream;
    },
    getLocalStream() {
      return localStream;
    },
    getRemoteStreams() {
      return [...remoteStreams.entries()].map(([peerId, stream]) => ({ peerId, stream }));
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
      socket.off('moderator-mute', handleModeratorMute);
      peers.forEach((pc) => pc.close());
      peers.clear();
      remoteStreams.clear();
      pendingPeers.clear();
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
        localStream = null;
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        cameraStream = null;
      }
    },
  };
}
