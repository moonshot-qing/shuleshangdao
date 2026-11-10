"""Targeted camera, crowding, touch and live-region checks; no balance claims."""
from contextlib import ExitStack
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import subprocess
from playwright.sync_api import sync_playwright


def main():
    root=Path(__file__).resolve().parents[1]
    out=root/'test-results'/'view-refinement';out.mkdir(parents=True,exist_ok=True)
    old=subprocess.check_output(['git','show','0a3e67d:game.js'],cwd=root).decode('utf-8')
    baseline=old[old.index('function physics()'):old.index('\nfunction drawNetwork')]
    report={'errors':[],'views':[],'baseline':'0a3e67d physics on the same current layout, simulation state and starting positions','limitations':'Chrome viewport/touch emulation and DOM live-region checks; not physical devices or screen-reader speech.'}
    with sync_playwright() as p, ExitStack() as stack:
        class Quiet(SimpleHTTPRequestHandler):
            def log_message(self,*args): pass
        server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
        stack.callback(server.server_close);stack.callback(server.shutdown)
        Thread(target=server.serve_forever,daemon=True).start()
        browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
        stack.callback(browser.close)
        for width,height in [(390,844),(320,700),(844,390)]:
            context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=2,has_touch=True,reduced_motion='reduce')
            page=context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
            page.evaluate("""() => {
                startGame({seed:9831,scenario:0,difficulty:1,role:'rumor'});
                match.nextAI=100000;let next=1.15;
                while(match.day<7&&!match.ended){match.step();if(!match.ended&&match.day>=next){
                    const saved=match.opponent;
                    for(const side of ['clarify','rumor']){const status=match.lastAI;match.opponent=match.actors[side];match.aiTurn();if(side===match.role)match.lastAI=status;}
                    match.opponent=saved;match.nextAI=100000;next=match.day+.9;
                }}
                match.paused=true;refresh();
            }""")
            page.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
            crowd=page.evaluate("""source => {
                const original=structuredClone(visuals),previous=new Function('return ('+source+');')();
                const count=()=>match.nodes.filter(n=>n.active&&visuals[n.id].y+nodeSize(n).h/2>H-14).length;
                for(let i=0;i<150;i++)previous();const before=count();
                visuals=structuredClone(original);for(let i=0;i<150;i++)physics();
                return {beforeBottomBand:before,afterBottomBand:count(),people:match.counts().total};
            }""",baseline)
            page.screenshot(path=str(out/f'crowd-{width}.png'),animations='disabled')
            page.evaluate("""() => {
                selectedNode=match.nodes.find(n=>n.active&&n.type==='mkt').id;
                view.s=1.25;view.x=W*.5-visuals[selectedNode].x*view.s;view.y=H*.6-visuals[selectedNode].y*view.s;applyView();rememberViewFocus();
            }""")
            page.locator('#btn-zoom-in').click()
            r=page.locator('#net').bounding_box()
            page.mouse.move(r['x']+r['width']*.5,r['y']+r['height']*.65)
            page.mouse.down();page.mouse.move(r['x']+r['width']*.5+22,r['y']+r['height']*.65+5,steps=4);page.mouse.up()
            page.evaluate("""() => {
                const canvasRect=canvas.getBoundingClientRect();
                const boxes=['btn-stats','view-controls','btn-log','fx-bar','action-flash'].map(id=>$(id))
                    .concat($('phase-label').parentElement).map(el=>el.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);
                for(const n of match.nodes.filter(n=>n.active)){
                    const v=visuals[n.id],size=nodeSize(n),x=canvasRect.left+view.x+v.x*view.s,y=canvasRect.top+view.y+v.y*view.s,w=size.w*view.s,h=size.h*view.s;
                    if(boxes.some(b=>x+w/2>b.left&&x-w/2<b.right&&y+h/2>b.top&&y-h/2<b.bottom))throw Error('Zoom/pan HUD overlap: '+n.id);
                }
            }""")
            before=page.evaluate('({id:selectedNode,x:(view.x+visuals[selectedNode].x*view.s)/W,y:(view.y+visuals[selectedNode].y*view.s)/H,s:view.s})')
            page.set_viewport_size({'width':844 if width<760 else 390,'height':390 if width<760 else 844})
            page.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
            after=page.evaluate('({id:selectedNode,x:(view.x+visuals[selectedNode].x*view.s)/W,y:(view.y+visuals[selectedNode].y*view.s)/H,s:view.s})')
            assert before['id']==after['id'] and before['s']==after['s']
            assert abs(before['x']-after['x'])<.015 and abs(before['y']-after['y'])<.015,(before,after)
            page.screenshot(path=str(out/f'rotation-{width}.png'),animations='disabled')
            free=page.evaluate("""() => {
                selectedNode=-1;rememberViewFocus();const x=(W/2-view.x)/view.s,y=(H/2-view.y)/view.s;
                const n=match.nodes.filter(n=>n.active).reduce((a,b)=>Math.hypot(visuals[a.id].x-x,visuals[a.id].y-y)<Math.hypot(visuals[b.id].x-x,visuals[b.id].y-y)?a:b);
                return {id:n.id,x:(view.x+visuals[n.id].x*view.s)/W,y:(view.y+visuals[n.id].y*view.s)/H};
            }""")
            page.set_viewport_size({'width':width,'height':height})
            page.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
            free_after=page.evaluate('id=>({x:(view.x+visuals[id].x*view.s)/W,y:(view.y+visuals[id].y*view.s)/H})',free['id'])
            assert abs(free['x']-free_after['x'])<.015 and abs(free['y']-free_after['y'])<.015,(free,free_after)
            page.set_viewport_size({'width':844,'height':390})
            page.evaluate("""() => {startGame({seed:173,scenario:0,difficulty:1,role:'rumor'});match.nextAI=100000;match.player.hand=[match.newCard('farm',1)];match.revision++;refresh();}""")
            assert page.evaluate("cameraFocus===-1 && $('announcement').textContent.includes('你以传谣者开始')")
            assert page.locator('.card-play').evaluate('el=>el.getBoundingClientRect().height>=44')
            page.locator('.card-play').tap();assert page.evaluate('match.player.played===1')
            assert page.evaluate("$('announcement').textContent.includes('资源整理')")
            assert page.locator('#action-flash').get_attribute('aria-hidden')=='true'
            assert page.locator('#process-note').get_attribute('role') is None
            assert page.evaluate('H>=120')
            page.screenshot(path=str(out/f'touch-{width}.png'),animations='disabled')
            page.evaluate("""async () => {
                await setPaused(true);$('announcement').textContent='人物查看通知';
                const n=match.nodes.find(n=>n.active),msg=match.record(QUOTES[n.type][0],'quote','both');
                Object.assign(msg,{speaker:n.id,type:n.type,state:n.state,group:n.group,replyTo:-1});
                match.record('普通阶段统计','observe','both');refresh();
                if($('announcement').textContent!=='人物查看通知')throw Error('Ordinary log overwrote notice');
                match.beginEmergency(0);refresh();
                if(!$('announcement').textContent.includes('校媒记者'))throw Error('Important event not announced');
            }""")
            report['views'].append({'width':width,'height':height,'crowding':crowd,'cameraBefore':before,'cameraAfter':after,'freeCameraBefore':free,'freeCameraAfter':free_after,'touch44px_and_announcementFiltering':'passed'})
            context.close()
        page=browser.new_page(viewport={'width':1440,'height':900});page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
        hints=page.evaluate("""() => {
            const results=[];
            for(let scenario=0;scenario<3;scenario++){
                startGame({seed:173,scenario,difficulty:1,role:'rumor'});
                const card=match.newCard('farm',1);match.player.hand=[card];match.play(match.player,card.uid);
                match.paused=true;match.day=2.9;refresh();const before=$('guide-copy').textContent;
                match.day=3.1;match.resolveScenario();refresh();const after=$('guide-copy').textContent;
                if(before===after)throw Error('Scene hint stayed in preparation phase');
                if(scenario===1){match.day=4.3;refresh();if(!$('guide-copy').textContent.includes('阶段已结束'))throw Error('Expired protection hint');}
                results.push({scenario,before,after});
            }
            match.finish();refresh();
            if($('end-title').getAttribute('aria-describedby')!=='end-verdict end-grade end-score')throw Error('Missing result description');
            return results;
        }""")
        report['hints']=hints
        assert sum(v['crowding']['afterBottomBand'] for v in report['views'])<sum(v['crowding']['beforeBottomBand'] for v in report['views']),report['views']
        assert not report['errors'],report['errors']
    (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'views':report['views'],'hintScenarios':len(hints),'errors':report['errors']},ensure_ascii=True))


if __name__=='__main__':
    main()
