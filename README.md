# dshcard-pokemon · 宝可梦火红叶绿：关都旅程

[![测试](https://github.com/weixinlll/dshcard-pokemon/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/weixinlll/dshcard-pokemon/actions/workflows/ci.yml)
[![角色卡下载](https://img.shields.io/github/v/release/weixinlll/dshcard-pokemon?label=角色卡)](https://github.com/weixinlll/dshcard-pokemon/releases/latest)
[![代码许可 MIT](https://img.shields.io/badge/code-MIT-green.svg)](LICENSE)

**这是 [DSH Tavern](https://github.com/flizzywine/dsh-tavern) 的角色卡与配套插件，必须在 DSH Tavern 中游玩。**
下载 Release 里的 `.dshcard` 后，通过 DSH Tavern 的人物卡导入功能加载。GitHub 的「Download ZIP」是开发源码，不能作为角色卡直接导入；这里也不是可以直接打开的在线游戏。

以火红／叶绿关都 151 为核心，把 AI 角色扮演、伙伴成长和可操作的回合制对战接到同一座原生舞台。队伍、背包、金币、任务和战果共同保存在本局 MVU 中；数值规则由插件计算，AI 负责叙事与人物互动。

![桌面战斗：像素精灵、场景与招式菜单](docs/images/battle-desktop.png)

> 上图为隔离预览环境中实际运行的战斗画面。界面会随 DSH Tavern 的窗口尺寸和舞台设置变化。

## 下载与开始游玩

1. 安装并启动 [DSH Tavern](https://github.com/flizzywine/dsh-tavern)，按其文档完成模型连接配置。本卡要求宿主提供 **Tavern API 4**，包括原生 MVU 结算提供者；以宿主实际能力为准。
2. 打开本项目的 **[最新发行版](https://github.com/weixinlll/dshcard-pokemon/releases/latest)**，下载 `pokemon-frlg-1.0.3.dshcard`。资源随卡提供，文件约 **545 MiB**；不要下载 GitHub 自动生成的 Source code 代替它。
3. 在 DSH Tavern 的卡片管理／人物卡导入入口选择该文件。包内含人物卡、插件，以及人物／场景／音乐、动态精灵、原创演出材质三个资源包，无须另外运行安装器或覆盖宿主文件。
4. 新开本卡游玩，等待开场与结算完成，选择初始伙伴。可以点击舞台入口，也可以直接输入「选择小火龙」「前往常青市」「寻找皮卡丘」等行动；地点通行与遭遇仍受当前剧情、地图和队伍条件限制。
5. 出现合法邀约后点「接受剧情对战／进入本轮战斗」。战斗中亲自选择招式、道具、换人或逃跑。结束后结果直接保存到 MVU，同一故事轮可以继续主动对战，不需要把战果再发送给模型。

更新前请先用 DSH Tavern 自带功能备份旧局。旧局与新卡的兼容问题请附版本和复现步骤反馈；本仓库不会读取或上传玩家存档。

### 更新已有安装

已经在玩的用户**不需要每次重下 545 MiB**。卡片里约 530 MiB 是几乎不变的媒体，会变的是约 14 MiB 的插件代码（压缩后 2.6 MiB）。

```powershell
powershell -ExecutionPolicy Bypass -File .\update-plugin.ps1
```

脚本会比对版本、下载 `pokemon-kanto-<版本>.zip`、备份旧插件并覆盖，最后提示你重启 DSH。存档、MVU 变量和剧情记忆都在插件目录之外，不会被碰到。

**什么时候需要完整重装**：Release 说明里提到新增立绘／背景／音乐／动态精灵时。判断方法很简单——附件里有 `pokemon-kanto-*.zip` 就说明这次可以只更新代码。

完整步骤、手动更新方式和回滚办法见 **[docs/UPDATING.md](docs/UPDATING.md)**。
### 下载完整性

发行版附 `SHA256SUMS.txt`。Windows 可以用 `Get-FileHash .\pokemon-frlg-1.0.3.dshcard -Algorithm SHA256`，macOS / Linux 可以用 `shasum -a 256 pokemon-frlg-1.0.3.dshcard`，与清单核对。源码中的 [release-manifest.json](release-manifest.json) 也固定了首发资源的版本与校验值。

## 可以玩到什么

| 部分 | 当前内容 |
| --- | --- |
| 对战 | 第三世代规则引擎；单打、双打、属性与状态、特性和携带物、捕捉／逃跑、有限 NPC 药品、跨重启战斗恢复 |
| 成长 | IV / EV / 性格、经验与等级上限、升级学招队列、学习机／导师、进化确认与取消、队伍与电脑管理、放生保护 |
| 世界 | 图片地图缩放与平移、城市专属商店与设施、NPC 交换、按故事轮推进的培育、玉虹游戏厅与百货导师 |
| 故事 | 无印篇与特别篇灵感的关都改编、火箭队、宿敌与重要 NPC、分阶段委托、永久工具奖励、回访与 AI 交谈 |
| 伙伴 | 露营、共同记忆、亲密度与信赖；可配置的羁绊扩展及战斗体现 |
| 演出 | 像素与高清二维动态精灵、正背面与闪光素材、战斗镜头、技能演出、重要对战开场、可取得并装备的原创外观 |

**这是同人改编，尚不等于原作完整复刻。** 未完整覆盖原作全部逐格机关、NPC 视线脚本、剧情 flag、七之岛完整主线及全部隐藏物可达路径；不支持联机交换／联机对战，也没有实时 3D 引擎。高清模式使用预渲染的二维动态素材。地狱强度、羁绊和部分工具属于本卡扩展规则，并非原版第三世代规则。

### 舞台与特效

命中、保护、异常和战果由真实对战事件驱动；原生对白气泡与开关交给 DSH Tavern 控制。新版（UI API 7）舞台的 BGM 统一交给本体播放器，插件不再另外启动剧情／战斗背景音乐，攻击音效继续独立播放；曲目、暂停、音量与导演选曲使用本体音乐面板。旧宿主和独立开发预览保留原有播放器。演出速度、减少动态及外观参数可调，特效预览与保存使用共用配置。

![原创外观的共享渲染器预览](docs/images/effect-gallery.png)

上图是原创外观的共享渲染器预览，展示围绕精灵的分层效果，**不是完整游戏截图**。素材获取条件包括剧情、委托、羁绊和重要对战；不会把所有奖励当开局物品发放。PokeMMO 社区预览仅作为研究参考，不代表官方合作或原样复刻。

<details>
<summary>查看窄屏战斗实测画面</summary>

![390 像素宽度下的实际战斗预览](docs/images/battle-mobile.png)

这是浏览器窄屏检查，不代表所有手机或宿主版本均已完成实机验收。
</details>

## 常见问题

**小茂的 `@bubble` 直接露出来，或进舞台后有两首 BGM？** 请下载当前 **1.0.3 正式版（`v1.0.3`）**，旧的 `v1.0.0` 上传包已标记为旧预览。此次修复取消了对整句台词的按钮替换，邀请通过台词外的「接受剧情对战」或舞台入口操作；不新增气泡开关。新版音乐由本体管理，插件不会改变你的本体音乐设置。

**点战斗没有反应／提示正在结算？** 先确认本轮正文和后台任务已经结束、已领取可战斗伙伴、当前存在未结束的合法遭遇。不要连续反复点击。如果一直停住，请保存本体诊断，记录卡版本、宿主版本、操作与错误文字，然后[提交问题](https://github.com/weixinlll/dshcard-pokemon/issues/new/choose)。不要把完整聊天和凭据直接公开。

**自然语言移动或指定野怪没生效？** 输入明确的当前行动和目的地／精灵名。规则不会把假设、回忆或否定句自动当作行动，也不会绕过不可通行路线。若正文已移动而 MVU 没同步，请把前后地点及脱敏错误发给维护者。

**图片或声音没有出现？** 确认导入了完整 `.dshcard` 及其资源包，下载哈希与清单一致。音乐通常需首次点击页面才能播放，也受本体开关影响。源码预览需要先准备资源，不能只复制插件代码。

**游玩很慢？** AI 正文与模型对手仍受模型、网络及宿主队列影响；本地规则结算不会消除模型生成耗时。先尝试关闭不需要的动态效果并查看本体任务状态。反馈时请区分「等 AI」「结算不完成」「动画掉帧」，并附大致耗时。

**可以商用、出售或随意复用素材吗？** MIT 仅覆盖本项目原创代码，不覆盖全部图像、音频和宝可梦衍生内容。见 [第三方说明](THIRD_PARTY_NOTICES.md)。

## 反馈与贡献

- [报告 Bug / 提议功能](https://github.com/weixinlll/dshcard-pokemon/issues/new/choose)：模板包含环境、操作步骤、预期／实际结果和脱敏诊断字段。
- 欢迎 PR；先阅读 [贡献指南](CONTRIBUTING.md)。小问题直接提修复；规则或存档格式等较大改动建议先开 Issue 讨论。
- 不要提交 API Key、完整玩家存档、私人对话或机器绝对路径。安全问题按 [SECURITY.md](SECURITY.md) 处理。
- 测试范围和限制见 [1.0 验证记录](docs/TESTING.md)，核心边界见 [架构说明](docs/ARCHITECTURE.md)。自动化检查通过不等于没有 Bug。

## 本地开发

需要 **Git、Node.js 22+、Python 3.10+**。基础源码不包含大型媒体；首次准备资源约需下载 545 MiB，并预留约 2 GiB 空间。引擎运行依赖已固定放在 `vendor/`，日常运行不需要另装 npm 包。

```sh
git clone https://github.com/weixinlll/dshcard-pokemon.git
cd dshcard-pokemon
python scripts/fetch_assets.py
npm test
npm start
```

打开 `http://127.0.0.1:4177`。这只是本地战斗／管理预览，**不是完整 DSH AI 剧情环境**；原生舞台、模型叙事和宿主 MVU 接口还需在 DSH Tavern 验证。

已经下载角色卡时，可用 `python scripts/fetch_assets.py --archive /path/to/pokemon-frlg-1.0.3.dshcard`，避免重复下载。资源脚本先验证固定哈希，再解出允许的资源目录；不会访问 DSH 安装目录。

```sh
python scripts/check_repository.py
python scripts/build_card.py
```

新构建位于 `dist/pokemon-frlg-1.0.3.dshcard`，附独立校验报告；开发构建的哈希可与首次发行不同，以其生成的报告为准。源码包未带媒体时不能离线构建。CI 在 PR、发布及手动运行时执行，先取已发布的固定资源再运行测试。

## 目录

```text
card-source/          角色卡正文、世界书、原生清单与图标
pokemon-kanto/        插件入口、规则、前端、数据、测试和固定引擎
docs/                 架构、测试说明、截图、经脱敏的审查记录
scripts/              资源准备、原生角色卡构建、仓库校验
resources/            本机准备的独立媒体包（Git 忽略）
```

## 来源与许可

感谢 [DSH Tavern](https://github.com/flizzywine/dsh-tavern)、[Pokémon Showdown](https://github.com/smogon/pokemon-showdown)、[PokéAPI](https://github.com/PokeAPI/pokeapi) 和相关素材社区。源码与资源来源分别记录，原许可证随固定依赖保留。

本项目为非官方同人作品，与 Nintendo、Creatures、GAME FREAK、The Pokémon Company、DSH Tavern 或 PokeMMO 均无官方关联或背书。宝可梦名称、形象、音乐等权利归各权利人所有。详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
