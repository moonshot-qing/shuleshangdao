"""Real Chromium UI verification; --demo records a complete timed 4x match."""
import argparse
from contextlib import ExitStack
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import hashlib
import time
from playwright.sync_api import sync_playwright


def enter(page, role):
    page.locator('#btn-start').click()
    page.locator('#role-' + role).click()
    page.locator('#btn-deploy').click()
    page.wait_for_function('running')


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--url')
    parser.add_argument('--demo',action='store_true')
    parser.add_argument('--demo-only',action='store_true')
    parser.add_argument('--demo-seed',type=int)
    parser.add_argument('--browser',default=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
    args=parser.parse_args()
    root=Path(__file__).resolve().parents[1]
    out=root/'test-results'/'duel';out.mkdir(parents=True,exist_ok=True)
    report={'simulationSha256':hashlib.sha256((root/'simulation.js').read_bytes()).hexdigest(),'layouts':[],'flows':{},'pageErrors':[]}
    with sync_playwright() as p, ExitStack() as stack:
        if args.url is None:
            class Quiet(SimpleHTTPRequestHandler):
                def log_message(self,*args): pass
            server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
            stack.callback(server.server_close);stack.callback(server.shutdown)
            Thread(target=server.serve_forever,daemon=True).start()
            args.url=f'http://127.0.0.1:{server.server_port}'
        browser=p.chromium.launch(executable_path=args.browser,headless=True)
        stack.callback(browser.close)
        if not args.demo_only:
            for width,height in [(360,800),(390,844),(768,1024),(1440,900),(844,390)]:
                context=browser.new_context(viewport={'width':width,'height':height})
                page=context.new_page();page.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
                page.goto(args.url,wait_until='networkidle')
                assert page.locator('#start-dialog').is_visible()
                assert page.locator('.experiment-settings').evaluate('el=>el.open')
                page.screenshot(animations='disabled',path=str(out/f'start-{width}.png'))
                page.locator('#btn-start').click()
                assert page.locator('#btn-deploy').is_disabled()
                page.locator('#role-rumor').click()
                page.screenshot(animations='disabled',path=str(out/f'roles-{width}.png'))
                page.locator('#btn-deploy').click();page.wait_for_function('running')
                report['layouts'].append(page.evaluate('''() => {
                    const controls=[...document.querySelectorAll('.controls button, .controls summary')].filter(e=>getComputedStyle(e).display!=='none');
                    for(const e of controls){const r=e.getBoundingClientRect();if(r.left<0||r.right>innerWidth)throw new Error('Clipped '+e.id);}
                    if($('hand').getBoundingClientRect().bottom>innerHeight+1)throw new Error('Hand extends outside viewport');
                    if($('stage').clientHeight<120)throw new Error('Network is too short to observe');
                    return {width:innerWidth,height:innerHeight,stage:$('stage').clientHeight,cards:match.player.hand.length};
                }'''))
                if width<760 or height<500:
                    assert not page.locator('#stats-detail').is_visible()
                    page.locator('#btn-stats').click();assert page.locator('#stats-detail').is_visible()
                    page.locator('#btn-stats').click()
                    page.locator('#btn-log').click();assert page.locator('#log').is_visible()
                    assert page.locator('#log-list .log-meta').count()>0
                    page.locator('#btn-log-close').click();assert not page.locator('#log').is_visible()
                page.screenshot(animations='disabled',path=str(out/f'play-{width}.png'))
                if width<760 or height<500: page.locator('#btn-stats').click()
                page.locator('#btn-formulas').click()
                assert page.locator('.formula-block').count()==6
                assert page.locator('#formula-content').evaluate('el=>el.scrollWidth<=el.clientWidth+1')
                page.screenshot(animations='disabled',path=str(out/f'formulas-{width}.png'))
                page.locator('#btn-formulas-close').click()
                if width<760 or height<500: page.locator('#btn-stats').click()
                page.locator('.card-face').first.click();assert page.locator('#card-dialog').is_visible()
                page.locator('#btn-card-close').click()
                context.close()
            print('Layouts and two-step selection passed.',flush=True)
            context=browser.new_context(viewport={'width':1440,'height':900})
            page=context.new_page();page.clock.install();page.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
            page.goto(args.url,wait_until='networkidle');enter(page,'clarify')
            assert page.evaluate("audio.context.state==='running' && audio.played>0")
            page.locator('#btn-pause').click();before=page.evaluate('({t:match.tickCount,elapsed:elapsedMs})')
            page.clock.fast_forward(5000);assert before==page.evaluate('({t:match.tickCount,elapsed:elapsedMs})')
            page.locator('#btn-pause').click()
            page.locator('.card-face').first.click()
            assert page.evaluate('match.paused && readingPaused')
            assert not page.locator('.card-full-rules').evaluate('el=>el.open')
            assert '继续并出牌' in page.locator('#btn-detail-play').text_content()
            page.locator('#btn-card-pause').click();assert not page.evaluate('match.paused')
            page.locator('#btn-card-pause').click()
            assert page.evaluate('match.paused');assert page.locator('#btn-detail-play').is_disabled()
            page.locator('#btn-card-pause').click();assert not page.evaluate('match.paused')
            page.screenshot(animations='disabled',path=str(out/'detail-desktop.png'));page.locator('#btn-card-close').click()
            report['flows']['details_pause']='passed'
            page.locator('#btn-formulas').click()
            assert '0.55' in page.locator('#formula-content').text_content()
            page.locator('#btn-formulas-pause').click();assert page.evaluate('match.paused')
            page.locator('#btn-formulas-pause').click();assert not page.evaluate('match.paused')
            page.locator('#btn-formulas-close').click()
            before=page.locator('#v-strength').text_content()
            page.evaluate("match.apply(match.actors.rumor,{id:'hot',level:1});refresh()")
            assert before!=page.locator('#v-strength').text_content()
            report['flows']['original_formula_visibility_live_parameters_pause']='passed'
            page.clock.run_for(8000)
            assert page.locator('.log-entry.log-observe').count()>0
            assert '相信率' in page.locator('.log-entry.log-observe').first.text_content()
            assert '新增听说' in page.locator('.log-entry.log-observe').first.text_content()
            assert page.locator('.log-entry.log-observe details').first.evaluate('el=>el.open')
            report['flows']['detailed_propagation_bulletins_and_mobile_drawer']='passed'
            state=page.evaluate('({spent:match.player.spent,hand:JSON.stringify(match.player.hand)})')
            page.locator('#btn-fuse').click();page.locator('[data-material]').nth(0).click();page.locator('[data-material]').nth(1).click();page.locator('#btn-fusion-close').click()
            assert state==page.evaluate('({spent:match.player.spent,hand:JSON.stringify(match.player.hand)})')
            page.locator('#btn-fuse').click();page.locator('[data-material]').nth(0).click();page.locator('[data-material]').nth(1).click()
            page.screenshot(animations='disabled',path=str(out/'fusion-desktop.png'));page.locator('#btn-fusion-confirm').click()
            assert page.evaluate('match.player.hand.length===3 && match.player.hand[0].level===2 && match.player.fused===1')
            assert page.evaluate('match.player.spent')==state['spent']+30
            report['flows']['fusion_preview_cancel_confirm']='passed'
            page.evaluate("match.beginEmergency(0);match.event.expires=match.day+.6;refresh()")
            page.locator('[data-event-choice]').first.click();assert page.evaluate('match.event===null')
            page.evaluate("match.beginEmergency(1);match.event.expires=match.day+.6;refresh()")
            page.locator('#btn-event-skip').click();assert page.evaluate('match.event===null')
            page.evaluate("match.beginEmergency(2);match.event.expires=match.day+.6;refresh()")
            page.clock.run_for(9400);assert page.evaluate('match.event===null')
            report['flows']['event_choices_skip_expire']='passed'
            page.locator('#btn-sound').click();page.locator('#btn-mute').click()
            assert page.evaluate('!audio.enabled')
            page.wait_for_function('audio.gain.gain.value===0',timeout=1000)
            page.locator('#volume').evaluate("el=>{el.value='0.35';el.dispatchEvent(new Event('input',{bubbles:true}));}")
            assert page.evaluate('audio.volume')==.35
            page.locator('#btn-mute').click();assert page.evaluate('audio.enabled')
            page.locator('#btn-sound').click()
            report['flows']['audio_activation_mute_volume']='passed'
            page.evaluate('match.finish();refresh()');assert page.locator('#end-dialog').is_visible()
            assert page.locator('#end-grade').text_content() in ['S','A','B','C']
            assert page.locator('#end-chart svg').count()==1
            assert page.locator('.score-details').evaluate('el=>el.open')
            page.screenshot(animations='disabled',path=str(out/'ending-desktop.png'))
            page.locator('#btn-again').click();assert page.locator('#role-step').is_visible()
            page.locator('#btn-deploy').click();page.wait_for_function('running')
            assert page.evaluate("match.role==='rumor' && match.player.fused===0 && speed===1")
            page.clock.fast_forward(151000);assert page.evaluate('running && !match.ended')
            report['flows']['ending_score_replay_no_wallclock_cutoff']='passed'
            context.close()
            print('Cards, fusion, audio, events, pause, end and restart passed.',flush=True)
            context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
            page=context.new_page();page.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
            page.goto(args.url,wait_until='networkidle')
            page.locator('#btn-start').focus();page.keyboard.press('Enter');page.locator('#role-clarify').focus();page.keyboard.press('Enter');page.locator('#btn-deploy').focus();page.keyboard.press('Enter');page.wait_for_function('running')
            page.locator('#net').focus();page.keyboard.press('ArrowRight');assert page.locator('#node-detail').is_visible()
            page.screenshot(animations='disabled',path=str(out/'keyboard-reduced-motion.png'))
            context.close();report['flows']['keyboard_reduced_motion']='passed'
            for width,height in [(1440,900),(390,844),(844,390)]:
                context=browser.new_context(viewport={'width':width,'height':height})
                page=context.new_page();page.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
                page.goto(args.url,wait_until='networkidle');enter(page,'rumor')
                page.evaluate("""() => {
                    startGame({seed:173,scenario:0,difficulty:1,role:'rumor'});match.paused=true;
                    for(const id of ['exams','witness','repost','meme','screenshot'])match.campusEvent(id);
                    for(const type of Object.keys(TYPES)){
                        const n=match.nodes.find(n=>n.type===type);n.aware=true;n.state=['bot','mid','counselor'].includes(type)?2:1;match.say(n,-1);
                    }
                    match.conversation();refresh();
                }""")
                if width<760 or height<500:page.locator('#btn-log').click()
                assert page.locator('.chat-avatar canvas').count()>=8
                assert page.locator('.chat-bubble').count()>=8
                assert page.locator('.log-ambient').count()==5
                assert page.locator('.chat-reply').count()>0
                assert page.locator('.log-observe details:not([open])').count()==0
                assert '虚构' not in page.locator('body').text_content()
                assert '不预测' not in page.locator('body').text_content()
                assert 'undefined' not in page.locator('#log-list').text_content()
                page.screenshot(animations='disabled',path=str(out/f'campus-content-{width}.png'))
                page.locator('#log').screenshot(animations='disabled',path=str(out/f'campus-chat-{width}.png'))
                if width<760 or height<500:page.locator('#btn-log-close').click()
                for role in ['rumor','clarify']:
                    for event_id in range(5):
                        page.evaluate("""args => {
                            startGame({seed:173,scenario:0,difficulty:1,role:args.role});match.paused=true;
                            match.beginEmergency(args.id);match.event.expires=match.day+.6;refresh();
                        }""",{'role':role,'id':event_id})
                        assert page.locator('[data-event-choice]').count()==2
                        assert page.locator('#ev-title').text_content().strip()
                        assert page.locator('#event-toast').evaluate('el=>el.getBoundingClientRect().top>=0')
                        page.locator('#btn-event-skip').click()
                        assert page.evaluate('match.event===null')
                context.close()
            report['flows']['original_chat_avatars_replies_and_all_10_role_emergencies']='passed'
            print('Original campus chat, automatic events and both-role emergencies passed.',flush=True)
        if args.demo or args.demo_only:
            context=browser.new_context(viewport={'width':1440,'height':900},record_video_dir=str(out/'video'),record_video_size={'width':1440,'height':900})
            page=context.new_page();page.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
            page.goto(args.url,wait_until='networkidle');enter(page,'clarify')
            if args.demo_seed is not None:page.evaluate('seed=>startGame({...lastOptions,seed})',args.demo_seed)
            audio_offset=page.evaluate('performance.now()/1000')
            page.evaluate("""() => {
                const dest=audio.context.createMediaStreamDestination();audio.gain.connect(dest);
                window.audioChunks=[];window.demoRecorder=new MediaRecorder(dest.stream,{mimeType:'audio/webm;codecs=opus'});
                demoRecorder.ondataavailable=e=>audioChunks.push(e.data);demoRecorder.start();
            }""")
            page.locator('#btn-speed').click();page.locator('#btn-speed').click()
            began=time.monotonic();next_play=7;captured=False;fused=False;detail=False;formulas=False
            print('Real-time 4x recorded match started.',flush=True)
            while not page.evaluate('match.ended'):
                elapsed=time.monotonic()-began
                assert elapsed<110,'Recorded match did not finish'
                if not detail and elapsed>1.5:
                    page.locator('.card-face').first.click();page.wait_for_timeout(850);page.locator('#btn-card-close').click();detail=True
                if not formulas and elapsed>2.8:
                    page.locator('#btn-formulas').click();page.wait_for_timeout(1000)
                    page.screenshot(animations='disabled',path=str(out/'actual-formulas.png'))
                    page.locator('#btn-formulas-close').click();formulas=True
                if not fused and elapsed>4:
                    page.locator('#btn-fuse').click();page.locator('[data-material]').nth(0).click();page.locator('[data-material]').nth(1).click();page.wait_for_timeout(650);page.locator('#btn-fusion-confirm').click();fused=True
                if elapsed>=next_play:
                    uid=page.evaluate("() => {const c=match.choose(match.player,'smart');return c===null?0:c.uid;}")
                    if uid: page.locator(f'[data-play="{uid}"]').click()
                    next_play=elapsed+3.6
                if not captured and elapsed>18:
                    page.screenshot(animations='disabled',path=str(out/'actual-match.png'));captured=True
                page.wait_for_timeout(150)
            page.screenshot(animations='disabled',path=str(out/'actual-ending.png'))
            report['realTimeDemo']=page.evaluate("({role:match.role,seed:match.seed,day:match.day,playerCards:match.player.played,aiCards:match.opponent.played,fusions:match.player.fused,result:match.result,audioState:audio.context.state,sounds:audio.played,campusEvents:match.ambientHistory,chatMessages:match.messages.filter(m=>m.kind==='quote').length,chatTypes:[...new Set(match.messages.filter(m=>m.kind==='quote').map(m=>m.type))],replies:match.messages.filter(m=>m.kind==='quote'&&m.replyTo>=0).length})")
            report['realTimeDemo']['wallSeconds']=round(time.monotonic()-began,2)
            report['realTimeDemo']['audioOffsetSeconds']=round(audio_offset,3)
            page.wait_for_timeout(2500)
            audio_bytes=page.evaluate("""async () => {
                await new Promise(resolve=>{demoRecorder.onstop=resolve;demoRecorder.stop();});
                return Array.from(new Uint8Array(await new Blob(audioChunks,{type:'audio/webm'}).arrayBuffer()));
            }""")
            (out/'actual-audio.webm').write_bytes(bytes(audio_bytes))
            video=page.video;context.close();video.save_as(str(out/'actual-match.webm'))
            print('Real-time match finished: '+json.dumps(report['realTimeDemo'],ensure_ascii=False),flush=True)
        if args.demo:
            (out/'demo-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        assert not report['pageErrors'],report['pageErrors']
        (out/('demo-report.json' if args.demo_only else 'ui-report.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        print('UI verification passed. Artifacts: '+str(out),flush=True)


if __name__=='__main__':main()
