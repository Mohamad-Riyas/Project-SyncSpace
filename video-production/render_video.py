"""Render the 45s SyncSpace promo (1920x1080, 30 FPS, H.264 MP4).

Intro/outro/captions are drawn programmatically (Pillow + NumPy); product
sections are real footage from footage/*.webm (or your own recordings in
footage/user/). Frames are piped to the FFmpeg binary bundled with imageio-ffmpeg.

    python render_video.py            # -> output/syncspace.mp4
"""
import json
import math
import re
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).parent
FOOT = ROOT / "footage"
USER_FOOT = FOOT / "user"
MUSIC_DIR = ROOT / "assets" / "music"
OUT = ROOT / "output" / "syncspace.mp4"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

W, H, FPS = 1920, 1080, 30
NAVY = (7, 11, 26)
BLUE = (56, 140, 255)
VIOLET = (139, 92, 246)
WHITE = (240, 244, 255)
MUTED = (150, 162, 195)

DEFAULT_CREDITS = {
    "title": "SyncSpace",
    "tagline": "Code. Draw. Collaborate, in real time.",
    "built_by": "Built by Nivo",
    "context": "Axlero Internship Project, 2026",
    "repo": "github.com/Nivo16/SyncSpace_Workplace_AxleroProject1",
    "tech": ["React", "Konva.js", "Monaco Editor", "Socket.IO", "Yjs", "Node.js", "MongoDB"],
}
credits_file = ROOT / "credits.json"
CREDITS = {**DEFAULT_CREDITS, **(json.loads(credits_file.read_text("utf-8")) if credits_file.exists() else {})}

SEGMENTS = [  # name, start, end, footage key
    ("intro", 0, 5, None),
    ("whiteboard", 5, 14, "whiteboard"),
    ("code", 14, 23, "code"),
    ("collab", 23, 35, "collab_host"),
    ("outro", 35, 45, None),
]
CAPTIONS = {
    "whiteboard": ("Real-time collaborative whiteboard", "Pen, shapes, text, undo and redo"),
    "code": ("Browser-based code editor", "Write and run code right in the workspace"),
    "collab": ("Shared rooms with guest access", "Invite anyone with a code and see who is online"),
}


def font(size, weight="regular"):
    names = {
        "bold": ["segoeuib.ttf", "arialbd.ttf"],
        "light": ["segoeuil.ttf", "segoeui.ttf", "arial.ttf"],
        "regular": ["segoeui.ttf", "arial.ttf"],
    }[weight]
    for n in names:
        try:
            return ImageFont.truetype(n, size)
        except OSError:
            pass
    return ImageFont.load_default()


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


def seg_p(t, start, dur):
    return ease((t - start) / dur)


# ---------- background ----------
def make_bg():
    pad = 300
    bw, bh = W + 2 * pad, H + 2 * pad
    base = np.zeros((bh, bw, 3), np.float32)
    base[:] = NAVY
    yy, xx = np.mgrid[0:bh, 0:bw].astype(np.float32)
    for cx, cy, r, col, a in [
        (0.25, 0.3, 0.55, BLUE, 0.35),
        (0.8, 0.75, 0.6, VIOLET, 0.38),
        (0.55, 0.05, 0.35, BLUE, 0.15),
    ]:
        d = np.sqrt((xx - cx * bw) ** 2 + (yy - cy * bh) ** 2) / (r * bw / 2)
        g = np.clip(1 - d, 0, 1) ** 2 * a
        for i in range(3):
            base[..., i] += g * col[i]
    return np.clip(base, 0, 255).astype(np.uint8), pad


BG, PAD = make_bg()
RNG = np.random.default_rng(7)
PARTS = RNG.random((70, 4))  # x, y, speed, size


def background(t):
    ox = int(PAD + math.sin(t * 0.35) * 120)
    oy = int(PAD + math.cos(t * 0.27) * 90)
    img = Image.fromarray(BG[oy:oy + H, ox:ox + W]).convert("RGBA")
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    pts = []
    for x, y, s, z in PARTS:
        px = (x * W + t * 14 * (0.4 + s)) % W
        py = (y * H - t * 22 * (0.4 + s)) % H
        pts.append((px, py))
        r = 1.5 + z * 2.5
        d.ellipse([px - r, py - r, px + r, py + r], fill=(160, 190, 255, int(60 + 90 * s)))
    for i in range(len(pts)):
        for j in range(i + 1, min(i + 6, len(pts))):
            dist = math.dist(pts[i], pts[j])
            if dist < 210:
                d.line([pts[i], pts[j]], fill=(110, 140, 255, int(50 * (1 - dist / 210))), width=1)
    return Image.alpha_composite(img, layer)


def text_c(img, xy, s, f, fill, alpha=1.0, anchor="mm"):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).text(xy, s, font=f, fill=(*fill, int(255 * alpha)), anchor=anchor)
    img.alpha_composite(layer)


def glow_text(img, xy, s, f, alpha=1.0):
    g = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(g).text(xy, s, font=f, fill=(*BLUE, int(200 * alpha)), anchor="mm")
    img.alpha_composite(g.filter(ImageFilter.GaussianBlur(22)))
    text_c(img, xy, s, f, WHITE, alpha)


def logo(img, cx, cy, size, p):
    """Original mark: two interlocking rounded squares (blue + violet)."""
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    s = size * ease(p)
    off = s * 0.22
    r = s * 0.28
    d.rounded_rectangle([cx - s / 2 - off, cy - s / 2 - off, cx + s / 2 - off, cy + s / 2 - off],
                        r, outline=(*BLUE, 255), width=max(2, int(size * 0.07)))
    d.rounded_rectangle([cx - s / 2 + off, cy - s / 2 + off, cx + s / 2 + off, cy + s / 2 + off],
                        r, outline=(*VIOLET, 255), width=max(2, int(size * 0.07)))
    glow = layer.filter(ImageFilter.GaussianBlur(18))
    img.alpha_composite(glow)
    img.alpha_composite(layer)


# ---------- scenes ----------
def scene_intro(t):
    img = background(t)
    p_logo = seg_p(t, 0.2, 1.2)
    logo(img, W / 2, 400 - 20 * (1 - p_logo), 190, p_logo)
    glow_text(img, (W / 2, 640 + 20 * (1 - seg_p(t, 1.0, 1.2))), CREDITS["title"], font(150, "bold"),
              alpha=seg_p(t, 1.0, 1.2))
    sub_a = seg_p(t, 2.4, 1.0)
    text_c(img, (W / 2, 760 + 14 * (1 - sub_a)), CREDITS["tagline"], font(46, "light"), MUTED, sub_a)
    # accent line
    la = seg_p(t, 2.0, 1.2)
    d = ImageDraw.Draw(img)
    half = 260 * la
    d.line([(W / 2 - half, 815), (W / 2 + half, 815)], fill=(*VIOLET, 255), width=3)
    chip_a = seg_p(t, 3.4, 0.9)
    text_c(img, (W / 2, 880), "PRODUCT SHOWCASE  |  2026", font(26, "regular"), BLUE, chip_a)
    return img


def scene_outro(t):
    img = background(t + 30)
    p = seg_p(t, 0.1, 1.0)
    logo(img, W / 2, 230, 120, p)
    glow_text(img, (W / 2, 390), CREDITS["title"], font(120, "bold"), alpha=seg_p(t, 0.3, 1.0))
    text_c(img, (W / 2, 495), CREDITS["tagline"], font(40, "light"), MUTED, seg_p(t, 0.8, 1.0))
    # tech chips
    chips = CREDITS["tech"]
    f = font(28, "regular")
    widths = [int(ImageDraw.Draw(img).textlength(c, font=f)) + 56 for c in chips]
    total = sum(widths) + 18 * (len(chips) - 1)
    x = W / 2 - total / 2
    for i, (c, w) in enumerate(zip(chips, widths)):
        a = seg_p(t, 1.6 + i * 0.18, 0.7)
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        dd = ImageDraw.Draw(layer)
        y = 590 + 14 * (1 - a)
        dd.rounded_rectangle([x, y - 30, x + w, y + 30], 30, fill=(30, 40, 90, int(170 * a)),
                             outline=(*BLUE, int(200 * a)), width=2)
        dd.text((x + w / 2, y), c, font=f, fill=(*WHITE, int(255 * a)), anchor="mm")
        img.alpha_composite(layer)
        x += w + 18
    text_c(img, (W / 2, 750), CREDITS["built_by"], font(54, "bold"), WHITE, seg_p(t, 3.4, 0.9))
    text_c(img, (W / 2, 820), CREDITS["context"], font(34, "light"), MUTED, seg_p(t, 3.9, 0.9))
    text_c(img, (W / 2, 930), CREDITS["repo"], font(30, "regular"), BLUE, seg_p(t, 4.6, 0.9))
    return img


def scene_footage(t, dur, frame, key):
    img = background(t + 10)
    # product window with glow, slight zoom-in
    z = 0.86 + 0.02 * ease(t / dur)
    fw, fh = int(W * z), int(H * z)
    shot = Image.fromarray(frame).resize((fw, fh), Image.LANCZOS)
    x0, y0 = (W - fw) // 2, 70 + (H - 70 - fh) // 2 - 20
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(glow).rounded_rectangle([x0 - 6, y0 - 6, x0 + fw + 6, y0 + fh + 6], 22, fill=(*VIOLET, 140))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(30)))
    m = Image.new("L", (fw, fh), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, fw - 1, fh - 1], 18, fill=255)
    img.paste(shot.convert("RGBA"), (x0, y0), m)
    ImageDraw.Draw(img).rounded_rectangle([x0, y0, x0 + fw, y0 + fh], 18, outline=(*BLUE, 255), width=2)
    # caption pill
    head, sub = CAPTIONS[key]
    a = seg_p(t, 0.3, 0.6)
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    dd = ImageDraw.Draw(layer)
    fh1, fh2 = font(38, "bold"), font(24, "regular")
    wd = int(max(dd.textlength(head, font=fh1), dd.textlength(sub, font=fh2))) + 90
    cx, cy = W / 2, 44 - 12 * (1 - a)
    dd.rounded_rectangle([cx - wd / 2, cy - 36, cx + wd / 2, cy + 62], 40,
                         fill=(10, 15, 40, int(235 * a)), outline=(*BLUE, int(255 * a)), width=2)
    dd.text((cx, cy - 4), head, font=fh1, fill=(*WHITE, int(255 * a)), anchor="mm")
    dd.text((cx, cy + 34), sub, font=fh2, fill=(*MUTED, int(255 * a)), anchor="mm")
    img.alpha_composite(layer)
    return img


# ---------- footage decoding ----------
def probe_duration(path):
    r = subprocess.run([FFMPEG, "-i", str(path)], capture_output=True, text=True)
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", r.stderr)
    if m:
        return int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3])
    r = subprocess.run([FFMPEG, "-i", str(path), "-f", "null", "-"], capture_output=True, text=True)
    times = re.findall(r"time=(\d+):(\d+):(\d+\.\d+)", r.stderr)
    if not times:
        raise RuntimeError(f"Unreadable footage: {path}. Re-record it with record_footage.py.")
    h, mi, s = times[-1]
    return int(h) * 3600 + int(mi) * 60 + float(s)


def find_footage(key):
    for ext in ("mp4", "mov", "mkv", "webm"):
        p = USER_FOOT / f"{key}.{ext}"
        if p.exists():
            return p, 0.0, True
    p = FOOT / f"{key}.webm"
    if not p.exists():
        sys.exit(f"Missing footage: {p}. Run record_footage.py or put your own clip at {USER_FOOT}/{key}.mp4")
    offsets = json.loads((FOOT / "offsets.json").read_text())
    return p, float(offsets.get(key, 0.0)), False


def footage_frames(key, slot):
    path, offset, user = find_footage(key)
    total = probe_duration(path) - offset - (0.0 if user else 0.3)
    speed = max(total / slot, 0.5)  # >1 speeds the clip up to fit the slot
    print(f"  {key}: {path.name} usable {total:.1f}s -> {slot}s (x{speed:.2f})")
    vf = (f"setpts=(PTS-STARTPTS)/{speed:.5f},fps={FPS},scale={W}:{H}:flags=lanczos,"
          f"tpad=stop_mode=clone:stop_duration={slot}")
    cmd = [FFMPEG, "-v", "error", "-ss", f"{offset:.2f}", "-i", str(path), "-vf", vf,
           "-frames:v", str(int(slot * FPS)), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    size = W * H * 3
    last = None
    for _ in range(int(slot * FPS)):
        buf = proc.stdout.read(size)
        if len(buf) < size:
            buf = last if last is not None else bytes(size)
        last = buf
        yield np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    proc.stdout.close()
    proc.wait()


# ---------- main ----------
def fade_factor(lt, dur, fin=0.35, fout=0.35, first=False, last=False):
    f = 1.0
    if not first and lt < fin:
        f = min(f, lt / fin)
    if not last and lt > dur - fout:
        f = min(f, (dur - lt) / fout)
    return f


def sweep(img, lt, dur):
    """Light sweep at the start of each scene change."""
    if lt > 0.6:
        return
    x = int(-300 + (W + 600) * (lt / 0.6))
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).polygon([(x, 0), (x + 120, 0), (x - 80, H), (x - 200, H)], fill=(*BLUE, 70))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(25)))


def pick_music():
    if MUSIC_DIR.exists():
        for p in sorted(MUSIC_DIR.iterdir()):
            if p.suffix.lower() in (".mp3", ".wav", ".m4a", ".ogg", ".flac"):
                return p
    return None


def main():
    OUT.parent.mkdir(exist_ok=True)
    music = pick_music()
    cmd = [FFMPEG, "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-"]
    if music:
        print("music:", music.name)
        cmd += ["-i", str(music), "-af", "afade=t=in:d=1.5,afade=t=out:st=42.5:d=2.5,volume=0.6",
                "-c:a", "aac", "-b:a", "192k", "-shortest"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
            "-r", str(FPS), "-movflags", "+faststart", "-t", "45", str(OUT)]
    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    navy = Image.new("RGBA", (W, H), (*NAVY, 255))
    for si, (name, s, e, key) in enumerate(SEGMENTS):
        dur = e - s
        print(f"rendering {name} ({dur}s)")
        frames = footage_frames(key, dur) if key else None
        for i in range(dur * FPS):
            lt = i / FPS
            if name == "intro":
                img = scene_intro(lt)
            elif name == "outro":
                img = scene_outro(lt)
            else:
                img = scene_footage(lt, dur, next(frames), name)
            if si > 0:
                sweep(img, lt, dur)
            f = fade_factor(lt, dur, first=si == 0, last=si == len(SEGMENTS) - 1)
            if f < 1.0:
                img = Image.blend(navy, img, f)
            enc.stdin.write(img.convert("RGB").tobytes())
    enc.stdin.close()
    code = enc.wait()
    if code != 0:
        sys.exit(f"ffmpeg failed with exit code {code}")
    print("done:", OUT)


if __name__ == "__main__":
    main()
