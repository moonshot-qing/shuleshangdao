"""Exercise learning, real deliveries, scene fixtures and same-network comparisons."""
from contextlib import ExitStack
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import hashlib
import json
from playwright.sync_api import sync_playwright


def main():
    root=Path(__file__).resolve().parents[1]
    out=root/'test-results'/'judging-review'
    out.mkdir(parents=True,exist_ok=True)
    report={'simulationSha256':hashlib.sha256((root/'simulation.js').read_bytes()).hexdigest(),
            'errors':[],'views':[],'sceneAndEndingScreenshots':'constructed fixtures; not natural matches'}
    with sync_playwright() as p, ExitStack() as stack:
        class Quiet(SimpleHTTPRequestHandler):
            def log_message(self,*args): pass
        server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
        stack.callback(server.server_close);stack.callback(server.shutdown)
        Thread(target=server.serve_forever,daemon=True).start()
        browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
        stack.callback(browser.close)
        for width,height,scenario in [(1440,900,0),(390,844,1),(844,390,2)]:
            context=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce' if width==390 else 'no-preference')
            page=context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
            page.screenshot(path=str(out/f'scenes-{width}.png'),animations='disabled')
            page.locator(f'[data-scenario="{scenario}"]').click()
            page.locator('#btn-start').click()
            assert not page.locator('#campus-demo').is_visible()
            assert '第 3 天' in page.locator('#selected-rule').text_content()
            page.locator('#role-rumor').click()
            page.screenshot(path=str(out/f'roles-{width}.png'),animations='disabled')
            page.locator('#btn-deploy').click()
            page.wait_for_function('audio.musicTimer!==null && audio.musicWanted')
            page.evaluate("""scenario => {
                startGame({seed:173,scenario,difficulty:1,role:'rumor'});
                match.player.hand=[match.newCard('army',1),match.newCard('farm',1),match.newCard('script',1),match.newCard('weaktie',1)];
                match.revision++;refresh();
            }""",scenario)
            assert page.locator('#process-note').is_visible()
            assert '你的目标' in page.locator('#guide-copy').text_content()
            page.locator('.card-face').first.click()
            assert page.evaluate('match.paused && readingPaused')
            assert page.evaluate('audio.musicTimer===null && !audio.musicWanted && audio.musicVoices.size===0')
            before=page.evaluate('match.tickCount')
            page.wait_for_timeout(350)
            assert before==page.evaluate('match.tickCount')
            assert not page.locator('.card-full-rules').evaluate('el=>el.open')
            assert '继续并出牌' in page.locator('#btn-detail-play').text_content()
            assert page.locator('#btn-detail-play').evaluate('el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}')
            page.screenshot(path=str(out/f'brief-card-{width}.png'),animations='disabled')
            page.locator('.card-full-rules summary').click()
            assert page.locator('.resolution-note').is_visible()
            page.screenshot(path=str(out/f'full-card-{width}.png'),animations='disabled')
            page.keyboard.press('Escape');page.wait_for_function('!match.paused && !readingPaused')
            page.wait_for_function('audio.musicTimer!==null && audio.musicWanted')
            page.locator('.card-face').first.click()
            page.locator('#btn-detail-play').click()
            page.wait_for_function('match.player.played===1 && !match.paused')
            page.wait_for_function('match.actions[0].pending===0',timeout=6000)
            assert page.evaluate('focusedAction===match.actions[0].id && impactNodes.size>0')
            assert '改变' in page.locator('#btn-impact').text_content()
            page.locator('#btn-impact').click()
            page.screenshot(path=str(out/f'impact-{width}.png'),animations='disabled')
            page.locator('#btn-guide-dismiss').click()
            assert not page.locator('#process-note').is_visible()
            page.locator('#btn-guide').click()
            assert page.locator('#process-note').is_visible()
            page.locator('#btn-pause').click()
            page.locator('.card-face').first.click()
            assert page.evaluate('match.paused && !readingPaused')
            page.locator('#btn-card-close').click()
            assert page.evaluate('match.paused')
            assert page.evaluate('audio.musicTimer===null')
            page.locator('#btn-pause').click()
            page.evaluate("""() => {
                match.opponent.resource=500;
                const card=match.newCard('radio',1);match.opponent.hand=[card];
                match.play(match.opponent,card.uid);refresh();
            }""")
            page.locator('#btn-ai-impact').click()
            assert page.evaluate('impactSide===match.opponent.side')
            page.screenshot(path=str(out/f'ai-impact-{width}.png'),animations='disabled')
            page.evaluate("""() => {
                match.nextAI=match.nextAmbient=match.nextEvent=10000;
                if(match.scenario===0)match.infect(match.scenarioSource);
                if(match.scenario===1)for(const n of match.nodes.filter(n=>n.active&&n.group===1&&n.type!=='bot').slice(0,4))match.clarify(n.id);
                while(match.day<3.01&&!match.ended)match.step();
                refresh();
            }""")
            assert page.evaluate("match.scenarioResolved && match.messages.filter(m=>m.kind==='scene').length===1")
            if width<760 or height<500:page.locator('#btn-stats').click()
            page.locator('.scene-rule summary').click()
            page.locator('#btn-scene-focus').click()
            assert page.evaluate("guideMode==='scene'")
            if scenario==0:page.locator('#btn-node-close').click()
            page.screenshot(path=str(out/f'scene-result-{width}.png'),animations='disabled')
            if width<760 or height<500:page.locator('#btn-stats').click()
            page.evaluate('match.step();match.finish();refresh()')
            assert not page.locator('#end-comparison').is_visible()
            assert page.locator('#score-parts span').count()>=2
            assert '档案' in page.locator('#end-assessment').text_content()
            assert page.locator('#btn-swap-network').evaluate('el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}')
            page.screenshot(path=str(out/f'ending-{width}.png'),animations='disabled')
            page.locator('#btn-swap-network').click();page.wait_for_function('running')
            assert page.evaluate("lastOptions.seed===173 && !match.scenarioResolved && focusedAction===0 && impactNodes.size===0 && !readingPaused")
            page.evaluate('match.step();match.finish();refresh()')
            assert page.locator('#end-comparison').is_visible()
            assert page.locator('#end-comparison tbody tr').count()==4
            page.screenshot(path=str(out/f'comparison-{width}.png'),animations='disabled')
            page.evaluate("""() => {
                startGame({seed:174,scenario:0,difficulty:1,role:'clarify'});
                for(const n of match.nodes)if(n.active)match.infect(n.id);
                match.reversed=true;match.postPeak=.6;match.step();match.finish();refresh();
            }""")
            assert not page.locator('#end-comparison').is_visible()
            assert page.evaluate("!match.result.won && match.result.grade==='S'")
            assert '形态基准' in page.locator('#end-assessment').text_content()
            page.screenshot(path=str(out/f'lost-high-archive-{width}.png'),animations='disabled')
            report['views'].append({'width':width,'height':height,'scenario':scenario,
                'autoPause_resume_manualPause_receipts_scene_comparison_reset':'passed'})
            context.close()
        assert not report['errors'],report['errors']
    (out/'ui-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Judging UI passed: 3 viewports; learning, pause ownership, real delivery, scene fixtures and same-network comparison. Page errors 0.')


if __name__=='__main__':
    main()
