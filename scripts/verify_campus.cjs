"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'simulation.js'),'utf8');
const {Simulation,QUOTES,CAMPUS_EVENTS,EMERGENCIES}=new Function(source+';return {Simulation,QUOTES,CAMPUS_EVENTS,EMERGENCIES};')();
const old=execFileSync('git',['show','6a1d474:game.js'],{cwd:root,encoding:'utf8'});
const block=old.slice(old.indexOf('const QUOTES ='),old.indexOf('\n};',old.indexOf('const QUOTES ='))+3);
const original=new Function(block+';return QUOTES;')();let checks=0;
const create=role=>new Simulation({seed:173,scenario:0,difficulty:1,role});
const near=(a,b)=>assert(Math.abs(a-b)<1e-10);
assert.deepEqual(QUOTES,original);assert.equal(Object.values(QUOTES).flat().length,41);checks+=2;
const originalEvents=old.slice(old.indexOf('const EVENTS ='),old.indexOf('\n];',old.indexOf('const EVENTS ='))+3);
assert.deepEqual(CAMPUS_EVENTS.map(e=>e.name),[...originalEvents.matchAll(/name: "([^"]+)"/g)].map(m=>m[1]));checks++;
const originalEmergencies=old.slice(old.indexOf('const EMERGENCIES ='),old.indexOf('\n];',old.indexOf('const EMERGENCIES ='))+3);
assert.deepEqual(EMERGENCIES.map(e=>e.title.rumor),[...originalEmergencies.matchAll(/title: "([^"]+)"/g)].map(m=>m[1]));checks++;
for(const [type,lines] of Object.entries(QUOTES))for(let i=0;i<lines.length;i++){
  const g=create('rumor'),n=g.nodes.find(n=>n.type===type);n.state=type==='bot'?2:1;g.chatRandom=()=>i/lines.length;
  g.say(n,-1);const message=g.messages.at(-1);
  assert.equal(message.text,lines[i]);assert.equal(message.type,type);assert.equal(message.speaker,n.id);checks++;
}
{
  const g=create('rumor'),h=create('rumor'),before=JSON.stringify({nodes:g.nodes,particles:g.particles,effects:g.effects,actors:g.actors});
  for(let i=0;i<30;i++)g.conversation();
  assert.equal(JSON.stringify({nodes:g.nodes,particles:g.particles,effects:g.effects,actors:g.actors}),before);
  near(g.random(),h.random());near(g.eventRandom(),h.eventRandom());
  const messages=g.messages.filter(m=>m.kind==='quote');assert(messages.length>30);assert(new Set(messages.map(m=>m.type)).size>=2);
  for(const m of messages){assert(g.nodes[m.speaker].active);if(m.replyTo>=0)assert(g.adj[m.replyTo].includes(m.speaker));}
  const n=g.nodes.find(n=>n.type==='crowd');n.state=2;assert(!g.chatLines(n).includes('反正我是不信官方那套说辞'));checks+=6;
}
{
  const g=create('rumor'),f=g.formulas(),heat=g.heat;g.campusEvent('exams');near(g.heat,heat*.55);near(g.formulas().multiplier,f.multiplier*.7);near(g.examUntil,2);checks+=3;
}
{
  const g=create('rumor'),f=g.formulas();g.campusEvent('repost');near(g.formulas().multiplier,f.multiplier*1.4);near(g.mediaUntil,1.5);assert(g.heat>g.formulas().belief);checks+=3;
}
{
  const g=create('rumor'),f=g.formulas();g.campusEvent('meme');near(g.formulas().forget,f.forget*3);near(g.memeUntil,3);assert(g.ambiguity<f.a);checks+=3;
}
{
  const g=create('rumor');g.eventRandom=()=>0;const before=g.counts().i;g.campusEvent('witness');assert.equal(g.counts().i,0);assert.equal(g.activity.clarified,before);assert(g.messages.at(-1).text.includes(`${before} 人`));checks+=3;
}
{
  const g=create('rumor'),before=g.counts().i,protectedNode=g.nodes.find(n=>n.active&&n.type==='crowd');protectedNode.shieldUntil=2;
  g.campusEvent('screenshot');assert.equal(g.counts().i-before,5);assert.equal(protectedNode.state,0);assert.equal(g.activity.believed,5);checks+=3;
}
for(const role of ['rumor','clarify'])for(let id=0;id<5;id++)for(let choice=0;choice<2;choice++){
  const g=create(role);g.player.resource=12;g.player.income=12;g.beginEmergency(id);
  g.chooseEvent(choice);
  assert.equal(g.event,null);assert(g.player.resource>=0);near(g.player.income-g.player.spent,g.player.resource);
  assert(g.messages.at(-1).text.includes(EMERGENCIES[id].title[role]));
  if(id===4&&choice===1){assert(g.reversalAt>g.day);assert.equal(g.reversalAmount,7);}
  if(id===1&&choice===0)assert.equal(g.player.resource,0);
  checks++;
}
{
  const g=create('rumor');g.nextAmbient=0;g.step();assert.equal(g.ambientHistory.length,1);assert(g.messages.some(m=>m.kind==='ambient'));
  g.paused=true;const before=JSON.stringify(g.messages);g.step();assert.equal(JSON.stringify(g.messages),before);checks+=3;
}
console.log(`Campus content passed: ${checks} checks; all 41 original lines, 5 automatic events and 5 emergencies retained.`);
