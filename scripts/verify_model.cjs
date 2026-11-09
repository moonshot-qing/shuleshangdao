"use strict";
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {Simulation,CARD_DEFS,CARD_BY_ID,cardStats,cardDescription,MODEL_RATES}=new Function(fs.readFileSync(path.join(__dirname,'../simulation.js'),'utf8')+';return {Simulation,CARD_DEFS,CARD_BY_ID,cardStats,cardDescription,MODEL_RATES};')();
const create=role=>new Simulation({seed:73,scenario:0,difficulty:1,role});
let checks=0;
for(const role of ['rumor','clarify']){
  const g=create(role),a=g.player;
  assert.equal(a.hand.length,4);
  for(const category of ['行动','应对','资源'])assert(a.hand.some(c=>CARD_BY_ID[c.id].category===category));
  assert(a.hand.some(c=>g.playProblem(a,c)===''));
  assert(a.hand.every(c=>CARD_BY_ID[c.id].side===role||CARD_BY_ID[c.id].side==='both'));
  const chosen=a.hand[0],aux=a.hand[1],rest=a.hand.slice(2).map(c=>c.uid),resource=a.resource;
  a.cooldown[chosen.id]=4;
  assert.equal(g.fuse(a,chosen.uid,aux.uid),'');
  assert.equal(chosen.level,2);assert.equal(a.hand.length,3);assert.equal(a.resource,resource-30);assert.equal(a.cooldown[chosen.id],4);
  assert(!a.hand.some(c=>c.uid===aux.uid));assert(rest.every(uid=>a.hand.some(c=>c.uid===uid)));
  assert(g.playProblem(a,chosen).includes('冷却'));
  assert(g.fusionProblem(a,chosen.uid,a.hand[1].uid).includes('相同'));
  g.day=5;a.resource=300;
  assert.equal(g.play(a,chosen.uid),'');assert(a.hand.some(c=>c.uid===chosen.uid&&c.level===2));
  assert(g.playProblem(a,chosen).includes('同名冷却'));checks+=3;
  chosen.level=3;assert(g.fusionProblem(a,chosen.uid,a.hand[1].uid).includes('上限'));
  checks+=11;
}
{
  const g=create('clarify'),a=g.player;
  for(const n of g.nodes)if(n.active&&n.type!=='bot')g.infect(n.id);
  g.heat=1;g.peak=.8;a.hand=[g.newCard('debunk',1)];
  assert.equal(g.play(a,a.hand[0].uid),'');assert.equal(g.reversalAt,-1);
  for(let i=0;i<21;i++)g.step();assert(g.nodes.some(n=>n.type!=='bot'&&n.shieldUntil>g.day));checks+=3;
}
{
  const g=create('rumor'),a=g.player;a.hand=[g.newCard('hot',1),g.newCard('hot',1)];
  assert.equal(g.play(a,a.hand[0].uid),'');
  assert(g.playProblem(a,a.hand[0]).includes('同名冷却'));
  const before=a.hand.length;a.resource=0;assert(g.play(a,a.hand[0].uid).includes('还需'));assert.equal(a.hand.length,before);
  g.paused=true;const t=g.tickCount;g.step();assert.equal(g.tickCount,t);checks+=5;
}
for(const d of CARD_DEFS)for(let level=1;level<=3;level++){
  const card={id:d.id,level};assert(!cardDescription(card).includes('{'));assert(cardStats(card).cost>=d.cost);checks++;
}
{
  const g=create('rumor');for(const n of g.nodes)if(n.state===1)n.silencedUntil=10;
  const target=g.nodes.find(n=>n.active&&n.type==='crowd'&&!n.aware);
  g.send(5,target.id,'rumor',0);for(let i=0;i<20;i++)g.step();
  assert(target.aware);assert.equal(target.state,0);checks+=2;
}
function run(seed){
  const g=new Simulation({seed,scenario:1,difficulty:1,role:'clarify'});
  while(!g.ended){if(g.tickCount%90===0){const c=g.choose(g.player,'smart');if(c!==null)g.play(g.player,c.uid);}g.step();}
  assert(g.nodes.filter(n=>n.type==='bot').every(n=>n.state===2));
  for(const a of Object.values(g.actors)){assert(a.resource>=0);assert(Math.abs(a.income-a.spent-a.resource)<1e-7);assert.equal(new Set(a.hand.map(c=>c.uid)).size,a.hand.length);}
  assert(g.tickCount<=1350);assert(g.opponent.played>0);assert(g.samples.length>2);assert.equal(g.result.winner,g.result.belief>=Simulation.WIN_THRESHOLD?'rumor':'clarify');
  return JSON.stringify({samples:g.samples,result:g.result,actions:g.actions});
}
assert.equal(run(9191),run(9191));assert.notEqual(run(9191),run(9192));checks+=13;
{
  const g=create('clarify');
  const before=JSON.stringify({nodes:g.nodes,effects:g.effects,particles:g.particles,resource:g.player.resource,hand:g.player.hand});
  Object.defineProperty(g.opponent,'hand',{get(){throw new Error('AI must not inspect the opposing hand');}});
  g.choose(g.player,'smart');
  assert.equal(JSON.stringify({nodes:g.nodes,effects:g.effects,particles:g.particles,resource:g.player.resource,hand:g.player.hand}),before);checks++;
}
{
  const g=create('rumor'),near=(a,b)=>assert(Math.abs(a-b)<1e-12);
  let f=g.formulas();near(f.strength,f.i*f.a);near(f.heatFactor,.5+1.5*g.heat);
  near(f.spread,MODEL_RATES.spread*f.i*(.5+.5*f.a)*f.heatFactor);
  near(f.voice,Math.max(.2,1.2-f.belief));near(f.forget,.0028);near(f.official,.55*g.trust+.2);
  const old=f;g.apply(g.player,{id:'hot',level:1});f=g.formulas();assert(f.strength>old.strength);assert(f.spread>old.spread);
  g.apply(g.player,{id:'control',level:1});f=g.formulas();near(f.voice,old.voice*.3);
  const target=g.nodes.find(n=>n.active&&n.type==='crowd'),counselor=g.nodes.find(n=>n.type==='counselor'),bot=g.nodes.find(n=>n.type==='bot'),mid=g.nodes.find(n=>n.type==='mid');
  near(g.naturalClarify(counselor,target,f),MODEL_RATES.clarify*1.2);near(g.naturalClarify(mid,target,f),MODEL_RATES.clarify*.4*f.voice);
  for(const n of g.nodes)if(n.type==='troll')n.state=0;
  near(g.naturalClarify(bot,target,f),MODEL_RATES.clarify*f.voice);
  const troll=g.nodes.find(n=>n.type==='troll');troll.active=true;troll.state=1;g.adj[target.id].push(troll.id);
  near(g.naturalClarify(bot,target,f),MODEL_RATES.clarify*f.voice*.5);
  const controlled=g.formulas().voice;g.apply(g.actors.clarify,{id:'chot',level:1});f=g.formulas();near(f.voice,Math.min(2,controlled+.8));
  near(g.naturalClarify(bot,target,f),MODEL_RATES.clarify*f.voice*.5*2);
  const official=f.official;g.apply(g.actors.clarify,{id:'cold',level:1});f=g.formulas();near(f.official,official+.25);near(f.forget,.016);
  g.campusEvent('meme');near(g.formulas().forget,.048);
  g.particles=[];const probability=g.formulas().official,ambiguity=g.ambiguity;
  g.apply(g.actors.clarify,{id:'debunk',level:1});assert(g.particles.length>0);assert(g.particles.every(p=>p.chance===probability));assert(g.ambiguity<ambiguity);
  const script=g.newCard('script',1);g.actors.rumor.hand.push(script);
  const before=JSON.stringify({a:g.ambiguity,m:g.memeUntil,n:g.nodes});g.project(g.actors.rumor,{kind:'play',uid:script.uid},0);
  assert.equal(JSON.stringify({a:g.ambiguity,m:g.memeUntil,n:g.nodes}),before);checks+=22;
}
{
  const g=create('rumor');g.nextAI=1000;g.nextEvent=1000;
  g.nodes.forEach(n=>{n.state=n.type==='bot'?2:0;n.aware=false;});g.adj=g.nodes.map(()=>[]);g.resetActivity();
  const source=g.nodes.find(n=>n.type==='mkt'),target=g.nodes.find(n=>n.active&&n.type==='crowd'&&n.group!==source.group);
  g.send(source.id,target.id,'rumor',1);for(let i=0;i<20;i++)g.step();
  assert.equal(g.activity.heard,1);assert.equal(g.activity.believed,1);assert.equal(g.activity.cross,1);
  const bot=g.nodes.find(n=>n.type==='bot');g.send(bot.id,target.id,'clarify',1);for(let i=0;i<20;i++)g.step();
  assert.equal(g.activity.clarified,1);assert.equal(target.state,2);
  for(let i=0;i<10;i++)g.step();const news=g.messages.find(m=>m.kind==='observe');
  assert(news.text.includes('开始相信 1 人次'));assert(news.text.includes('核实 1 人次'));assert.equal(g.activity.arrived,0);checks+=8;
}
console.log(`Model rules passed: ${checks} checks; deterministic replay and complete matches verified.`);
