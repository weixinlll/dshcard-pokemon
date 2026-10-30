# 更新已有安装

**大多数更新不需要重新下载 545 MiB。** 卡片里那 530 MiB 是人物／场景／音乐／动态精灵等媒体，它们几乎从不改动；真正会变的是约 14 MiB 的插件代码（压缩后 2.6 MiB）。

DSH Tavern 安装时会把两者拆开存放：

```
data/plugins/card-dsh-card-pokemon-frlg-stage-<哈希>/   ← 只有代码，约 14 MiB
data/asset-packs/                                       ← 全部媒体，约 620 MiB
```

所以只要媒体没变，替换代码就够了——存档、变量、剧情记忆都在别处，不会被碰到。

## 一、只更新插件代码（日常修复，推荐）

适用于：修 bug、调平衡、改界面。**不动媒体，也不动你的存档。**

```powershell
# 在 Windows 上，把仓库里的 update-plugin.ps1 存到任意位置，然后：
powershell -ExecutionPolicy Bypass -File .\update-plugin.ps1
```

脚本会：

1. 找到 `data/plugins/card-dsh-card-pokemon-frlg-stage-*/`
2. 读取本地版本，和 GitHub 最新 Release 比较
3. 下载 `pokemon-kanto-<版本>.zip`（约 2.6 MiB）
4. 备份旧插件到 `data/_plugin-backups/`
5. 覆盖代码文件，**保留** `.dsh-card.json` 与 `.tavern-status.json`
6. 提示你重启 DSH

可选参数：

| 参数 | 作用 |
|---|---|
| `-DryRun` | 只检查有没有新版本，不下载不覆盖 |
| `-Force` | 版本相同时也强制覆盖（修过本地文件时有用） |
| `-BackupDir <路径>` | 自定义备份位置 |

**更新完必须完全退出并重启 DSH。** 插件是启动时 `import()` 的，刷新页面不生效。

**手动更新（不想跑脚本）**：从 Release 下载 `pokemon-kanto-<版本>.zip`，解压出 `plugins/pokemon-kanto/`，把里面所有文件覆盖到上面那个插件目录，再重启。脚本做的就是这件事，只是帮你找目录、做备份。

## 二、完整重装（媒体有更新时）

适用于：新增了立绘、背景、BGM、动态精灵，或版本说明里写了「需要完整包」。

1. 先用 DSH Tavern 自带功能备份旧局
2. 下载新的 `pokemon-frlg-<版本>.dshcard`
3. 通过卡片导入功能加载

`.dshcard` 自带全部媒体，导入后不需要联网，也不需要另外跑任何安装脚本。

## 怎么判断该走哪条

Release 说明里会写清楚。一般规律：

- 版本号第三位变化（1.0.1 → 1.0.2）且说明里只提代码修复 → **只更新插件**
- 说明里提到新增资源、或媒体包体积变化 → **完整重装**

拿不准就直接看 Release 附件：**有 `pokemon-kanto-*.zip` 就说明这次可以只更新代码。**

## 回滚

每次覆盖前都会备份到 `data/_plugin-backups/card-pokemon-<旧版本>-<时间戳>/`。出问题就把那个文件夹里的内容复制回插件目录，重启 DSH。

## 更新会不会影响正在玩的局

不会。插件目录里没有玩家数据；存档、MVU 变量、剧情记忆、卡内插件数据都在 `data/` 的其他位置，覆盖代码不会碰到它们。但**跨版本的行为差异**仍可能出现（比如某条规则改了），所以更新前备份旧局总是稳妥的。
