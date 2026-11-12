# KR cheat engine

Kingdom Rush（王国保卫战 1，Steam 版）单机作弊模块。

通过替换游戏 exe 内嵌 ZIP 里的 `main.lua` 作为加载器，在游戏启动后从存档目录动态加载 `kr_cheats.lua`，
实现金币、命数、秒杀、跳波、无冷却等功能，并在游戏画面上给出文字反馈。

> 仅用于单机自娱。游戏更新后需要重新注入。

## 功能

| 按键 | 功能 |
|---|---|
| `5` | 金币 +1000 |
| `6` | 命数 +1 |
| `7` | 全屏秒杀当前所有敌人 |
| `8` | 立刻推进到下一波（当前波次剩余敌人会被清掉） |
| `9` | 开关无限技能（流星火雨 / 援兵无冷却），关闭时还原原始冷却 |
| `F9` | 调试信息写入日志 |
| `P` | 暂停 / 继续 |

`3`、`4` 不拦截，保留游戏原本行为（选英雄等）。

作弊状态以左上角文字提示，不会覆盖游戏 UI。

## 原理

游戏基于 LÖVE，逻辑代码以 LuaJIT 字节码形式打包在 exe 内嵌的 ZIP 中（ZIP 数据起始偏移 `99328`）。

1. 用 `patch_exe.py` 把内嵌 ZIP 里的 `main.lua` 替换成加载器，原版另存为 `main_orig.lua`；
2. 加载器先 `require("main_orig")` 让原版正常启动，再用 `io.open` 以**绝对路径**读存档目录下的 `kr_cheats.lua` 并执行；
3. `kr_cheats.lua` hook 住 `love.keypressed / love.update / love.draw`，并每帧检查 hook 是否被游戏覆盖、被覆盖就重新挂上。

之所以用 `io.open` 绝对路径而不是 `require`：游戏会改写 `package.path`，且加载器执行时 LÖVE 的 identity 还没设置。

存档目录（Windows）：

```
%APPDATA%\kingdom_rush\
```

## 安装

需要 Python 3（仅用于注入这一步）。

1. 把 `kr_cheats.lua` 复制到存档目录 `%APPDATA%\kingdom_rush\`
2. 注入加载器（自动备份原 exe 为 `Kingdom Rush.exe.bak`）：

```bash
python patch_exe.py --game-dir "D:\SteamLibrary\steamapps\common\Kingdom Rush"
```

3. 启动游戏，进入关卡后即可使用上面的热键

## 卸载

- **只关闭作弊**：删除 `%APPDATA%\kingdom_rush\kr_cheats.lua`，游戏恢复原版行为
- **完全还原**：用 `Kingdom Rush.exe.bak` 覆盖 `Kingdom Rush.exe`

## 文件说明

| 文件 | 说明 |
|---|---|
| `kr_cheats.lua` | 作弊模块本体，放在存档目录，启动时动态加载 |
| `loader_main.lua` | 加载器，注入游戏后会成为 exe 内的 `main.lua` |
| `patch_exe.py` | 注入脚本：备份 exe、重打包内嵌 ZIP、替换 `main.lua` |

## 注意

- 注入前请确认 `Kingdom Rush.exe.bak` 已生成，这是唯一的还原手段
- Steam 校验文件或游戏更新会还原 exe，需要重新注入
- 秒杀通过把敌人血量扣到 0 实现，死亡动画由游戏自身流程处理
- 日志写在存档目录的 `kr_cheat_log.txt`，排查问题时有用
