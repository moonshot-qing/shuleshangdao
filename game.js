"use strict";

const $=id=>document.getElementById(id);
const canvas=$('net'),ctx=canvas.getContext('2d'),demo=$('campus-demo');
const audio=new PixelAudio(),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const dialogs=['start-dialog','card-dialog','fusion-dialog','formula-dialog','end-dialog'].map($);
let selectedScenario=0,selectedRole='',selectedDifficulty=1;
let match=new Simulation({seed:8321,scenario:0,difficulty:1,role:'rumor'});
let running=false,speed=1,elapsedMs=0,clockAt=performance.now(),endShown=false;
let W=0,H=0,DPR=1,visuals=[],lastRevision=-1,messageCursor=0,selectedCard=0,selectedNode=-1;
let fusionMain=0,fusionAux=0,lastEvent=null,actionTimer=0;
let feedbacks=[],presentationMs=0,presentationAt=performance.now(),lastHand='';
let lastOptions={seed:8321,scenario:0,difficulty:1,role:'rumor'};
const view={s:1,x:0,y:0};
const pointers=new Map();let pinch=null,dragTravel=0;
const roleGoal=side=>side==='rumor'?`结算相信率 ≥${Math.round(Simulation.WIN_THRESHOLD*100)}%`:`结算相信率 <${Math.round(Simulation.WIN_THRESHOLD*100)}%`;
const levelName=level=>['','I','II','III'][level];

function buildVisuals() {
  const random=seededRandom(match.seed^0x778ab);
  visuals=match.nodes.map(n=>({x:random(),y:random(),vx:0,vy:0,appear:0,speakingUntil:0,change:n.changedAt,state:n.state,shield:n.shieldUntil,silence:n.silencedUntil,boost:n.boostUntil}));
  for(const n of match.nodes){const v=visuals[n.id],a=anchor(n.group);v.x=a.x+(v.x-.5)*110;v.y=a.y+(v.y-.5)*105;}
  for(let k=0;k<90;k++)physics();
}
function resize() {
  const rect=canvas.getBoundingClientRect();W=rect.width;H=rect.height;DPR=devicePixelRatio;
  canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);
}
function anchor(group) {
  const compact=H<300;
  const left=compact?24:W>1000?205:W>760?180:24,right=compact?24:W>1000?240:W>760?205:24;
  const width=W-left-right;
  return {x:left+width*((compact?[.14,.38,.62,.86]:[.27,.72,.28,.73])[group]),y:H*(compact?.51:[.32,.31,.7,.7][group])};
}
function physics() {
  for(const n of match.nodes)if(n.active){
    const a=visuals[n.id];
    for(let j=n.id+1;j<match.nodes.length;j++)if(match.nodes[j].active){
      const b=visuals[j],dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy+2;
      const d=Math.sqrt(d2),f=Math.min(2.5,1200/d2)*Math.max(0,1-d/105);
      a.vx+=dx/d*f;a.vy+=dy/d*f;b.vx-=dx/d*f;b.vy-=dy/d*f;
    }
  }
  for(const n of match.nodes)if(n.active){
    const v=visuals[n.id],a=anchor(n.group);
    v.vx=(v.vx+(a.x-v.x)*.007)*.78;v.vy=(v.vy+(a.y-v.y)*.007)*.78;
    v.x=Math.max(18,Math.min(W-18,v.x+v.vx));
    v.y=Math.max(H<300?26:50,Math.min(H-(H<300?22:65),v.y+v.vy));
  }
}
function drawNetwork(now) {
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='#f2eee3';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#d4cebf30';ctx.lineWidth=.7;ctx.beginPath();
  for(let x=0;x<W;x+=20){ctx.moveTo(x,0);ctx.lineTo(x,H);}for(let y=0;y<H;y+=20){ctx.moveTo(0,y);ctx.lineTo(W,y);}ctx.stroke();
  ctx.save();ctx.translate(view.x,view.y);ctx.scale(view.s,view.s);
  for(let g=0;g<4;g++){
    const a=anchor(g);ctx.fillStyle=['#e8dece55','#e0e7dc77','#e6dfcf77','#e7dce155'][g];
    ctx.beginPath();ctx.ellipse(a.x,a.y+15,W<760?75:112,H<400?50:78,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#b0aa98';ctx.font='10px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(GROUP_NAMES[g],a.x,H<300?15:a.y+(H<400?65:98));
    if(H>=300){
      ctx.globalAlpha=.45;drawGroupSign(ctx,Math.round(a.x)-8,Math.round(a.y)+(H<400?43:76),g);ctx.globalAlpha=1;
      ctx.fillRect(a.x-8,a.y+(H<400?72:105),16,2);
    }
  }
  ctx.textAlign='left';
  const inspect=selectedNode>=0?new Set(match.adj[selectedNode]):new Set();
  for(const [i,j] of match.edges){
    const a=match.nodes[i],b=match.nodes[j];if(!a.active||!b.active)continue;
    const p=visuals[i],q=visuals[j];
    const on=a.state===1||b.state===1;
    ctx.strokeStyle=selectedNode===i||selectedNode===j?'#a89363aa':on?'#ca8b8747':'#8c938c1c';
    ctx.lineWidth=on?1.2:.7;
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
  }
  for(const p of match.particles){
    const a=visuals[p.a],b=visuals[p.b],x=a.x+(b.x-a.x)*p.t,y=a.y+(b.y-a.y)*p.t;
    ctx.fillStyle=p.kind==='rumor'?'#d64a56':'#238b6b';ctx.globalAlpha=.22;ctx.fillRect(x-5,y-5,10,10);ctx.globalAlpha=1;ctx.fillRect(x-2,y-2,4,4);
    ctx.fillStyle='#fffdf6';ctx.fillRect(x-1,y-1,1,1);
  }
  const drawOrder=match.nodes.filter(n=>n.active).sort((a,b)=>visuals[a.id].y-visuals[b.id].y);
  for(const n of drawOrder){
    const v=visuals[n.id];if(!match.paused)v.appear=Math.min(1,v.appear+.07);
    const known=n.aware||['bigv','mkt','bot','leader','counselor'].includes(n.type);
    const factor=W<760?.66:W<1050?.72:.82;
    const scale=factor*(known?1:.7),pose=!reducedMotion.matches&&presentationMs<v.speakingUntil?1:0;
    const sprite=getSprite(n.type,n.state,pose),w=sprite.width*scale,h=sprite.height*scale;
    ctx.globalAlpha=n.banned?.5:known?1:.58;ctx.fillStyle='#b6ae9944';ctx.fillRect(v.x-w*.35,v.y+h/2-3,w*.7,3);
    ctx.drawImage(sprite,Math.round(v.x-w/2),Math.round(v.y-h/2),w,h);ctx.globalAlpha=1;
    const age=match.tickCount-n.changedAt;
    if(!reducedMotion.matches&&n.changedAt>0&&age>0&&age<9){ctx.strokeStyle=n.state===1?'#d64a56':'#238b6b';ctx.globalAlpha=(9-age)/12;ctx.strokeRect(v.x-w/2-age,v.y-h/2-age,w+age*2,h+age*2);ctx.globalAlpha=1;}
    if(n.shieldUntil>match.day&&n.type!=='bot'){ctx.fillStyle='#178454';ctx.fillRect(v.x+w/2-2,v.y-h/2+5,4,6);}
    if(n.silencedUntil>match.day){ctx.strokeStyle='#6a6e72';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(v.x-5,v.y-4);ctx.lineTo(v.x+5,v.y+6);ctx.stroke();}
    if(n.banned){
      ctx.fillStyle='#fffdf6';ctx.fillRect(v.x+5,v.y-15,10,10);ctx.strokeStyle='#75544e';ctx.lineWidth=2;
      ctx.strokeRect(v.x+5,v.y-15,10,10);ctx.beginPath();ctx.moveTo(v.x+6,v.y-14);ctx.lineTo(v.x+14,v.y-6);ctx.stroke();
    }
    if(n.id===selectedNode||inspect.has(n.id)){ctx.strokeStyle=n.id===selectedNode?'#a68337':'#a6833744';ctx.lineWidth=1.5;ctx.strokeRect(v.x-w/2-3,v.y-h/2-3,w+6,h+6);}
  }
  for(const f of feedbacks){
    const v=visuals[f.id],age=(presentationMs-f.at)/950;
    ctx.globalAlpha=reducedMotion.matches?1:1-age*age;
    const y=Math.max(14,v.y-23-(reducedMotion.matches?0:9*(1-(1-age)**3)));
    ctx.font='bold 11px Microsoft YaHei';ctx.textAlign='center';
    const width=ctx.measureText(f.text).width+10;
    ctx.fillStyle='#fffdf6';ctx.fillRect(v.x-width/2,y-12,width,18);
    ctx.strokeStyle=f.side==='rumor'?'#b9424e':'#178454';ctx.lineWidth=1;
    ctx.strokeRect(v.x-width/2,y-12,width,18);ctx.fillStyle=ctx.strokeStyle;ctx.fillText(f.text,v.x,y+1);
    ctx.globalAlpha=1;
  }
  ctx.textAlign='left';
  ctx.restore();
}
function collectFeedback() {
  let added=0;
  for(const n of match.nodes){
    const v=visuals[n.id];
    if(n.changedAt!==v.change||n.state!==v.state||n.shieldUntil!==v.shield||n.silencedUntil!==v.silence||n.boostUntil!==v.boost){
      v.speakingUntil=presentationMs+650;
      if(added<3){
        const text=n.banned?'账号封禁':n.silencedUntil>match.day?'转述受限':n.state===1?(v.state===1?'传播加成':'开始相信'):n.shieldUntil>match.day?'证据保护':'不再相信';
        const side=n.state===1&&n.silencedUntil<=match.day?'rumor':'clarify';
        feedbacks.push({id:n.id,text,side,at:presentationMs});added++;
      }
      if(n.state!==v.state)audio.play(n.state===1?'arrivalRumor':'arrivalClarify');
      v.change=n.changedAt;v.state=n.state;v.shield=n.shieldUntil;v.silence=n.silencedUntil;v.boost=n.boostUntil;
    }
  }
  feedbacks=feedbacks.slice(-6);
}
function renderScenes() {
  $('rumor-cards').innerHTML=SCENARIOS.map((s,i)=>`<button class="rumor-card ${i===selectedScenario?'selected':''}" data-scenario="${i}" aria-pressed="${i===selectedScenario}"><span class="scene-icon">${campusThumbnail(i)}</span>${i===selectedScenario?'<span class="scene-check">已选</span>':''}<b>${s.label}</b><small>${s.note}</small></button>`).join('');
  document.querySelectorAll('[data-scenario]').forEach(b=>b.onclick=()=>{selectedScenario=Number(b.dataset.scenario);renderScenes();$('rumor-cards').querySelector(`[data-scenario="${selectedScenario}"]`).focus();});
}
function renderRoles() {
  $('role-cards').innerHTML=['rumor','clarify'].map(side=>`<button id="role-${side}" class="role-card ${side} ${selectedRole===side?'selected':''}" data-side="${side}" aria-pressed="${selectedRole===side}">${pixelIcon(side==='rumor'?'hot':'vaxx',45)}<h3>${ROLES[side].name}</h3><p>${roleGoal(side)}</p><small>${side==='rumor'?'扩大曝光，连接圈层。对手会核实与反制。':'送达证据，抑制传播。对手会寻找新的路径。'}</small></button>`).join('');
  document.querySelectorAll('[data-side]').forEach(b=>{
    const portrait=document.createElement('canvas'),side=b.dataset.side;
    portrait.width=64;portrait.height=56;portrait.className='role-portrait';portrait.setAttribute('aria-hidden','true');
    const c=portrait.getContext('2d');c.imageSmoothingEnabled=false;
    const sprite=getSprite(side==='rumor'?'mkt':'counselor',side==='rumor'?1:2,1);
    c.fillStyle='#e7dcc6';c.fillRect(7,portrait.height-6,50,2);
    c.drawImage(sprite,(portrait.width-sprite.width)/2,(portrait.height-sprite.height)/2);
    b.prepend(portrait);
    b.onclick=()=>{selectedRole=side;renderRoles();$('role-'+side).focus();audio.play('select');};
  });
  $('btn-deploy').disabled=selectedRole==='';$('btn-deploy').textContent=selectedRole===''?'选择身份后开始':`以${ROLES[selectedRole].name}开始 →`;
}
function renderDifficulties() {
  $('diff-row').innerHTML=DIFFICULTIES.map((d,i)=>`<button class="difficulty ${i===selectedDifficulty?'selected':''}" data-diff="${i}" aria-pressed="${i===selectedDifficulty}">${d.name}<small>${d.note}</small></button>`).join('');
  document.querySelectorAll('[data-diff]').forEach(b=>b.onclick=()=>{selectedDifficulty=Number(b.dataset.diff);renderDifficulties();$('diff-row').querySelector(`[data-diff="${selectedDifficulty}"]`).focus();});
  const stored=localStorage.getItem('rumorPlagueAch');const unlocked=stored===null?[]:JSON.parse(stored);
  $('achievements-note').textContent=`已留下 ${unlocked.length} 项探索记录。可以换身份，看同一条消息的另一面。`;
}
function showStart(step) {
  running=false;audio.stop();for(const d of dialogs)if(d.open)d.close();
  feedbacks=[];clearTimeout(actionTimer);$('action-flash').classList.remove('show');
  $('event-toast').classList.add('hidden');$('node-detail').classList.add('hidden');selectedNode=-1;
  if(step===1)selectedRole='';
  if(step===2)selectedRole=lastOptions.role==='rumor'?'clarify':'rumor';
  $('scene-step').classList.toggle('hidden',step===2);$('role-step').classList.toggle('hidden',step===1);
  renderScenes();renderRoles();renderDifficulties();$('start-dialog').showModal();
}
function startGame(options) {
  lastOptions={...options};selectedRole=options.role;selectedScenario=options.scenario;selectedDifficulty=options.difficulty;
  match=new Simulation(options);running=true;speed=1;elapsedMs=0;clockAt=performance.now();endShown=false;
  lastRevision=-1;messageCursor=0;selectedNode=-1;selectedCard=0;fusionMain=0;fusionAux=0;lastEvent=null;
  view.s=1;view.x=0;view.y=0;pointers.clear();pinch=null;
  feedbacks=[];presentationMs=0;presentationAt=performance.now();lastHand='';dragTravel=0;lastVisualTick=-1;
  clearTimeout(actionTimer);$('action-flash').classList.remove('show');audio.reset();
  $('opponent-mark').parentElement.classList.remove('opponent-acted');
  $('log-list').innerHTML='';$('event-toast').classList.add('hidden');$('node-detail').classList.add('hidden');
  for(const d of dialogs)if(d.open)d.close();
  $('btn-speed').textContent='1×';$('btn-pause').textContent='Ⅱ';$('btn-pause').setAttribute('aria-label','暂停传播');$('btn-pause').setAttribute('aria-pressed','false');
  $('scene-label').textContent=SCENARIOS[options.scenario].label;$('rumor-title').textContent=SCENARIOS[options.scenario].title;
  resize();buildVisuals();refresh();audio.play('start');
}
function renderCards() {
  lastRevision=match.revision;
  const hand=JSON.stringify(match.player.hand);
  if(lastHand===hand)return;
  lastHand=hand;
  $('cards').innerHTML=match.player.hand.map(card=>{
    const d=CARD_BY_ID[card.id],s=cardStats(card);
    return `<article class="card ${d.side} ${card.level>1?'upgraded':''}" id="card-${card.uid}"><button class="card-face" data-detail="${card.uid}" aria-describedby="card-status-${card.uid}" aria-label="查看${d.name}的说明"><span class="card-head"><span class="card-art">${pixelIcon(d.id,48)}</span><span class="card-level">${levelName(card.level)}</span></span><span class="card-name">${d.name}</span><span class="card-effect">${cardDescription(card)}${cardRiskDelta(card,match.role)!==0?" · 封号风险 "+(cardRiskDelta(card,match.role)>0?"+":"")+cardRiskDelta(card,match.role):""}</span><span class="card-status" id="card-status-${card.uid}"></span></button><div class="card-bottom"><span class="card-rarity">${'◆'.repeat(d.rarity)}</span><button class="card-play" data-play="${card.uid}" aria-describedby="card-status-${card.uid}">出牌 ${s.cost}</button></div></article>`;
  }).join('');
  document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>openCard(Number(b.dataset.detail)));
  document.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>playCard(Number(b.dataset.play)));
}
function updateButtons() {
  for(const card of match.player.hand){
    const b=$(`card-${card.uid}`).querySelector('.card-play'),s=cardStats(card),problem=match.playProblem(match.player,card);
    b.disabled=problem!=='';b.title=problem;
    b.textContent=problem===''?`出牌 ${s.cost}`:'暂不可用';
    const status=$(`card-status-${card.uid}`);status.textContent=problem===''?'就绪 · 点牌查看详情':problem;
    status.classList.toggle('unavailable',problem!=='');
  }
  $('btn-fuse').disabled=!running||match.ended||match.paused||match.player.hand.length<2;
  const drawProblem=match.drawProblem(match.player);
  $('btn-draw').disabled=!running||drawProblem!=='';$('btn-draw').title=drawProblem;
}
function openCard(uid) {
  selectedCard=uid;const card=match.player.hand.find(c=>c.uid===uid),d=CARD_BY_ID[card.id],s=cardStats(card);
  $('card-description').innerHTML=`<div class="detail-heading">${pixelIcon(d.id,52)}<div><span class="detail-tag">${d.side==='both'?'通用牌':ROLES[d.side].name} · ${['','普通','稀有','史诗'][d.rarity]} · 强化 ${levelName(card.level)}</span><h2>${d.name}</h2></div></div><p class="detail-effect">${cardDescription(card)}</p><div class="detail-facts"><div>资源费用<b>${s.cost}</b></div><div>同名冷却<b>${d.cd} 天</b></div><div>${d.duration>0?'效果时长':'生效方式'}<b>${d.duration>0?s.duration.toFixed(1)+' 天':'抵达/即时'}</b></div></div><div class="detail-section"><b>作用对象</b>${d.target}</div><div class="detail-section"><b>组合思路</b>${cardCombo(card)}</div><div class="detail-section"><b>对手如何反制</b>${d.counter}</div><div class="detail-section theory-note"><b>这张牌怎样改变传播</b>${CARD_THEORY[d.id]}</div><div class="detail-section"><b>融牌会怎样</b>保留原作用，数量或持续时间强化。强化牌本局保留，冷却后可重复使用；II / III 级费用增加 12 / 24，同名冷却不刷新。</div>`;
  const resolution=document.createElement('div');resolution.className='detail-section resolution-note';
  const title=document.createElement('b');title.textContent='实际怎样结算';resolution.append(title,document.createTextNode(cardResolution(card,match.role)+' '+cardRisk(card,match.role)));
  $('card-description').querySelector('.detail-facts').after(resolution);
  const preview=document.createElement('p');preview.id='card-risk-preview';preview.className='card-risk-preview';resolution.before(preview);
  const facts=$('card-description').querySelectorAll('.detail-facts b');
  if(card.id==='script')facts[2].textContent=`准备 ${s.duration.toFixed(1)} 天`;
  else if(d.duration===0)facts[2].textContent=['army','weaktie','lottery','debunk','radio','scout'].includes(card.id)?'消息抵达后':'立即生效';
  updateCardDialog();$('card-dialog').showModal();
}
function updateCardDialog() {
  const card=match.player.hand.find(c=>c.uid===selectedCard),problem=match.playProblem(match.player,card);
  $('card-rule').textContent=problem;$('btn-detail-play').disabled=problem!=='';$('btn-detail-play').textContent=`出牌 · ${cardStats(card).cost} ${ROLES[match.role].resource}`;
  const preview=$('card-risk-preview');preview.hidden=cardRiskDelta(card,match.role)===0;
  if(!preview.hidden){
    const risk=match.riskPreview(card,match.role),pct=value=>(value*100).toFixed(2)+'%';
    preview.textContent=`出牌后：封号风险 ${risk.before.toFixed(1)} → ${risk.after.toFixed(1)}；实际概率 ${pct(risk.beforeChance)} → ${pct(risk.afterChance)} / 步。${risk.crossed?'将越过封禁风险阈值。':''}${risk.targets===0?'当前没有可封禁目标，所以概率仍为 0；消息抵达后目标情况可能变化。':'按当前 '+risk.targets+' 个可封禁账号计算，实际概率会随局势变化。'}`;
  }
}
function playCard(uid) {
  const card=match.player.hand.find(c=>c.uid===uid),name=CARD_BY_ID[card.id].name,index=match.player.hand.indexOf(card),queued=match.particles.length;
  const problem=match.play(match.player,uid);
  if(problem){$('announcement').textContent=problem;return;}
  if($('card-dialog').open)$('card-dialog').close();
  const sent=match.particles.length-queued;audio.play(card.id==='script'?'reversal':sent>0?'dispatch':'instant');
  flashAction(`${name} · ${card.id==='script'?'反转正在酝酿':sent>0?sent+' 份消息正在派送':'已生效'}`);refresh();
  const next=match.player.hand[Math.min(index,match.player.hand.length-1)];$(`card-${next.uid}`).querySelector('.card-face').focus({preventScroll:true});
}
function openFusion() {fusionMain=0;fusionAux=0;renderFusion();$('fusion-dialog').showModal();}
function renderFusion() {
  const main=fusionMain===0?null:match.player.hand.find(c=>c.uid===fusionMain),aux=fusionAux===0?null:match.player.hand.find(c=>c.uid===fusionAux);
  const slot=(card,label)=>card===null?`<div class="fusion-slot">${label}</div>`:`<div class="fusion-slot chosen">${pixelIcon(card.id,48)}<span>${label}<b>${CARD_BY_ID[card.id].name} ${levelName(card.level)}</b></span></div>`;
  $('fusion-slots').innerHTML=slot(main,'保留的主牌')+'<span class="fusion-arrow">＋</span>'+slot(aux,'消耗的辅牌');
  $('fusion-materials').innerHTML=match.player.hand.map(c=>`<button class="fusion-material ${c.uid===fusionMain||c.uid===fusionAux?'selected':''}" data-material="${c.uid}" aria-pressed="${c.uid===fusionMain||c.uid===fusionAux}">${CARD_BY_ID[c.id].name} ${levelName(c.level)}</button>`).join('');
  document.querySelectorAll('[data-material]').forEach(b=>b.onclick=()=>{
    const uid=Number(b.dataset.material);
    if(uid===fusionMain){fusionMain=fusionAux;fusionAux=0;}else if(uid===fusionAux)fusionAux=0;else if(fusionMain===0)fusionMain=uid;else fusionAux=uid;
    renderFusion();$('fusion-materials').querySelector(`[data-material="${uid}"]`).focus({preventScroll:true});
  });
  if(main===null)$('fusion-preview').textContent='先选主牌：这张牌会留下并升级。再选同等级辅牌。';
  else if(main.level===3)$('fusion-preview').textContent='这张牌已经是 III 级，可以另选一张主牌。';
  else{
    const upgraded={...main,level:main.level+1};
    const cost=FUSION_COSTS[main.level];
    $('fusion-preview').innerHTML=`<div class="fusion-delta" aria-label="强化变化">${cardUpgradeSummary(main).map(change=>`<span>${change}</span>`).join('')}</div><details class="fusion-full-rules"><summary>查看完整效果对照</summary><div class="fusion-comparison"><section><small>现在 · ${levelName(main.level)}</small><b>${cardStats(main).cost} 资源 / 次</b><p>${cardResolution(main,match.role)}</p></section><section class="fusion-result"><small>融合后 · ${levelName(upgraded.level)}</small><b>${cardStats(upgraded).cost} 资源 / 次</b><p>${cardResolution(upgraded,match.role)}</p></section></div></details><p class="fusion-receipt">保留：${CARD_BY_ID[main.id].name} · 消耗：${aux===null?'待选辅牌':CARD_BY_ID[aux.id].name}<br>支付 ${cost} 资源。共享冷却继承，不会刷新。<br>强化牌本局保留；融合不补牌。${cardRisk(upgraded,match.role)}</p>`;
  }
  updateFusionButton();
}
function updateFusionButton() {
  const problem=match.fusionProblem(match.player,fusionMain,fusionAux);
  $('fusion-rule').textContent=problem;$('btn-fusion-confirm').disabled=problem!=='';$('btn-fusion-confirm').textContent=problem===''?'确认融合 · 保留主牌':'选择两张同等级牌';
}
function flashAction(text) {
  clearTimeout(actionTimer);$('action-flash').classList.remove('show');$('action-flash').innerHTML=`<span class="action-ink">${text}</span>`;
  $('action-flash').getBoundingClientRect();$('action-flash').classList.add('show');
  actionTimer=setTimeout(()=>$('action-flash').classList.remove('show'),1400);
}
function updateEvent() {
  const e=match.event;
  $('event-toast').classList.toggle('hidden',e===null);
  if(e===null){lastEvent=null;return;}
  if(e!==lastEvent){
    const definition=EMERGENCIES[e.id];
    $('ev-title').textContent=definition.icon+' '+definition.title[match.role];$('ev-context').textContent=match.eventContext();
    $('ev-options').innerHTML=definition.options[match.role].map((label,i)=>`<button data-event-choice="${i}"><b>${label}</b><small>${match.eventPreview(i)}</small></button>`).join('');
    document.querySelectorAll('[data-event-choice]').forEach(b=>b.onclick=()=>{
      const problem=match.chooseEvent(Number(b.dataset.eventChoice));
      if(problem){$('announcement').textContent=problem;return;}
      audio.play('select');refresh();
    });
    lastEvent=e;audio.play('event');
  }
  $('ev-countdown').textContent=match.paused?'已暂停，可先读完选项；继续传播后再回应':`传播继续 · 约 ${Math.max(0,Math.ceil((e.expires-match.day)*15/speed))} 秒后自动略过`;
  $('btn-event-pause').textContent=match.paused?'继续传播':'暂停思考';
  const problem=match.eventProblem();document.querySelectorAll('[data-event-choice]').forEach(b=>{b.disabled=problem!=='';b.title=problem;});
}
function flushMessages() {
  const tags={start:'最初投放',card:'卡牌干预',fusion:'融合强化',draw:'补充手牌',delivery:'行动结果',moderation:'平台风控',turn:'传播转折',event:'校园突发','event-followup':'事件后续',end:'传播归档',observe:'阶段观察',quote:'校园群聊',ambient:'校园见闻'};
  for(const msg of match.messages.slice(messageCursor)){
    const el=document.createElement('article'),lines=msg.text.split('\n');el.className='log-entry '+msg.side+' log-'+msg.kind;
    if(msg.kind==='quote'){
      visuals[msg.speaker].speakingUntil=presentationMs+1100;
      el.style.setProperty('--speaker-color',TYPES[msg.type].color);
      el.innerHTML=`<div class="chat-avatar" aria-hidden="true"></div><div class="chat-message"><div class="chat-byline"><b>${TYPES[msg.type].name} #${msg.speaker+1}</b><time>${msg.day.toFixed(1)} 天</time></div><small class="chat-group">${GROUP_NAMES[msg.group]}</small>${msg.replyTo>=0?`<small class="chat-reply">回复 ${TYPES[match.nodes[msg.replyTo].type].name} #${msg.replyTo+1}</small>`:''}<p class="chat-bubble"></p></div>`;
      el.querySelector('.chat-bubble').textContent=msg.text;
      const sprite=getSprite(msg.type,msg.state,0),avatar=document.createElement('canvas');avatar.width=sprite.width;avatar.height=sprite.height;
      avatar.getContext('2d').drawImage(sprite,0,0);el.querySelector('.chat-avatar').append(avatar);
    }else if(msg.kind==='observe'){
      el.innerHTML=`<details open><summary><span>阶段变化</span><time>第 ${msg.day.toFixed(1)} 天</time></summary><b>${lines[0]}</b>${lines.slice(1).map(line=>`<p>${line}</p>`).join('')}</details>`;
    }else{
      el.innerHTML=`<div class="log-meta"><span>${tags[msg.kind]}</span><time>第 ${msg.day.toFixed(1)} 天</time></div><b>${lines[0]}</b>${lines.slice(1).map(line=>`<p>${line}</p>`).join('')}`;
    }
    $('log-list').prepend(el);
    if(msg.kind==='ambient')audio.play('event');
    if(msg.kind==='delivery')audio.play('delivered');
    if(msg.kind==='event-followup')audio.play('event');
    if(msg.kind==='moderation')audio.play('ban');
    if(msg.kind==='turn')audio.play('reversal');
    $('announcement').textContent=msg.kind==='quote'?`${TYPES[msg.type].name}：${msg.text}`:msg.text;
    if(['card','fusion','draw'].includes(msg.kind)&&msg.side===match.opponent.side){
      audio.play(msg.kind==='fusion'?'fusion':'ai');flashAction(`人机 · ${msg.kind==='card'?CARD_BY_ID[msg.card].name:lines[0]}`);
      const strip=$('opponent-mark').parentElement;strip.classList.remove('opponent-acted');strip.getBoundingClientRect();strip.classList.add('opponent-acted');
    }
  }
  messageCursor=match.messages.length;
  while($('log-list').children.length>50)$('log-list').lastChild.remove();
}
function renderFormulas() {
  const f=match.formulas(),c=match.counts(),pct=n=>(n*100).toFixed(2)+'%';
  const m=match.moderation(),blocks=[
    ['01','谣言强度','R = i × a',`${f.i.toFixed(2)} × ${f.a.toFixed(2)} = <b>${f.strength.toFixed(2)}</b>`,`i 为重要性，a 为模糊性。议程设置改变 i；热搜、反转提高 a，官方辟谣与原始材料降低 a。`],
    ['02','沿连接传播','p = β × q × s × H × M',`普通同学 → 普通同学：<b>${pct(f.spread)}</b> / 次接触`,`β = ${MODEL_RATES.spread}；H = 0.5 + 1.5 × 热度 = ${f.heatFactor.toFixed(2)}；M = i × (0.5 + 0.5a) × 热搜 × 冷处理 × 外媒 × 考试周 = ${f.multiplier.toFixed(2)}。q / s 见人物详情；大V加成 ×1.7，曾核实者再相信 ×0.27，证据保护中为 0。`],
    ['03','沉默的螺旋','V = max(0.2, 1.2 − 相信率)',`相信率 ${pct(f.belief)} → 当前发声意愿 <b>${f.voice.toFixed(2)}</b>`,`控评 ×0.3；辟谣热搜再 +0.8，最高 2。bot 核实概率 = ${MODEL_RATES.clarify} × V × 杠精压制 × 辟谣热搜；杠精压制为 0.5，热搜为 2。理中客为 ${(MODEL_RATES.clarify*.4).toFixed(4)} × V；辅导员固定 ${(MODEL_RATES.clarify*1.2).toFixed(4)}，不受控评。`],
    ['04','遗忘与再观望',`f = (冷处理 ? ${CARD_PARAMS.cold.forget} : 0.0028) × 玩梗`,`当前遗忘概率 <b>${pct(f.forget)}</b> / 步`,`玩梗消解期间再 ×3。自然遗忘使 I → R；保护到期且未反转时，R 每步以 0.0001 概率回到 S，保留“听说过”的记录。`],
    ['05','官方辟谣',`P = ${CARD_PARAMS.debunk.trustCoefficient} × T + ${CARD_PARAMS.debunk.baseChance} + 冷处理加成`,`公信力 T = ${match.trust.toFixed(2)} → 成功率 <b>${pct(f.official)}</b>`,`冷处理期间 +${CARD_PARAMS.debunk.coldChance}。此概率在出牌时确定，核实抵达后才结算；校园电台直接核实，不受此项影响。`],
    ['06','平台封号',`P = max(0, 风险 − ${MODERATION.threshold}) × ${MODERATION.rate}`,`封号风险 ${m.risk.toFixed(1)} → 当前概率 <b>${pct(m.chance)}</b> / 步`,`每步最多封禁一个连接数至少 ${MODERATION.minConnections}、正在相信且未被封禁的在线账号；没有目标时概率为 0。平台关注超过 ${MODERATION.attentionThreshold} 后推动风险累积。已封禁账号本局不再传谣，仍计入已上线人口；难度不修改此概率。`]
  ];
  $('formula-content').innerHTML=blocks.map(([n,title,equation,value,note])=>`<section class="formula-block"><span>${n}</span><div><h3>${title}</h3><code>${equation}</code><p>${value}</p><small>${note}</small></div></section>`).join('')+`<div class="state-flow"><b>S ${c.s}</b><span>→</span><b class="rumor-text">I ${c.i}</b><span>→</span><b class="clarify-text">R ${c.r}</b><small>未相信 → 相信并转述 → 核实 / 不再相信</small></div>`;
  $('btn-formulas-pause').textContent=match.paused?'继续传播':'暂停思考';
}
function phaseName() {
  if(match.ended)return '传播已收束';
  if(match.day>=12)return '等待最后的转述抵达';
  if(match.reversed)return '新的说法，再次扩散';
  const c=match.counts();
  if(c.i/c.total>.35)return '传播正在跨过圈层';
  if(c.aware/c.total>.65)return '听说过，不一定相信';
  return match.day<1.6?'最初的耳语':'转述与核实，同时发生';
}
function refresh() {
  collectFeedback();
  if(lastRevision!==match.revision)renderCards();
  const c=match.counts(),belief=c.i/c.total,aware=c.aware/c.total;
  const m=match.moderation(),chance=(m.chance*100).toFixed(2);
  $('moderation-brief').textContent=`封号概率 ${chance}% / 步 · 风险 ${Math.round(m.risk)}`;
  $('moderation-brief').classList.toggle('risk-active',m.chance>0);
  $('v-risk').textContent=`${Math.round(m.risk)} / 100`;$('bar-risk').style.width=m.risk+'%';
  $('v-ban-chance').textContent=chance+'% / 步';$('v-attention').textContent=`${Math.round(m.attention)} / 100`;
  $('ban-count').textContent=`已封禁 ${m.banned} 个账号`;
  $('moderation-note').textContent=m.targets.length===0?'当前没有符合条件的高影响传谣账号，实际概率为 0。':`风险超过 ${MODERATION.threshold} 后生效；当前有 ${m.targets.length} 个高影响传谣账号。100 步为模拟 1 天。`;
  $('player-role').textContent=ROLES[match.role].name;$('player-goal').textContent=roleGoal(match.role);
  $('player-mark').className='side-mark '+match.role;$('opponent-mark').className='side-mark '+match.opponent.side;
  $('opponent-role').textContent=ROLES[match.opponent.side].name;
  $('player-resource').innerHTML=`${Math.floor(match.player.resource)}<span>${ROLES[match.role].resource}</span>`;
  $('opponent-resource').innerHTML=`${Math.floor(match.opponent.resource)}<span>资源 · ${match.opponent.hand.length} 张牌</span>`;
  $('ai-status').textContent=match.lastAI;$('ai-status').title=`${match.lastAI}；下次决策约 ${(Math.max(0,match.nextAI-match.day)*15/speed).toFixed(0)} 秒后`;
  $('belief-main').textContent=Math.round(belief*100)+'%';$('belief-fill').style.width=belief*100+'%';
  $('threshold-marker').style.left=Simulation.WIN_THRESHOLD*100+'%';$('threshold-label').textContent=`胜负分界 ${Math.round(Simulation.WIN_THRESHOLD*100)}%`;
  for(const [id,value] of [['aware',aware],['belief',belief],['heat',match.heat]]){$('v-'+id).textContent=Math.round(value*100)+'%';$('bar-'+id).style.width=value*100+'%';}
  $('v-strength').textContent=match.formulas().strength.toFixed(2);
  $('p-pop').textContent=`${c.total} / ${match.nodes.length}`;$('p-peak').textContent=Math.round(match.peak*100)+'%';
  $('phase-label').textContent=phaseName();
  $('btn-card-pause').textContent=match.paused?'继续传播':'暂停思考';$('btn-fusion-pause').textContent=match.paused?'继续传播':'暂停思考';
  const seconds=Math.floor(elapsedMs/1000);$('clock').textContent=match.paused?'已暂停':`演化 ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  $('fx-bar').innerHTML=Object.entries(match.effects).filter(([,until])=>until>match.day).map(([id,until])=>`<span class="fx-chip ${CARD_BY_ID[id].side}">${CARD_BY_ID[id].name} ${(until-match.day).toFixed(1)} 天</span>`).join('')+(match.reversalAt>match.day?`<span class="fx-chip rumor">反转酝酿 ${(match.reversalAt-match.day).toFixed(1)} 天</span>`:'')+(match.memeUntil>match.day?`<span class="fx-chip clarify">玩梗遗忘 ×3 ${(match.memeUntil-match.day).toFixed(1)} 天</span>`:'')+(match.mediaUntil>match.day?`<span class="fx-chip rumor">外媒搬运 ×1.4 ${(match.mediaUntil-match.day).toFixed(1)} 天</span>`:'')+(match.examUntil>match.day?`<span class="fx-chip clarify">考试周 ×0.7 ${(match.examUntil-match.day).toFixed(1)} 天</span>`:'');
  $('fx-bar').insertAdjacentHTML('beforeend',match.eventFollowups.map(item=>`<span class="fx-chip event-pending" title="${EMERGENCIES[item.id].title[item.role]} · ${GROUP_NAMES[item.group]}">${EMERGENCIES[item.id].icon} 后续 ${(item.due-match.day).toFixed(1)} 天</span>`).join(''));
  $('process-note').textContent=match.reversed?'新说法进入了讨论。看看哪些人再次改变判断。':match.day<2?'红色是转述，绿色是核实。信息抵达后，判断才会改变。':'先看对手刚做了什么，再选一张能改变局势的牌。';
  updateButtons();flushMessages();updateEvent();
  if(selectedNode>=0)updateNodeDetail();
  if($('card-dialog').open)updateCardDialog();
  if($('fusion-dialog').open)updateFusionButton();
  if($('formula-dialog').open)renderFormulas();
  if(match.ended&&!endShown)showEnding();
}
function showEnding() {
  endShown=true;running=false;const r=match.result,e=ENDINGS[r.key];
  for(const d of dialogs)if(d.open)d.close();$('event-toast').classList.add('hidden');
  $('end-verdict').textContent=r.won?'你达成了阵营目标':'人机达成了阵营目标';$('end-verdict').className='verdict '+(r.won?'':'lost');
  $('end-role-note').textContent=`你的身份：${ROLES[match.role].name} · 传播档案 #${match.seed}`;
  $('end-title').textContent=e.title;$('end-desc').textContent=e.desc;$('end-grade').textContent=r.grade;$('end-score').textContent=`传播评分 ${r.score}`;
  drawResult($('end-art'),match.role,r.won);
  $('end-stats').innerHTML=`<div>结算相信率<b>${Math.round(r.belief*100)}%</b></div><div>相信率峰值<b>${Math.round(match.peak*100)}%</b></div><div>你的出牌<b>${match.player.played} 次</b></div><div>融合强化<b>${match.player.fused} 次</b></div>`;
  const chartW=550,chartH=105,path=key=>match.samples.map((p,i)=>`${i===0?'M':'L'}${(12+p.day/13.5*(chartW-24)).toFixed(1)},${(chartH-12-p[key]*(chartH-22)).toFixed(1)}`).join(' ');
  $('end-chart').innerHTML=`<svg viewBox="0 0 ${chartW} ${chartH+16}" role="img" aria-label="传播曲线：蓝色听说，红色相信。峰值 ${Math.round(match.peak*100)}%，结算相信 ${Math.round(r.belief*100)}%。"><path d="M12 10V${chartH-12}H${chartW-12}" fill="none" stroke="#d3cdbd"/><path d="${path('aware')}" fill="none" stroke="#568db9" stroke-width="2"/><path d="${path('belief')}" fill="none" stroke="#d64a56" stroke-width="2.5"/><text x="12" y="${chartH+10}" fill="#999584" font-size="9">开局</text><text x="${chartW-42}" y="${chartH+10}" fill="#999584" font-size="9">收束</text></svg>`;
  $('end-timeline').innerHTML=r.moments.map(moment=>`<div class="timeline-item"><time>第 ${moment.day.toFixed(1)} 天</time>${moment.text}</div>`).join('');
  const formulas={known:'100 − 出牌次数×4 − 模拟天数×3',cradle:'115 − 模拟天数×8 − 出牌次数×3',rebound:'110 + 二次峰值×40 − 模拟天数×2',meme:'95 − 模拟天数×3 − 出牌次数×3',fade:'平息结局基础 55 分',stalemate:'余波结局基础 35 分'};
  $('score-explanation').textContent=`${formulas[r.key]}${r.won?'；达成阵营目标 +15 分':''}，取整后限制在 10–100 分；90/70/50 分分别为 S/A/B。阵营胜负另按结算相信率 ${Math.round(Simulation.WIN_THRESHOLD*100)}% 分界判断。`;
  const stored=localStorage.getItem('rumorPlagueAch'),unlocked=new Set(stored===null?[]:JSON.parse(stored));
  const achievements=[{id:r.key,name:'看见'+e.title},{id:'side-'+match.role,name:'体验'+ROLES[match.role].name}];
  if(match.player.fused>0)achievements.push({id:'fusion',name:'第一次融合'});if(r.won)achievements.push({id:'win-'+match.role,name:'达成'+ROLES[match.role].name+'目标'});
  const newly=achievements.filter(a=>!unlocked.has(a.id));for(const a of newly)unlocked.add(a.id);localStorage.setItem('rumorPlagueAch',JSON.stringify([...unlocked]));
  $('end-ach').textContent=newly.length>0?'本局新探索：'+newly.map(a=>a.name).join('、'):`已留下 ${unlocked.size} 项探索记录`;
  $('end-dialog').showModal();audio.play(r.won?'win':'lose');
}
function pickNode(mx,my) {
  const x=(mx-view.x)/view.s,y=(my-view.y)/view.s;
  let found=-1,distance=24;
  for(const n of match.nodes)if(n.active){const v=visuals[n.id],d=Math.hypot(x-v.x,y-v.y);if(d<distance){found=n.id;distance=d;}}
  if(found>=0){selectedNode=found;updateNodeDetail();$('node-detail').classList.remove('hidden');}
}
function updateNodeDetail() {
  const n=match.nodes[selectedNode],sprite=getSprite(n.type,n.state,0);
  $('node-person').replaceChildren(sprite.cloneNode());const target=$('node-person').firstChild;target.getContext('2d').drawImage(sprite,0,0);
  $('node-text').innerHTML=`<b>${TYPES[n.type].name} #${n.id+1}</b>${n.banned?'已封禁 · 本局不再传谣':['尚未相信','相信并转述','已核实 / 不再相信'][n.state]} · ${match.adj[n.id].length} 条连接<small>传播力 q = ${TYPES[n.type].inf} · 易感度 s = ${TYPES[n.type].sus}</small><small>${n.lastReason}${n.shieldUntil>match.day?' · 证据保护中':''}${n.silencedUntil>match.day?' · 转述受限':''}</small>`;
}
function zoom(factor) {const next=Math.max(.65,Math.min(2.8,view.s*factor));view.x=W/2-(W/2-view.x)*next/view.s;view.y=H/2-(H/2-view.y)*next/view.s;view.s=next;}
function pointerPoint(e) {const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  canvas.setPointerCapture(e.pointerId);const p=pointerPoint(e);pointers.set(e.pointerId,p);dragTravel=0;
  if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),scale:view.s};}
});
canvas.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;
  const before=pointers.get(e.pointerId),p=pointerPoint(e);pointers.set(e.pointerId,p);dragTravel+=Math.hypot(p.x-before.x,p.y-before.y);
  if(pointers.size===1){view.x+=p.x-before.x;view.y+=p.y-before.y;}
  else if(pointers.size===2){const [a,b]=[...pointers.values()];zoom(Math.max(.65,Math.min(2.8,pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance))/view.s);}
});
canvas.addEventListener('pointerup',e=>{if(dragTravel<6){const p=pointerPoint(e);pickNode(p.x,p.y);}pointers.delete(e.pointerId);});
canvas.addEventListener('pointercancel',e=>pointers.delete(e.pointerId));
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.12:1/1.12);},{passive:false});
canvas.tabIndex=0;
canvas.addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft'].includes(e.key)){e.preventDefault();const active=match.nodes.filter(n=>n.active);const i=active.findIndex(n=>n.id===selectedNode);selectedNode=active[(i+(e.key==='ArrowRight'?1:active.length-1)+active.length)%active.length].id;updateNodeDetail();$('node-detail').classList.remove('hidden');}});
$('btn-start').onclick=()=>{$('scene-step').classList.add('hidden');$('role-step').classList.remove('hidden');renderRoles();};
$('btn-back').onclick=()=>{$('scene-step').classList.remove('hidden');$('role-step').classList.add('hidden');};
$('btn-deploy').onclick=async()=>{await audio.activate();startGame({seed:crypto.getRandomValues(new Uint32Array(1))[0],scenario:selectedScenario,difficulty:selectedDifficulty,role:selectedRole});};
async function togglePause(){
  match.paused=!match.paused;$('btn-pause').textContent=match.paused?'▷':'Ⅱ';$('btn-pause').setAttribute('aria-label',match.paused?'继续传播':'暂停传播');$('btn-pause').setAttribute('aria-pressed',String(match.paused));
  if(match.paused)audio.stop();else await audio.activate();clockAt=performance.now();refresh();
}
$('btn-pause').onclick=togglePause;$('btn-card-pause').onclick=togglePause;$('btn-fusion-pause').onclick=togglePause;$('btn-event-pause').onclick=togglePause;
$('btn-speed').onclick=()=>{speed=speed===1?2:speed===2?4:1;$('btn-speed').textContent=speed+'×';$('btn-speed').setAttribute('aria-label',`切换速度，当前 ${speed} 倍`);};
$('btn-restart').onclick=()=>showStart(1);$('btn-again').onclick=()=>showStart(2);
$('btn-replay').onclick=async()=>{await audio.activate();startGame(lastOptions);};
$('btn-swap-network').onclick=async()=>{await audio.activate();startGame({...lastOptions,role:lastOptions.role==='rumor'?'clarify':'rumor'});};
$('btn-formulas').onclick=()=>{renderFormulas();$('formula-dialog').showModal();};
$('btn-formulas-close').onclick=()=>$('formula-dialog').close();
$('btn-formulas-pause').onclick=()=>$('btn-pause').click();
$('btn-card-close').onclick=()=>$('card-dialog').close();$('btn-detail-play').onclick=()=>playCard(selectedCard);
$('btn-fuse').onclick=openFusion;$('btn-fusion-close').onclick=()=>$('fusion-dialog').close();
$('btn-fusion-confirm').onclick=()=>{
  const uid=fusionMain,problem=match.fuse(match.player,fusionMain,fusionAux);
  if(problem){$('fusion-rule').textContent=problem;return;}
  $('fusion-dialog').close();audio.play('fusion');flashAction('融合成功 · 主牌升级');refresh();$(`card-${uid}`).classList.add('fusion-celebrate');
  $(`card-${uid}`).querySelector('.card-face').focus({preventScroll:true});
};
$('btn-draw').onclick=()=>{const problem=match.draw(match.player);if(problem)$('announcement').textContent=problem;else{audio.play('select');refresh();}};
$('btn-event-source').onclick=()=>{
  selectedNode=match.event.source;const v=visuals[selectedNode];view.x=W/2-v.x*view.s;view.y=H/2-v.y*view.s;
  updateNodeDetail();$('node-detail').classList.remove('hidden');
};
$('btn-event-skip').onclick=()=>{match.skipEvent('skipped');refresh();};
$('btn-stats').onclick=()=>{const expanded=$('stats').classList.toggle('expanded');$('btn-stats').setAttribute('aria-expanded',String(expanded));$('btn-stats').textContent=expanded?'传播指标 −':'传播指标 ＋';};
function toggleLog() {
  const expanded=$('log').classList.toggle('expanded');$('btn-log').setAttribute('aria-expanded',String(expanded));$('btn-log').textContent=expanded?'传播动态 −':'传播动态 ＋';
}
$('btn-log').onclick=toggleLog;$('btn-log-close').onclick=toggleLog;
$('btn-zoom-in').onclick=()=>zoom(1.15);$('btn-zoom-out').onclick=()=>zoom(1/1.15);$('btn-view-reset').onclick=()=>{view.s=1;view.x=0;view.y=0;};
$('btn-node-close').onclick=()=>{selectedNode=-1;$('node-detail').classList.add('hidden');};
$('volume').value=audio.volume;$('btn-mute').textContent=audio.enabled?'声音已开启':'声音已关闭';
$('volume').oninput=e=>audio.setVolume(Number(e.target.value));
  $('btn-mute').onclick=async()=>{await audio.activate();audio.toggle();$('btn-mute').textContent=audio.enabled?'声音已开启':'声音已关闭';if(running&&!match.paused)audio.play('select');else audio.stop();};
window.addEventListener('resize',resize);
reducedMotion.addEventListener('change',()=>{for(let k=0;k<60;k++)physics();});
document.addEventListener('visibilitychange',async()=>{clockAt=performance.now();presentationAt=clockAt;if(document.hidden)audio.stop();else if(running&&!match.paused)await audio.activate();});
setInterval(()=>{
  const now=performance.now();if(running&&!match.paused&&!document.hidden){elapsedMs+=now-clockAt;for(let i=0;i<speed&&!match.ended;i++)match.step();refresh();}clockAt=now;
},150);
let lastVisualTick=-1;
function frame(now) {
  if(running&&!match.paused&&!document.hidden)presentationMs+=now-presentationAt;
  presentationAt=now;feedbacks=feedbacks.filter(f=>presentationMs-f.at<950);
  if(running&&!match.paused&&!document.hidden&&(!reducedMotion.matches||lastVisualTick!==match.tickCount)){physics();lastVisualTick=match.tickCount;}
  drawNetwork(now);
  if($('start-dialog').open)drawCampus(demo,now,reducedMotion.matches,selectedScenario);
  requestAnimationFrame(frame);
}
$('legend').innerHTML=Object.entries(TYPES).map(([id,t])=>`<span><i style="background:${t.color}"></i>${t.name}</span>`).join('');
resize();buildVisuals();renderScenes();renderRoles();renderDifficulties();refresh();$('start-dialog').showModal();requestAnimationFrame(frame);
