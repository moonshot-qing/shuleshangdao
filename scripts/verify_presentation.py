"""Inspect live presentation, dense self-play, UI exclusion and phone DPRs."""
from contextlib import ExitStack
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from shutil import copyfile
from threading import Thread
import json
from playwright.sync_api import sync_playwright


def main():
    root=Path(__file__).resolve().parents[1]
    out=root/'test-results'/'presentation-review';out.mkdir(parents=True,exist_ok=True)
    report={'errors':[],'views':[],'method':'Fixed-seed AI self-play advanced to day 7; event panel checks use explicit UI fixtures. Desktop Chrome emulates viewport and DPR.'}
    with sync_playwright() as p, ExitStack() as stack:
        class Quiet(SimpleHTTPRequestHandler):
            def log_message(self,*args): pass
        server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
        stack.callback(server.server_close);stack.callback(server.shutdown)
        Thread(target=server.serve_forever,daemon=True).start()
        browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
        stack.callback(browser.close)
        for width,height,dpr in [(1440,900,1),(1366,768,1),(390,844,2),(360,800,3),(320,700,2),(844,390,2)]:
            context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=dpr,reduced_motion='reduce')
            page=context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
            page.evaluate("""() => {
                startGame({seed:9831,scenario:0,difficulty:1,role:'rumor'});
                match.nextAI=100000;let next=1.15;
                while(match.day<7&&!match.ended){
                    match.step();
                    if(!match.ended&&match.day>=next){
                        const saved=match.opponent;
                        for(const side of ['clarify','rumor']){
                            const status=match.lastAI;
                            match.opponent=match.actors[side];match.aiTurn();
                            if(side===match.role)match.lastAI=status;
                        }
                        match.opponent=saved;match.nextAI=100000;next=match.day+.9;
                    }
                }
                match.paused=true;refresh();
            }""")
            page.wait_for_function('W===canvas.getBoundingClientRect().width && H===canvas.getBoundingClientRect().height')
            page.evaluate('for(let i=0;i<100;i++)physics()')
            state=page.evaluate("""() => {
                const g=$('process-note').getBoundingClientRect(),s=$('stage').getBoundingClientRect();
                if(g.top<s.bottom)throw Error('Guide covers the network');
                if($('stage').clientHeight<120)throw Error('Network too short');
                if(document.documentElement.scrollWidth>innerWidth)throw Error('Horizontal overflow');
                const hidden=[],outside=[];
                const controls=['btn-stats','view-controls','btn-log','fx-bar','action-flash'].map(id=>$(id))
                    .concat($('phase-label').parentElement).filter(el=>getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).opacity!=='0')
                    .map(el=>el.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0)
                    .map(r=>({x:r.left-s.left,y:r.top-s.top,w:r.width,h:r.height}));
                for(const n of match.nodes.filter(n=>n.active)){
                    const v=visuals[n.id],{w,h}=nodeSize(n);
                    if(controls.some(o=>v.x+w/2>o.x&&v.x-w/2<o.x+o.w&&v.y+h/2>o.y&&v.y-h/2<o.y+o.h))hidden.push(n.id);
                    if(v.x-w/2<0||v.x+w/2>W||v.y-h/2<0||v.y+h/2>H)outside.push(n.id);
                }
                if(hidden.length)throw Error('Persistent controls cover people: '+hidden.join(','));
                if(outside.length)throw Error(innerWidth+'x'+innerHeight+' people outside viewport: '+outside.join(','));
                const ai=$('btn-ai-impact').getBoundingClientRect();
                if(ai.right>innerWidth)throw Error('AI receipt overflows');
                return {width:innerWidth,height:innerHeight,dpr:devicePixelRatio,stage:H,day:match.day,people:match.counts().total,coveredByControls:hidden.length};
            }""")
            page.screenshot(path=str(out/f'late-play-{width}.png'),animations='disabled')
            page.locator('#btn-guide-dismiss').click()
            page.wait_for_function('H===canvas.getBoundingClientRect().height')
            assert page.evaluate('H')>=state['stage']
            page.locator('#btn-guide').click();page.wait_for_function('H===canvas.getBoundingClientRect().height')
            page.evaluate("""() => {
                startGame({seed:173,scenario:1,difficulty:1,role:'clarify'});
                match.paused=true;match.beginEmergency(0);refresh();
            }""")
            assert page.locator('#ev-title svg').count()==1
            assert page.locator('.log-event>b>svg').count()>0
            page.screenshot(path=str(out/f'event-{width}.png'),animations='disabled')
            page.locator('#btn-event-source').click()
            assert page.locator('#event-inspector-slot #node-detail').is_visible()
            assert page.locator('#btn-node-close').evaluate("el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}")
            page.screenshot(path=str(out/f'event-person-{width}.png'),animations='disabled')
            page.locator('[data-event-choice]').first.scroll_into_view_if_needed()
            page.screenshot(path=str(out/f'event-options-{width}.png'),animations='disabled')
            assert page.locator('[data-event-choice]').first.evaluate("el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}"),width
            page.locator('#btn-node-close').click()
            if width==390:
                page.set_viewport_size({'width':844,'height':390})
                page.wait_for_function('W===canvas.getBoundingClientRect().width && H===canvas.getBoundingClientRect().height')
                assert page.evaluate('match.paused')
                page.screenshot(path=str(out/'paused-rotation.png'),animations='disabled')
            report['views'].append(state);context.close()
        assert not report['errors'],report['errors']
    (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    copyfile(out/'late-play-1440.png',root/'screenshots'/'04-桌面对局.png')
    copyfile(out/'late-play-390.png',root/'screenshots'/'05-手机对局.png')
    print(json.dumps({'views':report['views'],'errors':report['errors']},ensure_ascii=True))


if __name__=='__main__':
    main()
