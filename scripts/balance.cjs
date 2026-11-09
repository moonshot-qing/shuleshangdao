"use strict";
const fs=require('node:fs'),path=require('node:path');
const {Simulation:Model,CARD_BY_ID}=new Function(fs.readFileSync(path.join(__dirname,'../simulation.js'),'utf8')+';return {Simulation,CARD_BY_ID};')();
function play(seed,scenario,role,difficulty,policy){
  const g=new Model({seed,scenario,difficulty,role});
  if(policy==='fusion'){
    const main=g.player.hand.find(c=>CARD_BY_ID[c.id].category==='行动');
    const aux=g.player.hand.find(c=>CARD_BY_ID[c.id].category==='应对');
    g.fuse(g.player,main.uid,aux.uid);
  }
  while(!g.ended){
    if(g.tickCount%90===0&&policy!=='idle'){const card=g.choose(g.player,policy==='fusion'?'smart':policy);if(card!==null)g.play(g.player,card.uid);}
    g.step();
  }
  return {won:g.result.won,belief:g.result.belief,seconds:g.tickCount*.15,ending:g.result.key,playerCards:g.player.played,aiCards:g.opponent.played,campusEvents:g.ambientHistory.map(e=>e.id),chatMessages:g.messages.filter(m=>m.kind==='quote').length,chatTypes:[...new Set(g.messages.filter(m=>m.kind==='quote').map(m=>m.type))]};
}
function summarize(samples){
  const n=samples.length,wins=samples.filter(s=>s.won).length,p=wins/n,z=1.96,d=1+z*z/n;
  const mid=(p+z*z/(2*n))/d,half=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;
  const times=samples.map(s=>s.seconds).sort((a,b)=>a-b);
  return {n,wins,winRate:p,confidence95:[mid-half,mid+half],meanBelief:samples.reduce((n,s)=>n+s.belief,0)/n,meanSeconds:times.reduce((n,s)=>n+s,0)/n,p95Seconds:times[Math.floor(.95*(n-1))],playerCards:samples.reduce((n,s)=>n+s.playerCards,0)/n,aiCards:samples.reduce((n,s)=>n+s.aiCards,0)/n,endings:samples.reduce((o,s)=>{o[s.ending]=(o[s.ending]||0)+1;return o;},{}),campusEvents:samples.flatMap(s=>s.campusEvents).reduce((o,id)=>{o[id]=(o[id]||0)+1;return o;},{}),meanChatMessages:samples.reduce((n,s)=>n+s.chatMessages,0)/n,chatTypes:[...new Set(samples.flatMap(s=>s.chatTypes))]};
}
const {Worker,isMainThread,parentPort,workerData}=require('node:worker_threads');
const crypto=require('node:crypto');
function measure(job){
  const {kind,scenario,role,difficulty,policy,n,firstSeed}=job;
  const samples=Array.from({length:n},(_,i)=>play(i+firstSeed,kind==='policyComparison'?i%3:scenario,role,difficulty,policy));
  return {kind,row:{scenario,role,difficulty,policy,...summarize(samples)}};
}
if(!isMainThread){parentPort.postMessage(measure(workerData));}
else{
  const jobs=[];
  for(let scenario=0;scenario<3;scenario++)for(const role of ['rumor','clarify']){
    jobs.push({kind:'standard',scenario,role,difficulty:1,policy:'smart',n:100,firstSeed:1});
  }
  for(const difficulty of [0,2])for(let scenario=0;scenario<3;scenario++)for(const role of ['rumor','clarify']){
    jobs.push({kind:'otherDifficulties',difficulty,scenario,role,policy:'smart',n:30,firstSeed:101});
  }
  for(const role of ['rumor','clarify'])for(const policy of ['smart','random','idle','fusion']){
    jobs.push({kind:'policyComparison',role,policy,difficulty:1,n:90,firstSeed:3001});
  }
  const report={date:'2026-11-09',simulationSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../simulation.js'))).digest('hex'),threshold:Model.WIN_THRESHOLD,totalMatches:1680,standard:[],otherDifficulties:[],policyComparison:[]};
  async function lane(){
    while(jobs.length){
      const job=jobs.shift();
      const result=await new Promise((resolve,reject)=>{
        const worker=new Worker(__filename,{workerData:job});worker.on('message',resolve);worker.on('error',reject);
      });
      report[result.kind].push(result.row);
      console.log(result.kind,job.kind==='policyComparison'?'mixed':job.scenario,job.role,job.policy,result.row.wins+'/'+job.n);
    }
  }
  Promise.all(Array.from({length:8},lane)).then(()=>{
    for(const key of ['standard','otherDifficulties','policyComparison'])report[key].sort((a,b)=>JSON.stringify([a.difficulty,a.scenario,a.role,a.policy]).localeCompare(JSON.stringify([b.difficulty,b.scenario,b.role,b.policy])));
    const out=path.join(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'balance-report.json'),JSON.stringify(report,null,2)+'\n');
    console.log('Saved test-results/balance-report.json; total matches: 1680.');
  });
}
