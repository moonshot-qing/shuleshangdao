"""Focused browser checks for the newly added event, risk and replay flows."""
from contextlib import ExitStack
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import hashlib
import json
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
out=root/'test-results'/'iteration';out.mkdir(parents=True,exist_ok=True)
report={'simulationSha256':hashlib.sha256((root/'simulation.js').read_bytes()).hexdigest(),'errors':[],'views':[]}

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

with sync_playwright() as p, ExitStack() as stack:
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
    stack.callback(server.server_close);stack.callback(server.shutdown)
    Thread(target=server.serve_forever,daemon=True).start()
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    stack.callback(browser.close)
    for width,height in [(1440,900),(390,844),(844,390)]:
        context=browser.new_context(viewport={'width':width,'height':height})
        page=context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
        page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
        page.locator('#btn-start').click();page.locator('#role-rumor').click();page.locator('#btn-deploy').click()
        page.evaluate("""() => {
            startGame({seed:173,scenario:0,difficulty:1,role:'rumor'});
            match.player.hand=[match.newCard('army',1)];match.banRisk=38;match.revision++;refresh();
        }""")
        page.locator('.card-face').click()
        assert '→' in page.locator('#card-risk-preview').text_content()
        assert page.locator('#card-risk-preview').is_visible()
        page.screenshot(path=str(out/f'risk-{width}.png'),animations='disabled')
        page.locator('#btn-card-close').click()
        page.evaluate("""() => {
            match.player.resource=0;refresh();
        }""")
        assert '还需' in page.locator('.card-status').text_content()
        assert page.locator('.card-play').is_disabled()
        page.evaluate("""() => {
            startGame({seed:173,scenario:0,difficulty:1,role:'clarify'});match.beginEmergency(0);refresh();
        }""")
        assert '后续' in page.locator('[data-event-choice]').first.text_content()
        page.locator('#btn-event-pause').click()
        before=page.evaluate('({tick:match.tickCount,deadline:match.event.expires})')
        page.wait_for_timeout(300)
        assert before==page.evaluate('({tick:match.tickCount,deadline:match.event.expires})')
        assert page.locator('[data-event-choice]').first.is_disabled()
        assert page.locator('#event-toast').evaluate("el=>{const r=el.getBoundingClientRect(),s=innerHeight<500&&innerWidth>760?{top:0,bottom:innerHeight}:$('stage').getBoundingClientRect();return r.top>=s.top&&r.bottom<=s.bottom;}")
        page.screenshot(path=str(out/f'event-{width}.png'),animations='disabled')
        page.locator('#btn-event-source').click();assert page.locator('#node-detail').is_visible()
        assert page.locator('#node-detail').evaluate("el=>{const r=el.getBoundingClientRect(),s=innerHeight<500&&innerWidth>760?{top:0,bottom:innerHeight}:$('stage').getBoundingClientRect();return r.top>=s.top&&r.bottom<=s.bottom;}")
        page.screenshot(path=str(out/f'event-person-{width}.png'),animations='disabled')
        page.locator('#btn-node-close').click()
        page.locator('#btn-event-pause').click();page.locator('[data-event-choice]').first.click()
        assert page.evaluate('match.eventFollowups.length===1')
        page.locator('#btn-speed').click();page.locator('#btn-speed').click()
        page.wait_for_function('match.eventFollowups.length===0',timeout=15000)
        assert page.locator('.log-event-followup').count()>0
        page.evaluate('match.finish();refresh()')
        original=page.evaluate('({...lastOptions})')
        assert page.locator('.timeline-item').count()<=3
        page.locator('#btn-swap-network').click();page.wait_for_function('running')
        changed=page.evaluate('({...lastOptions})')
        assert changed['seed']==original['seed'] and changed['scenario']==original['scenario'] and changed['difficulty']==original['difficulty']
        assert changed['role']!=original['role']
        assert page.evaluate('match.eventFollowups.length===0 && match.emergencyHistory.length===0')
        report['views'].append({'width':width,'height':height,'risk_event_pause_followup_replay':'passed'})
        context.close()
    assert not report['errors'],report['errors']
(out/'ui-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('New browser flows passed: 3 viewports, actual-clock followups, swap replay and reset; page errors 0.')
