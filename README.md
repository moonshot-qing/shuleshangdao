# 谣言瘟疫 · 看见信息的一生

一则校园消息，在转述与核实之间流动。选择传谣者或辟谣者，用几分钟的实时卡牌对抗，观察行动如何沿社交网络产生影响。

暖纸色、八类像素人物、十六张卡牌插画，配合校园群聊、突发事件、局势反转和传播复盘。原生 HTML / CSS / JavaScript + Canvas，零运行时依赖，无需构建。

新增四社群校园地标、手机专用人物帧、场景卡牌与六种结局小景：[查看美术图鉴](screenshots/03-美术图鉴.png)。

实际界面截图：[桌面对局](screenshots/04-桌面对局.png) · [手机对局](screenshots/05-手机对局.png)。

## 直接运行

双击 `index.html`，或运行：

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

访问 <http://127.0.0.1:8765>。

## 五步开始

1. 选择校园场景，查看本局公开的特殊进展。
2. 选择身份：传谣者争取结算相信率达到35%，辟谣者争取低于35%。
3. 点牌看简要说明；阅读自动暂停，“继续并出牌”执行。关闭后自动继续，原本手动暂停则保持。
4. 看抵达后的行动回执，点击查看落点。可抽牌或用同等级两牌融合：I→II花30资源，II→III花45，最高III级。
5. 等传播自然收束，查看胜负、计分与关键时刻。重玩同一网络或交换身份，比较两局记录。

节奏参考约三分钟，传播全过程优先，在途转述和反转有收尾窗口。支持暂停、1/2/4×速度、拖动缩放、触屏人物详情、键盘主要操作和减少动态效果。

## 场景变奏

三种进展均在第3模拟天发生一次，双方提前知道：

| 场景 | 本局进展 | 可以怎样准备 |
| --- | --- | --- |
| 音乐节 | 领袖按当前态度跨圈接力，受限则停发 | 争取领袖、核实来源或限制其传播 |
| 图书馆 | 最多4名已核实同学的保护延长到第4.2天 | 提前送证据，或准备保护结束后的再传播 |
| 超市 | 最多6位稍后上线的同学提前入群 | 留行动牌，或提前保护传播路径上的人物 |

## 决策与反馈

手牌有独立实例，同名共享冷却。I级使用后补牌；强化牌本局保留、冷却后再用，II/III费用增加12/24。融合消耗辅牌，不刷新冷却。

双方初始资源180；基础回流为传谣25/模拟天、核实20/模拟天，再随各自阵营人数增加。实际回流可在传播指标中查看。

回执区分派送、抵达、改变判断、保护与源头限制，可定位落点；全网增益按实际效果说明。弱连接沿真实跨社群边派送。人机比较公开局势中的相信率、收益、费用、组合与反制，保留真实延迟；传播尚未建立或接近消失时优先行动，不读取对方手牌或真实未来随机结果。

保留8类人物41条原对白、5类自动事件、5类选择突发及可追踪后续。人物会求证、接话和改口；手机可展开传播动态，阶段变化默认展开。

胜负按结算在线相信率35%判断。S/A/B/C是传播档案评级，原公式记录传播形态、用时、行动投入和目标达成，逐项展示分数并单列定向行动。同网络对照仅保存在当前页面，换网络清空。

## 美术与声音

人物、卡牌、校园、身份及结算小景由代码原创绘制，不加载外部美术或字体。Web Audio合成声音在用户操作后激活；112 BPM的8bit背景音乐随局势加入节奏与旋律层，与音效共用音量/静音控制，支持阅读暂停、恢复、重开和后台挂起。

## 项目资料

- [实现与验证](IMPLEMENTATION_REPORT.md)
- [传播公式](PROPAGATION_MODEL.md)
- [平衡证据](CARD_BALANCE_REPORT.md)
- [美术规格](assets/art-direction-brief.md)
- [Skills来源与应用](SKILLS_APPLIED.md)
- [首次试玩与演示提纲](PLAYTEST.md)
- [维护交接](HANDOVER.md)
- [目标设计与计划](PROJECT_PLAN.md)

## 开发验证

使用Node、Python Playwright与Chrome，均不是运行依赖：

```powershell
node --check game.js
node --check simulation.js
node scripts/verify_model.cjs
node scripts/verify_campus.cjs
node scripts/verify_iteration.cjs
node scripts/verify_judging.cjs
python scripts/verify_experience.py
python scripts/verify_iteration_ui.py
python scripts/verify_judging_ui.py
node scripts/verify_judging_balance.cjs compare 10 9831
python scripts/verify_experience.py --demo-only --demo-seed 173
```

对照使用Git中的8df3085和当前源码，交替先手，输出模型哈希与逐局结果。浏览器脚本自带服务器；`verify_experience.py --browser <Chrome路径>`可指定浏览器。录像需Playwright FFmpeg，可用 `python -m playwright install ffmpeg` 安装。产物保存在Git忽略的 test-results/。

## 已知边界

自动检查与真实玩家体验分开记录，当前不能据少量仿真宣称已平衡。真实手机/Safari、首次玩家验证尚需完成，详见平衡报告和试玩提纲。站点发布和报名不属于本轮游戏修改范围。

## License

项目使用MIT。开发Skills的来源和许可单独记录，不是运行依赖。
