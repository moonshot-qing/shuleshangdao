# 交接文档 · HANDOVER

> 写给要接手/修改本项目的小伙伴。读完这份文档，你应该能在 30 分钟内定位到任何想改的地方。
> 配套阅读：[README.md](README.md)（玩法与特性总览）

## 1. 文件结构

```
天池算法大赛/
├── index.html          # 页面骨架：顶栏 / 画布 / 状态面板 / 舆情栏 / 手牌 / 5 个 overlay
├── style.css           # eBoy 像素风 UI（有限色板，全部定义在 :root CSS 变量里）
├── game.js             # 全部逻辑（~1600 行，单文件，无模块）
├── README.md           # 项目简介
├── HANDOVER.md         # 本文档
├── .gitignore
└── 备份-v6-像素版/      # 历史版本备份（已被 .gitignore 排除，可删）
```

## 2. 顶层架构

两个独立的循环：

```
rAF 渲染循环 frame()          150ms 模拟循环 setInterval(…, 150)
├── resize 自检（画布尺寸变了→重建）     └── 若 running && !paused：每 tick 跑 speed 次 tick()
├── physics()   力导向布局（纯视觉）               │
└── draw()      全部绘制（纯渲染，可安全重入）      ▼
                                            tick()  ← 游戏的心跳，所有数值逻辑在这
```

**铁律：数值逻辑只许写在 tick() 里，draw() 只做渲染**（draw 里的 `n.appear++`/`n.flash--` 是唯一例外——纯视觉状态）。draw 抛异常会杀死整个 rAF 链（画面永久冻结），改 draw 后务必手动调一次确认不抛。

`tick()` 内部顺序（game.js 搜 `function tick`）：

1. 热度/传播/遗忘结算（酝酿期 `incubateUntil`、`boostInfUntil`、`silenced` 都在这生效）
2. bot/理中客/辅导员澄清 → 生成**澄清粒子**（绿色）
3. 遗忘、R→S 回流（0.0001，`!mutation` 时）
4. 人群波次刷入（`pendingSpawns`）
5. 主体反应语料（QUOTES）
6. `updateParticles()` —— **粒子抵达结算**（感染/澄清在这里真正生效）
7. counts() → 峰值统计 → 流量收入 → 关注度/封号风险 → 封号 → 官方强制介入 → 随机事件 → 紧急事件
8. `checkEnding()` 结局判定 → `updateHUD()`

## 3. 核心数据结构

### node（nodes[i]，141 个，`add()` 工厂）

| 字段 | 含义 |
|---|---|
| `type` | bigv / mkt / crowd / bot / mid / leader / troll / counselor |
| `state` | 0=未闻(S) 1=信谣(I) 2=免疫(R)；bot 恒为 R |
| `active` | 是否已上线（动态人群：false 时不参与一切模拟与渲染） |
| `disc` | 是否已浮现（浮现机制：false 不绘制，相邻感染边 0.004/tick 概率浮现） |
| `appear` | 浮现动画进度 0→1（draw 里推进，easeOutBack 弹出） |
| `incubateUntil` | 酝酿期：信谣后隔 0.1-0.22 天才开始传播（防秒结局） |
| `bought` / `boostInfUntil` | 大V公关卡：收买标记 / 传播力×2 到期日 |
| `silenced` | 反黑调查卡：永久停止传播 |
| `banned` | 封号（变灰 + 红叉，停止传播） |
| `moves` / `boost` | 站位脉冲：状态转换时位移，终身限 3 次 |
| `flash` | 命中闪黄框倒计时（纯视觉） |

**改动提醒**：新增节点字段时，必须在 `startGame()` 或 `buildNetwork()` 里初始化（`buildNetwork` 重建所有节点，字段写在 `add()` 工厂里最安全）。历史上 `controlUntil` 忘了重置导致跨局泄漏——新全局变量一律加进 `startGame` 的重置块。

### 其它全局

- `particles[]`：`{a, b, t, sp, kind:"rumor"|"clarify"}`，a/b 是节点下标，t∈[0,1]，**在 tick 里推进**（不要移到 rAF，自动化测试是同步跑 tick 的）
- `bursts[]`：抵达/刷入的扩散环（纯视觉，draw 里推进）
- `hand[]` / `cardState[id].cdUntil` / `pity` / `drawCount`：手牌与抽卡
- `pendingSpawns[]`：待刷入节点下标，按 spawnDay 排序
- `RUMORS[]`：三个开局剧本（**对象**，用 `.text/.imp/.traffic`…，不是字符串）

## 4. 参数速查（调平衡从这里下手）

| 位置 | 参数 | 现值 | 作用 |
|---|---|---|---|
| 顶部常量 | `TICKS_PER_DAY` | 160 | 1 天 = 24 秒（150ms/tick） |
| | `MAX_DAY` | 12 | 局长上限 ≈ 4.8 分钟 |
| | `BASE_SPREAD` | 0.015 | 每条边每 tick 的基础传播率 |
| TYPE | `inf` / `sus` | — | 各主体传染力 / 易感度 |
| | `cell` | 2-4 | 像素小人尺寸（×LAYSCL 自适应） |
| tick | `knownStreak` 判定 | ratio≥0.55 累计 50，低于阈值 −1 衰减 | 🔥全网皆知（**累计制**，连续制在人口稀释下不可达） |
| | 摇篮判定 | `cardsPlayed≥1 && peak<25%` | 🧊 |
| | 娱乐化判定 | aware≥50% && belief≤12% && peak∈[30%,55%] && 未反转 | 🎭 |
| | 反转判定 | `reversalHappened && postRevPeak≥50%` | 🌪 |
| | 官方强制介入 | attention≥80，冷却 4 天，翻车线 peak>45% | 注意力是传播的天然天花板 |
| | 封号 | risk>40 后概率触发，risk 来自卡牌+attention>55 累积 | |
| | 沉默的螺旋 | `voice = max(0.2, 1.2-belief)`，控评 ×0.3，辟谣热搜 +0.8 | 调制 bot/理中客澄清 |
| | 人群刷入 | 5-9 波，时刻 1.5-11.2 天均匀随机 | 每轮随机性的主要来源 |
| CARDS | `cost`/`cd`/`rarity` | — | 抽卡权重 `RARITY_W = {1:5, 2:2.5, 3:1}` |
| 差异化 | `DIFFS` | 休闲/标准/大师 | spread/income/ban 三个乘数 |

## 5. 平衡测试方法（强烈建议沿用）

手动试玩调平衡又慢又不可复现。本项目的标准做法是**浏览器自动化跑策略**：

1. `python -m http.server 8765` 启动，用浏览器自动化（本项目用 MCP browser-use）打开页面
2. `evaluate_script` 直接操作全局函数（它们都是 window 上的全局）：

```js
// 模板：跑一局“策略”并返回结局
const run = (strategy, ru, di) => {
  diffIdx = di; rumorIdx = ru; startGame();
  let steps = 0;
  while (running && steps < 2600) {          // 12天×160tick 上限
    if (modalOpen) document.querySelector('#ev-opts .ev-opt').click(); // 处理紧急事件
    strategy(); tick(); steps++;
  }
  return { title: document.getElementById('end-title').textContent,
           peak: (peakRatio*100).toFixed(0)+'%', endDay: day.toFixed(1) };
};
// 手牌是随机的，测试时直接往里塞牌：
const give = id => { if (!hand.includes(id)) hand.push(id); };
```

3. 四条基准策略：`known`（hot+army+control 速攻）、`cradle`（cold+早辟谣）、`rebound`（扩散过半后辟谣钓翻车）、`meme`（热到 40% 急停后干净澄清）。**每条至少跑 3 局**看胜率，目标：全部结局可达、known≈50-75%、无牌局不能误触任何主动结局。
4. **跑完测试必须 `localStorage.removeItem('rumorPlagueAch')`**，否则玩家开局就是满成就墙。

## 6. 已知坑（前人踩过的）

| 坑 | 症状 | 规避 |
|---|---|---|
| per-game 全局未重置 | 上一局的效果延续到下一局 | 新全局变量一律加入 `startGame()` 重置块 |
| `resize()` 早于 `buildNetwork()` | SPACING 按 0 节点算，布局崩 | 初始化顺序：buildNetwork → resize |
| 粒子推进放在 rAF | 同步测试时粒子永远不前进 | 保持 `updateParticles()` 在 tick 里 |
| draw() 抛异常 | rAF 链死亡，画面永久冻结 | 改 draw 后手动 `draw()` 一次验证 |
| rAF 被节流 | 隐藏页面里画面“冻结” | 测试环境假象，用像素采样/逻辑验证，别信肉眼 |
| localStorage 污染 | 开局满成就 | 测试后清 `rumorPlagueAch` |
| `evaluate_script` 超时 | 内嵌浏览器脚本 15s 上限 | 长等待拆成多次调用 |
| `RUMORS` 当字符串用 | 日志显示 [object Object] | 它是对象数组，用 `.text` |

## 7. 修改指南（step by step）

### 加一张新卡牌
1. `CARDS[]` 里加一个定义：`{ id, icon, name, cls, cost, cd, rarity, eff }`（id 全局唯一）
2. `playCard()` 里加 `else if (id === "…") { …效果… }`（可以用 `give/hand` 之外的全部全局；生成粒子用 `particles.push({a, b, t:0, sp:0.05, kind:"rumor"|"clarify"})`）
3. `style.css` 加 `.card.c-你的id { background; }` 配色
4. 用第 5 节的方法测：塞牌→打一局→看结局分布没被破坏

### 加一类新主体
1. `TYPE` 加条目（name/color/r/inf/sus/cell）
2. `SPRITES` 加像素画（字符串矩阵，`O`描边 `W`白 `A`类型色 `B`状态色，宽度不齐会自动补点）
3. `buildNetwork()` 加生成数量与连边规则；`TRAFFIC_RATE/BURST` 加流量参数；决定初始是否可见（`add()` 里的 `pub` 列表）
4. 想要专属机制 → 在 tick 的对应环节加（参考杠精压制 bot / 辅导员无视野澄清）
5. `QUOTES` 加语料、`index.html` 图例加一行、CSS 加 `.lg-xxx`
6. **注意总人数变化会影响 SPACING 与所有比率**——改完跑一轮平衡

### 加一个结局
先想清楚它和现有五个结局的判定是否互斥（当前五个的判定顺序在 `checkEnding()`，从上到下短路）。加判定 → `ENDINGS` 加文案 → 成就/目标模式（`TARGETS`）同步 → 重新跑四策略平衡。**不要在没有平衡测试的情况下加结局。**

### 加紧急事件
`EMERGENCIES[]` 加 `{ icon, title, opts: [{label, effect}] }`，effect 里随便改全局，写一条 log。会自动进随机池。

## 8. Roadmap（未实现的想法）

- 更多紧急事件与主体语料
- 像素小人第二帧动画（行走/说话）
- 音效（BGM + 命中音）
- 复盘画廊：结局后回放传播热力曲线
- 移动端触控优化（现在捏合缩放未做）
