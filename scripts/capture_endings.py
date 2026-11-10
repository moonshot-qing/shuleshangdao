"""Capture reproducible, naturally completed AI matches for the gameplay document."""
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
    out=root/'screenshots';out.mkdir(exist_ok=True)
    results=[]
    with sync_playwright() as p, ExitStack() as stack:
        class Quiet(SimpleHTTPRequestHandler):
            def log_message(self,*args): pass
        server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
        stack.callback(server.server_close);stack.callback(server.shutdown)
        Thread(target=server.serve_forever,daemon=True).start()
        browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
        stack.callback(browser.close)
        for role,seed,name in [('rumor',9831,'01-传谣者胜利.png'),('clarify',9832,'02-辟谣者胜利.png')]:
            page=browser.new_page(viewport={'width':1440,'height':1200},reduced_motion='reduce')
            page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
            result=page.evaluate("""options => {
                startGame({...options,scenario:0,difficulty:1});
                match.nextAI=100000;let next=1.15;
                const order=options.seed%2===0?['rumor','clarify']:['clarify','rumor'];
                while(!match.ended){
                    match.step();
                    if(!match.ended&&match.day<12&&match.day>=next){
                        const opponent=match.opponent;
                        for(const side of order){match.opponent=match.actors[side];match.aiTurn();}
                        match.opponent=opponent;match.nextAI=100000;next=match.day+.9;
                    }
                }
                elapsedMs=match.tickCount*150;refresh();
                return {seed:match.seed,role:match.role,day:match.day,result:match.result};
            }""",{'seed':seed,'role':role})
            assert result['result']['won'],result
            page.locator('#end-dialog').screenshot(path=str(out/name),animations='disabled')
            results.append({**result,'file':'screenshots/'+name})
            page.close()
    report={'simulationSha256':hashlib.sha256((root/'simulation.js').read_bytes()).hexdigest(),
            'method':'Fixed-seed complete-AI self-play at equal cadence; simulation reaches its natural end. Screenshots are simulated matches, not human play sessions.',
            'screenshots':results}
    (out/'README.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(results,ensure_ascii=True))


if __name__=='__main__':
    main()
