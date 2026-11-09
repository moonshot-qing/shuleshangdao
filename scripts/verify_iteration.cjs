"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {Simulation,CARD_DEFS,EMERGENCIES,EMERGENCY_RULES,cardStats,cardUpgradeSummary}=new Function(fs.readFileSync(path.join(__dirname,'../simulation.js'),'utf8')+';return {Simulation,CARD_DEFS,EMERGENCIES,EMERGENCY_RULES,cardStats,cardUpgradeSummary};')();
let checks=0;
function create(role){const g=new Simulation({seed:173,scenario:0,difficulty:1,role});g.nextAI=g.nextAmbient=g.nextEvent=g.nextChat=10000;return g;}
for(const role of ['rumor','clarify'])for(let id=0;id<5;id++)for(let choice=0;choice<2;choice++){
  const g=create(role);g.beginEmergency(id);g.nextEvent=10000;
  assert(!g.eventPreview(choice).includes('undefined'));assert(g.eventContext().includes('音乐节'));
  const before=g.player.resource;g.paused=true;assert(g.chooseEvent(choice).includes('继续'));assert.equal(g.player.resource,before);
  const deadline=g.event.expires;g.step();assert.equal(g.event.expires,deadline);assert.equal(g.tickCount,0);g.paused=false;
  assert.equal(g.chooseEvent(choice),'');assert.equal(g.event,null);
  for(let i=0;i<105;i++)g.step();
  if((id===2||id===4)&&choice===1)assert.equal(g.eventFollowups.length,0);
  else{
    assert.equal(g.eventFollowups.length,0);assert(g.messages.some(m=>m.kind==='event-followup'&&m.text.includes(EMERGENCIES[id].title[role])));
    assert(g.messages.some(m=>m.kind==='quote'&&m.type==='bot'));
  }
  assert(Math.abs(g.player.income-g.player.spent-g.player.resource)<1e-8);checks++;
}
for(const [side,id] of [['rumor','hot'],['rumor','army'],['rumor','farm'],['clarify','cold']]){
  const g=create(side);g.player.resource=600;g.banRisk=38;g.player.hand=[g.newCard(id,1)];
  const card=g.player.hand[0],preview=g.riskPreview(card,side);assert.equal(g.play(g.player,card.uid),'');
  assert.equal(g.banRisk,preview.after);assert.equal(g.moderation().chance,preview.afterChance);checks++;
}
{
  const g=create('clarify');g.beginEmergency(2);g.nextEvent=10000;const source=g.event.source;
  g.chooseEvent(0);g.clarify(source);for(let i=0;i<71;i++)g.step();
  assert(g.messages.some(m=>m.kind==='event-followup'&&m.text.includes('没有产生额外转述')));checks++;
}
{
  const g=create('rumor');g.banRisk=70;g.beginEmergency(1);g.nextEvent=10000;g.chooseEvent(0);g.heat=.2;
  for(let i=0;i<100;i++)g.step();
  assert(g.messages.some(m=>m.kind==='event-followup'&&m.text.includes('封号风险再降低')));assert(g.banRisk<=20.000001);checks++;
}
{
  const g=create('clarify');g.beginEmergency(0);g.chooseEvent(1);const before=JSON.stringify(g);
  g.scoreActions(g.player,[{kind:'wait'}]);assert.equal(JSON.stringify(g),before);checks++;
  g.finish();assert(g.result.moments.length<=3);assert(g.messages.some(m=>m.text.includes('尚未发生')));checks++;
}
{
  const g=create('rumor');g.beginEmergency(0);const resource=g.player.resource;
  for(let i=0;i<121;i++)g.step();
  assert.equal(g.event,null);assert.equal(g.emergencyHistory.at(-1).choice,'expired');assert(g.player.resource>=resource);checks++;
}
{
  const g=create('rumor'),card=g.newCard('pr',3);g.player.resource=600;g.player.hand=[card];
  assert.equal(g.play(g.player,card.uid),'');
  assert.equal(g.nodes.filter(n=>n.boostUntil>g.day).length,cardStats(card).amount);
  assert(!cardUpgradeSummary({id:'pr',level:2}).some(text=>text.startsWith('目标人数')));checks++;
}
console.log(`Iteration behavior passed: ${checks} event/risk/projection/recap scenarios.`);
