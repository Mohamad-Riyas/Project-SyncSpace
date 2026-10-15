import { useCallback, useRef, useState } from 'react';
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
  const recorderRef = useRef(null);
  const recordingIdRef = useRef(null);
  const startedAtRef = useRef(null);
  const audioContextRef = useRef(null);
  const pendingRef = useRef([]);

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
      if (audioContextRef.current) {
        await audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!enabled || recording || !interviewId) return;
    setError('');
    try {
      if (!window.MediaRecorder) throw new Error('This browser does not support meeting recording.');
      const streams = audio?.getRecordingStreams?.() || {};
      if (!streams.localStream && !streams.remoteStreams?.length) {
        throw new Error('Microphone/audio connection is not ready yet.');
      }

      const mimeType =
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
          .find((type) => MediaRecorder.isTypeSupported(type)) || 'audio/webm';

      const { recording: remoteRecord } = await recordingsApi.start(interviewId, mimeType);
      recordingIdRef.current = remoteRecord.id;

      const context = new AudioContext();
      const destination = context.createMediaStreamDestination();
      audioContextRef.current = context;

      if (streams.localStream) {
        const source = context.createMediaStreamSource(streams.localStream);
        source.connect(destination);
      }
      for (const [, stream] of streams.remoteStreams || []) {
        try {
          const source = context.createMediaStreamSource(stream);
          source.connect(destination);
        } catch {
          // A remote peer can disappear between snapshot and connection.
        }
      }

      const recorder = new MediaRecorder(destination.stream, { mimeType });
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
      recorder.start(5000);
      setRecording(true);
    } catch (err) {
      setError(err.message || 'Could not start recording.');
      setRecording(false);
      recordingIdRef.current = null;
      if (audioContextRef.current) {
        await audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    }
  }, [audio, enabled, interviewId, recording]);

  return { recording, processing, error, startRecording, stopRecording };
}
