"use strict";
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Worker,isMainThread,parentPort,workerData}=require('node:worker_threads');
const source=fs.readFileSync(path.join(__dirname,'../simulation.js'),'utf8');
const {Simulation,CARD_PARAMS,MODERATION}=new Function(source+';return {Simulation,CARD_PARAMS,MODERATION};')();
const variants={current:{forget:.02,ban:.0012},noBan:{forget:.02,ban:0},softerCold:{forget:.008,ban:.0012},both:{forget:.008,ban:0}};
function play(seed,scenario,role,variant){
  CARD_PARAMS.cold.forget=variants[variant].forget;MODERATION.rate=variants[variant].ban;
  const g=new Simulation({seed,scenario,role,difficulty:1});g.nextAI=100000;let next=1.15;
  const order=seed%2===0?['rumor','clarify']:['clarify','rumor'];
  while(!g.ended){
    g.step();
    if(!g.ended&&g.day<12&&g.day>=next){
      const opponent=g.opponent;
      for(const side of order){g.opponent=g.actors[side];g.aiTurn();}
      g.opponent=opponent;g.nextAI=100000;next=g.day+.9;
    }
  }
  return {won:g.result.won,belief:g.result.belief,bans:g.banCount,ending:g.result.key,
    actions:g.actions.filter(a=>!a.fusion).map(a=>({side:a.side,card:a.card})),fusions:g.player.fused,seconds:g.tickCount*.15};
}
if(!isMainThread){
  const {variant,scenario,role}=workerData;
  const matches=Array.from({length:10},(_,index)=>play(8001+index,scenario,role,variant));
  parentPort.postMessage({variant,scenario,role,n:matches.length,wins:matches.filter(m=>m.won).length,
    meanBelief:matches.reduce((n,m)=>n+m.belief,0)/matches.length,meanBans:matches.reduce((n,m)=>n+m.bans,0)/matches.length,
    meanFusions:matches.reduce((n,m)=>n+m.fusions,0)/matches.length,
    cards:matches.flatMap(m=>m.actions).reduce((counts,a)=>{const key=a.side+':'+a.card;counts[key]=(counts[key]||0)+1;return counts;},{})});
}else{
  const jobs=[];for(const variant of Object.keys(variants))for(let scenario=0;scenario<3;scenario++)for(const role of ['rumor','clarify'])jobs.push({variant,scenario,role});
  const rows=[];
  async function lane(){while(jobs.length){const job=jobs.shift();const row=await new Promise((resolve,reject)=>{const w=new Worker(__filename,{workerData:job});w.on('message',resolve);w.on('error',reject);});rows.push(row);console.log(job.variant,job.scenario,job.role,row.wins+'/'+row.n);}}
  Promise.all(Array.from({length:4},lane)).then(()=>{
    const report={simulationSha256:crypto.createHash('sha256').update(source).digest('hex'),variants,totalMatches:240,rows,
      method:'Same current AI for both actors, same .9-day cadence from day 1.15, seed parity alternates first mover. 8001..8010 x 3 scenarios x 2 player roles x 4 parameter variants. Choice events expire. Parameter variants are analysis only; production source unchanged.'};
    fs.mkdirSync(path.join(__dirname,'../test-results/card-balance'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../test-results/card-balance/ablations.json'),JSON.stringify(report,null,2)+'\n');
    for(const variant of Object.keys(variants))for(const role of ['rumor','clarify']){const sample=rows.filter(r=>r.variant===variant&&r.role===role);console.log('TOTAL',variant,role,sample.reduce((n,r)=>n+r.wins,0)+'/'+sample.reduce((n,r)=>n+r.n,0));}
  });
}
