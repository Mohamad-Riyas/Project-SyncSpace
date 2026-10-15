import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Real microphone permission + live level check, used on the pre-join screen.
 * Requests getUserMedia, then uses an AnalyserNode to show an actual live
 * input level meter (not a fake animation) so the candidate can confirm
 * their mic is picking up sound before joining.
 */
export function useMicrophoneCheck() {
  const [permission, setPermission] = useState('prompt'); // prompt | granted | denied | unsupported
  const [level, setLevel] = useState(0);
  const [error, setError] = useState('');
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission('unsupported');
      setError('This browser does not support microphone access.');
      return null;
    }
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermission('granted');

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
        setLevel(Math.min(1, avg / 100));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      return stream;
    } catch (err) {
      setPermission('denied');
      setError(
        err.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please allow it in your browser settings and retry.'
          : err.message || 'Could not access the microphone.'
      );
      return null;
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { permission, level, error, start, stop, getStream: () => streamRef.current };
}
