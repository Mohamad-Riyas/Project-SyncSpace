import { useCallback, useEffect, useRef, useState } from 'react';
import { recordingsApi } from '../../../api/client';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const value = String(reader.result || '');
      resolve(value.includes(',') ? value.split(',')[1] : value);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useInterviewRecording(interviewId, audio, enabled = true) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const recorderRef = useRef(null);
  const recordingIdRef = useRef(null);
  const startedAtRef = useRef(null);
  const audioContextRef = useRef(null);
  const displayStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const pendingRef = useRef([]);

  const cleanupCapture = useCallback(async () => {
    window.cancelAnimationFrame(animationFrameRef.current);
    displayStreamRef.current?.getTracks().forEach((track) => track.stop());
    displayStreamRef.current = null;
    if (audioContextRef.current) {
      await audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    setProcessing(true);
    await new Promise((resolve) => {
      recorder.addEventListener('stop', resolve, { once: true });
      recorder.stop();
    });
    try {
      await Promise.all(pendingRef.current);
      const duration = startedAtRef.current ? (Date.now() - startedAtRef.current) / 1000 : 0;
      await recordingsApi.finalize(recordingIdRef.current, duration);
      setRecording(false);
    } catch (err) {
      setError(err.message || 'Could not save the recording.');
    } finally {
      recorderRef.current = null;
      recordingIdRef.current = null;
      pendingRef.current = [];
      setProcessing(false);
      await cleanupCapture();
    }
  }, [cleanupCapture]);

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') void stopRecording();
    else void cleanupCapture();
  }, [cleanupCapture, stopRecording]);

  const startRecording = useCallback(async () => {
    if (!enabled || recording || !interviewId) return;
    setError('');
    setNotice('');
    try {
      if (!window.MediaRecorder) {
        throw new Error('Video recording is not supported by this browser. Try the latest version of Chrome, Edge, or Firefox.');
      }
      const streams = audio?.getRecordingStreams?.() || {};
      if (!streams.localStream && !streams.remoteStreams?.length) {
        throw new Error('Microphone/audio connection is not ready yet.');
      }

      const canShareScreen = typeof navigator.mediaDevices?.getDisplayMedia === 'function';
      if (!canShareScreen && typeof navigator.mediaDevices?.getUserMedia !== 'function') {
        throw new Error('This browser cannot capture a screen or camera. Open SyncSpace in a supported desktop browser over HTTPS or localhost.');
      }
      const displayStream = canShareScreen
        ? await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 15, max: 24 } },
          audio: true,
        })
        : await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      displayStreamRef.current = displayStream;
      if (!canShareScreen) {
        setNotice('Screen capture is unavailable in this browser. Recording participant camera video and meeting audio instead.');
      }

      const mimeType = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm',
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
      ].find((type) => MediaRecorder.isTypeSupported?.(type));
      if (!mimeType) throw new Error('This browser cannot encode the requested video recording format.');

      const { recording: remoteRecord } = await recordingsApi.start(interviewId, mimeType);
      recordingIdRef.current = remoteRecord.id;

      const captureVideo = document.createElement('video');
      captureVideo.srcObject = displayStream;
      captureVideo.muted = true;
      captureVideo.playsInline = true;
      await captureVideo.play();

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not prepare the video recording canvas.');

      const cameraStreams = [...(canShareScreen ? [streams.localCameraStream] : []), ...(streams.remoteStreams || []).map(([, stream]) => stream)]
        .filter((stream) => stream?.getVideoTracks().some((track) => track.readyState === 'live'));
      const cameraVideos = cameraStreams.map((stream) => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.play().catch((err) => console.warn('Could not preview a camera stream in the recording:', err));
        return video;
      });

      const drawFrame = () => {
        if (captureVideo.videoWidth && captureVideo.videoHeight) {
          const scale = Math.max(canvas.width / captureVideo.videoWidth, canvas.height / captureVideo.videoHeight);
          const width = captureVideo.videoWidth * scale;
          const height = captureVideo.videoHeight * scale;
          context.drawImage(captureVideo, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        } else {
          context.fillStyle = '#0f172a';
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        cameraVideos.forEach((video, index) => {
          if (!video.videoWidth || !video.videoHeight) return;
          const tileWidth = 240;
          const tileHeight = 135;
          const x = canvas.width - tileWidth - 24;
          const y = canvas.height - (cameraVideos.length - index) * (tileHeight + 12) - 20;
          context.fillStyle = 'rgba(15, 23, 42, 0.85)';
          context.fillRect(x - 3, y - 3, tileWidth + 6, tileHeight + 6);
          context.drawImage(video, x, y, tileWidth, tileHeight);
        });
        animationFrameRef.current = window.requestAnimationFrame(drawFrame);
      };
      drawFrame();

      const outputStream = canvas.captureStream(15);
      const audioContext = new AudioContext();
      const audioDestination = audioContext.createMediaStreamDestination();
      audioContextRef.current = audioContext;
      const audioStreams = [
        streams.localStream,
        ...((streams.remoteStreams || []).map(([, stream]) => stream)),
        ...(canShareScreen ? [displayStream] : []),
      ];
      audioStreams.forEach((stream) => {
        if (!stream?.getAudioTracks().length) return;
        const audioOnlyStream = new MediaStream(stream.getAudioTracks());
        audioContext.createMediaStreamSource(audioOnlyStream).connect(audioDestination);
      });
      audioDestination.stream.getAudioTracks().forEach((track) => outputStream.addTrack(track));

      const recorder = new MediaRecorder(outputStream, { mimeType });
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      pendingRef.current = [];
      recorder.ondataavailable = (event) => {
        if (!event.data || event.data.size === 0 || !recordingIdRef.current) return;
        const task = blobToBase64(event.data)
          .then((base64) => recordingsApi.chunk(recordingIdRef.current, base64))
          .catch((err) => setError(err.message || 'A recording chunk failed.'));
        pendingRef.current.push(task);
      };
      recorder.onerror = () => setError('The browser stopped the recording unexpectedly.');
      recorder.start(1000);
      setRecording(true);
      if (canShareScreen) displayStream.getVideoTracks()[0]?.addEventListener('ended', stopRecording, { once: true });
    } catch (err) {
      setError(err.message || 'Could not start recording.');
      setRecording(false);
      const failedRecordingId = recordingIdRef.current;
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.ondataavailable = null;
        recorderRef.current.stop();
      }
      recordingIdRef.current = null;
      recorderRef.current = null;
      await cleanupCapture();
      if (failedRecordingId) {
        try {
          await recordingsApi.discard(failedRecordingId);
        } catch (cleanupError) {
          console.error('Could not discard the incomplete recording:', cleanupError);
        }
      }
    }
  }, [audio, cleanupCapture, enabled, interviewId, recording, stopRecording]);

  return { recording, processing, error, notice, startRecording, stopRecording };
}
