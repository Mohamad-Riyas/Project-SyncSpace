"""Record every scene of the complete SyncSpace demo into demo-output/footage."""
import json
import shutil
import sys
import time

from playwright.sync_api import sync_playwright

import record_footage as R
from record_footage import BASE, CFG, W, H, glide, draw, tool, new_ctx, open_ws

FOOT = R.ROOT.parent / "demo-output" / "footage"


def save(ctx, page, name, off, offsets):
    path = page.video.path()
    ctx.close()
    shutil.copy(path, FOOT / f"{name}.webm")
    offsets[name] = round(off, 2)
    print("saved", name, offsets[name])


def login(pg, email, pw):
    pg.fill('input[type="email"]', email)
    pg.fill('input[type="password"]', pw)
    pg.click(".login-button")


def skip_onboarding(pg):
    pg.wait_for_timeout(1500)
    if pg.get_by_text("Skip for now").count():
        pg.get_by_text("Skip for now").click()
        pg.wait_for_timeout(500)


def member_state(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": W, "height": H})
    pg = ctx.new_page()
    pg.goto(f"{BASE}/login")
    login(pg, "demo.member@syncspace.local", CFG["password"])
    pg.wait_for_url("**/dashboard", timeout=30000)
    skip_onboarding(pg)
    st = ctx.storage_state()
    b.close()
    return st


def scene_auth(br, st, off):
    ctx = new_ctx(br, None, tag="auth")
    pg = ctx.new_page()
    t0 = time.time()
    pg.goto(f"{BASE}/login")
    pg.wait_for_selector(".login-button")
    o = time.time() - t0
    pg.wait_for_timeout(1500)
    pg.fill('input[type="email"]', CFG["host_email"])
    pg.type('input[type="password"]', "wrong-password-123", delay=70)
    pg.wait_for_timeout(400)
    pg.click(".login-button")
    pg.wait_for_timeout(3500)
    pg.fill('input[type="password"]', CFG["password"])
    pg.wait_for_timeout(500)
    pg.click(".login-button")
    pg.wait_for_url("**/dashboard", timeout=30000)
    pg.wait_for_timeout(1500)
    save(ctx, pg, "auth", o, off)


def scene_dash(br, st, off):
    ctx = new_ctx(br, st, tag="dash")
    pg = ctx.new_page()
    t0 = time.time()
    pg.goto(f"{BASE}/dashboard")
    pg.wait_for_selector("text=Create Workspace", timeout=30000)
    o = time.time() - t0
    skip_onboarding(pg)
    glide(pg, 900, 300, 30)
    pg.wait_for_timeout(3000)
    pg.mouse.wheel(0, 500)
    pg.wait_for_timeout(3500)
    pg.mouse.wheel(0, -500)
    pg.wait_for_timeout(2500)
    save(ctx, pg, "dash", o, off)


def scene_rbac(br, st, off):
    ctx = new_ctx(br, st, tag="rbac")
    pg = ctx.new_page()
    t0 = time.time()
    pg.goto(f"{BASE}/dashboard")
    pg.wait_for_selector("text=Create Workspace", timeout=30000)
    o = time.time() - t0
    skip_onboarding(pg)
    pg.wait_for_timeout(1500)
    pg.goto(f"{BASE}/admin")
    pg.wait_for_timeout(5000)
    pg.goto(f"{BASE}/recordings")
    pg.wait_for_timeout(4500)
    pg.goto(f"{BASE}/interviews/create")
    pg.wait_for_timeout(4500)
    save(ctx, pg, "rbac", o, off)


def scene_sync(br, st_host, st_alex, off):
    a = new_ctx(br, st_host, tag="syncA")
    b = new_ctx(br, st_alex, tag="syncB")
    pa, pb = a.new_page(), b.new_page()
    ta = time.time()
    open_ws(pa)
    oa = time.time() - ta
    tb = time.time()
    pb.goto(f"{BASE}/workspaces/join?code={CFG['invite_code']}")
    pb.wait_for_timeout(3000)
    pb.screenshot(path=str(R.ROOT.parent / "demo-output" / "sync_B_join.png"))
    skip_onboarding(pb)
    try:
        open_ws(pb)
    except Exception:
        pb.screenshot(path=str(R.ROOT.parent / "demo-output" / "sync_B_fail.png"))
        raise
    ob = time.time() - tb
    for p in (pa, pb):
        skip_onboarding(p)
    pa.wait_for_timeout(2000)
    tool(pa, "Pen")
    draw(pa, [(300, 300), (420, 380), (540, 300), (660, 380), (780, 300)], steps=10)
    tool(pa, "Rectangle")
    draw(pa, [(330, 480), (600, 640)], steps=25)
    pa.wait_for_timeout(3500)
    tool(pb, "Pen")
    draw(pb, [(300, 800), (450, 740), (600, 800), (750, 740), (900, 800)], steps=10)
    tool(pb, "Circle")
    draw(pb, [(720, 480), (900, 650)], steps=25)
    pb.wait_for_timeout(3500)
    # delete a shape from user A via the select + delete tool, if it propagates
    pa.screenshot(path=str(R.ROOT.parent / "demo-output" / "sync_A_end.png"))
    pb.screenshot(path=str(R.ROOT.parent / "demo-output" / "sync_B_end.png"))
    pa_path, pb_path = pa.video.path(), pb.video.path()
    a.close()
    b.close()
    shutil.copy(pa_path, FOOT / "sync_a.webm")
    shutil.copy(pb_path, FOOT / "sync_b.webm")
    off["sync_a"], off["sync_b"] = round(oa, 2), round(ob, 2)
    print("saved sync", off["sync_a"], off["sync_b"])


def scene_code(br, st, off):
    R.FOOT = FOOT
    ctx = new_ctx(br, st, tag="code")
    pg = ctx.new_page()
    t0 = time.time()
    open_ws(pg)
    o = time.time() - t0
    skip_onboarding(pg)
    glide(pg, 1600, 450, 25)
    pg.mouse.click(1600, 450)
    pg.keyboard.press("Control+A")
    pg.keyboard.press("Delete")
    pg.keyboard.type(R.CODE, delay=45)
    pg.wait_for_timeout(500)
    run = pg.get_by_role("button", name="Run").first
    bx = run.bounding_box()
    glide(pg, bx["x"] + bx["width"] / 2, bx["y"] + bx["height"] / 2, 30)
    pg.wait_for_timeout(300)
    run.click()
    pg.wait_for_timeout(6000)
    save(ctx, pg, "code", o, off)


def scene_panels(br, st, off):
    ctx = new_ctx(br, st, tag="panels")
    pg = ctx.new_page()
    t0 = time.time()
    open_ws(pg)
    o = time.time() - t0
    skip_onboarding(pg)
    for label in ("Users", "History", "Settings", "Workspace"):
        el = pg.get_by_text(label, exact=True).first
        if el.count():
            bx = el.bounding_box()
            if bx:
                glide(pg, bx["x"] + bx["width"] / 2, bx["y"] + bx["height"] / 2, 25)
                el.click()
        pg.wait_for_timeout(2300)
    save(ctx, pg, "panels", o, off)


def scene_account(br, st, off):
    ctx = new_ctx(br, st, tag="account")
    pg = ctx.new_page()
    t0 = time.time()
    pg.goto(f"{BASE}/audit-logs")
    pg.wait_for_timeout(2500)
    o = time.time() - t0
    skip_onboarding(pg)
    pg.wait_for_timeout(1500)
    pg.goto(f"{BASE}/profile")
    pg.wait_for_timeout(3500)
    pg.goto(f"{BASE}/interviews")
    pg.wait_for_timeout(3500)
    save(ctx, pg, "account", o, off)


def main():
    FOOT.mkdir(parents=True, exist_ok=True)
    R.TMP.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[1:])
    of = FOOT / "offsets.json"
    off = json.loads(of.read_text()) if of.exists() else {}
    with sync_playwright() as p:
        st = R.login_state(p)
        sta = member_state(p)
        br = p.chromium.launch(args=["--force-device-scale-factor=1"])
        for name, fn in (("auth", scene_auth), ("dash", scene_dash), ("rbac", scene_rbac),
                         ("sync", None), ("code", scene_code), ("panels", scene_panels),
                         ("account", scene_account)):
            if only and name not in only:
                continue
            if name == "sync":
                scene_sync(br, st, sta, off)
            else:
                fn(br, st, off)
            of.write_text(json.dumps(off, indent=2))
        br.close()


if __name__ == "__main__":
    main()
