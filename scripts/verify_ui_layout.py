"""Check narrow layouts, modal reading order and sticky action visibility."""
from contextlib import ExitStack
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright


def main():
    root=Path(__file__).resolve().parents[1]
    out=root/'test-results'/'ui-layout';out.mkdir(parents=True,exist_ok=True)
    report={'errors':[],'views':[],'endingScreenshots':'constructed layout fixtures'}
    with sync_playwright() as p, ExitStack() as stack:
        class Quiet(SimpleHTTPRequestHandler):
            def log_message(self,*args): pass
        server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
        stack.callback(server.server_close);stack.callback(server.shutdown)
        Thread(target=server.serve_forever,daemon=True).start()
        browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
        stack.callback(browser.close)
        for width,height in [(320,700),(360,800),(390,844),(768,1024),(1440,900),(844,390)]:
            context=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
            page=context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
            page.evaluate("""() => {
                startGame({seed:173,scenario:0,difficulty:1,role:'rumor'});
                match.nextAI=100000;
                match.player.hand=['army','hot','farm','script'].map(id=>match.newCard(id,1));
                match.revision++;refresh();
            }""")
            page.locator('#net').focus();page.keyboard.press('ArrowLeft')
            assert page.evaluate('selectedNode===match.nodes.filter(n=>n.active).at(-1).id')
            page.keyboard.press('ArrowRight')
            assert page.evaluate('selectedNode===match.nodes.find(n=>n.active).id')
            assert page.locator('#node-detail').is_visible()
            assert page.locator('#announcement').text_content()==page.locator('#node-text').text_content()
            page.locator('#btn-node-close').click()
            assert page.evaluate("document.activeElement===$('net')")
            page.screenshot(path=str(out/f'play-{width}.png'),animations='disabled')
            page.evaluate("""() => {
                if(document.documentElement.scrollWidth>innerWidth)throw Error('Page overflow');
                if($('stage').clientHeight<120)throw Error('Network too short');
                for(const id of ['player-resource','opponent-resource']){
                    const el=$(id),r=el.getBoundingClientRect();
                    if(r.left<0||r.right>innerWidth)throw Error('Resource clipped');
                    if(el.scrollWidth>el.clientWidth+1)throw Error('Resource caption clipped');
                }
            }""")
            page.locator('#btn-fuse').click()
            page.locator('[data-material]').nth(0).click();page.locator('[data-material]').nth(1).click()
            assert '强化牌出牌时：封号风险' in page.locator('#fusion-preview').text_content()
            assert '30' in page.locator('#btn-fusion-confirm').text_content()
            page.locator('.fusion-full-rules summary').click()
            assert page.locator('#btn-fusion-confirm').evaluate("""el=>{
                const r=el.getBoundingClientRect();
                return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
            }""")
            page.screenshot(path=str(out/f'fusion-{width}.png'),animations='disabled')
            page.locator('#fusion-dialog').evaluate('el=>el.scrollTop=el.scrollHeight')
            page.locator('#btn-fusion-back').click()
            page.evaluate('match.step();match.finish();refresh()')
            assert page.evaluate("$('end-dialog').scrollTop===0 && document.activeElement===$('end-title')")
            assert page.locator('#end-verdict').evaluate('el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}')
            assert page.locator('#btn-swap-network').evaluate("""el=>{
                const r=el.getBoundingClientRect();
                return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
            }""")
            assert page.locator('#end-dialog').evaluate('el=>el.scrollWidth<=el.clientWidth+1')
            page.screenshot(path=str(out/f'ending-top-{width}.png'),animations='disabled')
            page.locator('#end-dialog').evaluate('el=>el.scrollTop=el.scrollHeight')
            assert page.evaluate("$('end-ach').getBoundingClientRect().bottom<=document.querySelector('#end-dialog .end-actions').getBoundingClientRect().top")
            page.locator('#btn-replay').focus()
            assert page.locator('#btn-replay').evaluate('el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}')
            page.screenshot(path=str(out/f'ending-bottom-{width}.png'),animations='disabled')
            report['views'].append({'width':width,'height':height,'layout_focus_stickyActions':'passed'})
            context.close()
        assert not report['errors'],report['errors']
    (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('UI layout passed: 6 viewports, keyboard inspection, fusion and result actions, initial focus and scroll access. Page errors 0.')


if __name__=='__main__':
    main()
