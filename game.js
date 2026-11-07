"use strict";

const RUMORS = [
  { text: "「食堂阿姨手抖是因为帕金森?」", imp: 0.95, traffic: 180, trust: 0.8,
    heat: 0.12, attention: 0, seeds: 1,
    tag: "新手局", cond: "起点宽松 · 流量 180 · 公信力高" },
  { text: "「某保研同学的材料全是伪造的?」", imp: 1.15, traffic: 150, trust: 0.75,
    heat: 0.2, attention: 12, seeds: 1,
    tag: "进阶局", cond: "官方已盯上 · 关注度 12% 起步" },
  { text: "「学校要封校三个月，超市已被抢空?」", imp: 1.3, traffic: 120, trust: 0.7,
    heat: 0.28, attention: 20, seeds: 2,
    tag: "地狱局", cond: "自带热度 · 双营销号起手 · 全程高压" },
];

const TYPE = {
  bigv:      { name: "大V",     color: "#f5b840", r: 15, inf: 2.2, sus: 0.7,  cell: 4 },
  mkt:       { name: "营销号", color: "#b06ce8", r: 11, inf: 2.2, sus: 1.3,  cell: 3 },
  crowd:     { name: "吃瓜群众", color: "#4da3ff", r: 10, inf: 1.0, sus: 1.0, cell: 3 },
  bot:       { name: "辟谣bot", color: "#35d98e", r: 11, inf: 0,   sus: 0,   cell: 3 },
  mid:       { name: "理中客", color: "#40c4b0", r: 10, inf: 0.5, sus: 0.35, cell: 3 },
  leader:    { name: "群主",   color: "#ee6fa0", r: 11, inf: 1.6, sus: 0.8,  cell: 3 },
  troll:     { name: "杠精",   color: "#ff9440", r: 10, inf: 1.2, sus: 1.7,  cell: 3 },
  counselor: { name: "辅导员", color: "#3b5bdb", r: 11, inf: 0.3, sus: 0.2,  cell: 3 },
};
const S = 0, I = 1, R = 2;
const STATE_COLOR = ["#98a2c0", "#f0475c", "#35d98e"];
const STATE_NAME = ["未闻谣言", "信谣传播中", "已免疫/清醒"];

// ---------- 像素小人（eBoy 风格：统一网格 + 有限色板） ----------
const INK = "#23252d", PAPER = "#fffdf6";
const SPRITES = {
  crowd: [
    "..OOOO..",
    ".OAAAAO.",
    ".OWWWWO.",
    ".OWOWO..",
    ".OWWWWO.",
    "..OOOO..",
    ".OBBBBBO",
    "OBBBBBBO",
    ".O.OO.O.",
  ],
  mkt: [
    "..OOOO..",
    ".OAAAAO.",
    ".OAWWAO.",
    ".OAWWAO.",
    ".OAAAAO.",
    "..OOOO..",
    ".OBBBBBO",
    "OBBBBBBO",
    ".O.OO.O.",
  ],
  bot: [
    "...OO...",
    "..OAAO..",
    ".OOOOOO.",
    ".OAAAAO.",
    ".OAWWAO.",
    ".OAAAAO.",
    ".OBBBBBO",
    "OBBBBBBO",
    ".O.OO.O.",
  ],
  mid: [
    "..OOOO..",
    ".OWWWWO.",
    ".OOOOOO.",
    ".OWWWWO.",
    ".OWWWWO.",
    "..OOOO..",
    ".OBBBBBO",
    "OBBBBBBO",
    ".O.OO.O.",
  ],
  leader: [
    "..OOOO..",
    "OAAAAAAO",
    ".OAWWAO.",
    ".OWOWO..",
    ".OWWWWO.",
    "..OOOO..",
    ".OBBBBBO",
    "OBBBBBBO",
    ".O.OO.O.",
  ],
  troll: [
    ".O.OO.O.",
    ".OAAAAO.",
    ".OWWWWO.",
    ".OOWWOO.",
    ".OWWWWO.",
    "..OOOO..",
    ".OBBBBBO",
    "OBBBBBBO",
    ".O.OO.O.",
  ],
  counselor: [
    "..OOOO..",
    ".OOWWOO.",
    ".OWWWWO.",
    ".OWOWO..",
    ".OWWWWO.",
    "..OOOO..",
    ".OBBBBBO",
    "OBBBBBBO",
    ".O.OO.O.",
  ],
  bigv: [
    "...OOOO...",
    "..OAAAAO..",
    ".OOWWWWOO.",
    ".OWOWWOWO.",
    ".OWWWWWWO.",
    "..OOOOOO..",
    ".OBBBBBBO.",
    ".OBBBBBBO.",
    "OBBBBBBBBO",
    ".O.O..O.O.",
  ],
};
let spriteCache = {}, spriteDim = {}, LAYSCL = 1, SPACING = 60;
function layoutScale() {
  SPACING = 0.8 * Math.sqrt((W * H) / nodes.length || 60);
  return Math.max(0.55, Math.min(1.1, SPACING / 80));
}
function makeSprite(type, state, banned) {
  const rows = SPRITES[type];
  const w = Math.max(...rows.map(r => r.length));
  const badgeRows = [];
  if (banned || state === I || state === R) {
    const pad = ".".repeat((w - 4) >> 1);
    const [bg, fg] = (banned || state === I) ? ["X", "x"] : ["Y", "y"];
    badgeRows.push(pad + "XXXX" + pad, pad + "X" + fg + fg + "X" + pad, ".".repeat(w));
  }
  const body = banned ? "#9aa0ae" : (state === S ? "#98a2c0" : TYPE[type].color);
  const accent = banned ? "#b8bdc9" : TYPE[type].color;
  const PAL = { O: INK, W: PAPER, B: body, A: accent, X: "#f0475c", x: "#ffd9de", Y: "#35d98e", y: "#d6ffe9" };
  const cell = Math.max(2, Math.round(TYPE[type].cell * LAYSCL));  const cv = document.createElement("canvas");
  cv.width = w * cell; cv.height = (badgeRows.length + rows.length) * cell;
  const c = cv.getContext("2d");
  [...badgeRows, ...rows].forEach((row, y) => {
    for (let x = 0; x < w; x++) {
      const ch = row[x] || ".";
      if (ch === ".") continue;
      c.fillStyle = PAL[ch] || INK;
      c.fillRect(x * cell, y * cell, cell, cell);
    }
  });
  return cv;
}
function prerenderSprites() {
  spriteCache = {}; spriteDim = {};
  for (const t in SPRITES) {
    for (const st of [S, I, R]) {
      spriteCache[t + st] = makeSprite(t, st, false);
      spriteDim[t] = { w: spriteCache[t + st].width, h: spriteCache[t + st].height };
    }
    spriteCache[t + "banned"] = makeSprite(t, R, true);
  }
}

const TICKS_PER_DAY = 160;
const MAX_DAY = 12;
const BASE_SPREAD = 0.015;

const CARDS = [
  { id: "hot",     icon: "🔥", name: "加热搜",   cls: "c-hot",     cost: 140, cd: 1.5, rarity: 1,
    eff: "传播 ×2.5、热度飙升，持续 3.5 天。流量收益 ×1.6" },
  { id: "army",    icon: "🤖", name: "买水军",   cls: "c-army",    cost: 170, cd: 1.5, rarity: 1,
    eff: "感染 8 个高影响力账号。热搜中变 Combo 带 14 个" },
  { id: "debunk",  icon: "📢", name: "官方辟谣", cls: "c-debunk",  cost: 110, cd: 2, rarity: 1,
    eff: "大面积澄清。冷处理中变 Combo 加强。扩散超 45% 会翻车" },
  { id: "cold",    icon: "🧊", name: "冷处理",   cls: "c-cold",    cost: 90, cd: 1.5, rarity: 1,
    eff: "传播 ×0.35、遗忘加速，持续 3 天。封号风险 −25" },
  { id: "control", icon: "🗣", name: "控评",     cls: "c-control", cost: 120, cd: 2, rarity: 1,
    eff: "水军压制评论区，辟谣声音 ×0.3，持续 2 天" },
  { id: "farm",    icon: "📊", name: "刷量",     cls: "c-farm",    cost: 60, cd: 2.5, rarity: 1,
    eff: "立刻注入流量 +180。代价：封号风险 +22" },
  { id: "vaxx",    icon: "💉", name: "群体接种", cls: "c-vaxx",    cost: 130, cd: 3, rarity: 1,
    eff: "给 15 个群众提前打好「预防针」，直接免疫（接种理论）" },
  { id: "weaktie", icon: "🔗", name: "弱连接渗透", cls: "c-weaktie", cost: 120, cd: 3, rarity: 2,
    eff: "在外圈 5 个角落埋下潜伏种子，半天后同时开花（弱连接）" },
  { id: "pr",      icon: "🤝", name: "大V公关",  cls: "c-pr",      cost: 160, cd: 3, rarity: 2,
    eff: "收买一位未下水的大V，其传播力 ×2，持续 3 天（两级传播）" },
  { id: "scout",   icon: "🎯", name: "关键节点", cls: "c-scout",   cost: 200, cd: 3, rarity: 2,
    eff: "精准渗透连接最广的意见桥梁及其 2 个邻居（创新扩散）" },
  { id: "agenda",  icon: "📰", name: "议程设置", cls: "c-agenda",  cost: 220, cd: 5, rarity: 3,
    eff: "把谣言送上公共议程：重要性 i 永久 +0.25（议程设置）" },
  { id: "lottery", icon: "🍉", name: "转发抽奖", cls: "c-lottery", cost: 100, cd: 2, rarity: 1,
    eff: "转发抽校园周边：立刻感染 6 个群众，热度 +0.15" },
  { id: "radio",   icon: "🎙", name: "校园电台", cls: "c-radio",   cost: 150, cd: 3, rarity: 2,
    eff: "联合辟谣bot向 10 个信谣者定向推送澄清（使用与满足）" },
  { id: "dig",     icon: "🕵", name: "反黑调查", cls: "c-dig",     cost: 180, cd: 4, rarity: 2,
    eff: "扒出传播最广账号的造谣实锤，让 TA 永久哑火" },
  { id: "script",  icon: "🎬", name: "反转剧本", cls: "c-script",  cost: 250, cd: 6, rarity: 3,
    eff: "自导自演一处破绽：2 天后舆论自动反转（高风险高回报）" },
  { id: "chot",    icon: "🚨", name: "辟谣热搜", cls: "c-chot",    cost: 150, cd: 3, rarity: 2,
    eff: "把澄清推上热搜：辟谣效率 ×2、发声意愿 +0.8，持续 2 天" },
];
const RARITY_W = { 1: 5, 2: 2.5, 3: 1 };

const TRAFFIC_RATE = { bigv: 0.035, mkt: 0.02, crowd: 0.008, bot: 0, mid: 0.005, leader: 0.03, troll: 0.02, counselor: 0.01 };
const TRAFFIC_BURST = { bigv: 6, mkt: 4, crowd: 2, mid: 2, bot: 0, leader: 4, troll: 2, counselor: 1 };

const ENDINGS = {
  known:    { emoji: "🔥", title: "全网皆知", desc: "超过三分之二的节点同时相信并传播这条谣言。它从一句玩笑变成了校园集体记忆，连辟谣bot都被淹没在口水里。操盘手，你赢了流量，输了真相。" },
  cradle:   { emoji: "🧊", title: "被扼杀在摇篮里", desc: "谣言还没爬出起始圈层就被彻底扑灭。没有热搜、没有反转，大多数学生甚至没听说过它。最好的舆情处置，是让谣言从未发生。" },
  rebound:  { emoji: "🌪", title: "反转后二次爆发", desc: "官方辟谣操之过急，被扒出漏洞，舆论瞬间反转：「官方都在掩盖，一定是真的!」谣言变异出更强的传染性，免疫者纷纷倒戈，二次爆发席卷全网。" },
  fade:     { emoji: "🍃", title: "悄然平息", desc: "没有大爆发，也没有彻底扑灭。谣言随着期末周的到来被慢慢遗忘，成为茶余饭后的过期谈资。" },
  meme:     { emoji: "🎭", title: "娱乐化消解", desc: "它传遍了整个校园，却没有人再把它当真——表情包、谐音梗、饭圈二创轮番上阵，谣言在狂欢中被彻底「玩坏」。最荒诞的胜利：人人皆知，无人相信。" },
  stalemate:{ emoji: "🕯", title: "不了了之", desc: "十来天过去，谣言仍在小圈层里阴魂不散地传播。既没烧成燎原大火，也没被干净扑灭——舆论场最容易留下的，就是这种烂尾楼。" },
};

const DIFFS = [
  { name: "休闲", spread: 0.85, income: 1.3, ban: 0.8, desc: "传播更慢 · 来钱更快" },
  { name: "标准", spread: 1, income: 1, ban: 1, desc: "原汁原味" },
  { name: "大师", spread: 1.15, income: 0.75, ban: 1.4, desc: "传播更凶 · 来钱更难" },
];
let diffIdx = 1;

const TARGETS = [
  { key: "known",   name: "全网皆知", metric: () => `信服 ${Math.round(counts().i / nodes.length * 100)}% → 66%` },
  { key: "cradle",  name: "扼杀摇篮", metric: () => `当前信谣 ${counts().i} 人 → 0` },
  { key: "rebound", name: "二次爆发", metric: () => reversalHappened ? `二次峰值 ${Math.round(postRevPeak * 100)}% → 50%` : "等待辟谣翻车…" },
  { key: "meme",    name: "娱乐化消解", metric: () => `知晓 ${Math.round((counts().i + counts().r) / nodes.length * 100)}% → 50% 且信服 ≤12%` },
];

// ---------- state ----------
let nodes = [], edges = [], adj = [], botIdx = [], counselorIdx = [], pendingSpawns = [];
let day = 0, tickCount = 0, running = false, paused = false, speed = 1;
let heat = 0.15, trust = 0.75;
let traffic = 150, attention = 0, banRisk = 0, lastAuto = -1;
let amb = 1, tempBoostUntil = -1, tempDampUntil = -1, tempForgetUntil = -1;
let nextEventDay = 0, nextEmergDay = 0, knownStreak = 0, trafficPeak = 0, lastEnding = "";
let usedCards = new Set();
const view = { s: 1, x: 0, y: 0 };
let hotUntil = -1, coldUntil = -1, controlUntil = -1, clarifHotUntil = -1;
let mutation = false, mutationAt = -1, reversalArmed = false, reversalHappened = false;
let peakRatio = 0, peakDay = 0, postRevPeak = 0, cardsPlayed = 0;
let cardState = {};
let rumorIdx = -1, ended = false, targetIdx = -1;
let particles = [], hand = [], pity = 0, drawCount = 0, agendaBonus = 0, quoteCD = 0, lastSpawnLog = -5;
let bursts = [];

// ---------- 主体反应语料 ----------
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

// ---------- dom ----------
const $ = id => document.getElementById(id);
const canvas = $("net"), ctx = canvas.getContext("2d");
let W = 0, H = 0, DPR = 1;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.clientWidth; H = canvas.clientHeight;
  canvas.width = W * DPR; canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  LAYSCL = layoutScale();
  prerenderSprites();
  clampView();
}
window.addEventListener("resize", resize);

// ---------- network generation ----------
function buildNetwork() {
  nodes = []; edges = []; adj = [];
  const add = t => {
    const a = Math.random() * Math.PI * 2, d = Math.random() * 120;
    const pub = (t === "bigv" || t === "mkt" || t === "bot" || t === "leader" || t === "counselor");
    nodes.push({ type: t, state: S, x: W / 2 + Math.cos(a) * d, y: H / 2 + Math.sin(a) * d,
                 vx: 0, vy: 0, infectedAt: -1,
                 disc: pub, appear: pub ? 1 : 0,
                 moves: 0, boost: 0, flash: 0, bought: false, boostInfUntil: -1,
                 active: true, spawnDay: -1 });
    return nodes.length - 1;
  };
  const bigv = [], mkt = [], crowd = [], bot = [], mid = [], leader = [], troll = [], counselor = [];
  for (let i = 0; i < 5; i++) bigv.push(add("bigv"));
  for (let i = 0; i < 12; i++) mkt.push(add("mkt"));
  for (let i = 0; i < 88; i++) crowd.push(add("crowd"));
  for (let i = 0; i < 6; i++) bot.push(add("bot"));
  for (let i = 0; i < 12; i++) mid.push(add("mid"));
  for (let i = 0; i < 6; i++) leader.push(add("leader"));
  for (let i = 0; i < 8; i++) troll.push(add("troll"));
  for (let i = 0; i < 4; i++) counselor.push(add("counselor"));

  const seen = new Set();
  const link = (a, b) => {
    if (a === b) return;
    const k = a < b ? a + "-" + b : b + "-" + a;
    if (seen.has(k)) return;
    seen.add(k); edges.push([a, b]);
  };
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  for (let i = 0; i < bigv.length; i++) link(bigv[i], bigv[(i + 1) % bigv.length]);
  link(pick(bigv), pick(bigv));
  for (const m of mkt) { link(m, pick(bigv)); link(m, pick(bigv)); link(m, pick(mkt)); link(m, pick(mkt)); }
  for (const c of crowd) {
    const r = Math.random();
    link(c, r < 0.5 ? pick(bigv) : r < 0.75 ? pick(mkt) : pick(crowd));
    link(c, pick(crowd));
    if (Math.random() < 0.4) link(c, pick(crowd));
  }
  for (const b of bot) { link(b, pick(bigv)); link(b, pick(mkt)); link(b, pick(crowd)); link(b, pick(crowd)); }
  for (const m of mid) { link(m, pick(crowd)); link(m, pick(crowd)); link(m, pick(bigv)); }
  for (const l of leader) {
    link(l, pick(bigv));
    for (let k = 0; k < 8; k++) link(l, pick(crowd));
    link(l, pick(leader));
  }
  for (const t of troll) { link(t, pick(crowd)); link(t, pick(mkt)); link(t, pick(troll)); }
  for (const c of counselor) { link(c, pick(crowd)); link(c, pick(crowd)); link(c, pick(crowd)); link(c, pick(mid)); }

  // ---- 动态刷新池：人群分波次不均匀上线（每轮随机） ----
  pendingSpawns = [];
  const pool = [...crowd.slice(12), ...troll];
  const waves = 5 + Math.floor(Math.random() * 5);
  const times = Array.from({ length: waves }, () => 1.5 + Math.random() * 9.7).sort((a, b) => a - b);
  for (const i of pool) {
    const t0 = times[Math.floor(Math.random() * times.length)] + (Math.random() - 0.5) * 0.5;
    nodes[i].spawnDay = Math.max(0.4, Math.min(11.4, t0));
    nodes[i].active = false;
    pendingSpawns.push(i);
  }
  pendingSpawns.sort((a, b) => nodes[a].spawnDay - nodes[b].spawnDay);

  adj = nodes.map(() => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  botIdx = [...bot];
  counselorIdx = [...counselor];
  for (const b of bot) nodes[b].state = R;
}

// ---------- logging ----------
function log(msg, cls = "", color = "") {
  const el = document.createElement("div");
  el.className = "log-item " + cls;
  if (color) el.style.color = color;
  el.innerHTML = `<span class="t">D${day.toFixed(1)}</span>${msg}`;
  const list = $("log-list");
  list.prepend(el);
  while (list.children.length > 40) list.lastChild.remove();
}

// ---------- simulation ----------
function counts() {
  let s = 0, i = 0, r = 0, total = 0;
  for (const n of nodes) {
    if (!n.active) continue;
    total++;
    if (n.type === "bot") { r++; continue; }
    if (n.state === S) s++; else if (n.state === I) i++; else r++;
  }
  return { s, i, r, total };
}

function spreadMult() {
  let m = 1;
  if (day < hotUntil) m *= 2.5;
  if (day < coldUntil) m *= 0.35;
  if (mutation) m *= 1.8;
  if (day < tempBoostUntil) m *= 1.4;
  if (day < tempDampUntil) m *= 0.7;
  m *= ((RUMORS[rumorIdx] ? RUMORS[rumorIdx].imp : 1) + agendaBonus) * (0.5 + 0.5 * amb);
  m *= DIFFS[diffIdx].spread;
  return m;
}

function stance(n) {
  if (n.moves >= 3) return;
  n.moves++;
  n.boost = 9;
  const a = Math.random() * Math.PI * 2;
  n.vx += Math.cos(a) * 6; n.vy += Math.sin(a) * 6;
}
function infect(idx) {
  const n = nodes[idx];
  if (n.type === "bot" || n.state !== S) return false;
  const firstSeen = !n.disc;
  n.state = I; n.infectedAt = day;
  n.incubateUntil = day + 0.1 + Math.random() * 0.12;
  n.disc = true;
  if (firstSeen) n.appear = 0;
  traffic += TRAFFIC_BURST[n.type];
  if (n.type === "counselor") {
    heat = Math.min(1, heat + 0.2);
    trust = Math.max(0.1, trust - 0.05);
    log("😱 连辅导员都信了!同学圈震动，官方公信力受挫", "hot");
  }
  stance(n);
  return true;
}

function tick() {
  tickCount++;
  day = tickCount / TICKS_PER_DAY;

  heat += (0.15 - heat) * 0.008;
  if (day < hotUntil) heat = Math.min(1, heat + 0.01);
  if (day < coldUntil) heat = Math.max(0.05, heat - 0.02);

  const mult = spreadMult();
  const heatF = 0.5 + heat * 1.5;
  const forget = (day < coldUntil ? 0.02 : 0.0028) * (day < tempForgetUntil ? 3 : 1);
  const beliefNow = counts().i / nodes.length;
  let voice = Math.max(0.2, 1.2 - beliefNow);
  if (day < controlUntil) voice *= 0.3;
  if (day < clarifHotUntil) voice = Math.min(2, voice + 0.8);

  if (reversalArmed && day >= mutationAt) {
    reversalArmed = false; reversalHappened = true; mutation = true;
    heat = 1;
    let reverted = 0;
    for (const n of nodes) {
      if (n.type !== "bot" && n.state === R && Math.random() < 0.45) { n.state = S; reverted++; }
    }
    const hubs = nodes.map((n, i) => [i, adj[i].length])
      .filter(([i]) => nodes[i].state === S && nodes[i].type !== "bot")
      .sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const [i] of hubs) infect(i);
    log(`💥 舆论反转!「辟谣声明被扒出漏洞」，${reverted} 人倒戈，谣言变异反扑!`, "hot");
  }

  const newI = [], newR = [];
  for (let a = 0; a < nodes.length; a++) {
    const na = nodes[a];
    if (!na.active || na.state !== I || day < na.incubateUntil) continue;
    const inf = TYPE[na.type].inf * (day < na.boostInfUntil ? 2 : 1) * (na.silenced ? 0 : 1);
    for (const b of adj[a]) {
      const nb = nodes[b];
      if (!nb.active) continue;
      if (!nb.disc && Math.random() < 0.004) { nb.disc = true; nb.appear = 0; }
      if (nb.state !== S || nb.type === "bot") continue;
      const p = BASE_SPREAD * inf * TYPE[nb.type].sus * heatF * mult;
      if (Math.random() < p) {
        newI.push(b);
        if (particles.length < 400) particles.push({ a, b, t: 0, sp: 0.04 + Math.random() * 0.03, kind: "rumor" });
      }
    }
    if (Math.random() < forget) newR.push(a);
  }
  for (const b of botIdx) {
    for (const c of adj[b]) {
      const nc = nodes[c];
      if (!nc.active || nc.state !== I || day < nc.incubateUntil) {
        continue;
      }
      const suppressed = adj[c].some(j => nodes[j].type === "troll" && nodes[j].state === I && nodes[j].active);
        const p = 0.05 * voice * (suppressed ? 0.5 : 1) * (day < clarifHotUntil ? 2 : 1);
        if (Math.random() < p && particles.length < 400) {
          particles.push({ a: b, b: c, t: 0, sp: 0.04 + Math.random() * 0.03, kind: "clarify" });
        }
      }
    }
  for (let m = 0; m < nodes.length; m++) {
    if (nodes[m].type !== "mid") continue;
    for (const c of adj[m]) {
      const nc = nodes[c];
      if (!nc.active || nc.state !== I || day < nc.incubateUntil) continue;
      if (Math.random() < 0.02 * voice) {
        if (particles.length < 400) particles.push({ a: m, b: c, t: 0, sp: 0.04 + Math.random() * 0.03, kind: "clarify" });
      }
    }
  }
  for (const c of counselorIdx) {
    for (const j of adj[c]) {
      const nc = nodes[j];
      if (!nc.active || nc.state !== I || day < nc.incubateUntil) continue;
      if (Math.random() < 0.06) {
        if (particles.length < 400) particles.push({ a: c, b: j, t: 0, sp: 0.04 + Math.random() * 0.03, kind: "clarify" });
      }
    }
  }
  for (const a of newR) {
    const n = nodes[a];
    if (n.state === I) { n.state = R; n.disc = true; stance(n); }
  }
  if (!mutation) {
    for (const n of nodes) {
      if (n.type !== "bot" && n.state === R && Math.random() < 0.0001) n.state = S;
    }
  }

  // ---- 人群波次刷入 ----
  let spawnedNow = 0;
  while (pendingSpawns.length && nodes[pendingSpawns[0]].spawnDay <= day) {
    const i = pendingSpawns.shift();
    const n = nodes[i];
    n.active = true;
    n.appear = 0;
    bursts.push({ n: i, t: 0, color: "#fffdf6" });
    const actives = nodes.filter(x => x.active);
    const parent = actives[Math.floor(Math.random() * actives.length)];
    const a = Math.random() * Math.PI * 2;
    n.x = parent.x + Math.cos(a) * 45; n.y = parent.y + Math.sin(a) * 45;
    n.vx = 0; n.vy = 0;
    n.flash = 12;
    spawnedNow++;
  }
  if (spawnedNow > 0 && day - lastSpawnLog > 1.5) {
    lastSpawnLog = day;
    const online = nodes.filter(n => n.active).length;
    log(`📱 一批同学刷进了校园墙（在线 ${online}/${nodes.length}）`, "");
  }

  // ---- 主体反应 ----
  quoteCD--;
  if (quoteCD <= 0) {
    const changed = [...new Set([...newI, ...newR])];
    let pool = changed;
    if (!pool.length && Math.random() < 0.3) {
    pool = nodes.map((n, i) => i).filter(i => nodes[i].active && nodes[i].state === I && nodes[i].disc);
    }
    if (pool.length) {
      const i = pool[Math.floor(Math.random() * pool.length)];
      const n = nodes[i];
      const q = QUOTES[n.type][Math.floor(Math.random() * QUOTES[n.type].length)];
      log(`${TYPE[n.type].name}：「${q}」`, "", TYPE[n.type].color);
      quoteCD = 20 + Math.floor(Math.random() * 30);
    }
  }

  // ---- 信息粒子抵达结算 ----
  updateParticles();

  const c = counts();
  const ratio = c.i / c.total;
  if (ratio > peakRatio) { peakRatio = ratio; peakDay = day; }
  if (reversalHappened && ratio > postRevPeak) postRevPeak = ratio;

  // ---- 流量经济 ----
  let inc = 0;
  for (const n of nodes) if (n.state === I) inc += TRAFFIC_RATE[n.type];
  inc *= (0.4 + heat * 1.2) * (day < hotUntil ? 1.6 : 1) * DIFFS[diffIdx].income;
  traffic += inc;
  trafficPeak = Math.max(trafficPeak, traffic);

  // ---- 官方关注度 / 封号风险 ----
  const aware = (c.i + c.r) / c.total;
  attention = Math.max(0, Math.min(100, attention
    + heat * 0.15 + aware * 0.12 + newI.length * 0.012 + (day < hotUntil ? 0.12 : 0) - 0.08));
  banRisk = Math.max(0, Math.min(100, banRisk + (attention > 55 ? 0.4 : 0) - 0.05));

  const banChance = Math.max(0, banRisk - 40) * 0.0012 * DIFFS[diffIdx].ban;
  if (Math.random() < banChance) {
    const risky = nodes.map((n, i) => i)
      .filter(i => nodes[i].active && nodes[i].state === I && adj[i].length >= 12 && !nodes[i].banned);
    if (risky.length > 0) {
      const i = risky[Math.floor(Math.random() * risky.length)];
      nodes[i].state = R; nodes[i].banned = true;
      attention = Math.max(0, attention - 6);
      log(`🚫 高影响力账号「${TYPE[nodes[i].type].name}」因传谣被平台封禁`, "warn");
    }
  }

  if (attention >= 80 && day - lastAuto >= 4) {
    lastAuto = day;
    if (peakRatio > 0.45) {
      let conv = 0;
      for (const n of nodes) if (n.state === I && Math.random() < 0.1) { n.state = R; conv++; }
      trust = Math.max(0.1, trust - 0.3);
      amb = Math.min(1.2, amb + 0.25);
      reversalArmed = true; mutationAt = day + 1.5 + Math.random();
      log(`⚠️ 舆情过热，官方被迫发布通报澄清 ${conv} 人。评论高赞：「才回应?心虚了吧」`, "warn");
    } else {
      let conv = 0;
      for (const n of nodes) if (n.state === I && Math.random() < 0.2 + attention / 250) { n.state = R; conv++; }
      amb = Math.max(0.2, amb - 0.25);
      log(`🏫 舆情引起校方注意，官方通报澄清 ${conv} 人`, "good");
    }
  }

  for (const id in cardState) if (cardState[id].cdUntil > 0 && day >= cardState[id].cdUntil) cardState[id].cdUntil = -1;

  if (day >= nextEventDay) {
    nextEventDay = day + 1.5 + Math.random() * 1.2;
    const pool = EVENTS.filter(ev => ev.cond());
    (pool[Math.floor(Math.random() * pool.length)] || EVENTS[0]).run();
  }

  if (day >= nextEmergDay && !modalOpen) {
    nextEmergDay = day + 2.5 + Math.random() * 2.5;
    openEmergency(EMERGENCIES[Math.floor(Math.random() * EMERGENCIES.length)]);
  }

  checkEnding(c, ratio);
  updateHUD(c);
}

const EVENTS = [
  { name: "考试周来了", cond: () => true, run() {
    heat *= 0.55; tempDampUntil = day + 2;
    log("🎓 考试周来了，全校进入闭关模式，热度骤降", "good"); } },
  { name: "当事人现身说法", cond: () => true, run() {
    amb = Math.max(0.2, amb - 0.25);
    let n = 0;
    for (const x of nodes) if (x.state === I && Math.random() < 0.12) { x.state = R; n++; }
    log(`📸 当事人现身说法澄清谣言，${n} 人清醒，模糊性大幅下降`, "good"); } },
  { name: "校外自媒体搬运", cond: () => true, run() {
    heat = Math.min(1, heat + 0.25); tempBoostUntil = day + 1.5;
    log("📡 校外自媒体开始搬运，谣言正在出圈", "hot"); } },
  { name: "谣言被玩梗化", cond: () => counts().i / nodes.length > 0.25, run() {
    tempForgetUntil = day + 3; amb = Math.max(0.2, amb - 0.1);
    log("😂 谣言沦为表情包，大家只玩梗不当真", "good"); } },
  { name: "网传截图「实锤」", cond: () => counts().i / nodes.length > 0.15, run() {
    amb = Math.min(1.2, amb + 0.15);
    let n = 0;
    const cand = nodes.map((x, i) => i).filter(i => nodes[i].state === S && nodes[i].type !== "bot");
    for (let k = 0; k < 5 && cand.length; k++) {
      const i = cand.splice(Math.floor(Math.random() * cand.length), 1)[0];
      if (infect(i)) n++;
    }
    log(`🧾 一张来路不明的截图被当作实锤，${n} 人入坑`, "hot"); } },
];

function checkEnding(c, ratio) {
  if (ended) return;
  if (reversalHappened && postRevPeak >= 0.5) return endGame("rebound");
  if (ratio >= 0.55) {
    knownStreak++;
    if (knownStreak >= 50) return endGame("known");
  } else knownStreak = Math.max(0, knownStreak - 1);
  const awareRatio = (c.i + c.r) / c.total;
  if (!reversalHappened && !reversalArmed && awareRatio >= 0.5 && ratio <= 0.12 && peakRatio >= 0.3 && peakRatio <= 0.55) return endGame("meme");
  if (c.i === 0 && day >= 0.5) {
    return endGame(peakRatio < 0.25 && cardsPlayed >= 1 ? "cradle" : "fade");
  }
  if (day >= MAX_DAY) {
    if (reversalHappened && postRevPeak >= 0.35) return endGame("rebound");
    return endGame(ratio <= 0.05 ? "fade" : "stalemate");
  }
}

// ---------- cards ----------
function playCard(id) {
  if (!running || paused || ended) return;
  if (!hand.includes(id)) return;
  const def = CARDS.find(c => c.id === id);
  const cs = cardState[id];
  if (traffic < def.cost || cs.cdUntil > day) return;
  traffic -= def.cost;
  cs.cdUntil = def.cd > 0 ? day + def.cd : -1;
  cardsPlayed++;
  usedCards.add(id);
  const c = counts();

  if (id === "hot") {
    heat = Math.min(1, heat + 0.55); hotUntil = day + 3.5;
    amb = Math.min(1.2, amb + 0.08);
    banRisk = Math.min(100, banRisk + 12);
    log("🔥 你买了热搜第 3 位，全校都刷到了这条谣言", "hot");
  } else if (id === "army") {
    banRisk = Math.min(100, banRisk + 18);
    const combo = day < hotUntil;
    const quota = combo ? 14 : 8;
    const sorted = nodes.map((n, i) => ({ i, w: adj[i].length + (n.type === "mkt" ? 8 : 0) }))
      .filter(x => nodes[x.i].active && nodes[x.i].state === S && nodes[x.i].type !== "bot")
      .sort((a, b) => b.w - a.w);
    let n = 0;
    for (const t of sorted.slice(0, 4)) { if (Math.random() < 0.9 && infect(t.i)) n++; }
    const pool = sorted.slice(4);
    while (n < quota && pool.length > 0) {
      const total = pool.reduce((s, x) => s + x.w, 0);
      let roll = Math.random() * total, idx = 0;
      for (; idx < pool.length - 1; idx++) { roll -= pool[idx].w; if (roll <= 0) break; }
      const [target] = pool.splice(idx, 1);
      if (Math.random() < 0.75 && infect(target.i)) n++;
    }
    if (combo) log(`⚡ Combo「病毒式营销」! 热搜加持下，水军一口气带偏 ${n} 个账号`, "hot");
    else log(`🤖 水军入场，${n} 个账号开始统一话术带节奏`, "hot");
  } else if (id === "debunk") {
    if (peakRatio > 0.45) {
      trust = Math.max(0.1, trust - 0.4);
      amb = Math.min(1.2, amb + 0.25);
      let conv = 0;
      for (const n of nodes) if (n.state === I && Math.random() < 0.1) { n.state = R; conv++; }
      reversalArmed = true; mutationAt = day + 1.5 + Math.random();
      log(`📢 官方仓促辟谣，仅澄清 ${conv} 人。评论区高赞：「欲盖弥彰!」`, "warn");
    } else {
      const combo = day < coldUntil;
      const rate = 0.55 * trust + 0.2 + (combo ? 0.25 : 0);
      let conv = 0;
      for (const n of nodes) if (n.state === I && Math.random() < rate) { n.state = R; conv++; }
      for (const n of nodes) if (n.type === "crowd" && n.state === S && Math.random() < 0.15) n.state = R;
      amb = Math.max(0.2, amb - 0.3);
      if (combo) log(`⚡ Combo「权威降温」! 冷处理 + 官方通报双管齐下，${conv} 人清醒`, "good");
      else log(`📢 官方权威辟谣，${conv} 人清醒，大量围观群众提前免疫`, "good");
    }
  } else if (id === "cold") {
    heat *= 0.3; coldUntil = day + 3;
    banRisk = Math.max(0, banRisk - 25);
    log("🧊 撤热搜、限流、降权……谣言被悄悄冷处理", "good");
  } else if (id === "control") {
    controlUntil = day + 2;
    log("🗣 水军齐刷刷盖楼控评，辟谣的声音被顶到了最底下", "hot");
  } else if (id === "farm") {
    traffic += 180;
    banRisk = Math.min(100, banRisk + 22);
    log("📊 一夜之间数据暴涨 180……平台风控盯上你了", "warn");
  } else if (id === "vaxx") {
    let n = 0;
    const cand = nodes.map((x, i) => i).filter(i => nodes[i].active && nodes[i].state === S && nodes[i].type === "crowd");
    while (n < 15 && cand.length) {
      const i = cand.splice(Math.floor(Math.random() * cand.length), 1)[0];
      nodes[i].state = R; nodes[i].disc = true; nodes[i].appear = 0; n++;
    }
    log(`💉 给 ${n} 位群众提前打好「预防针」，谣言再难感染他们（接种理论）`, "good");
  } else if (id === "weaktie") {
    let n = 0;
    const cand = nodes.map((x, i) => i).filter(i => nodes[i].active && nodes[i].state === S && nodes[i].type === "crowd" && adj[i].length <= 5);
    while (n < 5 && cand.length) {
      const i = cand.splice(Math.floor(Math.random() * cand.length), 1)[0];
      if (infect(i)) { nodes[i].incubateUntil = day + 0.5 + Math.random() * 0.4; n++; }
    }
    log(`🔗 通过弱连接把种子埋进 ${n} 个外圈角落，半天后同时开花（弱连接理论）`, "hot");
  } else if (id === "pr") {
    let tgt = nodes.map((n, i) => i).filter(i => nodes[i].type === "bigv" && nodes[i].state === S);
    let msg = "🤝 收买了一位大V，TA 开始卖力转发（两级传播），传播力 ×2 持续 3 天";
    if (tgt.length === 0) {
      tgt = nodes.map((n, i) => i).filter(i => nodes[i].type === "bigv" && nodes[i].state === I);
      msg = "🤝 已下水的大V拿了钱更加卖力，传播力 ×2 持续 3 天";
    }
    if (tgt.length) {
      const i = tgt[Math.floor(Math.random() * tgt.length)];
      nodes[i].bought = true; nodes[i].disc = true; nodes[i].boostInfUntil = day + 3;
      log(msg, "hot");
    }
  } else if (id === "scout") {
    const cand = nodes.map((n, i) => i).filter(i => nodes[i].active && nodes[i].state === S && nodes[i].type !== "bot")
      .sort((a, b) => adj[b].length - adj[a].length);
    if (cand.length) {
      const i = cand[0];
      let n = infect(i) ? 1 : 0;
      for (const j of adj[i]) {
        if (n >= 3) break;
        if (nodes[j].state === S && nodes[j].type !== "bot" && infect(j)) n++;
      }
      log(`🎯 精准渗透了连接最广的意见桥梁及 ${n - 1} 个邻居（创新扩散）`, "hot");
    }
  } else if (id === "agenda") {
    agendaBonus = Math.min(0.75, agendaBonus + 0.25);
    log(`📰 谣言被送上了公共议程，重要性 i 永久 +0.25（议程设置）`, "hot");
  } else if (id === "lottery") {
    let n = 0;
    const cand = nodes.map((x, i) => i).filter(i => nodes[i].active && nodes[i].state === S && nodes[i].type === "crowd");
    while (n < 6 && cand.length) {
      const i = cand.splice(Math.floor(Math.random() * cand.length), 1)[0];
      if (infect(i)) n++;
    }
    heat = Math.min(1, heat + 0.15);
    log(`🍉 转发抽校园周边，${n} 人为了奖品顺手转了谣`, "hot");
  } else if (id === "radio") {
    let n = 0;
    const cand = nodes.map((x, i) => i).filter(i => nodes[i].state === I && nodes[i].type !== "bot");
    while (n < 10 && cand.length) {
      const i = cand.splice(Math.floor(Math.random() * cand.length), 1)[0];
      const src = botIdx[Math.floor(Math.random() * botIdx.length)];
      if (particles.length < 400) particles.push({ a: src, b: i, t: 0, sp: 0.05 + Math.random() * 0.03, kind: "clarify" });
      n++;
    }
    log(`🎙 校园电台开通辟谣专线，${n} 份澄清正在派送中（使用与满足：先给足信息再谈说服）`, "good");
  } else if (id === "dig") {
    const cand = nodes.map((n, i) => i).filter(i => nodes[i].state === I && !nodes[i].silenced)
      .sort((a, b) => adj[b].length - adj[a].length);
    if (cand.length) {
      nodes[cand[0]].silenced = true;
      nodes[cand[0]].flash = 12;
      log(`🕵 实锤扒出：传播最广的「${TYPE[nodes[cand[0]].type].name}」账号哑火了`, "good");
    } else log("🕵 反黑调查扑了个空：没有值得调查的目标", "");
  } else if (id === "script") {
    reversalArmed = true; mutationAt = day + 2 + Math.random();
    amb = Math.min(1.2, amb + 0.15);
    heat = Math.min(1, heat + 0.2);
    log("🎬 你自导自演了一处「破绽」——舆论正在酝酿惊天反转", "warn");
  } else if (id === "chot") {
    clarifHotUntil = day + 2;
    heat = Math.max(0.05, heat - 0.1);
    log("🚨 你把澄清推上了热搜第 5 位，辟谣声音首次盖过谣言", "good");
  }
  hand.splice(hand.indexOf(id), 1);
  if (hand.length < 4) hand.push(drawCard());
  renderCards();
  updateHUD(counts());
}

// ---------- physics ----------
function updateParticles() {
  for (let k = particles.length - 1; k >= 0; k--) {
    const p = particles[k];
    p.t += p.sp;
    if (p.t >= 1) {
      const tgt = nodes[p.b];
      if (p.kind === "rumor") {
        if (infect(p.b)) {
          tgt.flash = 10;
          if (bursts.length < 80) bursts.push({ n: p.b, t: 0, color: "#f5b840" });
        }
      } else if (tgt.state === I && tgt.type !== "bot") {
        tgt.state = R; tgt.flash = 10; stance(tgt);
        if (bursts.length < 80) bursts.push({ n: p.b, t: 0, color: "#35d98e" });
      }
      particles.splice(k, 1);
    }
  }
}

function physics() {
  const REP = 4000, REP_MAX = 6, SPRING = 0.012, SPRING_MAX = 6,
        GRAV = 0.002, DAMP = 0.82, VMAX = 3;
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    if (!a.active) continue;
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      if (!b.active) continue;
      let dx = a.x - b.x, dy = a.y - b.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < 4) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = 4; }
      if (d2 > 150000) continue;
      const d = Math.sqrt(d2);
      const f = Math.min(REP / d2, d < 60 ? 24 : REP_MAX);
      const fx = (dx / d) * f, fy = (dy / d) * f;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    }
  }
  for (const [i, j] of edges) {
    const a = nodes[i], b = nodes[j];
    if (!a.active || !b.active) continue;
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    const rest = SPACING + (TYPE[a.type].r + TYPE[b.type].r - 20) * 2 * LAYSCL;
    const f = Math.max(-SPRING_MAX, Math.min((d - rest) * SPRING, SPRING_MAX));
    const fx = (dx / d) * f, fy = (dy / d) * f;
    a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
  }
  for (const n of nodes) {
    if (!n.active) continue;
    n.vx += (W / 2 - n.x) * GRAV; n.vy += (H / 2 - n.y) * GRAV;
    n.vx *= DAMP; n.vy *= DAMP;
    const sp = Math.hypot(n.vx, n.vy);
    const vmax = n.boost > 0 ? 10 : VMAX;
    if (sp > vmax) { n.vx = n.vx / sp * vmax; n.vy = n.vy / sp * vmax; }
    if (n.boost > 0) n.boost--;
    n.x += n.vx; n.y += n.vy;
    const r = TYPE[n.type].r + 4;
    if (n.x < r) { n.x = r; n.vx = 0; }
    if (n.x > W - r) { n.x = W - r; n.vx = 0; }
    if (n.y < r) { n.y = r; n.vy = 0; }
    if (n.y > H - r) { n.y = H - r; n.vy = 0; }
  }
}

// ---------- render ----------
let hoverNode = -1, mouseX = -1, mouseY = -1;

function toCanvasXY(e) {
  const rect = canvas.getBoundingClientRect();
  return [e.clientX - rect.left, e.clientY - rect.top];
}
function pickHover() {
  const wx = (mouseX - view.x) / view.s, wy = (mouseY - view.y) / view.s;
  hoverNode = -1;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (!n.disc) continue;
    const d = spriteDim[n.type] || { w: 0, h: 0 };
    if (Math.abs(n.x - wx) < d.w / 2 + 5 && Math.abs(n.y - wy) < d.h / 2 + 5) { hoverNode = i; break; }
  }
}
function clampView() {
  if (W * view.s >= W) view.x = Math.min(0, Math.max(W - W * view.s, view.x));
  else view.x = (W - W * view.s) / 2;
  if (H * view.s >= H) view.y = Math.min(0, Math.max(H - H * view.s, view.y));
  else view.y = (H - H * view.s) / 2;
}
canvas.addEventListener("wheel", e => {
  e.preventDefault();
  const [mx, my] = toCanvasXY(e);
  const f = e.deltaY < 0 ? 1.15 : 1 / 1.15;
  const ns = Math.max(0.45, Math.min(3.5, view.s * f));
  view.x = mx - (mx - view.x) * (ns / view.s);
  view.y = my - (my - view.y) * (ns / view.s);
  view.s = ns;
  clampView();
}, { passive: false });

let dragging = false, dragX = 0, dragY = 0;
const pointers = new Map();
let pinch = null;

canvas.addEventListener("pointerdown", e => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  const [mx, my] = toCanvasXY(e);
  pointers.set(e.pointerId, { x: mx, y: my });
  if (pointers.size === 1) {
    dragging = true; dragX = mx; dragY = my;
  } else if (pointers.size === 2) {
    dragging = false;
    const [p1, p2] = [...pointers.values()];
    pinch = { dist: Math.max(1, Math.hypot(p1.x - p2.x, p1.y - p2.y)),
              cx: (p1.x + p2.x) / 2, cy: (p1.y + p2.y) / 2, s0: view.s, x0: view.x, y0: view.y };
  }
});
canvas.addEventListener("pointermove", e => {
  const [mx, my] = toCanvasXY(e);
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: mx, y: my });
  if (pointers.size >= 2 && pinch) {
    const [p1, p2] = [...pointers.values()];
    const dist = Math.max(1, Math.hypot(p1.x - p2.x, p1.y - p2.y));
    const cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2;
    view.s = Math.max(0.45, Math.min(3.5, pinch.s0 * dist / pinch.dist));
    view.x = cx - (pinch.cx - pinch.x0) * (view.s / pinch.s0);
    view.y = cy - (pinch.cy - pinch.y0) * (view.s / pinch.s0);
    clampView();
  } else if (dragging && pointers.size === 1) {
    view.x += mx - dragX;
    view.y += my - dragY;
    dragX = mx; dragY = my;
    clampView();
  }
  mouseX = mx; mouseY = my;
  pickHover();
});
function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
  if (pointers.size === 1) {
    const [p] = [...pointers.values()];
    dragging = true; dragX = p.x; dragY = p.y;
  } else if (pointers.size === 0) {
    dragging = false;
  }
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);
canvas.addEventListener("pointerleave", e => {
  if (e.pointerType === "mouse") { hoverNode = -1; }
  if (pointers.has(e.pointerId)) endPointer(e);
});
canvas.addEventListener("dblclick", () => { view.s = 1; view.x = 0; view.y = 0; clampView(); });

function draw() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#f2eee3";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(view.x, view.y);
  ctx.scale(view.s, view.s);

  ctx.strokeStyle = "rgba(35,37,45,.07)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 16) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += 16) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();

  for (const [i, j] of edges) {
    if (!nodes[i].disc || !nodes[j].disc) continue;
    const a = nodes[i], b = nodes[j];
    let color = "rgba(35,37,45,.14)", width = 1;
    if (a.state === I && b.state === I) { color = "rgba(240,71,92,.5)"; width = 2; }
    else if ((a.state === I && (a.type === "bigv" || a.type === "mkt")) ||
             (b.state === I && (b.type === "bigv" || b.type === "mkt"))) {
      color = "rgba(255,148,64,.4)"; width = 1.5;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    const flow = (a.state === I && b.state === S) || (b.state === I && a.state === S);
    if (flow) {
      ctx.setLineDash([4, 7]);
      ctx.lineDashOffset = (a.state === I ? -1 : 1) * ((performance.now() / 40) % 11);
    }
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    if (flow) { ctx.setLineDash([]); ctx.lineDashOffset = 0; }
  }

  for (const p of particles) {
    const a = nodes[p.a], b = nodes[p.b];
    for (let g = 0; g < 3; g++) {
      const tt = Math.max(0, Math.min(1, p.t - g * 0.05));
      const x = a.x + (b.x - a.x) * tt, y = a.y + (b.y - a.y) * tt;
      ctx.globalAlpha = [1, 0.45, 0.2][g];
      ctx.fillStyle = p.kind === "rumor" ? "#f0475c" : "#35d98e";
      const s = (p.kind === "rumor" ? 5 : 4) - g;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
      if (g === 0) {
        ctx.fillStyle = p.kind === "rumor" ? "#ffd9de" : "#d6ffe9";
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }
  }
  ctx.globalAlpha = 1;

  const frame = Math.floor(performance.now() / 280) % 2;
  const nowMs = performance.now();
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (!n.disc || !n.active) continue;
    const key = n.banned ? "banned" : ["0", "1", "2"][n.state];
    const sp = spriteCache[n.type + key];
    if (!sp) continue;
    if (n.appear < 1) n.appear = Math.min(1, n.appear + 0.055);
    const it = 1 - n.appear;
    let scale = 0.5 + 0.5 * (1 + 2.7 * it * it * it + 1.7 * it * it);
    if (scale < 0.05) scale = 0.05;
    if (n.appear >= 1 && n.state === I && !n.banned) scale *= 1 + 0.04 * Math.sin(nowMs / 280 + i * 1.3);
    const wob = (n.state === I && !n.banned) ? (frame ? 1.5 : -1.5) : 0;
    ctx.globalAlpha = Math.min(1, ((n.state === S && !n.banned) ? 0.6 : 1) * Math.min(1, n.appear * 1.6));
    const w = sp.width * scale, h = sp.height * scale;
    ctx.drawImage(sp, n.x - w / 2 + wob, n.y - h / 2, w, h);
    ctx.globalAlpha = 1;
    if (n.bought) {
      ctx.fillStyle = "#f5b840";
      ctx.fillRect(n.x - 3, n.y - h / 2 - 9, 6, 5);
      ctx.strokeStyle = INK; ctx.lineWidth = 1;
      ctx.strokeRect(n.x - 3, n.y - h / 2 - 9, 6, 5);
    }
    if (n.flash > 0) {
      n.flash--;
      ctx.strokeStyle = "#f5b840";
      ctx.lineWidth = 2;
      ctx.strokeRect(n.x - w / 2 - 3, n.y - h / 2 - 3, w + 6, h + 6);
    }
    if (i === hoverNode) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(n.x - w / 2 - 4 + wob, n.y - h / 2 - 4, w + 8, h + 8);
      ctx.setLineDash([]);
    }
  }

  for (let k = bursts.length - 1; k >= 0; k--) {
    const b = bursts[k];
    b.t += 0.04;
    if (b.t >= 1) { bursts.splice(k, 1); continue; }
    const n = nodes[b.n];
    const s = 14 + b.t * 52;
    ctx.globalAlpha = (1 - b.t) * 0.9;
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(n.x - s / 2, n.y - s / 2, s, s);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  if (hoverNode >= 0) {
    const n = nodes[hoverNode], t = TYPE[n.type];
    const sp = spriteDim[n.type];
    const sx = n.x * view.s + view.x, sy = n.y * view.s + view.y;
    const label = `${t.name} · ${STATE_NAME[n.state]} · 粉丝${adj[hoverNode].length}`;
    ctx.font = "bold 12px 'Courier New', monospace";
    const w = ctx.measureText(label).width + 18;
    let tx = sx - sp.w * view.s / 2, ty = sy - sp.h * view.s / 2 - 34;
    if (ty < 8) ty = sy + sp.h * view.s / 2 + 10;
    if (tx + w > W) tx = W - w - 8;
    if (tx < 8) tx = 8;
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillRect(tx, ty, w, 24);
    ctx.strokeRect(tx, ty, w, 24);
    ctx.fillStyle = INK;
    ctx.fillText(label, tx + 9, ty + 16);
  }
}

// ---------- HUD ----------
function updateHUD(c) {
  const aware = (c.i + c.r) / c.total;
  $("st-traffic").textContent = Math.floor(traffic);
  $("v-aware").textContent = Math.round(aware * 100) + "%";
  $("bar-aware").style.width = aware * 100 + "%";
  $("v-belief").textContent = Math.round(c.i / c.total * 100) + "%";
  $("bar-belief").style.width = c.i / c.total * 100 + "%";
  $("v-heat").textContent = Math.round(heat * 100) + "%";
  $("bar-heat").style.width = heat * 100 + "%";
  $("v-att").textContent = Math.round(attention) + "%";
  $("bar-att").style.width = attention + "%";
  $("v-risk").textContent = Math.round(banRisk) + "%";
  $("bar-risk").style.width = banRisk + "%";
  $("p-trust").textContent = Math.round(trust * 100) + "%";
  $("p-r").textContent = rumorIdx >= 0 && RUMORS[rumorIdx] ? (RUMORS[rumorIdx].imp * amb).toFixed(2) : "--";
  $("p-pop").textContent = `${nodes.filter(n => n.active).length}/${nodes.length}`;

  const fx = [];
  if (day < hotUntil) fx.push(["🔥", "热搜", hotUntil - day]);
  if (day < coldUntil) fx.push(["🧊", "冷处理", coldUntil - day]);
  if (day < controlUntil) fx.push(["🗣", "控评", controlUntil - day]);
  if (day < tempBoostUntil) fx.push(["📡", "出圈", tempBoostUntil - day]);
  if (day < tempDampUntil) fx.push(["🎓", "降温", tempDampUntil - day]);
  if (day < tempForgetUntil) fx.push(["😂", "玩梗", tempForgetUntil - day]);
  if (mutation) fx.push(["🌪", "变异中", null]);
  const fb = $("fx-bar");
  fb.innerHTML = fx.map(([i, n, d]) =>
    `<span class="fx-chip">${i} ${n}${d != null ? " " + Math.max(0, d).toFixed(1) + "天" : ""}</span>`).join("");
  fb.style.display = fx.length ? "flex" : "none";

  const tc = $("target-chip");
  if (targetIdx >= 0 && TARGETS[targetIdx]) {
    tc.style.display = "block";
    tc.innerHTML = `🎯 <b>${TARGETS[targetIdx].name}</b>｜${TARGETS[targetIdx].metric()}`;
  } else tc.style.display = "none";
  $("clock").textContent = `第 ${day.toFixed(1)} 天`;
  for (const id of hand) {
    const def = CARDS.find(c => c.id === id);
    const cs = cardState[def.id];
    const el = $("card-" + def.id);
    if (!el) continue;
    const cd = el.querySelector(".cd");
    const cooling = cs.cdUntil > day;
    if (cooling) { cd.style.display = "flex"; cd.textContent = (cs.cdUntil - day).toFixed(1) + " 天"; }
    else cd.style.display = "none";
    el.classList.toggle("disabled", traffic < def.cost || cooling || !running || paused);
    el.classList.toggle("poor", traffic < def.cost && !cooling);
  }
  const db = $("btn-draw");
  if (db) {
    const cost = 60 + drawCount * 15;
    db.classList.toggle("disabled", traffic < cost || hand.length >= 5 || !running || paused);
    db.classList.toggle("poor", traffic < cost);
  }
}

function drawCard() {
  let pool = CARDS;
  if (pity >= 2) pool = CARDS.filter(c => c.rarity >= 2);
  const total = pool.reduce((s, c) => s + RARITY_W[c.rarity], 0);
  let roll = Math.random() * total, picked = pool[0];
  for (const c of pool) { roll -= RARITY_W[c.rarity]; if (roll <= 0) { picked = c; break; } }
  pity = picked.rarity >= 2 ? 0 : pity + 1;
  return picked.id;
}

function refillHand() {
  while (hand.length < 4) hand.push(drawCard());
}

function doDraw() {
  if (!running || paused || ended) return;
  const cost = 60 + drawCount * 15;
  if (traffic < cost || hand.length >= 5) return;
  traffic -= cost; drawCount++;
  const id = drawCard();
  hand.push(id);
  const def = CARDS.find(c => c.id === id);
  log(`🃏 抽到了「${def.name}」${def.rarity >= 2 ? (def.rarity === 3 ? " ★★★" : " ★★") : ""}`, def.rarity >= 2 ? "hot" : "");
  renderCards();
  updateHUD(counts());
}

function renderCards() {
  const wrap = $("cards");
  wrap.innerHTML = "";
  for (const id of hand) {
    const def = CARDS.find(c => c.id === id);
    const b = document.createElement("button");
    b.className = "card " + def.cls;
    b.id = "card-" + def.id;
    b.innerHTML = `<span class="icon">${def.icon}</span><span class="cost">💰${def.cost}</span><span class="rar">${"★".repeat(def.rarity)}</span>
      <div class="name">${def.name}</div><div class="eff">${def.eff}</div><div class="cd" style="display:none"></div>`;
    b.addEventListener("click", () => {
      playCard(def.id);
      b.classList.remove("flash"); void b.offsetWidth; b.classList.add("flash");
    });
    wrap.appendChild(b);
  }
  const cost = 60 + drawCount * 15;
  const d = document.createElement("button");
  d.className = "card draw-card";
  d.id = "btn-draw";
  d.innerHTML = `<span class="icon">🃏</span><span class="cost">💰${cost}</span><span class="rar">🃏</span>
    <div class="name">抽卡</div><div class="eff">从牌库抽一张新牌。连抽 2 次必出稀有以上</div>`;
  d.addEventListener("click", doDraw);
  wrap.appendChild(d);
}

// ---------- game flow ----------
function startGame() {
  buildNetwork();
  day = 0; tickCount = 0; heat = 0.15; trust = 0.75;
  const ru = RUMORS[rumorIdx] || RUMORS[0];
  traffic = ru.traffic; attention = ru.attention; banRisk = 0; lastAuto = -1;
  trust = ru.trust; heat = ru.heat;
  amb = 1; tempBoostUntil = tempDampUntil = tempForgetUntil = -1;
  nextEventDay = 1.5 + Math.random() * 1.5;
  nextEmergDay = 2.5 + Math.random() * 2.5;
  knownStreak = 0; trafficPeak = traffic; lastEnding = "";
  usedCards = new Set();
  modalOpen = false;
  particles = []; hand = []; pity = 0; drawCount = 0; agendaBonus = 0; quoteCD = 30; lastSpawnLog = -5;
  bursts = [];
  refillHand();
  hotUntil = -1; coldUntil = -1; controlUntil = -1; clarifHotUntil = -1;
  mutation = false; reversalArmed = false; reversalHappened = false; mutationAt = -1;
  peakRatio = 0; peakDay = 0; postRevPeak = 0; cardsPlayed = 0;
  ended = false; paused = false;
  cardState = {};
  for (const def of CARDS) cardState[def.id] = { cdUntil: -1 };
  $("log-list").innerHTML = "";
  $("rumor-title").textContent = ru.text;
  $("overlay-start").classList.add("hidden");
  $("overlay-end").classList.add("hidden");
  $("btn-pause").textContent = "⏸";

  const seeds = nodes.map((n, i) => i).filter(i => nodes[i].type === "mkt");
  for (let k = 0; k < ru.seeds; k++) {
    const pool = seeds.filter(i => nodes[i].state === S);
    if (pool.length) infect(pool[Math.floor(Math.random() * pool.length)]);
  }
  running = true;
  log(`📱 谣言投放：${ru.text}${ru.seeds > 1 ? `（${ru.seeds} 个营销号同时发布）` : "，一个营销号率先发布"}`, "warn");
  renderCards();
  updateHUD(counts());
}

const EMERGENCIES = [
  { icon: "📰", title: "校媒记者前来核实", opts: [
    { label: "私下爆料，把水搅浑", effect() {
      amb = Math.min(1.2, amb + 0.15); heat = Math.min(1, heat + 0.25);
      log("📰 你向记者透露更多内幕，话题更热也更模糊", "hot"); } },
    { label: "坦诚接受采访", effect() {
      amb = Math.max(0.2, amb - 0.3);
      let n = 0;
      for (const x of nodes) if (x.state === I && Math.random() < 0.1) { x.state = R; n++; }
      attention = Math.min(100, attention + 10);
      log(`📰 校媒报道澄清，${n} 人清醒，但官方关注 +10`, "good"); } },
  ] },
  { icon: "🚨", title: "网信部门约谈", opts: [
    { label: "认怂整改，撤稿道歉", effect() {
      banRisk = Math.max(0, banRisk - 35); traffic = Math.max(0, traffic - 80); heat *= 0.6;
      log("🚨 你选择服软：风险骤降，但赔了流量和热度", "good"); } },
    { label: "装死硬扛", effect() {
      banRisk = Math.min(100, banRisk + 25); attention = Math.min(100, attention + 8);
      log("🚨 你选择装死，风险继续累积", "warn"); } },
  ] },
  { icon: "🎉", title: "平台发放流量红包", opts: [
    { label: "全部领取", effect() {
      traffic += 150; heat = Math.min(1, heat + 0.15); banRisk = Math.min(100, banRisk + 10);
      log("🎉 领了流量红包，代价是风控名单上多了一笔", "hot"); } },
    { label: "低调拒领", effect() {
      traffic += 40;
      log("🎉 你只领了保底红包，低调安全", "good"); } },
  ] },
  { icon: "😭", title: "谣言当事人崩溃发帖", opts: [
    { label: "火上浇油推热搜", effect() {
      heat = Math.min(1, heat + 0.4); amb = Math.min(1.2, amb + 0.1);
      log("😭 当事人崩溃刷屏，全网情绪沸腾", "hot"); } },
    { label: "帮他压下去", effect() {
      let n = 0;
      for (const x of nodes) if (x.state === I && Math.random() < 0.15) { x.state = R; n++; }
      log(`😭 你帮当事人控场，${n} 人悄悄退坑`, "good"); } },
  ] },
  { icon: "💣", title: "有人扒出你是幕后推手", opts: [
    { label: "死不承认", effect() {
      amb = Math.min(1.2, amb + 0.2); banRisk = Math.min(100, banRisk + 15);
      log(" 💣 你咬死不认，质疑声反而成了流量", "hot"); } },
    { label: "自爆引流，提前跑路", effect() {
      trust = Math.max(0.1, trust - 0.15); traffic += 100;
      reversalArmed = true; mutationAt = day + 2 + Math.random();
      log("💣 你自爆蹭了波关注——但「反转」的种子已经埋下", "warn"); } },
  ] },
];

let modalOpen = false;
function openEmergency(ev) {
  modalOpen = true;
  paused = true;
  $("ev-icon").textContent = ev.icon;
  $("ev-title").textContent = ev.title;
  const box = $("ev-opts");
  box.innerHTML = "";
  ev.opts.forEach(o => {
    const b = document.createElement("button");
    b.className = "ev-opt";
    b.textContent = o.label;
    b.addEventListener("click", () => {
      o.effect();
      modalOpen = false;
      paused = false;
      $("btn-pause").textContent = "⏸";
      $("overlay-event").classList.add("hidden");
      updateHUD(counts());
    });
    box.appendChild(b);
  });
  $("overlay-event").classList.remove("hidden");
  log(`⚡ 突发事件：${ev.title}`, "warn");
}

const ACHIEVEMENTS = [
  { id: "cradle",    name: "防患未然",   tier: 1, desc: "达成「被扼杀在摇篮里」",   test: () => lastEnding === "cradle" },
  { id: "tacent",    name: "塔西佗陷阱", tier: 1, desc: "见证辟谣翻车的名场面",     test: () => reversalHappened },
  { id: "fullhouse", name: "全能操盘手", tier: 1, desc: "一局内用过全部六种牌",     test: () => usedCards.size >= 6 },
  { id: "traffic",   name: "流量之王",   tier: 1, desc: "单局流量峰值达到 800",     test: () => trafficPeak >= 800 },
  { id: "known",     name: "顶流操盘手", tier: 2, desc: "达成「全网皆知」",         test: () => lastEnding === "known" },
  { id: "rebound",   name: "蝴蝶效应",   tier: 2, desc: "达成「反转后二次爆发」",   test: () => lastEnding === "rebound" },
  { id: "meme",      name: "玩梗大师",   tier: 2, desc: "达成「娱乐化消解」",       test: () => lastEnding === "meme" },
  { id: "reason",    name: "理性之友",   tier: 2, desc: "结束时清醒者过半",         test: () => counts().r / nodes.length >= 0.5 },
  { id: "clean",     name: "零污点收场", tier: 2, desc: "结局时封号风险 ≤ 10%",     test: () => banRisk <= 10 && lastEnding !== "stalemate" },
  { id: "blitz",     name: "雷霆手段",   tier: 3, desc: "2 天内达成任一结局",       test: () => day <= 2 && ["known", "cradle", "rebound"].includes(lastEnding) },
  { id: "zen",       name: "无为而治",   tier: 3, desc: "一张牌不出仍达成结局",     test: () => cardsPlayed === 0 && lastEnding !== "stalemate" },
  { id: "rebound2",  name: "教科书反转", tier: 3, desc: "二次爆发峰值 ≥ 70%",       test: () => lastEnding === "rebound" && postRevPeak >= 0.7 },
  { id: "promise",   name: "言出法随",   tier: 3, desc: "达成自己预设的目标结局",   test: () => targetIdx >= 0 && TARGETS[targetIdx] && TARGETS[targetIdx].key === lastEnding },
];

function loadAch() {
  try { return new Set(JSON.parse(localStorage.getItem("rumorPlagueAch") || "[]")); }
  catch (_) { return new Set(); }
}
function saveAch(set) {
  try { localStorage.setItem("rumorPlagueAch", JSON.stringify([...set])); } catch (_) {}
}

function endGame(key) {
  ended = true; running = false;
  lastEnding = key;
  const e = ENDINGS[key];
  const c = counts();

  let score = 35;
  if (key === "known") score = 100 - cardsPlayed * 4 - day * 3;
  else if (key === "cradle") score = 115 - day * 8 - cardsPlayed * 3;
  else if (key === "rebound") score = 110 + postRevPeak * 40 - day * 2;
  else if (key === "fade") score = 55;
  let targetNote = "";
  if (targetIdx >= 0 && TARGETS[targetIdx]) {
    const ok = TARGETS[targetIdx].key === key;
    if (ok) score += 15;
    targetNote = ok ? " · 🎯 目标达成!" : " · 🎯 目标未达成";
  }
  score = Math.max(10, Math.min(100, Math.round(score)));
  const grade = score >= 90 ? "S" : score >= 70 ? "A" : score >= 50 ? "B" : "C";

  const unlocked = loadAch();
  const newAch = ACHIEVEMENTS.filter(a => a.test() && !unlocked.has(a.id));
  for (const a of newAch) unlocked.add(a.id);
  saveAch(unlocked);

  $("end-emoji").textContent = e.emoji;
  $("end-title").textContent = e.title;
  $("end-desc").textContent = e.desc;
  $("end-stats").innerHTML = `
    <div>峰值感染率<b>${Math.round(peakRatio * 100)}%</b></div>
    <div>峰值出现<b>第 ${peakDay.toFixed(1)} 天</b></div>
    <div>最终信谣人数<b>${c.i} / ${c.total}</b></div>
    <div>出牌次数<b>${cardsPlayed}</b></div>`;
  $("end-grade").innerHTML = `<span class="grade g-${grade}">${grade}</span><span class="grade-sub">评分 ${score}${targetNote}</span>`;
  $("end-ach").innerHTML = newAch.length
    ? `<div class="ach-head">🏅 解锁成就 ×${newAch.length}</div>` +
      newAch.map(a => `<div class="ach new"><b>${a.name}</b> — ${a.desc}</div>`).join("")
    : `<div class="ach none">本次没有解锁新成就，已收集 ${unlocked.size}/${ACHIEVEMENTS.length}</div>`;
  $("overlay-end").classList.remove("hidden");
  log(`🏁 结局达成：${e.title}`, "warn");
  updateHUD(c);
}

// ---------- wiring ----------
function renderDiffRow() {
  const box = $("diff-row");
  box.innerHTML = "";
  DIFFS.forEach((d, i) => {
    const b = document.createElement("button");
    b.className = "mini-opt" + (i === diffIdx ? " sel" : "");
    b.innerHTML = `<b>${d.name}</b><span>${d.desc}</span>`;
    b.addEventListener("click", () => { diffIdx = i; renderDiffRow(); });
    box.appendChild(b);
  });
}

function renderTargetRow() {
  const box = $("target-row");
  box.innerHTML = "";
  const free = document.createElement("button");
  free.className = "mini-opt" + (targetIdx === -1 ? " sel" : "");
  free.innerHTML = "<b>自由发挥</b><span>不预设目标</span>";
  free.addEventListener("click", () => { targetIdx = -1; renderTargetRow(); });
  box.appendChild(free);
  TARGETS.forEach((t, i) => {
    const b = document.createElement("button");
    b.className = "mini-opt" + (targetIdx === i ? " sel" : "");
    b.innerHTML = `<b>${t.name}</b><span>评分 +15</span>`;
    b.addEventListener("click", () => { targetIdx = i; renderTargetRow(); });
    box.appendChild(b);
  });
}

function renderRumorCards() {
  const box = $("rumor-cards");
  box.innerHTML = "";
  RUMORS.forEach((r, i) => {
    const b = document.createElement("button");
    b.className = "rumor-card";
    b.innerHTML = `<div class="rc-tag">🎯 ${r.tag}</div><div class="rc-text">${r.text}</div><div class="rc-cond">${r.cond}</div>`;
    b.addEventListener("click", () => {
      document.querySelectorAll(".rumor-card").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
      rumorIdx = i;
      $("btn-start").disabled = false;
    });
    box.appendChild(b);
  });
}

function renderTrophyCase() {
  const unlocked = loadAch();
  const tierIco = ["", "🥉", "🥈", "🥇"];
  $("ach-case").innerHTML =
    `<div class="ach-head">🏆 成就墙（${unlocked.size}/${ACHIEVEMENTS.length}）</div>` +
    ACHIEVEMENTS.map(a => {
      const ok = unlocked.has(a.id);
      return `<div class="trophy ${ok ? "" : "locked"}">${tierIco[a.tier]} <b>${ok ? a.name : "？？？"}</b><span>${ok ? a.desc : "尚未解锁"}</span></div>`;
    }).join("");
}

$("btn-start").addEventListener("click", startGame);
$("btn-again").addEventListener("click", () => {
  $("overlay-end").classList.add("hidden");
  $("overlay-start").classList.remove("hidden");
  $("btn-start").disabled = true;
  document.querySelectorAll(".rumor-card").forEach(b => b.classList.remove("sel"));
  rumorIdx = -1;
  targetIdx = -1;
  renderTrophyCase();
  renderTargetRow();
});
$("btn-restart").addEventListener("click", () => {
  running = false; ended = true;
  $("overlay-end").classList.add("hidden");
  $("overlay-start").classList.remove("hidden");
  $("btn-start").disabled = true;
  document.querySelectorAll(".rumor-card").forEach(b => b.classList.remove("sel"));
  rumorIdx = -1;
  targetIdx = -1;
  renderTrophyCase();
  renderTargetRow();
});
$("btn-pause").addEventListener("click", () => {
  if (!running) return;
  paused = !paused;
  $("btn-pause").textContent = paused ? "▶" : "⏸";
  updateHUD(counts());
});
$("btn-speed").addEventListener("click", () => {
  speed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
  $("btn-speed").textContent = speed + "×";
});

setInterval(() => {
  if (running && !paused) for (let k = 0; k < speed && running; k++) tick();
}, 150);

function frame() {
  if (canvas.clientWidth !== W || canvas.clientHeight !== H) resize();
  physics();
  draw();
  requestAnimationFrame(frame);
}

buildNetwork();
resize();
for (const def of CARDS) cardState[def.id] = { cdUntil: -1 };
refillHand();
renderCards();
renderRumorCards();
renderDiffRow();
renderTargetRow();
renderTrophyCase();
updateHUD(counts());
requestAnimationFrame(frame);