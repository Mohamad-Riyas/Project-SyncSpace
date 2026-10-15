import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from '../../../services/socket';
import { createAudioMesh } from '../../../services/webrtcAudioService';

/**
 * Real microphone + WebRTC audio for the interview workspace, integrated
 * with the existing Socket.IO room (join-room/leave-room) rather than a
 * second disconnected system. Joins `roomId`, negotiates peer connections
 * for everyone already in the room, and plays remote audio through hidden
 * <audio> elements it manages internally.
 *
 * connectionState: 'idle' | 'connecting' | 'connected' | 'error'
 */
export function useInterviewAudio(roomId) {
  const [connectionState, setConnectionState] = useState('idle');
  const [muted, setMuted] = useState(true);
  const [error, setError] = useState('');
  const [remotePeers, setRemotePeers] = useState([]); // [{ id, muted }]
  const remoteStreamsRef = useRef(new Map());
  const meshRef = useRef(null);
  const audioElsRef = useRef(new Map());

  const attachRemoteAudio = useCallback((peerId, stream) => {
    let el = audioElsRef.current.get(peerId);
    if (!el) {
      el = new Audio();
      el.autoplay = true;
      audioElsRef.current.set(peerId, el);
    }
    el.srcObject = stream;
    remoteStreamsRef.current.set(peerId, stream);
    setRemotePeers((prev) => (prev.some((p) => p.id === peerId) ? prev : [...prev, { id: peerId, muted: false }]));
  }, []);

  const detachRemoteAudio = useCallback((peerId) => {
    const el = audioElsRef.current.get(peerId);
    if (el) {
      el.srcObject = null;
      audioElsRef.current.delete(peerId);
    }
    remoteStreamsRef.current.delete(peerId);
    setRemotePeers((prev) => prev.filter((p) => p.id !== peerId));
  }, []);

  const setPeerMicState = useCallback((peerId, isMuted) => {
    setRemotePeers((prev) => prev.map((p) => (p.id === peerId ? { ...p, muted: isMuted } : p)));
  }, []);

  useEffect(() => {
    if (!roomId) return undefined;
    const socket = getSocket();
    const mesh = createAudioMesh(socket, {
      onRemoteStream: attachRemoteAudio,
      onRemoteLeft: detachRemoteAudio,
      onMicState: setPeerMicState,
    });
    meshRef.current = mesh;

    setConnectionState('connecting');
    socket.emit('join-room', roomId);

    mesh
      .start()
      .then(() => {
        mesh.setMuted(true); // start muted by default; the user opts in
        setConnectionState('connected');
      })
      .catch((err) => {
        setError(
          err.name === 'NotAllowedError'
            ? 'Microphone permission was denied.'
            : err.message || 'Could not start the microphone.'
        );
        setConnectionState('error');
      });

    return () => {
      mesh.destroy();
      socket.emit('leave-room');
      audioElsRef.current.forEach((el) => {
        el.srcObject = null;
      });
      audioElsRef.current.clear();
      remoteStreamsRef.current.clear();
      setRemotePeers([]);
      setConnectionState('idle');
    };
  }, [roomId, attachRemoteAudio, detachRemoteAudio, setPeerMicState]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      meshRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const getRecordingStreams = useCallback(() => {
    const local = meshRef.current?.getLocalStream?.() || null;
    const remotes = [...remoteStreamsRef.current.entries()];
    return { localStream: local, remoteStreams: remotes };
  }, []);

  return { connectionState, muted, toggleMute, error, remotePeers, getRecordingStreams };
}
