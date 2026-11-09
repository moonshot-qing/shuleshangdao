"use strict";
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Worker,isMainThread,parentPort,workerData}=require('node:worker_threads');
const source=fs.readFileSync(path.join(__dirname,'../simulation.js'),'utf8');
const {Simulation,CARD_BY_ID,CARD_PARAMS,MODERATION}=new Function(source+';return {Simulation,CARD_BY_ID,CARD_PARAMS,MODERATION};')();
const variants={
  before:{forget:.02,ban:.0012,army:105,pr:110,dig:100,scout:95},
  after:{forget:CARD_PARAMS.cold.forget,ban:MODERATION.rate,army:CARD_BY_ID.army.cost,pr:CARD_BY_ID.pr.cost,dig:CARD_BY_ID.dig.cost,scout:CARD_BY_ID.scout.cost}
};
function play(seed,scenario,role,variant){
  const values=variants[variant];CARD_PARAMS.cold.forget=values.forget;MODERATION.rate=values.ban;
  for(const id of ['army','pr','dig','scout'])CARD_BY_ID[id].cost=values[id];
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
  return {seed,won:g.result.won,belief:g.result.belief,bans:g.banCount,seconds:g.tickCount*.15,
    ending:g.result.key,fusions:g.player.fused,spent:g.player.spent,
    cards:g.actions.filter(a=>!a.fusion).reduce((counts,a)=>{const key=a.side+':'+a.card;counts[key]=(counts[key]||0)+1;return counts;},{})};
}
if(!isMainThread){
  const {variant,scenario,role}=workerData;
  parentPort.postMessage({...workerData,matches:Array.from({length:10},(_,i)=>play(8021+i,scenario,role,variant))});
}else{
  const jobs=[];for(const variant of ['before','after'])for(let scenario=0;scenario<3;scenario++)for(const role of ['rumor','clarify'])jobs.push({variant,scenario,role});
  const rows=[];
  async function lane(){while(jobs.length){const job=jobs.shift();const row=await new Promise((resolve,reject)=>{const worker=new Worker(__filename,{workerData:job});worker.on('message',resolve);worker.on('error',reject);});rows.push(row);console.log(row.variant,row.scenario,row.role,row.matches.filter(m=>m.won).length+'/10');}}
  Promise.all(Array.from({length:4},lane)).then(()=>{
    const report={simulationSha256:crypto.createHash('sha256').update(source).digest('hex'),variants,totalMatches:120,rows,
      method:'Fresh held-out seeds 8021..8030, three scenarios, both player roles, before/after parameter-only variants. Same complete AI and .9-day cadence from day 1.15; seed parity alternates first mover. Choice events expire; no victory-threshold or strategy changes.'};
    const dest=path.join(__dirname,'../test-results/card-balance/micro-balance.json');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
    for(const variant of ['before','after'])for(const role of ['rumor','clarify']){const matches=rows.filter(r=>r.variant===variant&&r.role===role).flatMap(r=>r.matches);console.log('TOTAL',variant,role,matches.filter(m=>m.won).length+'/'+matches.length);}
  });
}
