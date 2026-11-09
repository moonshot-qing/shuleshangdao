# 维护交接 · 2026-11-09

最新美术精修：按 create-game-assets / game-ui-ux / game-feel 重画八类36×48人物、十六张24×24卡牌插画，接入三套校园建筑/缩略图、放大身份肖像与结算档案小景。人物服装与原类别/群聊名牌同色，状态独立标记；只在发言/实际变化后抬手机，减少动态静帧，视觉计时随新局重建。矮屏社群改横向展开，修复旧上下边界冲突导致人物挤一行的问题。只动表现，simulation.js 哈希保持539da6f8069c91b8805a67256912c4cdc1bad3c9f3c2968bd0dee21f1e41ee0c。语法、五视口基础及三视口专项浏览器通过，页面错误0；已查看桌面/手机/横屏截图。素材规范/来源见 assets/art-direction-brief.md、art-manifest.json；图鉴与四视口截图在 test-results/art-review/，preview_art.py 的结算是强制视觉样例，不是自然对局证据。未做真机/Safari与新平衡对照。

最新小修：用户要求略微优化平衡，不大改。冷处理遗忘率2%→1.6%、封禁概率系数0.0012→0.0010；水军/大V/反黑/关键节点费用分别变为100/100/90/75。其余规则和35%胜负分界保留。120局新种子同能力前后对照传谣8/30→10/30，尚不能称已平衡；130+89规则、30组场景及5视口基础/3视口专项回归通过。参数、证据与当前模型哈希见 CARD_BALANCE_REPORT.md 首节，旧报告保留为历史；小修前快照在 test-results/balance-before-micro/。

最新验证：用户已重新要求验证及卡牌平衡审查。语法、130项规则、89项校园内容、30组新增场景通过；五视口基础回归及修复后三视口专项、4×约50.75秒完整实跑通过，页面脚本错误0。本次修复大V三级预览人数错误和移动端浮层遮挡/越界。1,680局固定种子、7,128个单卡受控分支及240局同能力参数隔离表明当前偏向辟谣，正式平衡参数未调。详见 CARD_BALANCE_REPORT.md；下面“跳过验证”均为历史记录，不是当前状态。

最新追加：突发事件已细化为按局势加权触发、绑定社群人物、即时/后续效果预览和一次可追踪后续。保留原5类及5类自动事件；整改回访看热度，红包曝光可被核实/源头限制取消，后续进入动态和社群bot回应。窗口1.2模拟日，非模态，可就近暂停、不回应或查看人物。event/emergencyHistory/eventFollowups 随新局重建，AI只复制已公开安排的后续；自然结束等待后续，既有13.5日上限不变。用户要求跳过验证，本轮未执行；详见 CAMPUS_CONTENT.md 与 IMPLEMENTATION_REPORT.md 首节。

最新一轮：已按“全部修改”完成AI统一行动评分、真实延迟反转试算、实时出牌风险预览、实际结果筛选复盘、手机卡面禁用原因、同网络交换身份。AI试算统一最多300步及三条独立随机试算，后续使用相同加权选牌策略；旧“两套评分比较行动/反转提前到0.25天”已删除。project 调用契约已同步到现有规则脚本。用户要求跳过验证，本轮未跑检查、浏览器、截图或固定种子对照，详见 IMPLEMENTATION_REPORT.md 首节。

最新追加：已落实用户要求的六项进一步改进，并恢复此前双阵营改版移除的封号风险/平台关注/实际封禁及 UI。卡牌派送具备行动归因与抵达汇总，融合增加变化摘要，AI 已接入同入口的抽牌/融合决策，关键卡牌参数集中，人物剪影/社群符号和操作音效继续细化。具体规则见 IMPLEMENTATION_REPORT.md 首节。按用户要求跳过本次全部验证，历史1,680局与截图结果不覆盖当前源码。


## 下一个对话先读这里

项目目录：`D:/qoder项目/shuleshangdao`；上层工作区 `D:/qoder项目`。远端 `https://github.com/moonshot-qing/shuleshangdao.git`，比赛入口 `https://tianchi.aliyun.com/competition/entrance/532536`。

**当前交接状态：本地新增功能已做规则/浏览器验证，美术已精修并检查实际尺寸截图；卡牌参数已做上一轮小幅调整，仍偏向辟谣，不能称已平衡。最新结论见 CARD_BALANCE_REPORT.md、IMPLEMENTATION_REPORT.md 与 assets/art-direction-brief.md。**

先读本文件与 `AGENTS.md`；需要完整规则再看 `PROJECT_PLAN.md` / `DESIGN.md`，最新实测看 `IMPLEMENTATION_REPORT.md`。规划和 Skill 记录含历史阶段，不要把旧“尚未实施”或旧“默认折叠”当作当前状态。用户最新明确要求优先。

### 必须延续的用户约定

- 保留现有纸色、像素人物、中央网络与主体布局，美术继续精修；传播全过程是核心，不扩成长篇角色扮演。三分钟只是参考，完整流程优先。
- **绝对不要防御性编程**：不加吞错、默认值兜底、重复校验、兼容层、预设未来的框架；玩法的资源/冷却/等级由统一入口表达。
- **原版传播公式必须保留且真实生效**，界面可看实时参数。R=i×a、接触传播、沉默的螺旋、遗忘、公信力辟谣，详见 PROPAGATION_MODEL.md。
- **保留校园群聊**：8类人物41条原对白、5类自动随机事件、5类选择突发。要有人物发言、接话、质疑与改口，不能再压缩成通用三句或数据报表，详见 CAMPUS_CONTENT.md。
- **最新界面要求已经做完**：难度与探索记录、评分与本局探索记录、阶段变化默认展开；产品页面中的“虚构事件”“虚构对白”“简化模拟、不预测现实”等免责文案已删除。不要加回。声音按钮仍按点击打开设置。
- 人机要能判断、组合与反制；复杂长期意图系统保留，不在未请求时添加行为树/通用策略框架。原评分与S/A/B/C保留，与阵营胜负独立。
- 修改后实际跑浏览器看效果。纯文档交接不重复跑整套模拟；改公式或事件实效后才重跑相关平衡。

### 已实现的完整玩法

三个校园事件 → 选择传谣者/辟谣者 → 与相反阵营人机对抗 → 卡牌说明、出牌、抽牌与融合 → 随机事件及群聊 → 自然收束 → 阵营胜负、原版评分、传播曲线和关键时刻 → 换身份/同网络重玩。

16张牌、双方独立资源/冷却；强化牌II/III本局保留，冷却后重复用。初手兼顾行动/应对/资源。传播的听说与相信分开，证据保护有时限，消息抵达才结算。自然结算相信率35%为胜负分界。β=0.014，自然核实基础系数=0.014；不要直接套回早期版本参数。

像素校园开场、人物两种姿态、卡牌符号、音效、手机人物详情/动态抽屉和横屏布局均已接入。原生HTML/CSS/JS+Canvas，零运行时依赖，无构建步骤。

### 上轮验证证据（以下均为本次 Skill 改动之前）

| 项目 | 已确认结果 | 入口/证据 |
| --- | --- | --- |
| 核心规则 | 130项通过 | `scripts/verify_model.cjs` |
| 原版内容 | 89项通过，41条对白逐字核对、5+5事件、20种身份/选择结算 | `scripts/verify_campus.cjs` |
| 批量对局 | 1,680局；标准策略胜率39%–59% | `test-results/balance-report.json` |
| 界面 | 5种视口，最新默认展开/去说明文案后已回归，页面错误0 | `test-results/duel/ui-report.json` |
| 完整计时实跑 | 4×约50.73秒；5次自然事件、8类人物87条发言含43次接话 | `test-results/duel/demo-report.json` |
| 录像 | 含实际合成音轨 | `test-results/duel/actual-with-sound.webm` |

上轮已验证模拟脚本SHA256：`2e4c76efb682059692f6e8203e57ebe9675ce9739a92d0cb6fbc9b226ab83441`。历史批量、界面和实跑报告对应此模型，不对应本次修改后的 simulation.js。

**录像录于最后一轮“默认展开/删除说明文案”之前**，玩法和模型仍相同；最新界面以当前源码、最新 `ui-report.json` 和 `start-*.png` / `ending-desktop.png` 等回归截图为准。内容遍历的 `campus-content-*.png` / `campus-chat-*.png` 有主动构造状态，不能冒充自然实跑截帧。

边界：策略胜率不是实际玩家胜率；该批量对局的选择突发按到期略过处理，20种选择单独验证。手机仅为浏览器仿真视口，真实手机/Safari、实际200%缩放、首次用户试玩、公网发布和参赛提交仍未完成。复杂长期意图保持保留项。

### 运行、验证与本地状态

交接时 `http://127.0.0.1:8876/` 实测返回200。该服务依赖本机进程，换对话后可先访问；若服务已停，在项目目录执行：

```powershell
Set-Location 'D:\qoder项目\shuleshangdao'
python -m http.server 8876 --bind 127.0.0.1
```

也可直接打开 `index.html`。测试使用本机Node、Python Playwright与Chrome，不是游戏依赖：

```powershell
node --check simulation.js
node --check game.js
node --check pixel-art.js
node --check audio.js
node scripts/verify_model.cjs
node scripts/verify_campus.cjs
node scripts/balance.cjs
python scripts/verify_experience.py
python scripts/verify_experience.py --demo
```

浏览器脚本自带临时服务器；默认Chrome：`C:/Program Files/Google/Chrome/Application/chrome.exe`。录像需要Playwright FFmpeg：`C:/Users/58362/AppData/Local/ms-playwright/ffmpeg-1013/ffmpeg-win64.exe`。`--demo`生成视频/音轨，当前含声音成片已另外合并；重新录制后不要继续使用旧成片。

**本次仓库同步以 `6a1d474dec7ed908b9a4e60067858552e5271f1e` 为旧版基线，目标为 `origin/main`（https://github.com/moonshot-qing/shuleshangdao）。** `simulation.js`、`pixel-art.js`、`audio.js`、assets、scripts和维护文档均属于正式实现，应一并提交；最新提交以 `git log -1` 为准。不要reset/clean或把旧版覆盖回来。测试结果、视频及历史备份被Git忽略，仍保存在本地；仓库同步与公网部署分别记录。

当前交接源码与小型验证报告快照：`D:/qoder项目/交接归档/shuleshangdao-handover-20261109.zip`；快照内 `HANDOVER_MANIFEST.json` 记录Git基线与逐文件SHA256。完整Git工作目录和大体积录像仍在项目本地原位置。本次整理仅更新交接文档。

旧回退快照：`C:/Users/58362/.codex/tmp/shuleshangdao-v21-before-build-20261109-132528.zip`；事件恢复前局部备份：`test-results/campus-chat/before-*`。

### 后续工作入口

用户要求把重点放在指定 Skill 的实际改进，跳过验证，不做防御性编程。当前源码为本次改进版本，既有测试产物属于历史证据。后续按用户具体反馈继续打磨，不自动重复跑验证或重新规划。

---

## 运行与文件

双击 `index.html` 或 `python -m http.server 8765 --bind 127.0.0.1`。原生脚本按 simulation → pixel-art → audio → game 的顺序加载，无构建和运行依赖。

| 文件 | 职责 |
| --- | --- |
| simulation.js | 场景、16 张牌、传播状态、双方资源/冷却、融合、人机、胜负与原评分 |
| pixel-art.js | 原像素人物矩阵、两种姿态、状态标记、卡牌符号与校园开场 |
| audio.js | 用户激活的像素音效、音量、静音与暂停/后台生命周期 |
| game.js | Canvas 布局/绘制、双步骤开局、卡牌详情、融合面板、曲线与交互 |
| style.css | 保留纸色与描边语言的桌面/手机布局 |
| scripts/verify_campus.cjs | 原版41条对白、5+5事件、双身份选项及独立对白随机数 |
| scripts/verify_model.cjs | 玩法规则、融合保留/冷却、确定性与人机不读取隐藏手牌 |
| scripts/balance.cjs | 固定种子、身份/场景/难度、策略与融合对照 |
| scripts/verify_experience.py | 真实浏览器界面回归、截图与完整实跑录像 |

## 模型与状态

`Simulation` 必须由 `{seed, scenario, difficulty, role}` 创建。所有配置、牌定义和生命周期明确；程序数据错误直接暴露，不添加兜底、吞错或重复校验。

每个人物有独立 `id`，类型、社群、在线状态、是否听说 `aware`、判断 `state`（0=尚未相信，1=相信，2=不再相信/已核实）、证据保护到期、源头抑制到期与传播加成到期。信息抵达即计入听说，是否被说服另行计算。

`Simulation.nodes/edges/adj/particles` 是模拟数据。视觉坐标与速度单独存在 `game.js` 的 `visuals` 中，物理布局和帧率不消耗模拟随机数。修改画面不能改变传播结果。

时间步 150ms，100 步对应一个模拟日；自动事件/选择突发从第11日起停止开启，第12日起停止新AI行动，等待已有传播与反转，最迟 13.5 日记录余波。实际秒数不强制截断；暂停与后台不推进模拟。

原版传播关系由 `formulas()` 统一生成，`step()`、`apply()`、公式面板共同使用；自然核实在 `naturalClarify(source,target,formulas)` 中，杠精压制按接收者邻居判断。新增 `ambiguity` 与 `memeUntil` 必须随人机公开状态副本复制。详细出处与校准见 PROPAGATION_MODEL.md。

`apply()` 返回干预说明，由 `play()` 写入卡牌动态；目标仍在途中时只写“正在派送”。`activity` 收集抵达、判断转变、遗忘与上线次数，`reportActivity()` 每50步记录默认展开、可手动收起的阶段观察。汇总不抽取随机数，也不改变传播状态；人机副本单独初始化统计，不共享真实记录。次数使用“人次”，新增听说使用首次接触人数。

原版 `QUOTES` 完整保留，`chatLines/say/conversation` 按人物身份与当前判断生成群聊和相邻人物回复；使用独立 `chatRandom`，不消耗传播/事件随机数。`CAMPUS_EVENTS/campusEvent` 为5类自动事件，`EMERGENCIES/chooseEvent` 为5类选择突发，使用 `eventRandom`。AI公开副本复制当前 `examUntil/mediaUntil/memeUntil`，禁用未来自动事件、突发与对白；不能窥读真实的未来事件序列。详情和89项保留验证见 CAMPUS_CONTENT.md。

## 卡牌与融合

每张手牌为 `{uid, id, level}`。`CARD_BY_ID` 是定义，`cardStats` 与 `cardDescription` 用同一份数据生成费用、对象数量、持续时间与说明。名称可以重复，实例 ID 不重复；冷却按定义 ID 共享。

只有 `playProblem/play`、`fusionProblem/fuse` 和 `draw` 负责对应玩法判断与结算。界面和人机复用它们，不另写一套规则。资源不足、冷却、等级和暂停属于玩法条件，统一表达一次。

I 级牌打出后随机补一张 I 级牌；II/III 级强化牌本局保留，受同名冷却约束。融合消耗辅牌，不自动补齐手牌；额外抽牌 35 资源，最多 5 张。融合费用 30/45；升级出牌费用 +12/+24，数量约 +30%/+60%，持续时间小幅增长。反转的准备时间不随强化延长。

## 人机

休闲使用较慢的局势权重选择；标准/大师在公开状态的副本中作三次短时牌效试算。试算使用独立随机源、冻结未上线人物、不复制对方手牌，关闭副本里的 AI/随机事件。候选行动不会修改真实局势。读取真实未来随机序列或对方手牌属于规则错误。

人机比较局势变化与费用，会避免重复覆盖持续效果，并考虑己方手牌可完成的热搜/水军和冷处理/辟谣组合。复杂长期意图仍是后续项。改评估参数后运行策略对照，不能凭单场录像宣称智能提高。

## 界面、音频与重开

原生 dialog 管理开局、说明、融合与结算；对局在说明/融合中继续，面板提供暂停思考。突发事件是非模态提示，可选择、略过或自动过期。

声音只在点击开始/声音设置后激活，现代浏览器直接使用 AudioContext。程序错误不吞掉；首次设置初始化、静音、暂停与后台按正常状态实现。

`startGame` 重建整局 Simulation，重置视觉、缩放、选择、日志游标、计时与速度。声音设置与探索记录保留于 localStorage。

## 验证和当前交付

详见 `IMPLEMENTATION_REPORT.md`。本地截图、报告、录像在 `test-results/`，不进 Git。本段为初次本地实现时的历史状态；当前仓库同步见上文，公网部署尚未执行。只完成实际测过的设备与流程，不把仿真视口说成手机真机测试。
