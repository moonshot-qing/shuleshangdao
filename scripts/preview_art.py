"""Native artwork contact sheet and in-game visual fixtures, not balance evidence."""
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
    out=root/'test-results'/'art-review'
    out.mkdir(parents=True,exist_ok=True)
    errors=[]
    layouts=[]
    with sync_playwright() as p, ExitStack() as stack:
        class Quiet(SimpleHTTPRequestHandler):
            def log_message(self,*args): pass
        server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
        stack.callback(server.server_close)
        stack.callback(server.shutdown)
        Thread(target=server.serve_forever,daemon=True).start()
        url=f'http://127.0.0.1:{server.server_port}'
        browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
        stack.callback(browser.close)
        for width,height in [(1440,900),(390,844),(360,800),(320,700),(768,1024),(844,390)]:
            context=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
            page=context.new_page()
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(url,wait_until='networkidle')
            page.screenshot(path=str(out/f'after-start-{width}.png'))
            page.locator('#btn-start').click()
            page.locator('#role-rumor').click()
            page.screenshot(path=str(out/f'after-roles-{width}.png'))
            page.locator('#btn-deploy').click()
            page.evaluate("""() => {
                startGame({seed:173,scenario:0,difficulty:1,role:'rumor'});
                for(let i=0;i<70;i++)match.step();
                refresh();
            }""")
            page.locator('#btn-pause').click()
            page.screenshot(path=str(out/f'after-play-{width}.png'))
            layouts.append(page.evaluate("""() => ({
                width:innerWidth,height:innerHeight,stage:$('stage').clientHeight,
                hand:$('hand').getBoundingClientRect().toJSON(),
                body:document.body.getBoundingClientRect().toJSON()
            })"""))
            assert layouts[-1]['stage']>=120,layouts[-1]
            page.locator('.card-face').first.click()
            page.screenshot(path=str(out/f'after-detail-{width}.png'))
            page.locator('#btn-card-close').click()
            page.locator('#btn-pause').click()
            page.locator('#btn-fuse').click()
            page.locator('[data-material]').nth(0).click()
            page.locator('[data-material]').nth(1).click()
            page.screenshot(path=str(out/f'after-fusion-{width}.png'))
            page.locator('#btn-fusion-close').click()
            page.evaluate('match.finish();refresh()')
            page.screenshot(path=str(out/f'after-ending-{width}.png'))
            context.close()
        # Separate page: no game loop. Show sprites at native 36x48 and at 2x,
        # plus the 24px icon grid at its 48px card display size.
        context=browser.new_context(viewport={'width':1280,'height':900})
        page=context.new_page()
        page.goto(url+'/test-results/art-review/')
        page.set_content("""<meta charset="utf-8"><style>
          body{background:#f2eee3;color:#30323b;font:14px system-ui;margin:28px}
          h1{font-size:24px}h2{font-size:16px;margin:22px 0 12px}
          .people{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}
          .person{background:#fffaf0;border:1px solid #c3b49b;padding:10px;text-align:center}
          canvas{image-rendering:pixelated;display:inline-block}
          .zoom{width:72px;height:96px;display:block;margin:0 auto 8px}
          .icons{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
          .icon{background:#fffaf0;border:1px solid #c3b49b;text-align:center;padding:10px}
          .icon svg{display:block;margin:0 auto 8px}small{display:block;color:#726c5f}
          .scenes{display:flex;gap:20px}.scene{background:#fffaf0;padding:12px}
          .compact{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}
          .compact canvas{width:24px;height:32px;margin:10px 4px}
          .endings{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
          .ending{background:#fffaf0;padding:12px;text-align:center}
        </style><h1>校园传播 · 像素美术图鉴</h1>
        <p>人物：36 × 48 源帧 / 2 倍肖像 · 手机专用：12 × 16 源帧 / 24 × 32 显示</p>
        <h2>八类角色 / 无状态、相信、核实</h2><div class="people"></div>
        <h2>手机人物 / 三种状态、静止与举手机</h2><div class="compact"></div>
        <h2>十六张卡牌 / 64 × 40 插画 / 128 × 80 显示</h2><div class="icons"></div>
        <h2>对局四社群建筑 / 96 × 56</h2><div class="scenes"></div>
        <h2>六种传播结局 / 身份相同，胜负相同，按传播形态区分</h2><div class="endings"></div>""")
        page.add_script_tag(url=url+'/simulation.js')
        page.add_script_tag(url=url+'/pixel-art.js')
        page.evaluate("""() => {
            for(const type of Object.keys(TYPES)){
                const el=document.createElement('div');el.className='person';
                const big=document.createElement('canvas');big.width=36;big.height=48;big.className='zoom';
                big.getContext('2d').drawImage(getSprite(type,0,0),0,0);
                el.append(big);
                for(let state=0;state<3;state++)el.append(getSprite(type,state,0).cloneNode());
                el.querySelectorAll('canvas:not(.zoom)').forEach((cv,i)=>cv.getContext('2d').drawImage(getSprite(type,i,0),0,0));
                const label=document.createElement('small');label.textContent=TYPES[type].name;el.append(label);
                document.querySelector('.people').append(el);
                const small=document.createElement('div');small.className='person';
                for(let state=0;state<3;state++)for(let pose=0;pose<2;pose++){
                    const source=getCompactSprite(type,state,pose),cv=document.createElement('canvas');cv.width=12;cv.height=16;
                    cv.getContext('2d').drawImage(source,0,0);small.append(cv);
                }
                const name=document.createElement('small');name.textContent=TYPES[type].name;small.append(name);
                document.querySelector('.compact').append(small);
            }
            for(const d of CARD_DEFS){
                const el=document.createElement('div');el.className='icon';
                el.innerHTML=cardIllustration(d.id,128)+'<small>'+d.name+'</small>';
                document.querySelector('.icons').append(el);
            }
            for(let i=0;i<4;i++){
                const el=document.createElement('div');el.className='scene';
                el.append(getGroupLandmark(i));
                const name=document.createElement('small');name.textContent=GROUP_NAMES[i];el.append(name);
                document.querySelector('.scenes').append(el);
            }
            for(const key of Object.keys(ENDINGS)){
                const el=document.createElement('div');el.className='ending';
                const cv=document.createElement('canvas');cv.width=192;cv.height=128;drawResult(cv,'rumor',true,key);el.append(cv);
                const name=document.createElement('small');name.textContent=ENDINGS[key].title;el.append(name);
                document.querySelector('.endings').append(el);
            }
        }""")
        families=page.evaluate("""() => ({
            compactFrames:compactSpriteCache.size,
            uniqueCharacters:new Set(Object.keys(TYPES).map(t=>getCompactSprite(t,0,0).toDataURL())).size,
            cardScenes:Object.keys(CARD_ILLUSTRATIONS).length,
            landmarks:landmarkCache.size,
            uniqueEndings:new Set([...document.querySelectorAll('.ending canvas')].map(c=>c.toDataURL())).size
        })""")
        assert families=={'compactFrames':48,'uniqueCharacters':8,'cardScenes':16,'landmarks':4,'uniqueEndings':6},families
        page.screenshot(path=str(out/'art-contact-sheet.png'),full_page=True)
        copyfile(out/'art-contact-sheet.png',root/'screenshots'/'03-美术图鉴.png')
        context.close()
    (out/'art-layout-report.json').write_text(json.dumps({'layouts':layouts,'families':families,'pageErrors':errors,'fixtureEndingIsForced':True},ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'views':len(layouts),'stageHeights':[v['stage'] for v in layouts],'families':families,'pageErrors':errors},ensure_ascii=False,indent=2))
    assert not errors


if __name__=='__main__':
    main()
