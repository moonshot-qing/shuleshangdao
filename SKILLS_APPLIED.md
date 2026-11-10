# GitHub Skills 筛选与实际应用记录

2026-11-10 美术家族扩展：本次阅读 create-game-assets 及其art-direction参考，按既有色板、描边、游戏实际尺寸制作手机专用帧、四社群地标、16张场景卡牌、6种结局；game-ui-ux用于画幅、手机/短横屏尺寸及网络空间；webapp-testing用于实际页面、六视口图鉴与流程检查。沿用原生Canvas/SVG素材，未引入位图、外部素材或运行依赖；制作记录与许可见assets/art-direction-brief.md、art-manifest.json。没有为本轮美术任务加载音频、AI或卡牌规则设计，模拟校验值保持不变。

2026-11-10 界面复查：本次按需阅读 web-design-guidelines、game-ui-ux、webapp-testing；重新获取[界面准则原文](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)。据此调整胜负/评分层级、窄屏卡牌可读性、融合与重玩固定操作区，修复结算初始焦点导致的滚动位置，补人物键盘播报及返回焦点；删减重复解释，保留真实玩法状态。新增 verify_ui_layout.py 检查六种视口的溢出、可操作性和滚动阅读，并查看生成截图；既有体验检查通过，详见 IMPLEMENTATION_REPORT.md 当前节。没有为本轮界面任务重复加载美术生成、AI或音频设计，也没有新增运行依赖或批量平衡结论。

2026-11-10 评审问题改进：按需使用 card-game（真实跨社群目标、统一可用性与结算、资源曲线和固定种子对照）、game-ui-ux（简要/完整规则分层、阅读自动暂停、矮屏操作区、同网络对照）、game-feel（派送/抵达/实际状态变化回执及定位）与 ai-behavior-trees-utility-ai（局势收益、终局目标与低传播时的行动优先级）。沿用直接评分和条件，无行为树/通用框架。素材与Web Audio继续复用已有实现。清理开发机安装路径，保留第三方技能仓库、版本、哈希与许可。实际检查和未完成事项见 IMPLEMENTATION_REPORT.md 当前节。

合并远端背景音乐时另外取用audio-design，检查阅读暂停、恢复、静音和重开调度；保留原曲与混音，清理跨局音符/计时状态，去除吞错。合并后的浏览器检查覆盖音乐暂停/恢复，完整实跑另录并检查实际音轨。

2026-11-09 美术精修（最新）：本轮按需阅读并应用 create-game-assets（包括 art-direction 参考）、game-ui-ux、game-feel，未重复加载不相关的音频/卡牌规则/AI Skill。实际重画八类统一36×48人物和十六张24×24卡牌插画，接入三种校园建筑与缩略图、身份肖像及结算小景；类别衣色与群聊一致，传播状态用独立标记。game-ui-ux用于48px卡面和手机/横屏适配；game-feel用于发言/状态变化后的短暂抬手机，保留减少动态和跨局重置。素材规格、来源与许可在 assets/art-direction-brief.md / art-manifest.json。语法、五视口基础、三视口专项浏览器回归通过并查看实际截图；源码模拟哈希未变，未新做平衡测试或真机审美验收。下文7×7图标/72×64肖像和“未截图”记录属于本轮之前的历史状态。

2026-11-09 最新验证：用户已要求恢复验证，继续使用 webapp-testing 的原生 Python Playwright 流程。完成五视口基础回归和三视口新增流程实点，发现并修复浮层遮挡/越界；查看桌面、手机、融合、风险详情及事件截图，录制本次完整计时对局。使用 card-game 的费用/冷却/效果与融合代价分析完成1,680局回归、7,128个受控单卡分支及240局同能力参数隔离；结论为当前偏向辟谣，非“已平衡”。数据版本、限制及修复详见 CARD_BALANCE_REPORT.md。

2026-11-09 突发事件细化：继续取用 card-game 的明确规则/统一结算，把事件参数、预览和后续共用；game-ui-ux 用于非模态提示、即时/后续层级、就近暂停与人物入口；game-feel 用于让选择后的后续在真实局势和校园动态中可追踪。沿用原像素风、Web Audio、静态部署与零运行依赖，没有增加任务框架或防御性兜底。本次按用户要求未运行验证，不宣称事件收益已平衡。

2026-11-09 最新追加：沿用已阅读的 ai-behavior-trees-utility-ai，统一出牌/抽牌/融合/等待的试算效用尺度，并保留真实延迟；沿用 card-game，将风险预览与实际结算共用风险/概率函数；沿用 game-ui-ux，在卡面直接显示不可用原因，并补同网络换身份；沿用 game-feel，以真实有效人数、封禁和回升选复盘时刻。当前新增功能没有引入框架、兜底或运行依赖；按用户要求跳过本次验证，详细状态见 IMPLEMENTATION_REPORT.md 首节。

2026-11-09 最新继续应用：按用户要求将六项进一步建议写入源码。create-game-assets 用于人物剪影及四类社群符号；game-feel 用于关联卡牌派送与实际抵达结果；card-game 用于 CARD_PARAMS 参数来源及行动结算统计；game-ui-ux 用于融合差异摘要和封号概率/风险层级；audio-design 用于即时、派送、完成、反转及封禁提示声；ai-behavior-trees-utility-ai 用于出牌/补牌/融合/等待的直接收益比较。恢复封号机制属于原玩法修复，未增加行为树或运行依赖。用户要求跳过验证，本次没有新增已验证结论，明细见 IMPLEMENTATION_REPORT.md 首节。

## 最新追加：2026-11-09 指定六项 Skill 的实际改进

已阅读本机 `create-game-assets`、`game-feel`、`card-game`、`audio-design`、`game-ui-ux`、`ai-behavior-trees-utility-ai` 的 SKILL.md，按用户指定范围取用。当前以实际改动为重点，用户明确要求跳过验证。

| Skill | 本次落地位置与内容 |
| --- | --- |
| create-game-assets | pixel-art.js：八类人物轮廓道具、统一两像素细节与整数网格图标；game.js：同源身份肖像 |
| game-feel | game.js / style.css：局部状态短标注、派送/生效提示、AI 状态条强调、轻量融合反馈与跨局清理 |
| card-game | simulation.js / game.js：完整卡牌结算说明、强化前后对照、共享抽牌判断与融合费用 |
| audio-design | audio.js：三通道混音、频率/声部限制、轻微音高变化、音量曲线、暂停/后台挂起 |
| game-ui-ux | game.js / style.css：手机融合对照、参数层级、重建控件的焦点保持、己方手牌 DOM 缓存 |
| ai-behavior-trees-utility-ai | simulation.js：实际费用下的组合评分、可见威胁的反制资源取舍，沿用直接判断和现有试算 |

未引入第三方资产、框架或运行依赖，未引入行为树。未执行本次修改后的检查、截图、试听或平衡对照；后文验证数据属于历史版本。本次明细见 IMPLEMENTATION_REPORT.md 首节。

---

核验日：2026-11-08（北京时间）。按用户最新要求，三分钟为参考节奏，**玩法流程完整优先**。完整目标见 [PROJECT_PLAN.md](PROJECT_PLAN.md)，视觉方案见 [DESIGN.md](DESIGN.md)。

## 1. 选用了什么

星数由 GitHub API 当次查询得到，是**整个来源仓库的星数**，不是单个 Skill 的评价或星数。此次采用三个 Skills，来自两个原作者高星仓库。

| Skill | 原作者来源 | 仓库星数快照 | 用在本项目的部分 |
| --- | --- | ---: | --- |
| frontend-design | [anthropics/skills](https://github.com/anthropics/skills/tree/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/frontend-design) | 189,252 | 先写设计方向，再改入口、网络优先布局、手机手牌与指标层级，最后检查截图 |
| webapp-testing | [anthropics/skills](https://github.com/anthropics/skills/tree/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/webapp-testing) | 189,252 | Python Playwright 实际开页面、交互回归、脚本报错采集与多尺寸截图 |
| web-design-guidelines | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/skills/web-design-guidelines) | 33,710 | 图标按钮名称、键盘焦点、模态焦点、减少动态效果、触控与安全区检查 |

另检查了 [openai/skills](https://github.com/openai/skills)（28,594 星快照），本轮不额外安装重复能力。没有因为仓库热门而安装 React/Next.js 专用最佳实践：现有游戏是原生 Canvas，没有迁移框架的需求。

## 2. 安装与来源验证

使用本机系统 `skill-installer` 的官方辅助脚本，按固定 commit 安装：

```powershell
python <skill-installer>/scripts/install-skill-from-github.py --repo anthropics/skills --ref 2c5958ecac7cee2b583967a2c4981d0f4a75c579 --path skills/frontend-design skills/webapp-testing
python <skill-installer>/scripts/install-skill-from-github.py --repo vercel-labs/agent-skills --ref 1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62 --path skills/web-design-guidelines
```

已安装到本机开发技能目录；已阅读并应用其指引。所有三个本地 `SKILL.md` 均与固定 commit 的原始内容逐字节比较一致，SHA256 与来源信息保存在 [skills-lock.json](skills-lock.json)。该 JSON 是来源记录，不是游戏依赖管理器。

Anthropic 两项的目录内 `LICENSE.txt` 均为 Apache-2.0。Vercel 所选目录未发现明确的许可声明，本轮仅安装为本机开发指引，没有把 Skill 原文或脚本复制进项目进行分发。项目自身许可证仍为 MIT。

安装前阅读了所选 Skill 内容；未执行其无关安装或网络外传操作。`web-design-guidelines` 要求读取当次最新规则，因此还获取并应用了 [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)。

## 3. 已经实际做了什么

### frontend-design

先写 `DESIGN.md`，明确主视觉是像素人物与信息轨迹，保留原项目的网格、有限色板和描边，所有布局服务于观察传播。完成下列实际改动：

- 默认选好一个场景，第一屏可直接“开始观察”；难度、目标和成就收进实验设置。
- 弱化玩家作为操盘手的叙述，改用三条虚构校园传闻和描述传播现象的结果文案。
- 手机指标默认折叠；卡牌横向浏览且保留效果说明；顶部按钮完整显示。
- 增加简短过程提示，帮助理解转述、核实、扩大与余波。
- 新增缩放与还原按钮，补充纯手势操作的替代方式。

### web-design-guidelines

以下为审查定位与处理，行号对应本轮版本：

```text
index.html:18 - 图标按钮补充 aria-label；暂停同步 aria-pressed
index.html:24 - 主内容入口与网络文字说明
index.html:36 - 指标开关使用原生 button 与 aria-expanded
index.html:69 - 开始/结算使用 dialog 语义，并管理背景 inert 与焦点
style.css:293 - 增加 focus-visible，键盘操作可见
style.css:306 - 卡牌可横向浏览，正文颜色加深
style.css:354 - 手机顶部换行、安全区与指标折叠
style.css:391 - 尊重 prefers-reduced-motion
game.js:1392 - 突发事件不阻断传播，可略过，8 秒未处理自动关闭
game.js:1441 - 结算前清理事件，防止事件遮住结果
```

这不是完整可访问性认证。Canvas 节点的可访问文本结构、触屏人物详情、200% 缩放与真实读屏器仍需后续验证。

### webapp-testing

依照 Skill 使用 Python Playwright，先等待页面 `networkidle`，再识别控件、执行交互和截图。新增可重复执行的 [scripts/verify_experience.py](scripts/verify_experience.py)。

已先运行 Skill 自带 `with_server.py --help`，并实际尝试辅助脚本。Windows 下发现它终止 shell 后可能留下子服务器，导致重复运行出现空响应；因此验证脚本改用**同进程临时服务器**，动态端口，在退出时可靠关闭。未改动第三方 Skill 文件，已清理本轮启动的已确认子进程。

## 4. 完整流程优先的代码落地

- 常规参考 12 个模拟日，100 tick/日，150ms/tick，1× 名义约三分钟。
- 删除真实秒数硬截止与剩余倒计时，显示已演化时间。
- “全网皆知”与二次爆发先写入 `observedEnding`，达到阈值后继续观察后续变化。
- 传播者归零时，只要仍有有效在途转述或已安排的反转，就继续演化。
- 第 12 天进入收尾后，不再开启新随机事件；等待现有有效转述与反转，最迟到第 15 个模拟日汇总余波，避免无限运行。
- 统一目标与 HUD 的在线人口分母，并把 66% 的旧文字统一为实际 55% 阈值。
- 为“娱乐化消解”补评分公式，修复原先默认 35 分的问题。评分完全改成传播档案仍属于后续阶段。

## 5. 验证结果

已通过：

- `node --check game.js`。
- `git diff --check`。
- 360×800、390×844、768×1024、1440×900 布局；主按钮首屏可见、顶部控制不裁切、卡牌说明可见。
- 指标展开/收起、手动暂停时模拟与有效时长均停止。
- 事件自动略过、主动略过、选择后关闭、结算优先、重开重置。
- 浏览器计时延迟不会因真实时间到点而强制切断传播。
- 高传播记录后继续演化、在途消息与反转等待、完全耗尽后正常结束。
- 目标统计分母与阈值、娱乐化评分、减少动态效果模式下的键盘主要操作。
- 3 场景 × 3 难度各一次无牌冒烟，全部正常结算，浏览器 `pageerror` 为空。

本轮九个随机样本的名义模拟时长为约 65–184 秒；8 次为娱乐化消解，1 次余波未尽。**这只证明流程能跑通，不证明结果分布平衡。** 样本未使用已实现的种子系统（目前尚无），不能声称可复现相同随机结果。

截图与原始 JSON 在本地 `test-results/experience/`，已排除入库。重点截图：`start-390.png`、`play-390.png`、`play-1440.png`、`reduced-motion-keyboard.png`。本轮为桌面 Chromium 与仿真视口，不能替代 Safari、真实手机、用户测试或持续 FPS 测量。

## 6. 下一阶段仍需要完成

本轮完成规划、Skill 安装与 P1 基础改进。以下清楚保留为计划，尚未声称实现：

1. 知晓/相信/转发分离与真实可见的社群桥梁。
2. 简化默认干预，让卡牌经济退出主循环。
3. 触屏人物详情、过程曲线、三个关键时刻与传播档案。
4. 可复现随机种子与同网络对照；批量种子平衡测试。
5. 首次用户验证、真机适配、Qoder Sites 部署与真实开发过程提交材料。

GitHub 远端未提交、未推送，公网未部署。

## 7. 2026-11-09 本轮实际应用

用户已授权按 v2.1 实施。本轮继续使用 frontend-design 的主题/色板/层级/截图复查流程，制作原创像素校园、人物姿态、16种卡牌符号及四类关键界面；web-design-guidelines 用于原生 dialog、明确按钮、可见焦点、响应式与减少动态效果；webapp-testing 用于真实 Chrome 点击、截图、声音激活与完整计时录像。未额外安装不适配的框架 Skill。

新增实现和 130 项规则检查、1,680 局固定种子验证、五种视口及实跑数据见 IMPLEMENTATION_REPORT.md。第6节是上一轮的历史待办，本轮已实现其中人物详情、曲线、关键事件、种子和本地对局能力；公网部署与真机/用户验证仍未完成。

补充落地：原版传播公式及实时参数面板；传播动态的干预详情、阶段统计、群聊切片与手机回看；横屏压缩手牌区，保留网络空间。开发 Skill 只用于设计、审查与验证，不成为运行依赖。

2026-11-09 校园氛围恢复：继续按 frontend-design 的既有美术语言精修群聊头像、气泡和信息层级；webapp-testing 驱动真实 Chrome，遍历8类人物、5类自动事件及两身份下5类突发菜单，并录制自然演化对局。原版41条对白通过逐字对照，新增89项内容/行为检查；当前结果以 IMPLEMENTATION_REPORT.md 为准。
