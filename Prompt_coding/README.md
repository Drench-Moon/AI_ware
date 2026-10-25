# Prompt_coding · OJ 助手浏览器扩展

一个 Edge / Chrome 浏览器扩展：在算法竞赛 OJ 题面页一键抓取题目，调用大模型 API 直接生成**思路 + 可提交代码**，全程不用切屏。

## 支持的 OJ 平台

| 平台 | 域名 |
|---|---|
| 程天学（TJU OJ）| acm.tju.edu.cn |
| 力扣 | leetcode.cn / leetcode.com |
| 洛谷 | luogu.com.cn / luogu.com |
| Codeforces | codeforces.com / codeforces.ml |
| 蓝桥云课 | lanqiao.cn |
| PTA | pintia.cn / pta.cn |
| 牛客 | nowcoder.com / ac.nowcoder.com |
| AcWing | acwing.com |
| AtCoder | atcoder.jp |
| VJudge | vjudge.net |

## 功能特性

- 🚀 **一键生成**：点蓝色圆形 OJ 按钮（或按 `Alt+G`）→ 自动抓题 → 自动调 API → 思路+代码直接渲染
- 📝 **三大模式**：思路+代码 / 只要代码 / 只要提示
- 💻 **多语言**：C++17 / C++20 / Python3 / Java / Go / Rust
- 🧹 **C 风格 IO 自动转换**：模型返回 `printf/scanf` 时自动改写成 `cin/cout`（含精度控制 `setprecision`、换行统一 `endl`）
- 🧩 **函数式题目模式**：力扣等 `class Solution` 题型自动识别，抓取右侧代码模板作为函数签名，只生成函数实现不生成 `main`；题面抓取自动过滤评论/栏目等噪音
- 📦 **头文件规范化**：自动去掉 `bits/stdc++.h` 万能头并按需拆解为用到的头文件，重复的 `#include` 和 `using namespace std` 自动去重
- 🎨 **可拖拽**：面板、左下角 OJ 按钮、设置弹窗都可自由拖动；面板右下角蓝色三角调整大小；按 `Ctrl+Alt+R` 复位（可在右键菜单修改或设为无）
- 📚 **历史记录**：自动保存生成记录，支持搜索
- ⌨️ **快捷键**：`Alt+G` 一键抓题生成（隐藏悬浮球时也能用）；`Alt+S` 显示/隐藏悬浮球（按一次隐藏、再按一次显示）；两组快捷键互不影响，均可在右键菜单修改
- 🌐 **全站可用**：所有网站都会注入，任意页面按 `Alt+G` 即可调用，不必只在支持的 OJ 平台使用
- 🔔 **更新提醒**：检测到仓库有新版本时，OJ 按钮出现红点、面板顶部显示金色横幅，点击直达下载页

## 支持的模型服务

任何兼容 OpenAI `/chat/completions` 接口的服务都能用：

| 平台 | baseUrl |
|---|---|
| DeepSeek（推荐，新用户送 500 万 tokens）| `https://api.deepseek.com` |
| 硅基流动（有免费额度）| `https://api.siliconflow.cn/v1` |
| 月之暗面 Kimi | `https://api.moonshot.cn/v1` |
| 阿里云百炼 通义 | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| 字节火山引擎 豆包 | `https://ark.cn-beijing.volces.com/api/v3` |
| 智谱 AI | `https://open.bigmodel.cn/api/paas/v4` |
| OpenRouter | `https://openrouter.ai/api/v1` |
| 本地 Ollama | `http://127.0.0.1:11434/v1` |

## 安装步骤（Edge / Chrome 通用）

> 下载地址：**[Releases · 最新版](https://github.com/Drench-Moon/AI_ware/releases/latest)** → 下载 `Prompt_coding.zip`

1. **下载扩展包**：解压到**固定目录**（如 `D:\AI_ware`，不要放在下载/临时文件夹，删掉后扩展会失效）
2. **打开扩展页**：Edge 地址栏输 `edge://extensions/`，Chrome 输 `chrome://extensions/`
3. **打开开发人员模式**：页面右上角（/左上角）把"开发人员模式 / 开发者模式"开关打开
4. **加载扩展**：点"加载解压缩的扩展程序" → 选择解压出来的 **`Prompt_coding` 文件夹**（选文件夹本身，不要进去选单个文件）
5. **配置 API Key**：
   - 点工具栏的扩展图标
   - 选一个平台（推荐 DeepSeek）
   - 粘贴你的 API Key
   - 点"保存配置" → 点"测试连通性" → 显示 ✅ 就 OK

## 获取 API Key

- **DeepSeek**：https://platform.deepseek.com/ 注册 → API keys → 创建（新账号免费送 500 万 tokens）
- **硅基流动**：https://cloud.siliconflow.cn/ 注册 → API 密钥（有免费模型可用）
- 其他平台：去对应官网拿 Key，注意要选"兼容 OpenAI 接口"

## 使用方法

1. 打开任意支持的 OJ 题面页（比如 https://acm.tju.edu.cn/ 或 https://leetcode.cn/）
2. 左下角自动出现蓝色圆形 **OJ** 按钮
3. 点按钮（或按 `Alt+G`）→ 等 15-60 秒
4. 思路+代码直接渲染在左侧面板，代码块右上角有 **复制** 按钮
5. 复制到编辑器提交即可

## 更新扩展

扩展会**自动检查更新**（浏览器启动时 + 每 12 小时一次，对比本仓库 `Prompt_coding/manifest.json` 的版本号）。

发现新版本时：左下角 **OJ 按钮右上角出现红点**，打开面板**顶部出现金色横幅**。

> 未上架商店的扩展无法全自动升级，需手动 3 步：
> 1. 点横幅右侧的 **「点此更新」** 直接下载最新版 `Prompt_coding.zip`
> 2. 解压后用新的 `Prompt_coding` 文件夹**覆盖**原文件夹
> 3. 打开 `edge://extensions/`（Chrome 为 `chrome://extensions/`）→ 点本扩展的 🔄 **重新加载** → 回题面页按 F5

## 常见问题

**Q: 点 Alt+G 没反应？**
A: 确保在题面页（不是首页），按 F12 看 Console 有没有报错。先在 `edge://extensions/` 找到本扩展 → 点🔄重新加载 → 回题面页 F5 刷新。

**Q: 生成失败 / 提示"扩展连接丢失"？**
A: 扩展更新后必须 F5 刷新答题页。Chrome MV3 的 service worker 会被休眠，旧页面里的 content script 连不上新 worker。

**Q: 生成的代码用了 printf/scanf？**
A: 扩展会自动转成 cin/cout 并弹 toast 提示。如果还有漏网的，开 issue 把代码贴上来。

**Q: 抓题抓不全/抓偏了？**
A: 点面板里的"重新抓取"。不同 OJ 的 DOM 结构不一样，如果某个平台持续抓偏，开 issue 说明平台名。

## 文件结构

```
Prompt_coding/
├── manifest.json    # 扩展清单（MV3）
├── background.js    # Service worker：调 LLM API
├── content.js       # 注入到 OJ 页面的脚本（UI + 抓题 + 生成）
├── popup.html       # 配置面板（填 API Key）
└── popup.js         # 配置面板逻辑
```

## 隐私说明

- API Key 存在浏览器本地 `chrome.storage.local`，不会上传到任何服务器
- 题面只发给你配置的那个 LLM 服务（DeepSeek / 硅基流动 等），不经过第三方
- 历史记录存在浏览器本地，卸载扩展即清除

## License

MIT
