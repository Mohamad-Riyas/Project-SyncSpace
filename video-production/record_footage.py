"""Record real SyncSpace footage with Playwright (Chromium, 1920x1080).

Requires the SyncSpace backend (port 5000) and frontend (port 5173) running,
plus the demo data from tools/seed_demo.js. Writes footage/*.webm and
footage/offsets.json (seconds to skip at the start of each clip).
"""
import json
import math
import shutil
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent
FOOT = ROOT / "footage"
TMP = ROOT / "output" / "_rec"
BASE = "http://localhost:5173"
CFG = json.loads((ROOT / "demo_config.json").read_text())
W, H = 1920, 1080

CURSOR_JS = """
(() => {
  const mk = () => {
    if (document.getElementById('__cur')) return;
    const c = document.createElement('div');
    c.id = '__cur';
    c.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;width:26px;height:26px;'
      + 'left:-50px;top:-50px;transition:transform .05s;';
    c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M3 2l7 19 2.5-7.5L20 11z" '
      + 'fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(c);
  };
  window.addEventListener('mousemove', e => { mk();
    const c = document.getElementById('__cur'); c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
})();
"""


def login_state(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": W, "height": H})
    pg = ctx.new_page()
    pg.goto(f"{BASE}/login")
    pg.fill('input[type="email"]', CFG["host_email"])
    pg.fill('input[type="password"]', CFG["password"])
    pg.click(".login-button")
    pg.wait_for_url("**/dashboard", timeout=30000)
    pg.wait_for_timeout(1500)
    if pg.get_by_text("Skip for now").count():
        pg.get_by_text("Skip for now").click()
        pg.wait_for_timeout(500)
    state = ctx.storage_state()
    b.close()
    return state


def new_ctx(browser, state=None, record=True, tag="clip"):
    kw = dict(viewport={"width": W, "height": H})
    if state:
        kw["storage_state"] = state
    if record:
        kw["record_video_dir"] = str(TMP / tag)
        kw["record_video_size"] = {"width": W, "height": H}
    ctx = browser.new_context(**kw)
    ctx.add_init_script(CURSOR_JS)
    return ctx


def glide(pg, x, y, steps=28):
    pg.mouse.move(x, y, steps=steps)


def draw(pg, pts, steps=6):
    glide(pg, *pts[0], steps=24)
    pg.mouse.down()
    for x, y in pts[1:]:
        pg.mouse.move(x, y, steps=steps)
    pg.mouse.up()


def circle_pts(cx, cy, r, n=40):
    return [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n)) for i in range(n + 1)]


def tool(pg, title):
    b = pg.locator(f'button[title="{title}"]').first
    box = b.bounding_box()
    glide(pg, box["x"] + box["width"] / 2, box["y"] + box["height"] / 2, steps=20)
    pg.wait_for_timeout(150)
    b.click()
    pg.wait_for_timeout(200)


def open_ws(pg):
    pg.goto(f"{BASE}/workspaces/{CFG['workspace_id']}")
    pg.wait_for_selector(".whiteboard-toolbar", timeout=30000)
    pg.wait_for_timeout(2500)


def finish(ctx, page, name, offset, offsets):
    path = page.video.path()
    ctx.close()
    dst = FOOT / f"{name}.webm"
    shutil.copy(path, dst)
    offsets[name] = round(offset, 2)
    print("saved", dst, "offset", offsets[name])


def clip_whiteboard(browser, state, offsets):
    ctx = new_ctx(browser, state, tag="wb")
    pg = ctx.new_page()
    t0 = time.time()
    open_ws(pg)
    off = time.time() - t0
    glide(pg, 700, 500, 15)
    tool(pg, "Pen")
    draw(pg, [(300, 260), (380, 220), (470, 300), (560, 230), (650, 300), (740, 240)])
    tool(pg, "Rectangle")
    draw(pg, [(320, 420), (620, 620)], steps=25)
    tool(pg, "Circle")
    draw(pg, [(760, 420), (900, 560)], steps=25)
    tool(pg, "Line")
    draw(pg, [(620, 520), (760, 490)], steps=25)
    tool(pg, "Pen")
    draw(pg, circle_pts(560, 820, 90) + circle_pts(560, 820, 60))
    tool(pg, "Text")
    glide(pg, 330, 700, 20)
    pg.mouse.click(330, 700)
    pg.wait_for_timeout(300)
    pg.keyboard.type("Ideas", delay=80)
    pg.mouse.click(900, 900)
    pg.wait_for_timeout(1500)
    finish(ctx, pg, "whiteboard", off, offsets)


CODE = (
    "// Collaborative coding in SyncSpace\n"
    "const team = ['Nivo', 'Alex'];\n"
    "team.forEach(n => console.log(`Hello ${n}, welcome to SyncSpace!`));\n"
)


def clip_code(browser, state, offsets):
    ctx = new_ctx(browser, state, tag="code")
    pg = ctx.new_page()
    t0 = time.time()
    open_ws(pg)
    off = time.time() - t0
    glide(pg, 1600, 450, 25)
    pg.mouse.click(1600, 450)
    pg.keyboard.press("Control+A")
    pg.keyboard.press("Delete")
    pg.wait_for_timeout(300)
    pg.keyboard.type(CODE, delay=45)
    pg.wait_for_timeout(500)
    run = pg.get_by_role("button", name="Run").first
    box = run.bounding_box()
    glide(pg, box["x"] + box["width"] / 2, box["y"] + box["height"] / 2, 30)
    pg.wait_for_timeout(300)
    run.click()
    pg.wait_for_timeout(5000)
    finish(ctx, pg, "code", off, offsets)


def clip_collab(browser, state, offsets):
    # Host is recorded; the guest (a second real browser session) is not.
    host_ctx = new_ctx(browser, state, tag="host")
    host = host_ctx.new_page()
    guest_ctx = new_ctx(browser, None, record=False)
    guest = guest_ctx.new_page()
    t0 = time.time()
    open_ws(host)
    off_host = time.time() - t0
    guest.goto(f"{BASE}/workspaces/join?code={CFG['invite_code']}")
    guest.wait_for_selector('input[placeholder="Your name"]', timeout=30000)
    guest.fill('input[placeholder="Your name"]', "Guest Alex")
    guest.keyboard.press("Enter")
    guest.wait_for_selector(".whiteboard-toolbar", timeout=30000)
    guest.wait_for_timeout(3000)
    host.wait_for_timeout(1500)
    tool(guest, "Pen")
    draw(guest, [(300, 300), (420, 380), (540, 300), (660, 380), (780, 300)], steps=10)
    tool(guest, "Circle")
    draw(guest, [(350, 520), (520, 690)], steps=22)
    host.wait_for_timeout(2500)
    tool(host, "Pen")
    draw(host, [(300, 800), (450, 740), (600, 800), (750, 740), (900, 800)], steps=10)
    host.wait_for_timeout(1500)
    users = host.get_by_text("Users", exact=True).first
    if users.count():
        users.click()
        host.wait_for_timeout(3000)
    host.screenshot(path=str(ROOT / "output" / "collab_host_end.png"))
    host_path = host.video.path()
    host_ctx.close()
    guest_ctx.close()
    shutil.copy(host_path, FOOT / "collab_host.webm")
    (FOOT / "collab_guest.webm").unlink(missing_ok=True)
    offsets["collab_host"] = round(off_host, 2)
    offsets.pop("collab_guest", None)
    print("saved collab clip", offsets["collab_host"])

def main():
    FOOT.mkdir(exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[1:])
    offsets_file = FOOT / "offsets.json"
    offsets = json.loads(offsets_file.read_text()) if offsets_file.exists() else {}
    with sync_playwright() as p:
        state = login_state(p)
        browser = p.chromium.launch(args=["--force-device-scale-factor=1"])
        for name, fn in (("whiteboard", clip_whiteboard), ("code", clip_code), ("collab", clip_collab)):
            if only and name not in only:
                continue
            fn(browser, state, offsets)
            offsets_file.write_text(json.dumps(offsets, indent=2))
        browser.close()


if __name__ == "__main__":
    main()

