"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {Simulation}=new Function(fs.readFileSync(path.join(__dirname,'../simulation.js'),'utf8')+';return {Simulation};')();
let checks=0;
function create(scenario,role){
  const g=new Simulation({seed:173,scenario,role,difficulty:1});
  g.nextAI=g.nextAmbient=g.nextEvent=g.nextChat=100000;return g;
}
for(let seed=9201;seed<9211;seed++){
  const g=new Simulation({seed,scenario:0,role:'rumor',difficulty:1}),paths=g.weakLinks();
  assert(paths.length>0);assert.equal(new Set(paths.map(p=>p.b)).size,paths.length);
  for(const p of paths){
    assert(g.adj[p.a].includes(p.b));assert.notEqual(g.nodes[p.a].group,g.nodes[p.b].group);
    assert.equal(g.nodes[p.a].state,1);assert(g.nodes[p.b].state!==1);assert(g.nodes[p.b].shieldUntil<=g.day);
  }
  const card=g.newCard('weaktie',1);g.player.hand=[card];assert.equal(g.play(g.player,card.uid),'');
  const action=g.actions[0],particles=g.particles.filter(p=>p.action===action);
  assert.equal(particles.length,Math.min(6,paths.length));assert.deepEqual(action.targets,particles.map(p=>p.b));checks++;
}
{
  const g=create(0,'rumor'),card=g.newCard('weaktie',1);g.player.hand=[card];g.paused=true;
  assert.equal(g.playProblem(g.player,card,true),'');assert(g.play(g.player,card.uid).includes('继续'));assert.equal(g.player.resource,180);
  g.paused=false;for(const n of g.nodes)if(n.state===1)n.state=0;
  assert(g.playProblem(g.player,card).includes('跨圈'));assert.equal(g.play(g.player,card.uid),g.playProblem(g.player,card));assert.equal(g.player.resource,180);checks++;
}
for(const state of [0,1,2]){
  const g=create(0,'rumor'),source=g.nodes[g.scenarioSource];source.state=state;
  for(const n of g.nodes)if(n.active&&n.group!==source.group&&n.type!=='bot')n.state=state===2?1:0;
  g.day=3;g.resolveScenario();
  assert(g.scenarioResolved);
  if(state===0)assert.equal(g.particles.length,0);
  else{
    assert(g.particles.length>0);
    for(const p of g.particles){assert.equal(p.a,source.id);assert(g.adj[p.a].includes(p.b));assert.notEqual(g.nodes[p.b].group,source.group);assert.equal(p.kind,state===1?'rumor':'clarify');}
  }
  checks++;
}
{
  const g=create(0,'rumor');g.day=3;g.nodes[g.scenarioSource].silencedUntil=4;g.resolveScenario();assert.equal(g.particles.length,0);checks++;
}
{
  const g=create(1,'clarify');
  const group=g.nodes.filter(n=>n.active&&n.group===1&&n.type!=='bot');
  for(const n of group.slice(0,6))g.clarify(n.id);
  g.day=3;const counts=g.counts();g.resolveScenario();
  assert.equal(g.scenarioNodes.length,4);assert.deepEqual(g.counts(),counts);
  for(const id of g.scenarioNodes){assert.equal(g.nodes[id].group,1);assert.equal(g.nodes[id].shieldUntil,4.2);}
  checks++;
}
{
  const g=create(2,'rumor'),before=g.counts();g.day=3;g.resolveScenario();const after=g.counts();
  assert.equal(after.total,before.total+g.scenarioNodes.length);assert.equal(after.i,before.i);assert(g.scenarioNodes.length<=6);
  for(const id of g.scenarioNodes){assert(g.nodes[id].active);assert.equal(g.nodes[id].group,2);assert.equal(g.nodes[id].state,0);}
  checks++;
}
{
  const g=create(2,'clarify');g.tickCount=275;g.day=2.75;
  const before=JSON.stringify(g);g.project(g.player,{kind:'wait'},0);assert.equal(JSON.stringify(g),before);checks++;
}
for(let scenario=0;scenario<3;scenario++){
  const g=create(scenario,'rumor');for(let i=0;i<400&&!g.ended;i++)g.step();
  assert(g.scenarioResolved);assert.equal(g.messages.filter(m=>m.kind==='scene').length,1);
  const fresh=create(scenario,'rumor');assert(!fresh.scenarioResolved);assert.deepEqual(fresh.scenarioNodes,[]);checks++;
}
{
  const g=create(0,'rumor');g.opponent=g.player;
  g.player.resource=500;g.player.hand=[g.newCard('army',1),g.newCard('hot',1),g.newCard('farm',1)];
  g.aiTurn();assert.equal(g.player.played,1);assert.equal(g.player.fused,0);assert.equal(g.actions[0].card,'army');checks++;
}
{
  const g=create(0,'rumor'),card=g.newCard('army',1);g.player.hand=[card];g.play(g.player,card.uid);
  for(const n of g.nodes)if(n.state===1)n.silencedUntil=100;
  for(let i=0;i<20;i++)g.step();
  const action=g.actions[0];assert.equal(action.pending,0);assert.equal(action.arrived,action.sent);
  assert.equal(action.changedNodes.length,action.changed+action.immediate);
  assert(action.changedNodes.every(id=>action.targets.includes(id)));
  g.finish();assert.equal(g.result.intervention.changed,action.changed+action.immediate);checks++;
}
{
  const g=create(0,'rumor');g.day=7.35;g.player.played=6;g.postPeak=.42;
  const expected={known:100-6*4-7.35*3,cradle:115-7.35*8-6*3,rebound:110+.42*40-7.35*2,meme:95-7.35*3-6*3,fade:55,stalemate:35};
  for(const [key,raw] of Object.entries(expected))for(const won of [false,true]){
    const score=g.archiveScore(key,won);assert.equal(score.score,Math.max(10,Math.min(100,Math.round(raw+(won?15:0)))));
    assert(Math.abs(score.parts.reduce((sum,p)=>sum+p.value,0)-score.score)<1e-8);assert(score.reason.length>0);checks++;
  }
}
console.log('Judging improvements passed: '+checks+' bridge, scene, pause-preview, attribution, reset and score scenarios.');
