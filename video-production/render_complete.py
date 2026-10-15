"""Render the complete narrated SyncSpace demo -> demo-output/SyncSpace_Complete_Demo.mp4"""
import json, subprocess, wave
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import render_video as R

W, H, FPS = R.W, R.H, R.FPS
OUT_DIR = R.ROOT.parent / "demo-output"
FOOT = OUT_DIR / "footage"
AUD = OUT_DIR / "audio"
OFF = json.load(open(FOOT / "offsets.json"))
DUR = json.load(open(AUD / "durations.json"))
FF = R.FFMPEG
PAD = 0.9      # seconds of tail after each narration
LEAD = 0.5     # narration starts this long after scene start
XF = 0.4       # fade in/out

R.CAPTIONS.update({
    "auth": ("Secure Authentication", "Register, verify email and sign in"),
    "dash": ("Personal Dashboard", "Workspaces, activity and quick actions"),
    "rbac": ("Role-Based Access Control", "Standard users are blocked from the admin console"),
    "code": ("Live Code Editor", "Monaco editor with run output"),
    "panels": ("Team Panels", "Users, history and settings"),
    "account": ("Account & Activity", "Interviews, history and profile"),
})

SCENES = ["intro", "auth", "dash", "rbac", "sync", "code", "panels", "account", "outro"]
LEN = {s: DUR[s] + LEAD + PAD for s in SCENES}


def reader(name, start, length):
    """Yield `length` seconds of 1080p frames, freezing the last frame if short."""
    n = int(round(length * FPS))
    cmd = [FF, "-v", "error", "-ss", f"{start:.2f}", "-i", str(FOOT / f"{name}.webm"),
           "-vf", f"fps={FPS},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    last = None
    for _ in range(n):
        buf = p.stdout.read(W * H * 3) if p.stdout else b""
        if len(buf) == W * H * 3:
            last = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        if last is None:
            last = np.zeros((H, W, 3), np.uint8)
        yield last
    p.stdout.close()
    p.kill()


def scene_sync(t, dur, fa, fb):
    img = R.background(t + 20)
    pw, ph = 930, 523
    y0 = 250
    xs = [(W - 2 * pw - 40) // 2, (W - 2 * pw - 40) // 2 + pw + 40]
    for x, fr, label in zip(xs, (fa, fb), ("User One", "User Two")):
        glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(glow).rounded_rectangle([x - 6, y0 - 6, x + pw + 6, y0 + ph + 6], 18, fill=(*R.VIOLET, 130))
        img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(26)))
        shot = Image.fromarray(fr).resize((pw, ph), Image.LANCZOS).convert("RGBA")
        m = Image.new("L", (pw, ph), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, pw - 1, ph - 1], 14, fill=255)
        img.paste(shot, (x, y0), m)
        d = ImageDraw.Draw(img)
        d.rounded_rectangle([x, y0, x + pw, y0 + ph], 14, outline=(*R.BLUE, 255), width=2)
        R.text_c(img, (x + pw / 2, y0 + ph + 50), label, R.font(34, "bold"), R.WHITE, 1)
    a = R.seg_p(t, 0.3, 0.6)
    R.text_c(img, (W / 2, 110), "Real-Time Whiteboard Sync", R.font(64, "bold"), R.WHITE, a)
    R.text_c(img, (W / 2, 175), "Two separate sessions, drawing syncs both ways with no refresh",
             R.font(30, "light"), R.MUTED, a)
    R.text_c(img, (W / 2, 950), "Live cursors and presence avatars  |  Socket.IO + Yjs",
             R.font(28, "regular"), R.BLUE, R.seg_p(t, 1.5, 0.8))
    return img


def frames():
    for s in SCENES:
        L = LEN[s]
        n = int(round(L * FPS))
        if s == "sync":
            ga = reader("sync_a", OFF["sync_a"] + 6, L)
            gb = reader("sync_b", OFF["sync_b"] + 6, L)
            gen = ((scene_sync(i / FPS, L, a, b)) for i, (a, b) in enumerate(zip(ga, gb)))
        elif s in ("intro", "outro"):
            fn = R.scene_intro if s == "intro" else R.scene_outro
            gen = (fn(i / FPS) for i in range(n))
        else:
            g = reader(s, OFF[s], L)
            gen = (R.scene_footage(i / FPS, L, fr, s) for i, fr in enumerate(g))
        for i, img in enumerate(gen):
            arr = np.asarray(img.convert("RGB"), np.float32)
            t = i / FPS
            f = min(1.0, t / XF, (L - t) / XF)
            if s == "intro":
                f = min(1.0, (L - t) / XF)
            if s == "outro":
                f = min(1.0, t / XF, (L - t) / 1.5)
            f = max(0.0, f)
            if f < 1:
                arr = arr * f + np.array(R.NAVY, np.float32) * (1 - f)
            yield arr.astype(np.uint8).tobytes()
        print("scene done", s, flush=True)


def load_wav(p):
    with wave.open(str(p)) as w:
        ch, sr = w.getnchannels(), w.getframerate()
        d = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    d = d.reshape(-1, ch).mean(1) if ch > 1 else d
    return np.interp(np.arange(0, len(d) * 44100 / sr) * sr / 44100, np.arange(len(d)), d)


def build_audio(total):
    sr = 44100
    n = int(total * sr)
    mus = load_wav(R.MUSIC_DIR / "syncspace_original.wav")
    mus = np.tile(mus, int(n / len(mus)) + 1)[:n]
    mus *= 0.07
    fade = int(2 * sr)
    mus[-fade:] *= np.linspace(1, 0, fade)
    voice = np.zeros(n, np.float32)
    t0 = 0.0
    for s in SCENES:
        v = load_wav(AUD / f"{s}.wav")
        a = int((t0 + LEAD) * sr)
        voice[a:a + len(v)] += v[:n - a]
        t0 += LEN[s]
    peak = np.abs(voice).max() or 1
    voice *= 0.9 / peak
    mix = np.clip(mus + voice, -1, 1)
    out = OUT_DIR / "_mix.wav"
    with wave.open(str(out), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    return out


def main():
    total = sum(LEN.values())
    wav = build_audio(total)
    out = OUT_DIR / "SyncSpace_Complete_Demo.mp4"
    cmd = [FF, "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-i", str(wav), "-c:v", "libx264", "-crf", "17", "-preset", "medium",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
           "-shortest", "-movflags", "+faststart", str(out)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for b in frames():
        p.stdin.write(b)
    p.stdin.close()
    p.wait()
    print("DONE", out, f"{total:.1f}s")


if __name__ == "__main__":
    main()
