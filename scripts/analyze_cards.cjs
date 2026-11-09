"use strict";
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'../simulation.js'),'utf8');
const {Simulation,CARD_DEFS,CARD_BY_ID,cardStats,seededRandom,FUSION_COSTS}=new Function(source+';return {Simulation,CARD_DEFS,CARD_BY_ID,cardStats,seededRandom,FUSION_COSTS};')();
const phases=[1,5,9],out=path.join(__dirname,'../test-results/card-balance');
fs.mkdirSync(out,{recursive:true});
function capture(g){
  const actors=Object.fromEntries(Object.entries(g.actors).map(([side,a])=>[side,{...a,random:null,decisionRandom:null}]));
  return structuredClone({...g,actors,player:null,opponent:null,random:null,eventRandom:null,chatRandom:null,moderationRandom:null});
}
function restore(data,seed){
  const g=Object.assign(Object.create(Simulation.prototype),structuredClone(data));
  g.random=seededRandom(seed);g.moderationRandom=seededRandom(seed^0x732acd);
  g.eventRandom=seededRandom(seed^0x4e83a9);g.chatRandom=seededRandom(seed^0x63b91f);
  for(const [side,a] of Object.entries(g.actors)){a.random=seededRandom(seed^(side==='rumor'?0x183abc:0x781cde));a.decisionRandom=seededRandom(seed^0x1231);}
  g.player=g.actors[g.role];g.opponent=g.actors[g.role==='rumor'?'clarify':'rumor'];
  g.nextAI=g.nextAmbient=g.nextEvent=g.nextChat=100000;g.event=null;
  g.player.resource=600;g.player.cooldown=Object.fromEntries(CARD_DEFS.map(d=>[d.id,0]));
  return g;
}
function observe(g,endTick){
  let total=g.pressure(),n=1;
  while(!g.ended&&g.tickCount<endTick){g.step();if(g.tickCount%25===0){total+=g.pressure();n++;}}
  const c=g.counts();
  return {pressure:g.pressure()*.6+total/n*.4,belief:c.i/c.total,resource:g.player.resource,bans:g.banCount,
    direct:g.actions.filter(a=>!a.fusion).reduce((sum,a)=>sum+a.changed+a.immediate,0)};
}
const observations=[],combos=[],timing=[],coverage=[];
let snapshots=0,branches=0;
for(let scenario=0;scenario<3;scenario++)for(let index=0;index<8;index++){
  const seed=5001+index,role=index%2===0?'rumor':'clarify';
  const g=new Simulation({seed,scenario,difficulty:1,role});let phaseIndex=0;
  while(!g.ended&&phaseIndex<phases.length){
    if(g.tickCount%90===0){const card=g.choose(g.player,'weighted');if(card!==null)g.play(g.player,card.uid);}
    g.step();
    if(g.day<phases[phaseIndex])continue;
    const phase=phases[phaseIndex++],data=capture(g),sign=role==='rumor'?1:-1;
    snapshots++;const c=g.counts();coverage.push({seed,scenario,role,phase,believers:c.i,population:c.total});
    const began=performance.now();g.scoreActions(g.player,[{kind:'wait'}]);timing.push(performance.now()-began);
    for(let trial=0;trial<3;trial++){
      const trialSeed=seed*131+scenario*701+trial*9137+phase*1751,endTick=Math.min(1350,data.tickCount+400);
      const base=observe(restore(data,trialSeed),endTick);
      for(const d of CARD_DEFS.filter(d=>d.side===role||d.side==='both'))for(let level=1;level<=3;level++){
        const fork=restore(data,trialSeed),card=fork.newCard(d.id,level);fork.player.hand=[card];
        const problem=fork.playProblem(fork.player,card);if(problem!==''){observations.push({id:d.id,level,phase,role,legal:false,problem});continue;}
        fork.play(fork.player,card.uid);const result=observe(fork,endTick);branches++;
        observations.push({id:d.id,level,phase,role,legal:true,deltaPressure:(result.pressure-base.pressure)*sign,
          deltaBeliefPoints:(result.belief-base.belief)*sign*100,netResources:result.resource-base.resource,
          deltaBans:result.bans-base.bans,direct:result.direct-base.direct,cost:cardStats(card).cost});
      }
      const pair=role==='rumor'?['hot','army']:['cold','debunk'];
      for(const delay of [10,90]){
        const results=[];
        for(const plan of [[{at:0,id:pair[0]}],[{at:delay,id:pair[1]}],[{at:0,id:pair[0]},{at:delay,id:pair[1]}]]){
          const fork=restore(data,trialSeed),start=fork.tickCount;let valid=true;
          for(const move of plan){
            while(!fork.ended&&fork.tickCount<start+move.at)fork.step();
            const card=fork.newCard(move.id,1);fork.player.hand.push(card);
            if(fork.playProblem(fork.player,card)!==''){valid=false;break;}
            fork.play(fork.player,card.uid);
          }
          if(valid){const result=observe(fork,endTick);results.push((result.pressure-base.pressure)*sign);}else results.push(null);
          branches++;
        }
        if(results.every(value=>value!==null))combos.push({pair:pair.join('+'),phase,delayDays:delay/100,
          gain:results[2],synergy:results[2]-results[0]-results[1]});
      }
    }
  }
  console.log(`scenario ${scenario}, seed ${seed}, ${role}: ${phaseIndex} snapshots`);
}
const mean=(rows,key)=>rows.reduce((sum,row)=>sum+row[key],0)/rows.length;
const cards=[];
for(const d of CARD_DEFS)for(let level=1;level<=3;level++)for(const phase of phases){
  const rows=observations.filter(row=>row.id===d.id&&row.level===level&&row.phase===phase),legal=rows.filter(row=>row.legal);
  if(legal.length===0){cards.push({id:d.id,name:d.name,level,phase,n:0,blocked:rows.length});continue;}
  cards.push({id:d.id,name:d.name,level,phase,n:legal.length,blocked:rows.length-legal.length,
    cost:cardStats({id:d.id,level}).cost,meanPressure:mean(legal,'deltaPressure'),meanBeliefPoints:mean(legal,'deltaBeliefPoints'),
    pressurePer100Cost:mean(legal,'deltaPressure')*100/cardStats({id:d.id,level}).cost,
    meanNetResources:mean(legal,'netResources'),meanDirect:mean(legal,'direct'),meanExtraBans:mean(legal,'deltaBans'),
    positiveFraction:legal.filter(row=>row.deltaPressure>0).length/legal.length});
}
const comboSummary=[];
for(const pair of ['hot+army','cold+debunk'])for(const delayDays of [.1,.9]){
  const rows=combos.filter(row=>row.pair===pair&&row.delayDays===delayDays);
  comboSummary.push({pair,delayDays,n:rows.length,meanPressure:mean(rows,'gain'),meanSynergy:mean(rows,'synergy')});
}
timing.sort((a,b)=>a-b);
const report={simulationSha256:crypto.createHash('sha256').update(source).digest('hex'),snapshots,branches,coverage,cards,combos:comboSummary,
  projectionSixRunsMs:{median:timing[Math.floor(timing.length/2)],p95:timing[Math.floor(timing.length*.95)]},
  method:'24 fixed-seed actual matches; weighted player vs current AI; events expire without response. Capture day 1/5/9 when alive. Per snapshot 3 independent paired RNG trials, one card vs no-card over up to 4 simulated days. Branches freeze new AI/events, retain publicly scheduled followups, set acting resource=600 and cooldown ready. II/III constructed directly, fusion investment not charged here; this is conditional effect analysis, not win rate. Combos use .1/.9-day delay.'};
fs.writeFileSync(path.join(out,'analysis.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({snapshots,branches,timing:report.projectionSixRunsMs,combos:comboSummary}));
