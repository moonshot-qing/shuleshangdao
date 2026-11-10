# 维护交接 · 2026-11-10

## 快速接手

先读本文件与 AGENTS.md，再按需求读 PROJECT_PLAN.md、DESIGN.md、SKILLS_APPLIED.md。实际实现与验证见 IMPLEMENTATION_REPORT.md，平衡证据见 CARD_BALANCE_REPORT.md；规划、历史报告与当前实现应分开看。

项目为原生 HTML / CSS / JavaScript + Canvas，零运行时依赖、无构建步骤。保留暖纸色、像素风、中央网络、左侧指标、右侧动态、底部手牌。仓库：https://github.com/moonshot-qing/shuleshangdao ，功能评审轮以8df3085为基线，最新UI复查以5bd9e4为基线。

## 必须延续

- 不做防御性编程：不加多余空值/类型检查、默认兜底、吞错、兼容层、重试或未来框架。程序错误定位根因。
- 资源、同名冷却、卡牌归属、目标和融合条件共用模拟入口，玩家/AI/界面不能另建规则。
- 实时传播在 Simulation.step，视觉在 drawNetwork / physics；动效与声音不消费模拟随机数。
- 保留8类人物41条原对白、5类自动事件、5类选择突发、原传播公式和S/A/B/C档案评级。
- 难度/探索记录、阶段变化、评分明细默认展开；不要增加产品免责文案。
- 新局重建模拟和局内视觉状态。仅同网络对照的上一局结果有意跨局保留，换网络清空。
- 核心修改做语法与体验检查并查看桌面/手机截图；平衡用固定种子，仿真、真人、实际部署分别记录。

## 当前实现

2026-11-10 画面复查：玩法/回执已移入手牌区，顶部短提示替代中央大提示；nodeSize共用实际精灵尺寸与碰撞间距，窄屏/拥挤时用18×24帧。常驻按钮、效果与社群名称留视觉避让区；ResizeObserver更新画布尺寸与避让数据，startGame的resize重建新局几何。事件关联人物卡嵌入event-inspector-slot，短横屏事件使用视口高度；正常人物详情仍在网络。标题装饰统一复用像素符号，模拟和原对白未改。新增verify_presentation.py覆盖DPR2/3、7天105人样例、控件遮挡与事件选项，公开桌面/手机图在screenshots/04、05。

2026-11-10 美术家族扩展：四社群实体建筑已进入对局；手机/短横屏使用独立12×16人物缓存帧（8类×3状态×2姿态），完整人物与肖像保留。安静边减淡，在途边按真实派送提亮。16张64×40场景插画用于手牌/详情，符号图用于融合/角标。结局画布改192×128，drawResult必传实际结局key，6种场景与目标金章分开。新增素材只作视觉，模拟与平衡未改。preview_art.py生成六视口与图鉴，并同步screenshots/03-美术图鉴.png；具体规格在assets/，检查结果见IMPLEMENTATION_REPORT.md最新节。

2026-11-10 界面复查已完成：胜负先于档案评级展示，评分仍默认展开；结算初始焦点在标题、滚动从顶部开始，底部固定换身份重玩/原身份重试/重新选择事件。融合确认与返回也固定可见，费用明确；预览风险标为强化牌“出牌时”的变化。手机手牌效果、风险分行；网络左右键查看人物并播报，关闭后返回网络焦点。删去重复无效果/免责式说明，保留必要玩法限制。新增六视口检查 scripts/verify_ui_layout.py；本次未调平衡参数。

### 首次上手

卡牌先显示效果、对象、费用、冷却和时机；结算、组合、反制、理论、融合说明位于展开区。阅读自动暂停，“继续并出牌”先恢复传播，再调用统一出牌入口；关闭/Esc恢复自动暂停，原本手动暂停则保持。playProblem 的 willResume 只预览恢复后的可用性，实际 play 仍正常检查暂停。矮屏操作区保持可见，可直接返回手牌。

玩法提示从目标与第一张牌开始，随后切换为真实回执，可随时收起/重开。选择身份时突出场景规则，收起已经看过的校园演示。

### 因果反馈

出牌保存 targets、changedNodes、summary 及派送/抵达/改变/阻止/失败计数，只在真实派送/结算时更新。反转真正发出消息后才有落点。点击玩家回执或人机状态可定位人物；描边、提示与镜头只在界面保存。全网增益、资源牌、待发反转、保护和源头限制分别说明，不能把全网相信率变化当作单卡效果。

### 场景与弱连接

三种进展均在第3模拟天发生一次，开局公开：

| 场景 | 实际规则 |
| --- | --- |
| 音乐节 | 社团领袖按当时态度向跨圈邻居最多派送4份消息；相信则转述、核实则送证据，未表态/封禁/受限则停发 |
| 图书馆 | 自习小组最多4名已核实非bot人物，证据保护延长到第4.2天，不直接改变新人物判断 |
| 超市 | 最多6名原定稍后上线的生活群聊同学提前入群，不直接赋予相信或核实状态 |

进展进入动态，可查看人物/圈层；AI试算复制公开场景状态和入群安排。弱连接沿仍在转述且未受限来源的真实跨社群边派送，优先相信比例低的圈层、共同邻居少的连接，接收者不重复；无路径由统一入口拒绝。

### AI与参数

继续比较出牌/抽牌/融合/等待，保持同尺度试算、真实延迟、独立预测随机源，不读对方手牌。评分加入实际相信率与试算终局胜负。传谣AI尚未出牌或相信者少于8时优先建立传播，有可用传播行动则不先融合/等待。

当前：β=0.015、自然核实k=0.014；冷处理遗忘1%/步，玩梗叠加为3%；封禁系数0.0008、阈值40。I级水军8人、弱连接最多6人。双方初始资源180，基础回流传谣25/天、核实20/天，再加原阵营人数项。费用、共享冷却、融合30/45和35%分界保留。每轮固定种子和失败样本见平衡报告，不能把少量胜率或流程跑通当作真正平衡。

### 档案与重玩

原计分公式、范围和等级保留，archiveScore 为计算及逐项明细的单一来源。先显示阵营目标，再解释档案成本，另列定向行动记录。同网络重玩/换身份后比较两局相信率、目标、出牌/融合、直接影响人次。仅保存当前页面内最近一次相同 seed/scenario/difficulty 的结果，换网络清空，不做持久化排行榜。

### 美术、声音和内容

完整36×48人物、手机12×16人物、24×24符号、64×40卡牌场景、社群建筑、身份和六种结算共用 pixel-art.js。真实发言/变化后短暂抬手机，减少动态用静帧。来源/规格见 assets/。Web Audio 在用户操作后激活，支持静音、音量、暂停/后台挂起。原对白与事件说明见 CAMPUS_CONTENT.md。

交付前合并远端77f2bf6的背景音乐与两份介绍文档，保留原曲和混音。阅读暂停统一走setPaused，同时停乐/恢复；audio.reset清除上一局音乐调度、音符和强度，stopMusicLoop不吞错。玩法介绍的两张截图由capture_endings.py自然推进自对弈生成，种子9831/9832，未强制结算，来源见screenshots/README.json。

## 文件与检查

simulation.js 管规则/AI，game.js 管界面/视觉，pixel-art.js 管美术，audio.js 管声音。

```powershell
node --check simulation.js
node --check game.js
node --check pixel-art.js
node --check audio.js
node scripts/verify_model.cjs
node scripts/verify_campus.cjs
node scripts/verify_iteration.cjs
node scripts/verify_judging.cjs
python scripts/verify_experience.py
python scripts/verify_iteration_ui.py
python scripts/verify_judging_ui.py
python scripts/verify_ui_layout.py
python scripts/verify_presentation.py
node scripts/verify_judging_balance.cjs compare 10 9831
python scripts/verify_experience.py --demo-only --demo-seed 173
```

浏览器脚本自带临时服务器，开发机用Chrome；开发工具不属于运行依赖。对照通过Git读取8df3085源码，不依赖本机未提交快照。截图、逐局JSON和录像按Git忽略保存在 test-results/。judging-review 的场景/结算截图含构造样例，不能冒充自然实跑；duel 的 demo-report.json 和录像才是计时实跑。

真实手机/Safari及首次玩家验证仍需另行完成，提纲见 PLAYTEST.md。站点发布和报名不属于本轮游戏修改范围。
