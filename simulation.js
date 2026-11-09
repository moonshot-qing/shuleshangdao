"use strict";

const SCENARIOS = [
  { title: "校园音乐节要取消了？", label: "音乐节风波", note: "一张模糊的通知，传进了不同的同学圈。", place: "校园舞台", heat: .23, importance: 1.02, seeds: 4 },
  { title: "自习座位只留给部分学院？", label: "座位之争", note: "预约截图被截去半句，公平问题引发讨论。", place: "图书馆", heat: .3, importance: 1.04, seeds: 4 },
  { title: "校园超市要停业一个月？", label: "超市传闻", note: "一条临时调整消息，让群聊突然热闹起来。", place: "校园超市", heat: .36, importance: 1.07, seeds: 5 }
];
const TYPES = {
  bigv: { name: "大V", color: "#e5ad39", inf: 1.65, sus: .8 },
  mkt: { name: "营销号", color: "#9b74c8", inf: 1.6, sus: 1.1 },
  crowd: { name: "吃瓜同学", color: "#568db9", inf: 1, sus: 1 },
  bot: { name: "辟谣bot", color: "#309c78", inf: 0, sus: 0 },
  mid: { name: "理中客", color: "#4a9c9b", inf: .7, sus: .6 },
  leader: { name: "群主", color: "#cd7795", inf: 1.35, sus: .9 },
  troll: { name: "杠精", color: "#da9452", inf: 1.25, sus: 1.2 },
  counselor: { name: "辅导员", color: "#6879ac", inf: .55, sus: .45 }
};
const QUOTES = {
  bigv: [
    "深扒了一夜，这件事没有表面那么简单 🧵",
    "三个细节对不上，官方通报恐怕站不住脚",
    "这条转发过万了，大家自己品",
    "我不管别人怎么说，我只陈述我看到的",
    "已经联系到「知情人」，明天放料",
  ],
  mkt: [
    "惊天大瓜!全校都在传!速看速删!",
    "震惊!知情人透露更多细节，直接上链接",
    "本号独家：内幕比你想的更离谱",
    "不看后悔系列，第三张图信息量爆炸",
    "家人们谁懂啊，直接泪目",
  ],
  crowd: [
    "吃完瓜坐等反转",
    "有人知道具体是哪栋楼吗?蹲一个",
    "已经转发到 500 人的大群了",
    "隔壁班都说得有鼻子有眼的",
    "截图保住了，就问还能信谁",
    "反正我是不信官方那套说辞",
  ],
  bot: [
    "【核实】该消息暂无实据，请以官方通报为准",
    "检索到 3 条高度相似的历史谣言，判定：不实",
    "提醒：转发 500 次可能构成造谣，请谨慎",
    "本 bot 已自动向该话题下的 27 人推送澄清",
    "数据比对完成：原图拍摄于三年前外地",
  ],
  mid: [
    "都冷静点，目前证据链是不完整的",
    "信源只有一个匿名号，大概率不可靠",
    "情绪不能代替事实，建议等通报再站队",
    "两边都有问题，这瓜不算熟",
    "从传播路径看，这更像一次剪裁加工",
  ],
  leader: [
    "群里的都别睡，这事还没完",
    "本群已全员转发，进群看后续",
    "管理员刚置顶了最新截图",
    "都别吵，我拉了个小群细聊",
    "群公告更新：今晚八点蹲后续",
  ],
  troll: [
    "呵呵，又来?我就爱看你们急",
    "官方说什么你们信什么，可悲",
    "我就问一句：证据呢?拿不出来吧",
    "造谣的已经跑路了，笑死",
    "你们转发的样子真的很蠢",
  ],
  counselor: [
    "同学们不要轻信来源不明的消息",
    "已上报学校，请大家耐心等通报",
    "转发消息的同学，请私下找我一下",
    "以学校官方通知为准，切勿传谣",
    "凌晨一点了还在转发，明天来我办公室",
  ],
};
const GROUP_NAMES=["文艺社团","自习小组","生活群聊","校园墙"];
const CHAT_FOLLOWUPS={
  bigv:["补一下原始通知，刚才那段结论需要更正。","先别只截我的半句话，核实材料在这里。","新证据和前面说的不一样，我撤回那条转发。"],
  mkt:["更新：当事人的回应出来了，前一条先别继续转。","原截图少了半页，补上完整版本。","这条先暂停转发，等核对完来源再更新。"],
  crowd:["刚看到完整通知，和群里传的不是一回事。","等等，我把更正也转回刚才那个群。","听过这事，不过现在没那么信了。"],
  bot:QUOTES.bot,
  mid:QUOTES.mid,
  leader:["我把原始材料置顶了，别再只转那张截图。","刚才转发过的同学，麻烦把更正也带回去。","群里先停一下，等原始通知核实完再讨论。"],
  troll:["所以刚才那张图到底是谁先发的？","前面喊实锤的呢？现在怎么不说话了。","行，原图都出来了，这回先不跟着转。"],
  counselor:QUOTES.counselor
};
const CHAT_QUESTIONS=['有原始通知吗？我先不站队。','只看到了转发截图，蹲个完整来源。','先听大家说，等核实材料出来再转。'];
const CAMPUS_EVENTS=[
  {id:'exams',name:'考试周来了',icon:'🎓',minBelief:0,side:'clarify'},
  {id:'witness',name:'当事人现身说法',icon:'📸',minBelief:0,side:'clarify'},
  {id:'repost',name:'校外自媒体搬运',icon:'📡',minBelief:0,side:'rumor'},
  {id:'meme',name:'谣言被玩梗化',icon:'😂',minBelief:.25,side:'clarify'},
  {id:'screenshot',name:'网传截图「实锤」',icon:'🧾',minBelief:.15,side:'rumor'}
];
const EMERGENCIES=[
  {id:'reporter',icon:'📰',title:{rumor:'校媒记者前来核实',clarify:'校媒记者前来核实'},options:{
    rumor:['私下爆料，把水搅浑','坦诚接受采访'],
    clarify:['公开采访记录','继续追查信源']}},
  {id:'meeting',icon:'🚨',title:{rumor:'网信部门约谈',clarify:'网信部门约谈'},options:{
    rumor:['认怂整改，撤稿道歉','装死硬扛'],
    clarify:['公开更正并补证','暂缓回应，继续核实']}},
  {id:'redpacket',icon:'🎉',title:{rumor:'平台发放流量红包',clarify:'平台发放流量红包'},options:{
    rumor:['全部领取','低调领取保底'],
    clarify:['接入公开核实渠道','只领取基础资源']}},
  {id:'victim',icon:'😭',title:{rumor:'谣言当事人崩溃发帖',clarify:'谣言当事人崩溃发帖'},options:{
    rumor:['火上浇油推热搜','帮他压下去'],
    clarify:['转发当事人原帖','安抚并整理证据']}},
  {id:'exposed',icon:'💣',title:{rumor:'有人扒出你是幕后推手',clarify:'有人扒出幕后推手'},options:{
    rumor:['死不承认','自爆引流，提前跑路'],
    clarify:['公开传播链与证据','仓促发布结论']}}
];
const EMERGENCY_RULES={
  reporter:{delay:.8,heat:.25,ambiguity:.15,clearAmbiguity:.3,trust:.06,followTrust:.04,quick:4,deep:6,check:3,safeRisk:-8,attentionDrop:8},
  meeting:{delay:1,rumorCost:80,clarifyCost:40,heat:.6,ambiguity:.15,blank:.12,riskDown:35,riskUp:25,gain:30,clarifyGain:25,sourceCount:2,sourceDays:.8,heatLimit:.4,reviewRisk:-10,reviewAttention:8,hardAttention:12,protect:4,protectDays:1,trustLoss:.04},
  redpacket:{delay:.7,full:100,basic:40,heat:.15,risk:10,exposure:3,chance:.9},
  victim:{delay:.8,heat:.4,ambiguity:.1,trust:.08,clearAmbiguity:.15,quick:4,follow:4,protectDays:1.2,safeRisk:-10},
  exposed:{delay:1,ambiguity:.2,risk:15,gain:35,windfall:100,trustLoss:.15,reversalDelay:2,reversalAmount:7,trust:.05,clearAmbiguity:.2,sourceCount:1,sourceDays:1,reviewAttention:10,follow:3}
};
const EMERGENCY_WINDOW=1.2;
const ROLES = {
  rumor: { name: "传谣者", resource: "流量", verb: "转述", goal: "让结算相信率达到 35%", color: "#d64a56" },
  clarify: { name: "辟谣者", resource: "核实资源", verb: "核实", goal: "让结算相信率低于 35%", color: "#178454" }
};
const DIFFICULTIES = [
  { name: "休闲", interval: 1.25, note: "对手思考更久，适合熟悉卡牌" },
  { name: "标准", interval: .9, note: "会组合、留资源，也会反制" },
  { name: "大师", interval: .65, note: "行动更紧凑，更快抓住机会" }
];
const MODEL_RATES={spread:.014,clarify:.014};
const FUSION_COSTS=[0,30,45];
const MODERATION={threshold:40,rate:.0010,minConnections:12,attentionThreshold:55,riskGain:.4,riskDecay:.05,attentionDrop:6};
const CARD_PARAMS={
  hot:{multiplier:1.65,heatDelta:.25,ambiguityDelta:.08,banRisk:12},
  army:{chance:.8,bonusTargets:2,banRisk:18},control:{voiceMultiplier:.3},
  weaktie:{chance:.9},pr:{multiplier:1.7},agenda:{increment:.12,cap:.36},
  lottery:{chance:.9,heatDelta:.1},script:{chance:.9,ambiguityDelta:.15},
  debunk:{trustCoefficient:.55,baseChance:.2,coldChance:.25,bonusTargets:3,trustDelta:.02,ambiguityDelta:-.3},
  cold:{multiplier:.6,forget:.016,heatDelta:-.2,banRisk:-25},vaxx:{},radio:{chance:1},dig:{},
  chot:{voiceDelta:.8,voiceCap:2,multiplier:2,trustDelta:.05},farm:{banRisk:22},scout:{chance:1}
};
const CARD_THEORY={
  hot:'议程显著性：提高热度项 H，放大每次接触的传播概率。',army:'两级传播：先影响高连接账号，再由意见节点带动人群。',
  control:`沉默的螺旋：发声意愿 V ×${CARD_PARAMS.control.voiceMultiplier}，辅导员与直接核实卡不受影响。`,weaktie:'弱连接理论：让信息通过边缘关系进入其他圈层。',
  pr:'两级传播：意见领袖的传播力 q 获得阶段加成。',agenda:'议程设置：重要性 i 增加，同时改变 R=i×a 与实际传播倍率。',
  lottery:'使用与满足：额外动机带来转述，而接触不等于相信。',script:'信息反转：新说法抬高模糊性 a，改变谣言强度与二次传播。',
  debunk:`公信力模型：P=${CARD_PARAMS.debunk.trustCoefficient}T+${CARD_PARAMS.debunk.baseChance}，冷处理中额外 +${CARD_PARAMS.debunk.coldChance}。`,cold:`遗忘机制：每步自然退出信谣的概率由 0.0028 提高到 ${CARD_PARAMS.cold.forget}。`,
  vaxx:'McGuire 接种理论：预先接触证据，阶段性降低被说服的可能。',radio:'使用与满足：定向满足求证需求，核实抵达后才改变判断。',
  dig:'信息源可信度：限制关键传播源的输出，而非直接改变全部受众。',chot:`沉默的螺旋：V +${CARD_PARAMS.chot.voiceDelta}（最高${CARD_PARAMS.chot.voiceCap}），辟谣bot核实效率再 ×${CARD_PARAMS.chot.multiplier}。`,
  farm:'传播资源：资源服务于行动，不直接等同于相信人数。',scout:'创新扩散：意见桥梁的网络位置影响信息到达范围。'
};
const CARD_DEFS = [
  { id:"hot", name:"加热搜", side:"rumor", cost:85, cd:2, rarity:1, category:"持续", amount:0, duration:2.3, effect:"转述效率 ×1.65，讨论热度 +25%", target:"全网络", combo:"先加热搜，再用水军或弱连接扩大传播。", counter:"冷处理降低传播，辟谣热搜增加核实。" },
  { id:"army", name:"买水军", side:"rumor", cost:100, cd:2, rarity:1, category:"行动", amount:7, duration:0, effect:"向 {n} 个高连接账号送达转述，80% 被说服", target:"未相信、未受证据保护的在线账号", combo:"热搜生效时多影响 2 人。", counter:"群体接种保护关键人物，反黑调查抑制源头。" },
  { id:"control", name:"控评", side:"rumor", cost:75, cd:2, rarity:1, category:"应对", amount:0, duration:1.8, effect:"自然发声意愿 ×0.3；不影响辅导员与直接核实卡", target:"bot、理中客的自然澄清路径", combo:"在对手提高核实效率时使用。", counter:"校园电台的定向核实不受影响。" },
  { id:"weaktie", name:"弱连接渗透", side:"rumor", cost:85, cd:2.3, rarity:2, category:"行动", amount:5, duration:0, effect:"向 {n} 位低连接同学派送转述，尝试打开新圈层", target:"低连接、尚未相信的在线同学", combo:"先建立热度，再打开新路径。", counter:"预先核实可保护尚未入场的人群。" },
  { id:"pr", name:"大V公关", side:"rumor", cost:100, cd:2.5, rarity:2, category:"行动", amount:1, duration:2, effect:"说服 1 位大V或群主，其转述效率 ×1.7", target:"未被抑制、未受保护的大V或群主", combo:"与加热搜叠加；优先连接广的人。", counter:"反黑调查可让此节点暂时停止转述。" },
  { id:"agenda", name:"议程设置", side:"rumor", cost:130, cd:3.5, rarity:3, category:"持续", amount:0, duration:0, effect:"重要性 i +{i}，累计增量上限 +0.36", target:"全网络", combo:"适合前中期积累，不宜在收尾时投入。", counter:"提高持续核实能力，削弱长期收益。" },
  { id:"lottery", name:"转发抽奖", side:"rumor", cost:70, cd:1.6, rarity:1, category:"行动", amount:5, duration:0, effect:"向 {n} 位同学送达转述，热度 +10%", target:"普通在线同学", combo:"低成本建立第一轮讨论。", counter:"冷处理或电台及时跟进。" },
  { id:"script", name:"反转剧本", side:"rumor", cost:145, cd:4.5, rarity:3, category:"应对", amount:7, duration:1.4, effect:"{t} 天后向 {n} 人重新传播；证据保护仍有效", target:"已听说、但当前没有保护的人", combo:"对方大范围核实后，积蓄一次再传播。", counter:"反转抵达前使用群体接种或持续核实。" },
  { id:"debunk", name:"官方辟谣", side:"clarify", cost:100, cd:2.2, rarity:1, category:"行动", amount:11, duration:0, effect:"向 {n} 人核实，成功率由公信力公式决定", target:"优先高影响的在线相信者", combo:"冷处理中多核实 3 人，成功率额外 +25%。", counter:"转述方可用新路径恢复传播。" },
  { id:"cold", name:"冷处理", side:"clarify", cost:95, cd:2.8, rarity:1, category:"应对", amount:0, duration:1.4, effect:"降低转述与讨论热度，加速遗忘", target:"全网络", combo:"先降温，再用官方辟谣推送证据。", counter:"效果结束后仍可恢复传播，不能只靠降温。" },
  { id:"vaxx", name:"群体接种", side:"clarify", cost:85, cd:2.5, rarity:1, category:"持续", amount:9, duration:2.5, effect:"给 {n} 位关键同学建立证据保护，期间不被说服", target:"未相信且未受保护的在线人群", combo:"反转到来前使用，或保护跨圈层桥梁。", counter:"保护有时限；应配合核实现有传播源。" },
  { id:"radio", name:"校园电台", side:"clarify", cost:80, cd:1.8, rarity:2, category:"行动", amount:8, duration:0, effect:"向 {n} 人定向核实，抵达后修正判断", target:"在线相信者，不受控评影响", combo:"适合对方控评期间或处理小规模传播。", counter:"对方仍可从未保护的人群打开新路径。" },
  { id:"dig", name:"反黑调查", side:"clarify", cost:90, cd:2.8, rarity:2, category:"应对", amount:2, duration:2, effect:"让 {n} 个传播最广的账号暂停转述", target:"相信且仍可传播的关键节点", combo:"对方大V公关后优先反制，再派送证据。", counter:"影响有时限，其他圈层仍会传播。" },
  { id:"chot", name:"辟谣热搜", side:"clarify", cost:90, cd:2.4, rarity:2, category:"持续", amount:0, duration:2.4, effect:"发声意愿 +0.8，bot核实 ×2，公信力 +5%", target:"辟谣bot与理中客的核实路径", combo:"传播已经扩大时，为后续核实争取时间。", counter:"控评会抵消部分发声加成。" },
  { id:"farm", name:"资源整理", side:"both", cost:40, cd:2.5, rarity:1, category:"资源", amount:85, duration:0, effect:"整理现有渠道，立即获得 {n} 资源", target:"自己的资源", combo:"需要积蓄大牌或融牌费用时使用。", counter:"消耗一次手牌机会，不能跳过同名冷却。" },
  { id:"scout", name:"关键节点", side:"both", cost:75, cd:2.5, rarity:2, category:"行动", amount:4, duration:0, effect:"对 {n} 个连接最广的账号进行定向行动", target:"传谣者转述；辟谣者核实", combo:"按当前最有影响的节点行动。", counter:"保护与源头抑制会改变收益。" }
];
const CARD_BY_ID = Object.fromEntries(CARD_DEFS.map(c => [c.id,c]));
const ENDINGS = {
  known:{icon:"✹", title:"全网皆知", desc:"信息曾越过最初的圈层，被大量人物同时相信。热度过后，这次传播仍留下了痕迹。"},
  cradle:{icon:"❄",title:"被扼杀在摇篮里",desc:"证据赶在大规模转述之前抵达，传闻在最初几个圈层里失去了动力。"},
  rebound:{icon:"↻",title:"反转后二次爆发",desc:"最初的判断被修正后，信息又沿新的路径传播。一次回应，并不等于过程已经结束。"},
  meme:{icon:"◈",title:"娱乐化消解",desc:"听说的人很多，相信的人却越来越少。信息仍被讨论，最初的说法已经不再有同样的说服力。"},
  fade:{icon:"✦",title:"悄然平息",desc:"转述逐渐减少，核实与遗忘慢慢占据上风。多数人回到日常，传闻悄然退场。"},
  stalemate:{icon:"…",title:"余波未尽",desc:"主要传播已经走完，仍有小圈层保留着不同判断。这次对抗结束，信息的余波还没有完全消失。"}
};
function seededRandom(seed) {
  let s=seed>>>0;
  return () => {s+=0x6D2B79F5; let n=Math.imul(s^s>>>15,1|s); n^=n+Math.imul(n^n>>>7,61|n); return ((n^n>>>14)>>>0)/4294967296;};
}
function cardStats(card) {
  const d=CARD_BY_ID[card.id], factor=1+(card.level-1)*.3;
  return {...CARD_PARAMS[card.id],cost:d.cost+(card.level-1)*12, amount:d.id==='pr'?d.amount:Math.round(d.amount*factor), duration:d.id==='script'?d.duration:d.duration*(1+(card.level-1)*.15), factor};
}
function cardDescription(card) {
  const s=cardStats(card);
  const pct=n=>Math.round(n*100);
  switch(card.id){
    case 'hot':return `转述 ×${s.multiplier}，热度 +${pct(s.heatDelta)}%`;
    case 'army':return `派送最多 ${s.amount} 份转述，说服率 ${pct(s.chance)}%`;
    case 'control':return `自然发声意愿 ×${s.voiceMultiplier}，直接核实卡仍有效`;
    case 'pr':return `带动 1 位大V或群主，转述 ×${s.multiplier}`;
    case 'agenda':return `重要性 i +${(s.increment*s.factor).toFixed(3)}，累计上限 +${s.cap}`;
    case 'lottery':return `派送 ${s.amount} 份转述，热度 +${pct(s.heatDelta)}%`;
    case 'cold':return `转述 ×${s.multiplier}，每步遗忘率 ${pct(s.forget)}%`;
    case 'chot':return `发声意愿 +${s.voiceDelta}，bot核实 ×${s.multiplier}`;
  }
  return CARD_BY_ID[card.id].effect.replace('{n}',s.amount).replace('{t}',s.duration.toFixed(1));
}
function cardResolution(card,side) {
  const s=cardStats(card),days=s.duration.toFixed(1);
  switch(card.id) {
    case 'hot':return `立即提高热度 ${s.heatDelta*100} 个百分点（最高 100%）、模糊性 +${s.ambiguityDelta}（最高 1.2）；自然转述 ×${s.multiplier}，持续 ${days} 天。`;
    case 'army':return `向最多 ${s.amount} 个高连接账号派送转述，每人抵达时有 ${s.chance*100}% 概率相信。热搜期间额外派送 ${s.bonusTargets} 人；证据保护仍会阻止说服。`;
    case 'control':return `自然发声意愿 ×${s.voiceMultiplier}，持续 ${days} 天。影响 bot 和理中客的自然核实；辅导员、官方辟谣和校园电台不受此项影响。`;
    case 'weaktie':return `优先向连接较少的同学派送最多 ${s.amount} 份转述，每份抵达后有 ${s.chance*100}% 概率说服。目标来自全网，不保证每次都进入新圈层。`;
    case 'pr':return `立即说服 1 位大V或群主，优先尚未相信者及高连接者；其自然转述 ×${s.multiplier}，持续 ${days} 天。保护、抑制或公关加成尚未结束的关键人物不能成为目标。`;
    case 'agenda':return `立即提高重要性 i ${(s.factor*s.increment).toFixed(3)}，本局累计最多 +${s.cap}。强化提高单次增量，不提高累计上限。`;
    case 'lottery':return `优先向普通同学派送最多 ${s.amount} 份转述，抵达后有 ${s.chance*100}% 概率说服；立即提高热度 ${s.heatDelta*100} 个百分点（最高 100%）。`;
    case 'script':return `立即提高模糊性 ${s.ambiguityDelta}（最高 1.2）；准备 ${days} 天后，向最多 ${s.amount} 位已听说、尚未相信且未受保护的人派送转述，抵达后有 ${s.chance*100}% 概率说服。强化不延长准备时间。`;
    case 'debunk':return `向最多 ${s.amount} 位相信者派送证据，按连接数优先。出牌时锁定成功率：${s.trustCoefficient} × 公信力 +${s.baseChance}；冷处理期间额外 +${s.coldChance*100} 个百分点并多派送 ${s.bonusTargets} 人。立即提高公信力 ${s.trustDelta}（最高 0.95）、降低模糊性 ${-s.ambiguityDelta}（最低 0.2）。成功抵达者获 1 天证据保护。`;
    case 'cold':return `自然转述 ×${s.multiplier}、每步基础遗忘率变为 ${s.forget*100}%，持续 ${days} 天；立即降低热度 ${-s.heatDelta*100} 个百分点（最低 5%）。玩梗期间遗忘率另乘 3。`;
    case 'vaxx':return `立即让最多 ${s.amount} 位未相信、未受保护的在线同学接触证据；按连接数优先，保护 ${days} 天，期间不会被说服。`;
    case 'radio':return `向最多 ${s.amount} 位高连接相信者派送核实，抵达时若仍相信则修正判断，并保护 1 天。不受公信力和控评影响。`;
    case 'dig':return `立即抑制最多 ${s.amount} 个仍在转述的相信者，按连接数优先，持续 ${days} 天。停止新的自然转述，已经发出的消息继续抵达。`;
    case 'chot':return `自然发声意愿 +${s.voiceDelta}（最高 ${s.voiceCap}）、bot 自然核实效率 ×${s.multiplier}，持续 ${days} 天；立即提高公信力 ${s.trustDelta}（最高 0.95）。`;
    case 'farm':return `先支付 ${s.cost}，再获得 ${s.amount} 资源，净得 ${s.amount-s.cost}。不改变任何人的判断；同名牌共享冷却，强化不会绕过冷却。`;
    case 'scout':return `向最多 ${s.amount} 位高连接人物派送${side==='rumor'?'转述，抵达后若仍符合条件则说服；证据保护仍有效':'核实，抵达时若仍相信则修正判断，并保护 1 天'}。`;
  }
}
function cardRiskDelta(card,side) {
  if(['hot','army','cold'].includes(card.id)||(card.id==='farm'&&side==='rumor')){
    return cardStats(card).banRisk;
  }
  return 0;
}
function cardRisk(card,side) {
  const risk=cardRiskDelta(card,side);
  if(risk!==0)return `传谣账号封号风险 ${risk>0?'+':''}${risk} 点（限制在 0–100）；实际概率另由风险阈值计算。`;
  return '不直接改变封号风险。';
}
function cardCombo(card) {
  const s=cardStats(card);
  if(card.id==='army')return `热搜生效时多派送 ${s.bonusTargets} 人；请预留两张牌的实际费用。`;
  if(card.id==='debunk')return `冷处理中多派送 ${s.bonusTargets} 份核实，成功率额外 +${s.coldChance*100} 个百分点。`;
  return CARD_BY_ID[card.id].combo;
}
function cardUpgradeSummary(card) {
  const before=cardStats(card),after=cardStats({...card,level:card.level+1}),changes=[];
  if(before.amount!==after.amount)changes.push(`${card.id==='farm'?'获得资源':'目标人数'} ${before.amount} → ${after.amount}`);
  if(before.duration!==after.duration)changes.push(`持续 ${before.duration.toFixed(1)} → ${after.duration.toFixed(1)} 天`);
  if(card.id==='agenda')changes.push(`单次增量 ${(before.increment*before.factor).toFixed(3)} → ${(after.increment*after.factor).toFixed(3)}`);
  changes.push(`出牌费 ${before.cost} → ${after.cost}`,`融合费 ${FUSION_COSTS[card.level]}`, '消耗 1 张辅牌');
  return changes;
}
function incomeRate(side,counts) {return .20+.0015*(side==='rumor'?counts.i:counts.r);}
function banRiskAfter(risk,delta) {return Math.max(0,Math.min(100,risk+delta));}
function banChance(risk,targetCount) {return targetCount===0?0:Math.max(0,risk-MODERATION.threshold)*MODERATION.rate;}

class Simulation {
  constructor({seed,scenario,difficulty,role}) {
    this.seed=seed; this.scenario=scenario; this.difficulty=difficulty; this.role=role;
    this.random=seededRandom(seed); this.tickCount=0; this.day=0; this.ended=false; this.paused=false;
    this.heat=SCENARIOS[scenario].heat; this.trust=.78; this.ambiguity=1; this.memeUntil=0;
    this.attention=0;this.banRisk=0;this.banCount=0;this.stepBelieved=0;this.moderationRandom=seededRandom(seed^0x732acd);
    this.turningPoints=[];this.firstCross=null;this.strongestRebound=null;this.reboundFloor={day:0,belief:1};
    this.mediaUntil=0;this.examUntil=0;
    this.eventRandom=seededRandom(seed^0x4e83a9);this.chatRandom=seededRandom(seed^0x63b91f);
    this.nextAmbient=1.5+this.eventRandom()*1.2;this.lastAmbient='';this.ambientHistory=[];
    this.nextChat=25;this.lastSpeaker=-1;this.lastLine='';
    this.effects={hot:0,cold:0,control:0,chot:0}; this.agenda=0;
    this.particles=[]; this.messages=[]; this.actions=[]; this.samples=[];
    this.reversalAt=-1; this.reversalAmount=0; this.reversed=false; this.postPeak=0;this.reversalAction=null;
    this.nextActionId=0;
    this.peak=0; this.peakDay=0; this.knownTicks=0; this.zeroTicks=0;
    this.nextUid=0; this.nextEvent=2.3; this.event=null;this.lastEmergency=-1;this.emergencyHistory=[];this.eventFollowups=[];
    this.result=null; this.revision=0;
    this.buildNetwork();
    this.actors={rumor:this.makeActor('rumor'),clarify:this.makeActor('clarify')};
    this.player=this.actors[role]; this.opponent=this.actors[role==='rumor'?'clarify':'rumor'];
    this.nextAI=1.15; this.lastAI='正在观察最初的传播';
    const seeds=this.nodes.filter(n=>n.type==='mkt').slice(0,SCENARIOS[scenario].seeds);
    for(const n of seeds) this.infect(n.id);
    this.resetActivity();
    this.record(`校园墙收到一则新消息\n「${SCENARIOS[scenario].title}」\n${seeds.length} 个营销号率先发布，转述从这里开始。`,'start','rumor');
    this.sample();
  }
  buildNetwork() {
    this.nodes=[]; this.edges=[];
    const sizes={bigv:5,mkt:10,crowd:72,bot:5,mid:10,leader:6,troll:6,counselor:4};
    for(const [type,size] of Object.entries(sizes)) for(let j=0;j<size;j++) {
      const id=this.nodes.length,group=id%4;
      const publicNode=type!=='crowd'&&type!=='troll';
      this.nodes.push({id,type,group,state:type==='bot'?2:0,aware:false,banned:false,active:publicNode||j<24,
        spawnDay:publicNode||j<24?0:1.2+this.random()*7.5,
        shieldUntil:0,silencedUntil:0,boostUntil:0,incubateUntil:0,changedAt:0,lastReason:'还没有接触这条信息'});
    }
    const seen=new Set(),link=(a,b)=>{if(a===b)return;const key=[Math.min(a,b),Math.max(a,b)].join('-');if(!seen.has(key)){seen.add(key);this.edges.push([a,b]);}};
    const pick=arr=>arr[Math.floor(this.random()*arr.length)];
    const hubs=this.nodes.filter(n=>['bigv','mkt','leader'].includes(n.type));
    for(const n of this.nodes) {
      const local=this.nodes.filter(m=>m.group===n.group&&m.id!==n.id);
      link(n.id,pick(local).id); link(n.id,pick(local).id);
      link(n.id,pick(hubs.filter(m=>m.group===n.group)).id);
      if(this.random()<.35)link(n.id,pick(this.nodes).id);
    }
    for(const n of hubs) {link(n.id,pick(hubs).id);link(n.id,pick(hubs).id);}
    this.adj=this.nodes.map(()=>[]);
    for(const [a,b] of this.edges){this.adj[a].push(b);this.adj[b].push(a);}
  }
  makeActor(side) {
    const random=seededRandom(this.seed^(side==='rumor'?0x183abc:0x781cde));
    const a={side,random,decisionRandom:seededRandom(this.seed^(side==='rumor'?0x2ab901:0x790cab)),resource:180,hand:[],cooldown:Object.fromEntries(CARD_DEFS.map(c=>[c.id,0])),pity:0,draws:0,played:0,fused:0,spent:0,income:180};
    const groups=side==='rumor'?[['army','lottery','weaktie'],['control','script'],['farm']]:[['radio','debunk'],['cold','dig'],['farm']];
    for(const group of groups)a.hand.push(this.newCard(group[Math.floor(random()*group.length)],1));
    a.hand.push(this.drawCard(a));
    return a;
  }
  newCard(id,level) {return {uid:++this.nextUid,id,level};}
  drawCard(a) {
    let pool=CARD_DEFS.filter(d=>d.side===a.side||d.side==='both');
    if(a.pity===2) pool=pool.filter(d=>d.rarity>=2);
    const weight=d=>[0,5,2.5,1][d.rarity];
    let roll=a.random()*pool.reduce((n,d)=>n+weight(d),0),picked=pool[0];
    for(const d of pool){roll-=weight(d);if(roll<=0){picked=d;break;}}
    a.pity=picked.rarity>=2?0:a.pity+1;
    return this.newCard(picked.id,1);
  }
  counts() {
    const c={s:0,i:0,r:0,aware:0,total:0};
    for(const n of this.nodes)if(n.active){c.total++;c[['s','i','r'][n.state]]++;if(n.aware)c.aware++;}
    return c;
  }
  formulas() {
    const c=this.counts(),belief=c.i/c.total,i=SCENARIOS[this.scenario].importance+this.agenda,a=this.ambiguity;
    const hot=this.effects.hot>this.day,cold=this.effects.cold>this.day,control=this.effects.control>this.day,chot=this.effects.chot>this.day;
    let voice=Math.max(.2,1.2-belief);
    if(control)voice*=CARD_PARAMS.control.voiceMultiplier;
    if(chot)voice=Math.min(CARD_PARAMS.chot.voiceCap,voice+CARD_PARAMS.chot.voiceDelta);
    const heatFactor=.5+1.5*this.heat,multiplier=i*(.5+.5*a)*(hot?CARD_PARAMS.hot.multiplier:1)*(cold?CARD_PARAMS.cold.multiplier:1)*(this.mediaUntil>this.day?1.4:1)*(this.examUntil>this.day?.7:1);
    return {i,a,strength:i*a,belief,heatFactor,multiplier,voice,hot,cold,control,chot,
      spread:MODEL_RATES.spread*heatFactor*multiplier,
      forget:(cold?CARD_PARAMS.cold.forget:.0028)*(this.memeUntil>this.day?3:1),
      official:CARD_PARAMS.debunk.trustCoefficient*this.trust+CARD_PARAMS.debunk.baseChance+(cold?CARD_PARAMS.debunk.coldChance:0)};
  }
  naturalClarify(n,target,f) {
    if(n.type==='counselor')return MODEL_RATES.clarify*1.2;
    if(n.type==='mid')return MODEL_RATES.clarify*.4*f.voice;
    const suppressed=this.adj[target.id].some(id=>this.nodes[id].active&&this.nodes[id].state===1&&this.nodes[id].type==='troll');
    return MODEL_RATES.clarify*f.voice*(suppressed?.5:1)*(f.chot?CARD_PARAMS.chot.multiplier:1);
  }
  record(text,kind,side) {const message={day:this.day,text,kind,side};this.messages.push(message);return message;}
  chatLines(n) {
    if(['bot','mid','counselor'].includes(n.type)||n.state===1)return QUOTES[n.type];
    return n.state===2?CHAT_FOLLOWUPS[n.type]:CHAT_QUESTIONS;
  }
  say(n,replyTo) {
    const lines=this.chatLines(n);let index=Math.floor(this.chatRandom()*lines.length);
    if(lines[index]===this.lastLine)index=(index+1)%lines.length;
    this.lastLine=lines[index];this.lastSpeaker=n.id;
    this.messages.push({day:this.day,text:lines[index],kind:'quote',side:n.state===1?'rumor':'clarify',speaker:n.id,type:n.type,state:n.state,group:n.group,replyTo});
  }
  conversation() {
    const listeners=this.nodes.filter(n=>n.active&&(n.aware||n.type==='bot'));
    let types=Object.keys(TYPES).filter(type=>listeners.some(n=>n.type===type));
    if(types.length>1&&this.lastSpeaker>=0)types=types.filter(type=>type!==this.nodes[this.lastSpeaker].type);
    const type=types[Math.floor(this.chatRandom()*types.length)],voices=listeners.filter(n=>n.type===type);
    const speaker=voices[Math.floor(this.chatRandom()*voices.length)];this.say(speaker,-1);
    const replies=listeners.filter(n=>this.adj[speaker.id].includes(n.id)&&n.type!==speaker.type);
    if(replies.length>0){
      replies.sort((a,b)=>(a.state===speaker.state)-(b.state===speaker.state));
      this.say(replies[0],speaker.id);
    }
    this.nextChat=this.tickCount+24+Math.floor(this.chatRandom()*20);
  }
  clarifySome(chance) {
    let corrected=0;
    for(const n of this.nodes)if(n.active&&n.state===1&&this.eventRandom()<chance){this.clarify(n.id);corrected++;}
    this.activity.clarified+=corrected;
    return corrected;
  }
  suppressSources(count,duration,group) {
    const sources=this.nodes.filter(n=>n.active&&n.group===group&&n.state===1&&n.silencedUntil<=this.day).sort((a,b)=>this.adj[b.id].length-this.adj[a.id].length).slice(0,count);
    for(const n of sources){n.silencedUntil=this.day+duration;n.changedAt=this.tickCount;n.lastReason='平台核查使关键传播账号暂时受限';}
    return sources.length;
  }
  campusEvent(id) {
    const event=CAMPUS_EVENTS.find(e=>e.id===id);let detail='';
    switch(id){
      case 'exams':this.heat*=.55;this.examUntil=this.day+2;detail='全校进入闭关模式，群里突然安静下来。\n讨论热度降低，接下来 2 天自然转述再 ×0.7。';break;
      case 'witness':{
        this.ambiguity=Math.max(.2,this.ambiguity-.25);const n=this.clarifySome(.12);
        detail=`当事人把完整经过发了出来，${n} 人看过材料后修正判断。\n模糊性降低，群里开始追问最初的信源。`;break;
      }
      case 'repost':this.heat=Math.min(1,this.heat+.25);this.mediaUntil=this.day+1.5;detail='校外自媒体开始搬运，谣言正在出圈。\n热度上升，接下来 1.5 天自然转述 ×1.4。';break;
      case 'meme':this.memeUntil=this.day+3;this.ambiguity=Math.max(.2,this.ambiguity-.1);detail='谣言沦为表情包，大家只玩梗不当真。\n接下来 3 天遗忘率 ×3；还在讨论，不等于仍然相信。';break;
      case 'screenshot':{
        this.ambiguity=Math.min(1.2,this.ambiguity+.15);
          const targets=this.nodes.filter(n=>n.active&&!n.banned&&n.state===0&&n.type!=='bot'&&n.shieldUntil<=this.day);let changed=0;
        for(let i=0;i<5&&targets.length>0;i++){
          const n=targets.splice(Math.floor(this.eventRandom()*targets.length),1)[0],heard=n.aware;
          if(this.infect(n.id)){changed++;if(!heard)this.activity.heard++;}
        }
        this.activity.believed+=changed;
        detail=`一张来路不明的截图被当作实锤，${changed} 人开始相信。\n模糊性上升，截图是否完整还没有人说清。`;break;
      }
    }
    this.lastAmbient=id;this.ambientHistory.push({id,day:this.day});
    this.record(`${event.icon} ${event.name}\n${detail}`,'ambient',event.side);this.nextChat=Math.min(this.nextChat,this.tickCount+2);
  }
  resetActivity() {
    const c=this.counts();
    this.activity={arrived:0,heard:0,believed:0,clarified:0,forgot:0,cross:0,joined:0,belief:c.i/c.total};
  }
  reportActivity() {
    const a=this.activity,c=this.counts(),belief=c.i/c.total;
    if(a.arrived+a.forgot+a.joined>0){
      const title=a.cross>0?'转述越过了原来的圈层':a.believed>a.clarified+a.forgot?'讨论正在扩大':a.clarified+a.forgot>0?'核实与遗忘正在接力':a.joined>0?'新的围观者进入校园墙':'信息仍在流动，判断暂未改变';
      this.record(`${title}\n新增听说 ${a.heard} 人；开始相信 ${a.believed} 人次，核实 ${a.clarified} 人次，遗忘 ${a.forgot} 人次。\n相信率 ${Math.round(a.belief*100)}% → ${Math.round(belief*100)}%${a.cross>0?' · 跨圈传播 '+a.cross+' 次':''}${a.joined>0?' · 新上线 '+a.joined+' 人':''}`,'observe',a.believed>a.clarified+a.forgot?'rumor':a.clarified+a.forgot>a.believed?'clarify':'both');
    }
    this.resetActivity();
  }
  sample() {const c=this.counts();this.samples.push({day:this.day,belief:c.i/c.total,aware:c.aware/c.total,population:c.total});}
  targets(side) {
    return this.nodes.filter(n=>n.active&&!n.banned&&n.type!=='bot'&&(side==='rumor'?n.state!==1&&n.shieldUntil<=this.day:n.state===1));
  }
  moderation() {
    const targets=this.nodes.filter(n=>n.active&&!n.banned&&n.state===1&&this.adj[n.id].length>=MODERATION.minConnections);
    const chance=banChance(this.banRisk,targets.length);
    return {risk:this.banRisk,attention:this.attention,chance,targets,banned:this.banCount};
  }
  riskPreview(card,side) {
    const m=this.moderation(),after=banRiskAfter(m.risk,cardRiskDelta(card,side));
    return {before:m.risk,after,beforeChance:m.chance,afterChance:banChance(after,m.targets.length),
      crossed:m.risk<=MODERATION.threshold&&after>MODERATION.threshold,targets:m.targets.length};
  }
  changeBanRisk(delta) {this.banRisk=banRiskAfter(this.banRisk,delta);}
  updateModeration() {
    const c=this.counts(),hot=this.effects.hot>this.day;
    this.attention=Math.max(0,Math.min(100,this.attention+this.heat*.15+c.aware/c.total*.12+this.stepBelieved*.012+(hot?.12:0)-.08));
    this.changeBanRisk((this.attention>MODERATION.attentionThreshold?MODERATION.riskGain:0)-MODERATION.riskDecay);
    const m=this.moderation();
    if(m.chance>0&&this.moderationRandom()<m.chance){
      const n=m.targets[Math.floor(this.moderationRandom()*m.targets.length)];
      this.turningPoints.push({kind:'ban',day:this.day,weight:this.adj[n.id].length*.5+(n.boostUntil>this.day?4:0),
        text:`${TYPES[n.type].name} #${n.id+1} 被封禁，停止沿 ${this.adj[n.id].length} 条连接转述`});
      n.banned=true;n.state=2;n.aware=true;n.changedAt=this.tickCount;n.lastReason='平台封禁传谣账号，本局不能再转述或被说服';
      this.banCount++;this.attention=Math.max(0,this.attention-MODERATION.attentionDrop);
      this.record(`🚫 ${TYPES[n.type].name} #${n.id+1} 因传谣被封禁\n账号退出传谣，已发出的消息继续抵达；仍计入已上线人物。`,'moderation','clarify');
    }
  }
  infect(id) {
    const n=this.nodes[id];
    if(!n.active||n.banned||n.type==='bot'||n.state===1||n.shieldUntil>this.day)return false;
    n.state=1;n.aware=true;n.incubateUntil=this.day+.1;n.changedAt=this.tickCount;n.lastReason='收到一次转述，开始相信';
    return true;
  }
  clarify(id) {
    const n=this.nodes[id];n.state=2;n.aware=true;n.shieldUntil=this.day+1;n.changedAt=this.tickCount;n.lastReason='核实材料抵达，修正了判断';
  }
  send(a,b,kind,chance) {
    if(this.particles.length===260)return null;
    const particle={a,b,kind,chance,t:0,sp:.055,action:null};this.particles.push(particle);return particle;
  }
  completeDelivery(action) {
    this.record(`「${CARD_BY_ID[action.card].name}」抵达结果\n${action.arrived} 份消息抵达，${action.changed} 人${action.side==='rumor'?'开始相信':'修正判断'}。\n${action.blocked} 份因保护、封禁或判断已改变而无效；${action.failed} 份未能说服。`,'delivery',action.side).card=action.card;
  }
  playProblem(a,card) {
    const d=CARD_BY_ID[card.id],s=cardStats(card);
    if(this.ended)return '本局已经结束';
    if(this.paused)return '先继续传播，再出牌';
    if(a.resource<s.cost)return `还需 ${Math.ceil(s.cost-a.resource)} 资源`;
    if(a.cooldown[d.id]>this.day)return `同名冷却还剩 ${(a.cooldown[d.id]-this.day).toFixed(1)} 天`;
    if(d.side!=='both'&&d.side!==a.side)return '不属于当前阵营';
    if(['army','weaktie','lottery','debunk','radio','scout'].includes(d.id)&&this.targets(a.side).length===0)return '当前没有可作用的人物';
    if(d.id==='vaxx'&&!this.nodes.some(n=>n.active&&!n.banned&&n.type!=='bot'&&n.state!==1&&n.shieldUntil<=this.day))return '当前没有需要保护的人物';
    if(d.id==='dig'&&!this.nodes.some(n=>n.active&&n.state===1&&n.silencedUntil<=this.day))return '没有仍在转述的传播源';
    if(d.id==='pr'&&!this.nodes.some(n=>n.active&&!n.banned&&['bigv','leader'].includes(n.type)&&n.shieldUntil<=this.day&&n.silencedUntil<=this.day&&n.boostUntil<=this.day))return '关键人物正在受保护、抑制或已封禁';
    if(d.id==='script'&&this.reversalAt>this.day)return '已经有一次反转正在酝酿';
    if(d.id==='agenda'&&this.agenda>=s.cap)return '议程增益已经达到上限';
    return '';
  }
  play(a,uid) {
    const card=a.hand.find(c=>c.uid===uid),problem=this.playProblem(a,card);
    if(problem)return problem;
    const d=CARD_BY_ID[card.id],s=cardStats(card);
    a.resource-=s.cost;a.spent+=s.cost;a.cooldown[d.id]=this.day+d.cd;a.played++;
    const action={id:++this.nextActionId,day:this.day,resolvedDay:this.day,side:a.side,card:d.id,level:card.level,cost:s.cost,sent:0,pending:0,arrived:0,changed:0,immediate:0,blocked:0,failed:0};
    this.actions.push(action);
    const before=this.nodes.map(n=>[n.state,n.shieldUntil,n.silencedUntil,n.boostUntil]);
    const queued=this.particles.length,detail=this.apply(a,card);
    action.immediate=this.nodes.filter((n,i)=>n.state!==before[i][0]||n.shieldUntil!==before[i][1]||n.silencedUntil!==before[i][2]||n.boostUntil!==before[i][3]).length;
    for(const p of this.particles.slice(queued)){p.action=action;action.sent++;action.pending++;}
    if(d.id==='script')this.reversalAction=action;
    if(card.level===1){a.hand.splice(a.hand.indexOf(card),1);a.hand.push(this.drawCard(a));}
    this.record(`${a===this.player?'你':'人机'}使用「${d.name}」${card.level>1?' '+['','I','II','III'][card.level]:''}\n${detail}\n${cardRisk(card,a.side)}`, 'card',a.side).card=d.id;
    this.revision++;
    return '';
  }
  apply(a,card) {
    const d=CARD_BY_ID[card.id],s=cardStats(card),side=a.side;
    const before=this.formulas(),queued=this.particles.length;
    this.changeBanRisk(cardRiskDelta(card,side));
    let detail='';
    const ranked=this.targets(side).sort((x,y)=>this.adj[y.id].length-this.adj[x.id].length);
    const dispatch=(list,count,chance)=>{
      const origin=this.nodes.find(n=>n.active&&n.type===(side==='rumor'?'mkt':'bot'));
      for(const n of list.slice(0,count))this.send(origin.id,n.id,side,chance);
    };
    switch(d.id) {
      case 'hot':this.effects.hot=this.day+s.duration;this.heat=Math.min(1,this.heat+s.heatDelta);this.ambiguity=Math.min(1.2,this.ambiguity+s.ambiguityDelta);break;
      case 'army':dispatch(ranked,s.amount+(this.effects.hot>this.day?s.bonusTargets:0),s.chance);break;
      case 'control':this.effects.control=this.day+s.duration;break;
      case 'weaktie':dispatch(ranked.sort((x,y)=>this.adj[x.id].length-this.adj[y.id].length),s.amount,s.chance);break;
      case 'pr':{
        const n=this.nodes.filter(n=>n.active&&!n.banned&&['bigv','leader'].includes(n.type)&&n.shieldUntil<=this.day&&n.silencedUntil<=this.day&&n.boostUntil<=this.day).sort((x,y)=>(x.state===1?1:0)-(y.state===1?1:0)||this.adj[y.id].length-this.adj[x.id].length)[0];
        this.infect(n.id);n.boostUntil=this.day+s.duration;n.lastReason='大V公关带来持续转述';detail=`${TYPES[n.type].name} #${n.id+1} 开始带动 ${this.adj[n.id].length} 条连接，转述力 ×${s.multiplier}，持续 ${s.duration.toFixed(1)} 天。`;break;
      }
      case 'agenda':this.agenda=Math.min(s.cap,this.agenda+s.increment*s.factor);break;
      case 'lottery':dispatch(ranked.filter(n=>n.type==='crowd').concat(ranked.filter(n=>n.type!=='crowd')),s.amount,s.chance);this.heat=Math.min(1,this.heat+s.heatDelta);break;
      case 'script':this.reversalAt=this.day+s.duration;this.reversalAmount=s.amount;this.ambiguity=Math.min(1.2,this.ambiguity+s.ambiguityDelta);break;
      case 'debunk':dispatch(ranked,s.amount+(this.effects.cold>this.day?s.bonusTargets:0),this.formulas().official);this.trust=Math.min(.95,this.trust+s.trustDelta);this.ambiguity=Math.max(.2,this.ambiguity+s.ambiguityDelta);break;
      case 'cold':this.effects.cold=this.day+s.duration;this.heat=Math.max(.05,this.heat+s.heatDelta);break;
      case 'vaxx':{
        const targets=this.nodes.filter(n=>n.active&&!n.banned&&n.type!=='bot'&&n.state!==1&&n.shieldUntil<=this.day).sort((x,y)=>this.adj[y.id].length-this.adj[x.id].length);
        const protectedNodes=targets.slice(0,s.amount);
        for(const n of protectedNodes){n.shieldUntil=this.day+s.duration;n.aware=true;n.state=2;n.changedAt=this.tickCount;n.lastReason='提前接触证据，暂时受到保护';}
        detail=`${protectedNodes.length} 位关键同学提前接触证据，保护持续 ${s.duration.toFixed(1)} 天。\n接种期间不会被转述说服。`;break;
      }
      case 'radio':dispatch(ranked,s.amount,s.chance);break;
      case 'dig':{
        const sources=ranked.filter(n=>n.silencedUntil<=this.day).slice(0,s.amount);
        for(const n of sources){n.silencedUntil=this.day+s.duration;n.changedAt=this.tickCount;n.lastReason='调查使该账号暂时停止转述';}
        detail=`${sources.map(n=>TYPES[n.type].name+' #'+(n.id+1)).join('、')}暂时停止转述，持续 ${s.duration.toFixed(1)} 天。\n其他圈层仍会继续传播。`;break;
      }
      case 'chot':this.effects.chot=this.day+s.duration;this.trust=Math.min(.95,this.trust+s.trustDelta);break;
      case 'farm':a.resource+=s.amount;a.income+=s.amount;break;
      case 'scout':dispatch(ranked,s.amount,s.chance);break;
    }
    const after=this.formulas(),sent=this.particles.length-queued,pct=n=>(n*100).toFixed(1)+'%';
    switch(d.id){
      case 'hot':return `讨论被推上热搜，热度升至 ${pct(this.heat)}，转述倍率 ×${s.multiplier}。\n谣言强度 R ${before.strength.toFixed(2)} → ${after.strength.toFixed(2)}。`;
      case 'army':return `${sent} 份转述发往高连接账号，抵达后的说服率 ${pct(s.chance)}。${before.hot?'\n组合 · 热搜加持，额外争取 '+s.bonusTargets+' 个目标。':''}`;
      case 'control':return `辟谣声音被压低，发声意愿 V ${before.voice.toFixed(2)} → ${after.voice.toFixed(2)}。\n辅导员和直接核实卡仍能行动。`;
      case 'weaktie':return `${sent} 份转述沿弱连接发往低连接同学，尝试打开外圈。\n抵达后的说服率 ${pct(s.chance)}，证据保护仍有效。`;
      case 'pr':case 'vaxx':case 'dig':return detail;
      case 'agenda':return `重要性 i ${before.i.toFixed(3)} → ${after.i.toFixed(3)}。\n消息进入公共议程，R=i×a 也随之改变。`;
      case 'lottery':return `${sent} 份抽奖转述正在派送，热度升至 ${pct(this.heat)}。\n看见奖品不等于相信消息，抵达后再判断。`;
      case 'script':return `新说法正在酝酿，${s.duration.toFixed(1)} 天后向最多 ${s.amount} 人发起再传播。\n模糊性 a ${before.a.toFixed(2)} → ${after.a.toFixed(2)}。`;
      case 'debunk':return `${sent} 份官方材料正在派送，成功率 ${pct(before.official)}。${before.cold?'\n组合 · 权威降温：成功率额外 +'+s.coldChance*100+' 个百分点。':''}\n模糊性 a ${before.a.toFixed(2)} → ${after.a.toFixed(2)}；抵达后才结算。`;
      case 'cold':return `讨论降温，转述倍率 ×${s.multiplier}。\n每步遗忘率 ${pct(before.forget)} → ${pct(after.forget)}，持续 ${s.duration.toFixed(1)} 天。`;
      case 'radio':return `校园电台发出 ${sent} 份定向核实。\n不受控评影响，材料抵达后修正判断。`;
      case 'chot':return `求证声音被推上热搜，V ${before.voice.toFixed(2)} → ${after.voice.toFixed(2)}，bot 核实 ×${s.multiplier}。\n当前公信力 T=${this.trust.toFixed(2)}。`;
      case 'farm':return `整理渠道获得 ${s.amount} 资源；扣除本次费用，净得 ${s.amount-s.cost}。\n暂不改变任何人的判断。`;
      case 'scout':return `定向消息已发往 ${sent} 位意见桥梁。\n优先处理连接最广的节点，抵达后改变判断。`;
    }
  }
  fusionProblem(a,mainUid,auxUid) {
    if(this.ended)return '本局已经结束';
    if(this.paused)return '先继续传播，再确认融牌';
    if(mainUid===0||auxUid===0)return '依次选择主牌与辅牌';
    if(mainUid===auxUid)return '主牌与辅牌需要是两张牌';
    const main=a.hand.find(c=>c.uid===mainUid),aux=a.hand.find(c=>c.uid===auxUid);
    if(main.level===3)return '三级牌已达强化上限';
    if(main.level!==aux.level)return '需要两张相同强化等级的牌';
    if(a.resource<FUSION_COSTS[main.level])return '融合资源不足';
    return '';
  }
  fuse(a,mainUid,auxUid) {
    const problem=this.fusionProblem(a,mainUid,auxUid);if(problem)return problem;
    const main=a.hand.find(c=>c.uid===mainUid),aux=a.hand.find(c=>c.uid===auxUid),cost=FUSION_COSTS[main.level];
    a.resource-=cost;a.spent+=cost;main.level++;a.hand.splice(a.hand.indexOf(aux),1);a.fused++;
    this.record(`${a===this.player?'你':'人机'}将「${CARD_BY_ID[main.id].name}」融合至 ${['','I','II','III'][main.level]} 级\n支付 ${cost} 资源，消耗「${CARD_BY_ID[aux.id].name}」；原有同名冷却保留。`,'fusion',a.side);
    this.actions.push({day:this.day,side:a.side,card:main.id,level:main.level,cost,fusion:true});this.revision++;
    return '';
  }
  drawProblem(a) {
    if(this.ended||this.paused)return '请在对局进行时抽牌';
    if(a.hand.length===5)return '手牌已满，可先出牌或融合';
    if(a.resource<35)return '抽牌需要 35 资源';
    return '';
  }
  draw(a) {
    const problem=this.drawProblem(a);if(problem)return problem;
    a.resource-=35;a.spent+=35;a.draws++;a.hand.push(this.drawCard(a));this.revision++;
    this.record(`${a===this.player?'你':'人机'}支付 35 资源补充手牌\n手牌现为 ${a.hand.length} 张，资源余额 ${Math.floor(a.resource)}。`,'draw',a.side);return '';
  }
  evaluate(a,card) {
    const d=CARD_BY_ID[card.id],c=this.counts(),r=c.i/c.total,s=cardStats(card),targets=this.targets(a.side).length;
    let value=0;
    if(d.id==='farm')value=a.resource<120?38:5;
    if(d.id==='hot')value=this.effects.hot>this.day?0:12+c.i*.8+(this.effects.cold>this.day?15:0);
    if(d.id==='army')value=Math.min(s.amount,targets)*4+(this.effects.hot>this.day?12:0)+(c.i<6?22:0);
    if(d.id==='weaktie'||d.id==='lottery')value=Math.min(s.amount,targets)*4+(c.i<8?18:0);
    if(d.id==='pr')value=23+(c.i<12?12:0);
    if(d.id==='control')value=this.effects.control>this.day?0:8+c.i*.7+(this.effects.chot>this.day?15:0);
    if(d.id==='agenda')value=this.day<6?18+this.day:0;
    if(d.id==='script')value=this.day<9?10+c.r*.25+(r<.25?16:0):0;
    if(d.id==='debunk'||d.id==='radio')value=Math.min(s.amount,targets)*4+(this.effects.cold>this.day&&d.id==='debunk'?12:0);
    if(d.id==='cold')value=this.effects.cold>this.day?0:8+c.i*.8+(this.effects.hot>this.day?18:0);
    if(d.id==='vaxx')value=8+Math.min(12,targets)*.4+(this.reversalAt>this.day?25:0)+(r<.18?7:0);
    if(d.id==='dig'){
      const high=this.nodes.filter(n=>n.active&&n.state===1&&n.silencedUntil<=this.day).sort((x,y)=>this.adj[y.id].length-this.adj[x.id].length);
      value=high.slice(0,s.amount).reduce((v,n)=>v+this.adj[n.id].length*1.2+(n.boostUntil>this.day?15:0),0);
    }
    if(d.id==='chot')value=this.effects.chot>this.day?0:10+c.i*.55+(this.effects.control>this.day?12:0);
    if(d.id==='scout')value=Math.min(s.amount,targets)*5+(a.side==='rumor'&&c.i<8?16:0);
    return value*100/(s.cost+60);
  }
  pressure() {
    return this.nodes.reduce((value,n)=>value+(n.active&&n.state===1?1+this.adj[n.id].length*.035:0),0);
  }
  project(a,action,trial) {
    const s=Object.create(Simulation.prototype),side=a.side;
    const trialSeed=(this.tickCount+1)*7867^(side==='rumor'?3751:9127)^((trial+1)*42851);
    Object.assign(s,{
      seed:this.seed,scenario:this.scenario,difficulty:this.difficulty,role:side,
      random:seededRandom(trialSeed),moderationRandom:seededRandom(trialSeed^0x732acd),
      attention:this.attention,banRisk:this.banRisk,banCount:this.banCount,stepBelieved:0,
      tickCount:this.tickCount,day:this.day,ended:false,paused:false,
      heat:this.heat,trust:this.trust,ambiguity:this.ambiguity,memeUntil:this.memeUntil,mediaUntil:this.mediaUntil,examUntil:this.examUntil,
      effects:{...this.effects},agenda:this.agenda,particles:this.particles.map(p=>({...p,action:null})),
      nodes:this.nodes.map(n=>({...n,spawnDay:1000})),edges:this.edges,adj:this.adj,
      messages:[],actions:[],samples:[],reversalAt:this.reversalAt,reversalAmount:this.reversalAmount,reversalAction:null,nextActionId:0,
      reversed:this.reversed,postPeak:this.postPeak,peak:this.peak,peakDay:this.peakDay,
      knownTicks:this.knownTicks,zeroTicks:this.zeroTicks,nextUid:this.nextUid,nextAI:1000,nextEvent:1000,nextAmbient:1000,nextChat:100000,lastEmergency:-1,emergencyHistory:[],eventFollowups:this.eventFollowups.map(item=>({...item})),
      event:null,result:null,revision:0,turningPoints:[],firstCross:null,strongestRebound:null,reboundFloor:{...this.reboundFloor}
    });
    s.actors={};
    // Only the acting side's current hand is known; future draws use trial RNG.
    for(const role of ['rumor','clarify'])s.actors[role]={side:role,resource:this.actors[role].resource,hand:[],played:this.actors[role].played,fused:0,income:0,spent:0};
    s.actors[side]={side,resource:a.resource,hand:a.hand.map(card=>({...card})),cooldown:{...a.cooldown},
      pity:a.pity,draws:a.draws,played:a.played,fused:a.fused,spent:a.spent,income:a.income,
      random:seededRandom(trialSeed^0x83ab19),decisionRandom:seededRandom(trialSeed^0x1be934)};
    s.player=s.actors[side];s.opponent=s.actors[side==='rumor'?'clarify':'rumor'];s.resetActivity();
    if(action.kind==='play')s.play(s.player,action.uid);
    else if(action.kind==='fusion')s.fuse(s.player,action.main,action.aux);
    else if(action.kind==='draw')s.draw(s.player);
    // Same simulation horizon and continuation policy for every candidate, including waiting.
    // A reversal keeps its actual preparation and travel time; shields expire normally.
    const endTick=Math.min(1350,this.tickCount+300),interval=DIFFICULTIES[this.difficulty].interval;
    let nextOwn=s.day+interval,totalPressure=s.pressure(),observations=1;
    while(s.tickCount<endTick&&!s.ended){
      s.step();
      if(!s.ended&&s.day<12&&s.day>=nextOwn){
        const card=s.choose(s.player,'weighted');
        if(card!==null)s.play(s.player,card.uid);
        nextOwn=s.day+interval;
      }
      if(s.tickCount%25===0){totalPressure+=s.pressure();observations++;}
    }
    return {pressure:s.pressure()*.6+totalPressure/observations*.4,resource:s.player.resource,
      hand:s.player.hand.reduce((value,card)=>value+s.evaluate(s.player,card),0)};
  }
  scoreActions(a,actions) {
    const bases=[0,1,2].map(trial=>this.project(a,{kind:'wait'},trial)),sign=a.side==='rumor'?1:-1;
    return actions.map(action=>{
      const trials=[0,1,2].map(trial=>this.project(a,action,trial));
      const value=trials.reduce((total,result,i)=>total+(result.pressure-bases[i].pressure)*sign
        +(result.resource-bases[i].resource)*.01+(result.hand-bases[i].hand)*.02,0)/3;
      return {action,value};
    }).sort((x,y)=>y.value-x.value);
  }
  choose(a,policy) {
    const legal=a.hand.filter(card=>this.playProblem(a,card)==='');
    if(legal.length===0)return null;
    if(policy==='random')return legal[Math.floor(a.decisionRandom()*legal.length)];
    const useful=legal.filter(card=>!(['hot','cold','control','chot'].includes(card.id)&&this.effects[card.id]>this.day));
    if(useful.length===0)return null;
    if(policy==='smart'){
      const ranked=this.scoreActions(a,useful.map(card=>({kind:'play',uid:card.uid})));
      return ranked[0].value>.25?a.hand.find(card=>card.uid===ranked[0].action.uid):null;
    }
    const ranked=useful.map(card=>({card,value:this.evaluate(a,card)})).filter(item=>item.value>0).sort((x,y)=>y.value-x.value);
    if(ranked.length===0)return null;
    if(policy==='casual'&&a.decisionRandom()>.6)return ranked[Math.floor(a.decisionRandom()*ranked.length)].card;
    return ranked[0].card;
  }
  aiTurn() {
    const a=this.opponent;
    const actions=a.hand.filter(card=>this.playProblem(a,card)===''&&!(['hot','cold','control','chot'].includes(card.id)&&this.effects[card.id]>this.day))
      .map(card=>({kind:'play',uid:card.uid}));
    // One material with the lowest estimated opportunity cost per main bounds the work.
    for(const main of a.hand){
      const materials=a.hand.filter(aux=>this.fusionProblem(a,main.uid,aux.uid)==='')
        .sort((x,y)=>this.evaluate(a,x)-this.evaluate(a,y));
      if(materials.length>0)actions.push({kind:'fusion',main:main.uid,aux:materials[0].uid});
    }
    if(this.drawProblem(a)==='')actions.push({kind:'draw'});
    let action={kind:'wait'};
    if(actions.length>0){
      const ranked=this.scoreActions(a,actions);
      if(ranked[0].value>.25){
        let selected=ranked[0];
        if(this.difficulty===0&&a.decisionRandom()>.6){
          const worthwhile=ranked.filter(item=>item.value>.25);
          selected=worthwhile[Math.floor(a.decisionRandom()*worthwhile.length)];
        }
        action=selected.action;
      }
    }
    if(action.kind==='play'){
      const card=a.hand.find(card=>card.uid===action.uid);
      this.lastAI=`${CARD_BY_ID[card.id].name} · ${a.side==='rumor'?'扩大传播':'核实反制'}`;this.play(a,action.uid);
    }else if(action.kind==='fusion'){
      const main=a.hand.find(card=>card.uid===action.main);
      this.fuse(a,action.main,action.aux);this.lastAI=`强化${CARD_BY_ID[main.id].name} · 争取多轮收益`;
    }else if(action.kind==='draw'){
      this.draw(a);this.lastAI='支付资源补牌 · 寻找新的行动';
    }else this.lastAI='留住资源，等待更合适的时机';
    this.nextAI=this.day+DIFFICULTIES[this.difficulty].interval;
  }
  step() {
    if(this.ended||this.paused)return;
    this.tickCount++;this.day=this.tickCount/100;this.stepBelieved=0;
    this.heat+=(.25-this.heat)*.006;
    const f=this.formulas();
    if(this.reversalAt>0&&this.day>=this.reversalAt){
      this.reversalAt=-1;this.reversed=true;this.heat=Math.min(1,this.heat+.2);
      const c=this.counts();this.reboundFloor={day:this.day,belief:c.i/c.total};
      const target=this.targets('rumor').filter(n=>n.aware).sort((a,b)=>this.adj[b.id].length-this.adj[a.id].length).slice(0,this.reversalAmount);
      for(const n of target){
        const p=this.send(5,n.id,'rumor',CARD_PARAMS.script.chance);
        if(p!==null&&this.reversalAction!==null){p.action=this.reversalAction;p.action.sent++;p.action.pending++;}
      }
      if(this.reversalAction!==null&&this.reversalAction.pending===0)this.completeDelivery(this.reversalAction);
      this.reversalAction=null;
      this.record('新的说法再次进入讨论，观察二次传播','turn','rumor');
    }
    for(const n of this.nodes) {
      if(!n.active&&this.day>=n.spawnDay){n.active=true;this.activity.joined++;}
      if(!n.active||n.banned)continue;
      if(n.state===1&&n.incubateUntil<=this.day&&n.silencedUntil<=this.day){
        for(const j of this.adj[n.id]){
          const b=this.nodes[j];
          if(b.active&&!b.banned&&b.state!==1&&b.type!=='bot'&&b.shieldUntil<=this.day&&this.random()<f.spread*TYPES[n.type].inf*TYPES[b.type].sus*(b.state===2?.27:1)*(n.boostUntil>this.day?CARD_PARAMS.pr.multiplier:1))this.send(n.id,j,'rumor',1);
        }
      }
      if(n.state===1&&this.random()<f.forget){n.state=2;n.changedAt=this.tickCount;n.lastReason='重复讨论后逐渐不再相信';this.activity.forgot++;}
      if(n.state!==1&&['bot','mid','counselor'].includes(n.type))for(const j of this.adj[n.id]){
        const b=this.nodes[j];
        if(b.active&&b.state===1&&b.incubateUntil<=this.day&&this.random()<this.naturalClarify(n,b,f))this.send(n.id,j,'clarify',1);
      }
      if(n.type!=='bot'&&n.state===2&&n.shieldUntil<=this.day&&!this.reversed&&this.random()<.0001){n.state=0;n.lastReason='记忆衰减，重新回到观望状态';}
    }
    for(let k=this.particles.length-1;k>=0;k--){
      const p=this.particles[k];p.t+=p.sp;
      if(p.t>=1){
        const target=this.nodes[p.b],a=this.activity;a.arrived++;if(!target.aware)a.heard++;target.aware=true;
        const blocked=target.banned||(p.kind==='rumor'?(target.state===1||target.shieldUntil>this.day):target.state!==1);
        let changed=false;
        if(this.random()<p.chance&&!blocked){
          if(p.kind==='rumor'&&this.infect(p.b)){
            a.believed++;this.stepBelieved++;changed=true;
            if(this.nodes[p.a].group!==target.group){
              a.cross++;
              if(this.firstCross===null)this.firstCross={kind:'cross',day:this.day,weight:2,
                text:`首次成功跨圈转述：${GROUP_NAMES[this.nodes[p.a].group]} → ${GROUP_NAMES[target.group]}`};
            }
          }
          else if(p.kind==='clarify'&&target.state===1){this.clarify(p.b);a.clarified++;changed=true;}
        }
        if(p.action!==null){
          const action=p.action;action.pending--;action.arrived++;
          action.resolvedDay=this.day;
          if(changed)target.lastReason=`「${CARD_BY_ID[action.card].name}」抵达，${action.side==='rumor'?'开始相信这条信息':'根据核实材料修正判断'}。`;
          if(changed)action.changed++;else if(blocked)action.blocked++;else action.failed++;
          if(action.pending===0)this.completeDelivery(action);
        }
        this.particles.splice(k,1);
      }
    }
    this.updateModeration();
    const c=this.counts(),ratio=c.i/c.total;
    if(ratio>this.peak){this.peak=ratio;this.peakDay=this.day;}
    if(this.reversed)this.postPeak=Math.max(this.postPeak,ratio);
    if(this.reversed){
      if(ratio<this.reboundFloor.belief)this.reboundFloor={day:this.day,belief:ratio};
      const increase=ratio-this.reboundFloor.belief;
      if(increase>=.05&&(this.strongestRebound===null||increase>this.strongestRebound.increase)){
        this.strongestRebound={kind:'rebound',day:this.day,weight:increase*100,increase,
          text:`反转后相信率从第 ${this.reboundFloor.day.toFixed(1)} 天的 ${Math.round(this.reboundFloor.belief*100)}% 回升至 ${Math.round(ratio*100)}%`};
      }
    }
    if(ratio>=.55)this.knownTicks++;
    this.zeroTicks=c.i===0?this.zeroTicks+1:0;
    for(const a of Object.values(this.actors)){
      const gain=incomeRate(a.side,c);
      a.resource+=gain;a.income+=gain;
    }
    if(this.day<12&&this.day>=this.nextAI)this.aiTurn();
    if(this.day<11&&this.day>=this.nextAmbient){
      const pool=CAMPUS_EVENTS.filter(e=>ratio>=e.minBelief&&e.id!==this.lastAmbient);
      this.campusEvent(pool[Math.floor(this.eventRandom()*pool.length)].id);
      this.nextAmbient=this.day+1.5+this.eventRandom()*1.2;
    }
    if(this.tickCount>=this.nextChat)this.conversation();
    if(this.day<11&&this.day>=this.nextEvent&&this.event===null)this.selectEmergency();
    if(this.event!==null&&this.day>=this.event.expires)this.skipEvent('expired');
    this.resolveEventFollowups();
    if(this.tickCount%25===0)this.sample();
    if(this.tickCount%50===0)this.reportActivity();
    const pending=this.eventFollowups.length>0||this.particles.some(p=>p.action!==null||p.kind==='rumor'&&!this.nodes[p.b].banned&&this.nodes[p.b].state!==1&&this.nodes[p.b].shieldUntil<=this.day);
    if((this.day>=4&&this.zeroTicks>=120&&!pending&&this.reversalAt<0)||(this.day>=12&&!pending&&this.reversalAt<0)||this.day>=13.5)this.finish();
  }
  selectEmergency() {
    const c=this.counts();
    const weights=[1+c.aware/c.total,this.banRisk>=20||this.attention>=20||this.effects.hot>this.day?2:0,
      this.player.resource<140?2:1,c.i>=5||c.aware>=12?2:0,this.banRisk>=30||this.attention>=35?2:0];
    const pool=weights.map((weight,id)=>({id,weight:weight/(1+this.emergencyHistory.filter(item=>item.id===id).length)}))
      .filter(item=>item.weight>0&&item.id!==this.lastEmergency);
    let roll=this.eventRandom()*pool.reduce((sum,item)=>sum+item.weight,0);
    const picked=pool.find(item=>{roll-=item.weight;return roll<0;});
    this.beginEmergency(picked.id);
  }
  beginEmergency(id) {
    const groups=GROUP_NAMES.map((name,group)=>({group,value:this.nodes.reduce((sum,n)=>sum+(n.active&&n.group===group?(n.state===1?2:n.aware?1:0):0),0)}));
    groups.sort((a,b)=>b.value-a.value);
    const group=groups[0].group;
    const source=this.nodes.filter(n=>n.active&&!n.banned&&n.group===group)
      .sort((a,b)=>(Number(b.state===1)*1000+Number(b.aware)*100+this.adj[b.id].length)-(Number(a.state===1)*1000+Number(a.aware)*100+this.adj[a.id].length))[0].id;
    this.event={id,group,source,expires:this.day+EMERGENCY_WINDOW};
    this.lastEmergency=id;this.emergencyHistory.push({id,day:this.day,choice:'pending'});this.nextEvent=this.day+3.1;
    const e=EMERGENCIES[id];
    this.record(`${e.icon} ${e.title[this.role]}\n${this.eventContext()}\n选择会影响后续发展；不回应不会额外扣费。`,'event','both');
  }
  eventContext() {
    const e=this.event,n=this.nodes[e.source],group=GROUP_NAMES[e.group],scenario=SCENARIOS[this.scenario].label,c=this.counts();
    switch(EMERGENCIES[e.id].id){
      case 'reporter':return `已有 ${c.aware} 人听说「${scenario}」，校媒开始核对。${group}的${TYPES[n.type].name} #${n.id+1} 被列入采访线索：先抢时效，还是等原始材料？`;
      case 'meeting':return `「${scenario}」引起平台关注。约谈触发时风险 ${this.banRisk.toFixed(0)}、关注 ${this.attention.toFixed(0)}，${group}成为核查重点，回应方式会影响回访。`;
      case 'redpacket':return `推荐位向「${scenario}」开放资源，旧截图来源是${group}的${TYPES[n.type].name} #${n.id+1}。接下推荐会带来更多围观，也可能让旧截图重新曝光。`;
      case 'victim':return `仍有 ${c.i} 人相信「${scenario}」，当事人在${group}发帖，希望大家停止截取片段。公开传播与私下整理材料，会有不同的后续。`;
      case 'exposed':return `围绕${TYPES[n.type].name} #${n.id+1} 的传播链被整理出来，${group}开始追问「${scenario}」的最初出处。`;
    }
  }
  eventPreview(choice) {
    const event=this.event,id=EMERGENCIES[event.id].id,p=EMERGENCY_RULES[id],rumor=this.role==='rumor',group=GROUP_NAMES[event.group];
    switch(id){
      case 'reporter':
        if(rumor)return choice===0
          ? `立即：热度 +${p.heat*100}%，模糊性 +${p.ambiguity}。后续：${p.delay} 天后校媒核验，最多 ${p.check} 位${group}相信者修正判断。`
          : `立即：最多核实 ${p.quick} 人、模糊性 −${p.clearAmbiguity}、封号风险 ${p.safeRisk}。后续：${p.delay} 天后平台关注降低 ${p.attentionDrop}。`;
        return choice===0
          ? `立即：最多核实 ${p.quick} 位${group}相信者，模糊性 −${p.clearAmbiguity}。后续：${p.delay} 天后采访补证，公信力 +${p.followTrust*100}%。`
          : `立即：公信力 +${p.trust*100}%。后续：${p.delay} 天后完整材料公开，最多核实 ${p.deep} 位${group}相信者；等待期间传播继续。`;
      case 'meeting':
        if(rumor)return choice===0
          ? `立即：支付最多 ${p.rumorCost} 资源、热度 ×${p.heat}、模糊性 −${p.ambiguity}、风险 −${p.riskDown}。后续：${p.delay} 天后回访；热度≤${p.heatLimit*100}% 再降 ${-p.reviewRisk} 风险，否则关注 +${p.reviewAttention}。`
          : `立即：获得 ${p.gain} 资源、风险 +${p.riskUp}、模糊性 +${p.blank}，${group}最多 ${p.sourceCount} 个源头受限 ${p.sourceDays} 天。后续：${p.delay} 天后平台关注 +${p.hardAttention}。`;
        return choice===0
          ? `立即：支付最多 ${p.clarifyCost} 资源、热度 ×${p.heat}、模糊性 −${p.ambiguity}。后续：${p.delay} 天后最多保护 ${p.protect} 位${group}同学 ${p.protectDays} 天。`
          : `立即：资源 +${p.clarifyGain}、模糊性 +${p.blank}。后续：${p.delay} 天后信息空白受到质疑，公信力 −${p.trustLoss*100}%。`;
      case 'redpacket':return choice===0
        ? `立即：资源 +${p.full}、热度 +${p.heat*100}%${rumor?'、风险 +'+p.risk:''}。后续：${p.delay} 天后旧截图向${group}最多派送 ${p.exposure} 份转述；来源若已核实、封禁或受限，则取消曝光。`
        : `立即：资源 +${p.basic}。不接推荐位，没有这次额外曝光。`;
      case 'victim':
        if(choice===1)return `立即：最多核实 ${p.quick} 位${group}相信者${rumor?'、风险 '+p.safeRisk:''}。后续：${p.delay} 天后，最多 ${p.follow} 位尚未相信者获 ${p.protectDays} 天证据保护。`;
        return `立即：${rumor?'热度 +'+p.heat*100+'%、模糊性 +'+p.ambiguity:'公信力 +'+p.trust*100+'%、模糊性 −'+p.clearAmbiguity}。后续：${p.delay} 天后完整原帖公开，最多核实 ${p.follow} 位${group}相信者。`;
      case 'exposed':
        if(choice===1)return `立即：资源 +${p.windfall}、公信力 −${p.trustLoss*100}%。后续：${p.reversalDelay}–${p.reversalDelay+1} 天后酝酿一次最多 ${p.reversalAmount} 人的反转；已有反转只延后，不重复生成。`;
        return rumor
          ? `立即：资源 +${p.gain}、风险 +${p.risk}、模糊性 +${p.ambiguity}，限制 ${p.sourceCount} 个源头 ${p.sourceDays} 天。后续：${p.delay} 天后平台关注 +${p.reviewAttention}。`
          : `立即：模糊性 −${p.clearAmbiguity}、公信力 +${p.trust*100}%，限制 ${p.sourceCount} 个源头 ${p.sourceDays} 天。后续：${p.delay} 天后最多核实 ${p.follow} 位${group}相信者。`;
    }
  }
  eventProblem() {
    if(this.ended)return '本局已经结束';
    if(this.paused)return '先继续传播，再回应突发事件';
    return '';
  }
  clarifyGroup(group,quota) {
    const targets=this.targets('clarify').filter(n=>n.group===group).sort((a,b)=>this.adj[b.id].length-this.adj[a.id].length).slice(0,quota);
    for(const n of targets)this.clarify(n.id);
    this.activity.clarified+=targets.length;return targets.length;
  }
  protectGroup(group,quota,duration) {
    const targets=this.targets('rumor').filter(n=>n.group===group).sort((a,b)=>this.adj[b.id].length-this.adj[a.id].length).slice(0,quota);
    for(const n of targets){
      if(!n.aware)this.activity.heard++;
      n.aware=true;n.state=2;n.shieldUntil=this.day+duration;n.changedAt=this.tickCount;n.lastReason='突发事件的后续材料带来证据保护';
    }
    return targets.length;
  }
  skipEvent(reason) {
    const e=EMERGENCIES[this.event.id];this.emergencyHistory[this.emergencyHistory.length-1].choice=reason;
    const labels={expired:'回应窗口结束',skipped:'你选择继续观察',ended:'对局已收尾'};
    this.record(`${e.icon} ${e.title[this.role]} · ${labels[reason]}\n没有额外资源扣除，也没有提交任何选项。`,'event','both');this.event=null;
  }
  chooseEvent(choice) {
    const problem=this.eventProblem();if(problem)return problem;
    const event=this.event,e=EMERGENCIES[event.id],p=EMERGENCY_RULES[e.id],rumor=this.role==='rumor';let detail='',follow=true;
    const gain=amount=>{this.player.resource+=amount;this.player.income+=amount;};
    switch(e.id){
      case 'reporter':
        if(rumor&&choice===0){this.heat=Math.min(1,this.heat+p.heat);this.ambiguity=Math.min(1.2,this.ambiguity+p.ambiguity);detail='匿名说法被递给校媒，话题变热，但记者已经开始核验。';}
        else if(!rumor&&choice===1){this.trust=Math.min(.95,this.trust+p.trust);detail='先核对原件，完整报道稍后公开。';}
        else{this.ambiguity=Math.max(.2,this.ambiguity-p.clearAmbiguity);detail=`采访材料使 ${this.clarifyGroup(event.group,p.quick)} 人修正判断。`;if(rumor)this.changeBanRisk(p.safeRisk);}
        break;
      case 'meeting':
        if(choice===0){
          const cost=Math.min(this.player.resource,rumor?p.rumorCost:p.clarifyCost);this.player.resource-=cost;this.player.spent+=cost;this.heat*=p.heat;
          this.ambiguity=Math.max(.2,this.ambiguity-p.ambiguity);if(rumor)this.changeBanRisk(-p.riskDown);
          detail=`支付 ${Math.round(cost)} 资源提交整改材料，平台将在 ${p.delay} 天后回访。`;
        }else{
          this.ambiguity=Math.min(1.2,this.ambiguity+p.blank);gain(rumor?p.gain:p.clarifyGain);
          if(rumor){this.changeBanRisk(p.riskUp);detail=`硬扛期间腾出 ${p.gain} 资源，${this.suppressSources(p.sourceCount,p.sourceDays,event.group)} 个源头暂时受限，回访压力增加。`;}
          else detail=`暂缓发布，保留 ${p.clarifyGain} 资源；信息空白稍后会受到质疑。`;
        }
        break;
      case 'redpacket':gain(choice===0?p.full:p.basic);
        if(choice===0){this.heat=Math.min(1,this.heat+p.heat);if(rumor)this.changeBanRisk(p.risk);detail='领取全部资源并接入推荐位，旧截图的额外曝光已经排期。';}
        else{detail='只领保底资源，不参与这次推荐曝光。';follow=false;}
        break;
      case 'victim':
        if(choice===1){detail=`私下整理材料，${this.clarifyGroup(event.group,p.quick)} 人修正判断，稍后补充证据保护。`;if(rumor)this.changeBanRisk(p.safeRisk);}
        else if(rumor){this.heat=Math.min(1,this.heat+p.heat);this.ambiguity=Math.min(1.2,this.ambiguity+p.ambiguity);detail='片段再次被推热，当事人决定稍后公开完整原帖。';}
        else{this.trust=Math.min(.95,this.trust+p.trust);this.ambiguity=Math.max(.2,this.ambiguity-p.clearAmbiguity);detail='原帖开始公开流转，稍后在这次事件涉及的社群内补证。';}
        break;
      case 'exposed':
        if(choice===1){
          gain(p.windfall);this.trust=Math.max(.1,this.trust-p.trustLoss);const at=this.day+p.reversalDelay+this.eventRandom();
          if(this.reversalAt>this.day)this.reversalAt=Math.max(this.reversalAt,at);
          else{this.reversalAt=at;this.reversalAmount=p.reversalAmount;this.reversalAction=null;}
          detail=`获得 ${p.windfall} 资源，公信力下降；反转安排在第 ${this.reversalAt.toFixed(1)} 天。`;follow=false;
        }else if(rumor){
          gain(p.gain);this.ambiguity=Math.min(1.2,this.ambiguity+p.ambiguity);this.changeBanRisk(p.risk);
          detail=`否认后腾出 ${p.gain} 资源，${this.suppressSources(p.sourceCount,p.sourceDays,event.group)} 个源头受限，平台将继续追查。`;
        }else{
          this.ambiguity=Math.max(.2,this.ambiguity-p.clearAmbiguity);this.trust=Math.min(.95,this.trust+p.trust);
          detail=`传播链已经公开，${this.suppressSources(p.sourceCount,p.sourceDays,event.group)} 个源头受限，稍后向相关社群补证。`;
        }
        break;
    }
    if(follow)this.eventFollowups.push({id:event.id,choice,role:this.role,group:event.group,source:event.source,due:this.day+p.delay});
    this.emergencyHistory[this.emergencyHistory.length-1].choice=choice;
    this.record(`${e.icon} ${e.title[this.role]} · ${e.options[this.role][choice]}\n${detail}${follow?'\n后续将在第 '+(this.day+p.delay).toFixed(1)+' 天发生。':''}`,'event',this.role);
    this.event=null;this.nextChat=Math.min(this.nextChat,this.tickCount+2);return '';
  }
  resolveEventFollowups() {
    const due=this.eventFollowups.filter(item=>item.due<=this.day);this.eventFollowups=this.eventFollowups.filter(item=>item.due>this.day);
    for(const item of due){
      const e=EMERGENCIES[item.id],p=EMERGENCY_RULES[e.id],rumor=item.role==='rumor';let detail='';
      switch(e.id){
        case 'reporter':
          if(rumor&&item.choice===1){this.attention=Math.max(0,this.attention-p.attentionDrop);detail='采访材料完成核验，平台关注降低。';}
          else if(!rumor&&item.choice===0){this.trust=Math.min(.95,this.trust+p.followTrust);detail=`采访录音和原件补齐，公信力提高 ${p.followTrust*100}%。`;}
          else detail=`完整采访进入${GROUP_NAMES[item.group]}，${this.clarifyGroup(item.group,rumor?p.check:p.deep)} 人修正判断。`;
          break;
        case 'meeting':
          if(rumor&&item.choice===0){
            if(this.heat<=p.heatLimit){this.changeBanRisk(p.reviewRisk);detail='整改回访时讨论已降温，封号风险再降低。';}
            else{this.attention=Math.min(100,this.attention+p.reviewAttention);detail='回访时话题仍热，平台继续关注传播账号。';}
          }else if(rumor){this.attention=Math.min(100,this.attention+p.hardAttention);detail='拖延回应引来进一步追查，平台关注上升。';}
          else if(item.choice===0)detail=`回访材料为 ${this.protectGroup(item.group,p.protect,p.protectDays)} 位同学建立 ${p.protectDays} 天证据保护。`;
          else{this.trust=Math.max(.1,this.trust-p.trustLoss);detail='迟迟没有公开核实结果，公信力受到影响。';}
          break;
        case 'redpacket':{
          const source=this.nodes[item.source];let sent=0;
          if(source.state===1&&!source.banned&&source.silencedUntil<=this.day){
            const targets=this.targets('rumor').filter(n=>n.group===item.group).slice(0,p.exposure);
            for(const n of targets)if(this.send(source.id,n.id,'rumor',p.chance)!==null)sent++;
          }
          detail=sent>0?`推荐位把旧截图再次带进${GROUP_NAMES[item.group]}，${sent} 份转述正在派送，抵达后再结算。`:'推荐位没有产生额外转述：源头已核实、受限、封禁，或当前没有可作用目标。';break;
        }
        case 'victim':
          detail=item.choice===0?`完整原帖进入${GROUP_NAMES[item.group]}，${this.clarifyGroup(item.group,p.follow)} 人修正判断。`
            :`后续材料为 ${this.protectGroup(item.group,p.follow,p.protectDays)} 位同学建立证据保护。`;
          break;
        case 'exposed':
          if(rumor){this.attention=Math.min(100,this.attention+p.reviewAttention);detail='传播链追查仍在继续，平台关注进一步上升。';}
          else detail=`传播链证据进入${GROUP_NAMES[item.group]}，${this.clarifyGroup(item.group,p.follow)} 人修正判断。`;
          break;
      }
      this.record(`${e.icon} ${e.title[item.role]} · 后续\n${detail}`,'event-followup',item.role);
      const speaker=this.nodes.find(n=>n.type==='bot'&&n.group===item.group);
      const replies={reporter:'采访的原始材料补齐了，前面那段别再只截半句。',meeting:'这轮回访结果出来了，后续还要看大家怎么处理这条信息。',redpacket:'推荐位的后续到了，先核对完整来源，再决定要不要转。',victim:'当事人的后续材料贴出来了，转过消息的同学也看看这一条。',exposed:'传播链的后续记录来了，匿名转述和原始信源要分开看。'};
      this.messages.push({day:this.day,text:replies[e.id],kind:'quote',side:'clarify',speaker:speaker.id,type:speaker.type,state:speaker.state,group:item.group,replyTo:-1});
      this.nextChat=Math.max(this.nextChat,this.tickCount+16);
    }
  }
  keyMoments() {
    const candidates=[...this.turningPoints];
    for(const action of this.actions)if(!action.fusion&&action.changed+action.immediate>0){
      let effect=`抵达时使 ${action.changed} 人${action.side==='rumor'?'开始相信':'修正判断'}`;
      if(action.card==='vaxx')effect=`为 ${action.immediate} 人建立证据保护`;
      else if(action.card==='dig')effect=`限制 ${action.immediate} 个传播账号`;
      else if(action.card==='pr')effect=`带动 ${action.immediate} 位关键人物`;
      candidates.push({kind:'intervention',day:action.resolvedDay,weight:action.changed+action.immediate,
        text:`${action.side===this.role?'你':'人机'}的「${CARD_BY_ID[action.card].name}」${effect}`});
    }
    if(this.strongestRebound!==null)candidates.push(this.strongestRebound);
    if(this.firstCross!==null)candidates.push(this.firstCross);
    candidates.push({kind:'peak',day:this.peakDay,weight:0,text:`相信率到达峰值 ${Math.round(this.peak*100)}%`});
    candidates.sort((a,b)=>b.weight-a.weight||a.day-b.day);
    const moments=[];
    for(const point of candidates){
      if(!moments.some(moment=>moment.kind===point.kind))moments.push(point);
      if(moments.length===3)break;
    }
    return moments.sort((a,b)=>a.day-b.day);
  }
  finish() {
    if(this.event!==null)this.skipEvent('ended');
    this.ended=true;this.sample();
    for(const item of this.eventFollowups)this.record(`${EMERGENCIES[item.id].title[item.role]} · 尚待后续\n本局已收尾，原定第 ${item.due.toFixed(1)} 天的后续尚未发生，不计为已经生效。`,'event-followup',item.role);
    for(const action of this.actions)if(!action.fusion&&action.pending>0){
      this.record(`「${CARD_BY_ID[action.card].name}」收尾记录\n已抵达 ${action.arrived} 份、改变判断 ${action.changed} 人；仍有 ${action.pending} 份在途，不计为成功。`,'delivery',action.side).card=action.card;
    }
    if(this.reversalAction!==null)this.record(`「反转剧本」仍在酝酿\n本局已收尾，未派送的反转不计为成功。`,'delivery','rumor').card='script';
    const c=this.counts(),ratio=c.i/c.total;
    let key='stalemate';
    if(this.reversed&&this.postPeak>=.35)key='rebound';
    else if(this.knownTicks>=50)key='known';
    else if(c.i===0&&this.peak<.25&&this.actors.clarify.played>0)key='cradle';
    else if(c.aware/c.total>=.5&&ratio<=.12&&this.peak>=.3)key='meme';
    else if(ratio<=.07)key='fade';
    let score=35;
    if(key==='known')score=100-this.player.played*4-this.day*3;
    if(key==='cradle')score=115-this.day*8-this.player.played*3;
    if(key==='rebound')score=110+this.postPeak*40-this.day*2;
    if(key==='meme')score=95-this.day*3-this.player.played*3;
    if(key==='fade')score=55;
    const winner=ratio>=Simulation.WIN_THRESHOLD?'rumor':'clarify';
    if(winner===this.role)score+=15;
    score=Math.max(10,Math.min(100,Math.round(score)));
    this.result={key,winner,won:winner===this.role,score,grade:score>=90?'S':score>=70?'A':score>=50?'B':'C',belief:ratio,aware:c.aware/c.total,moments:this.keyMoments()};
    this.record(`${ROLES[winner].name}达成目标，传播进入档案`,'end',winner);
  }
}
Simulation.WIN_THRESHOLD=.35;
