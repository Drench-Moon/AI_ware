/* OJ Helper · Background Service Worker (MV3) */

const DEFAULT_CONFIG = {
  baseUrl: 'https://api.deepseek.com',
  apiKey: '',
  model: 'deepseek-chat',
  timeoutMs: 120000,
  language: 'C++17',
  mode: 'study'
};

chrome.runtime.onInstalled.addListener(async () => {
  const cfg = await chrome.storage.local.get();
  const merged = Object.assign({}, DEFAULT_CONFIG, cfg);
  await chrome.storage.local.set(merged);
  chrome.alarms.create('ojh_update', { periodInMinutes: 720 });
  checkForUpdate();
});

/* ===== 扩展更新/重载后自动恢复：免页面刷新，避免打断沉浸刷题计时 =====
   reload 或升级后，已打开页面里的旧 content script 上下文会失效（chrome.* 变成 null），
   以前只能按 F5 才能恢复。这里在 SW 每次启动时做两件事：
   1) 对每个已打开的网页发 ping，没人应答说明旧脚本已死 → 清理旧 UI 并重新注入；
   2) 版本号变化（升级）时对所有页面强制重注入，让新代码立即生效。 */
(async () => {
  try {
    const VER_KEY = 'ojh_installed_version';
    const cur = chrome.runtime.getManifest().version;
    const got = await chrome.storage.local.get(VER_KEY);
    const upgraded = !!got[VER_KEY] && got[VER_KEY] !== cur;
    await chrome.storage.local.set({ [VER_KEY]: cur });

    // 该函数会被序列化后注入页面，必须完全自包含
    const clean = function () {
      try {
        document.querySelectorAll('[id^="ojh-"]').forEach(function (el) { el.remove(); });
        document.querySelectorAll('style').forEach(function (s) {
          if (s.textContent && s.textContent.indexOf('#ojh-fab') !== -1) s.remove();
        });
        delete window.__ojhGuard;
        delete window.__ojhInjected;
      } catch (e) {}
      return true;
    };

    // 探活：能应答说明该页面的 content script 还能用
    function alive(tabId) {
      return Promise.race([
        chrome.tabs.sendMessage(tabId, { type: '__ojh_ping' })
          .then(function (r) { return !!(r && r.ok); })
          .catch(function () { return false; }),
        new Promise(function (res) { setTimeout(function () { res(true); }, 2000); }),
      ]);
    }

    async function reinject(tabId) {
      const tries = [
        { allFrames: true, matchOriginAsFallback: true },
        { allFrames: true },
        {},
      ];
      for (const opt of tries) {
        try {
          const target = Object.assign({ tabId: tabId }, opt);
          await chrome.scripting.executeScript({ target: target, func: clean });
          await chrome.scripting.executeScript({ target: target, files: ['content.js'] });
          return true;   // 注入成功，不用再降级重试
        } catch (e) { /* 换下一组参数重试 */ }
      }
      return false;
    }

    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
      if (!t || typeof t.id !== 'number') continue;
      if (t.url && !/^https?:/i.test(t.url)) continue;   // 跳过 chrome:// / edge:// 等
      if (!upgraded && await alive(t.id)) continue;      // 旧脚本还活着就不动它
      await reinject(t.id);
    }
  } catch (_) {}
})();

/* ===== 新版本检查（对比 GitHub 仓库里的 manifest.json）===== */
const UPDATE_KEY = 'ojh_update_info';
/* 多源兜底：部分网络/加速器会把 raw.githubusercontent.com 解析到本机回环地址，
   Chrome 的私有网络访问限制会直接拦掉，所以优先走 CDN 镜像 */
const MANIFEST_SOURCES = [
  'https://cdn.jsdelivr.net/gh/Drench-Moon/AI_ware@main/Prompt_coding/manifest.json',
  'https://fastly.jsdelivr.net/gh/Drench-Moon/AI_ware@main/Prompt_coding/manifest.json',
  'https://raw.githubusercontent.com/Drench-Moon/AI_ware/main/Prompt_coding/manifest.json',
];
const API_LATEST = 'https://api.github.com/repos/Drench-Moon/AI_ware/releases/latest';
const RELEASE_URL = 'https://github.com/Drench-Moon/AI_ware/releases/latest';
const RELEASE_ZIP = 'https://github.com/Drench-Moon/AI_ware/releases/latest/download/Prompt_coding.zip';

function cmpVer(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

async function fetchRemoteVersion() {
  for (const url of MANIFEST_SOURCES) {
    try {
      const resp = await fetch(url + '?t=' + Date.now(), { cache: 'no-store' });
      if (!resp.ok) continue;
      const j = await resp.json();
      if (j && j.version) return String(j.version);
    } catch (_) {}
  }
  try {
    const resp = await fetch(API_LATEST + '?t=' + Date.now(), {
      cache: 'no-store',
      headers: { 'Accept': 'application/vnd.github+json' },
    });
    if (resp.ok) {
      const j = await resp.json();
      if (j && j.tag_name) return String(j.tag_name).replace(/^v/, '');
    }
  } catch (_) {}
  return null;
}

async function checkForUpdate() {
  try {
    const remoteVersion = await fetchRemoteVersion();
    if (!remoteVersion) return null;
    const local = chrome.runtime.getManifest().version;
    const info = {
      local,
      latest: remoteVersion,
      hasUpdate: cmpVer(remoteVersion, local) > 0,
      url: RELEASE_URL,
      zipUrl: RELEASE_ZIP,
      checkedAt: Date.now(),
    };
    await chrome.storage.local.set({ [UPDATE_KEY]: info });
    return info;
  } catch (_) {
    return null; // 访问不了 GitHub（如校园网无代理）时静默失败
  }
}

chrome.runtime.onStartup.addListener(() => { checkForUpdate(); });
chrome.alarms.onAlarm.addListener(a => { if (a.name === 'ojh_update') checkForUpdate(); });

function buildEndpoint(baseUrl) {
  let s = (baseUrl || '').trim();
  while (s.endsWith('/')) s = s.slice(0, -1);
  if (s.endsWith('/chat/completions')) return s;
  if (/\/(v\d+|api\/v\d+|compatible-mode\/v\d+|paas\/v\d+)$/.test(s)) return s + '/chat/completions';
  return s + '/v1/chat/completions';
}

function buildPrompt(payload, cfg) {
  const modeText = {
    study: '请先给出解题思路，再给出完整代码。',
    code:  '请直接给出完整可提交的代码，代码前用一两句话点明算法。',
    hint:  '请不要给出完整代码，只给出分步提示、关键观察和易错点，让我自己实现。'
  }[payload.mode || cfg.mode || 'study'];
  const language = payload.language || cfg.language || 'C++17';
  const langLine = '【目标语言】' + language;
  const modeLine = '【输出要求】' + modeText;
  const titleLine = '【题目名称】' + (payload.title || '（未提供）');
  const lines = [
    '你是一个算法竞赛教练。下面是一道在线评测题目，请用中文回答。',
    '',
    '【硬性要求】',
    '1. 这是纯问答任务：不要读写任何文件，不要执行任何命令，不要使用任何工具，不要提交代码。',
    '2. 代码必须是完整可提交的版本，不要省略、不要写"此处省略"。',
    '3. 严格按给定格式输出，不要输出与题目无关的寒暄。',
    '',
    langLine, modeLine,
    '',
    '【输出格式】',
    '## 思路',
    '（关键观察、算法选择、正确性要点、时间与空间复杂度）',
    '',
    '## 代码',
    '（一个代码块，包含完整程序，关键处写中文注释）',
    '',
    '## 边界与易错点',
    '（3~5 条，针对这道题）',
    '',
    titleLine,
    '',
    '【题目描述】',
    payload.problem || '',
  ];
  return lines.join('\n');
}

async function callModel(cfg, prompt) {
  if (!cfg.apiKey) throw Object.assign(new Error('尚未配置 API Key — 请点工具栏扩展图标填写'), { code: 'NO_API_KEY' });
  const url = buildEndpoint(cfg.baseUrl);
  const body = JSON.stringify({
    model: cfg.model,
    messages: [
      { role: 'system', content: '你是算法竞赛教练，回答准确、简洁、代码可直接提交。' },
      { role: 'user', content: prompt },
    ],
    stream: false,
    temperature: 0.2,
    max_tokens: 8192,
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs || 120000);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey,
      },
      body,
      signal: controller.signal,
    });
    const raw = await resp.text();
    let data;
    try { data = JSON.parse(raw); } catch (_) {
      throw new Error('模型返回非 JSON：' + raw.slice(0, 300));
    }
    if (!resp.ok) {
      const msg = (data && data.error && (data.error.message || JSON.stringify(data.error))) || raw.slice(0, 300);
      throw Object.assign(new Error('模型接口 ' + resp.status + '：' + msg), { code: 'API_ERROR' });
    }
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) throw new Error('模型返回内容为空');
    return content;
  } finally {
    clearTimeout(timer);
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;
  (async () => {
    try {
      const cfg = await chrome.storage.local.get(Object.keys(DEFAULT_CONFIG));
      if (msg.type === 'OJ_CHAT') {
        const prompt = buildPrompt(msg.payload, cfg);
        const answer = await callModel(cfg, prompt);
        sendResponse({ ok: true, answer });
      } else if (msg.type === 'OJ_UPDATE_INFO') {
        const fresh = await checkForUpdate();
        if (fresh) { sendResponse({ ok: true, info: fresh }); return; }
        const stored = (await chrome.storage.local.get(UPDATE_KEY))[UPDATE_KEY];
        sendResponse({ ok: true, info: stored || null });
      } else if (msg.type === 'OJ_TEST') {
        const answer = await callModel(cfg, (msg.payload && msg.payload.prompt) || '只回复ok');
        sendResponse({ ok: true, answer });
      } else {
        sendResponse({ ok: false, error: '未知消息类型' });
      }
    } catch (err) {
      sendResponse({ ok: false, error: err.message || String(err), code: err.code });
    }
  })();
  return true;
});

/* ===== chrome.commands 扩展级快捷键（最高优先级，即使页面 stopImmediatePropagation 也拦不住）=====
   发消息给当前活动 tab 的 content script，content script 收到后走 fire() 执行。
   注意：manifest 里的键位是固定默认值，用户改了快捷键后旧默认键不该再生效，
   所以这里先比对 chrome.storage 里的当前设置，被改过就忽略该命令。 */
const CMD_DEFAULTS = {
  ojh_generate: { field: 'hotkey', alt: true, ctrl: false, shift: false, key: 'g' },
  ojh_copy: { field: 'copyHotkey', alt: true, ctrl: false, shift: false, key: 'c' },
  ojh_toggle: { field: 'toggleHotkey', alt: true, ctrl: false, shift: false, key: 's' },
  ojh_reset: { field: 'resetHotkey', alt: true, ctrl: false, shift: false, key: 'r' },
};
chrome.commands.onCommand.addListener(async (cmd) => {
  const actionMap = { ojh_generate: 'generate', ojh_copy: 'copysilent', ojh_toggle: 'toggle', ojh_reset: 'reset' };
  const action = actionMap[cmd];
  if (!action) return;
  const d = CMD_DEFAULTS[cmd];
  try {
    const st = (await chrome.storage.local.get('ojh_settings_v1'))['ojh_settings_v1'];
    const cur = st && st[d.field];
    if (cur) {
      // 被改成"无"或与默认键位不同 → 说明用户自定义过，不再用默认键触发
      const diff = cur.key === 'none' || cur.key !== d.key ||
        !!cur.alt !== d.alt || !!cur.ctrl !== d.ctrl || !!cur.shift !== d.shift;
      if (diff) return;
    }
  } catch (_) { /* 读不到设置就按默认键处理 */ }
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: '__ojh_cmds_action', action });
  } catch (_) { /* tab 可能没有 content script，比如 chrome:// 页面，静默忽略 */ }
});