"""Generates an original 45s ambient-tech soundtrack (no external assets, royalty-free)."""
import wave
import numpy as np
from pathlib import Path

SR = 44100
DUR = 45.0
N = int(SR * DUR)
t = np.arange(N) / SR
out = np.zeros((2, N))

def note(f):
    return 440.0 * 2 ** ((f - 69) / 12)

# Am - F - C - G, 4 bars each ~ 5.6s (8 beats @ 85bpm)
BEAT = 60 / 85
chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
bar = BEAT * 4
for i in range(int(DUR / bar) + 1):
    ch = chords[i % 4]
    s, e = int(i * bar * SR), min(N, int((i + 1) * bar * SR))
    if s >= N:
        break
    tt = t[s:e] - t[s]
    env = np.minimum(1, tt / 0.8) * np.minimum(1, (tt[-1] - tt) / 0.8 + 0.0)
    env = np.clip(env, 0, 1)
    sig = np.zeros_like(tt)
    for n in ch:
        f = note(n)
        for d in (-0.4, 0.4):
            sig += np.sin(2 * np.pi * (f + d) * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)
    sig += 0.8 * np.sin(2 * np.pi * note(ch[0] - 12) * tt)
    sig *= env * 0.05
    out[0, s:e] += sig
    out[1, s:e] += sig

# arpeggio from 5s
step = BEAT / 2
k = 0
tm = 5.0
while tm < DUR - 1:
    ch = chords[int(tm // bar) % 4]
    n = ch[k % 3] + 12 * (1 + (k // 3) % 2)
    s = int(tm * SR)
    L = int(0.45 * SR)
    e = min(N, s + L)
    tt = np.arange(e - s) / SR
    sig = np.sin(2 * np.pi * note(n) * tt) * np.exp(-tt * 7) * 0.09
    pan = 0.3 + 0.4 * ((k % 4) / 3)
    out[0, s:e] += sig * (1 - pan)
    out[1, s:e] += sig * pan
    tm += step
    k += 1

# soft kick from 5s to 36s, and 36-45 sparse
tm = 5.0
while tm < 43:
    s = int(tm * SR)
    e = min(N, s + int(0.3 * SR))
    tt = np.arange(e - s) / SR
    f = 120 * np.exp(-tt * 18) + 45
    kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 10) * 0.35
    out[:, s:e] += kick
    tm += BEAT

# simple echo for space
d = int(0.375 * SR)
out[:, d:] += 0.25 * out[:, :-d]

# fades and normalise
fade_in, fade_out = int(2 * SR), int(4 * SR)
out[:, :fade_in] *= np.linspace(0, 1, fade_in)
out[:, -fade_out:] *= np.linspace(1, 0, fade_out)
out *= 0.8 / np.abs(out).max()

pcm = (out.T * 32767).astype("<i2")
dest = Path(__file__).resolve().parent.parent / "assets" / "music"
dest.mkdir(parents=True, exist_ok=True)
with wave.open(str(dest / "syncspace_original.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("ok")
