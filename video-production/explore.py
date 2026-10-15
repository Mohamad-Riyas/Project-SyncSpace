import json,sys
from playwright.sync_api import sync_playwright
import record_footage as R
with sync_playwright() as p:
    state=R.login_state(p)
    b=p.chromium.launch(args=["--force-device-scale-factor=1"])
    ctx=b.new_context(storage_state=state,viewport={"width":1920,"height":1080})
    pg=ctx.new_page()
    for name,url in [("dash","/dashboard"),("ws","/workspaces"),("profile","/profile"),("int","/interviews"),("icreate","/interviews/create"),("admin","/admin"),("audit","/audit-logs"),("rec","/recordings"),("home","/")]:
        pg.goto(R.BASE+url); pg.wait_for_timeout(2500)
        pg.screenshot(path=f"../demo-output/shots/{name}.png")
        print(name,pg.url)
    pg.goto(f"{R.BASE}/workspaces/{R.CFG['workspace_id']}"); pg.wait_for_selector(".whiteboard-toolbar",timeout=30000); pg.wait_for_timeout(2000)
    pg.screenshot(path="../demo-output/shots/wsdetail.png")
    print(pg.inner_text("body")[:1500])
    b.close()
