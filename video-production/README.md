# SyncSpace 45-second promo video pipeline

Free, local, no AI-video services. Python + Pillow/NumPy frames piped to the FFmpeg binary bundled in `imageio-ffmpeg` (no system FFmpeg needed). Real app footage is captured with Playwright.

## Setup (PowerShell, from `video-production/`)
```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m playwright install chromium
```

## Render the video (uses footage already in `footage/`)
```powershell
.\.venv\Scripts\python.exe render_video.py
```
Output: `output/syncspace.mp4` (1920x1080, 30 fps, H.264, 45.00 s).

Timeline: 0-5 intro, 5-14 whiteboard, 14-23 code editor, 23-35 shared rooms/guest/presence, 35-45 outro + credits.

## Use your own screen recordings
Drop files at `footage/user/whiteboard.mp4`, `code.mp4`, `collab_host.mp4` (.mov/.mkv/.webm also fine). They override the auto-recorded clips and are speed-fitted to their slots.

## Music (optional)
Put a royalty-free track (e.g. YouTube Audio Library, Pixabay) in `assets/music/`. It is faded in/out automatically.

## Credits
Create `credits.json` to override the name/subtitle/repo text shown in the outro (see `render_video.py`).

## Re-recording the real app footage
1. Backend: `cd ../backend; node server.js` (port 5000).
2. Second backend for Yjs: `$env:PORT=5001; node server.js` — the whiteboard hardcodes `http://localhost:5001` for Yjs sync (`frontend/src/components/Whiteboard.jsx`).
3. Frontend: `cd ../frontend; npm run dev` (port 5173).
4. Seed demo users/workspace: `node tools/seed_demo.js`, then put the credentials/invite code in `demo_config.json` (git-ignored).
5. `.\.venv\Scripts\python.exe record_footage.py [whiteboard|code|collab]`

## Honest notes
- Verified in the real app: whiteboard (live sync + cursors), Monaco editor with Run, invite-code rooms, guest access, online presence. Chat exists but is not demoed.
- Playwright records VP8, so footage is slightly soft; record your own with OBS/Win+G at 1080p for sharper results.
- Demo users/workspace "SyncSpace Demo" were created in the database used by the backend; delete them when done.

## Complete narrated demo
```powershell
.venv\Scripts\python.exe tools\make_narration.py
.venv\Scripts\python.exe record_complete.py   # needs backend 5000+5001 and Vite 5173 running
.venv\Scripts\python.exe render_complete.py   # ~10+ min, writes ..\demo-output\SyncSpace_Complete_Demo.mp4
```
