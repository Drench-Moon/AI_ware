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

/* ===== 新版本检查（对比 GitHub 仓库里的 manifest.json）===== */
const UPDATE_KEY = 'ojh_update_info';
const REMOTE_MANIFEST = 'https://raw.githubusercontent.com/Drench-Moon/AI_ware/main/Prompt_coding/manifest.json';
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

async function checkForUpdate() {
  try {
    const resp = await fetch(REMOTE_MANIFEST + '?t=' + Date.now(), { cache: 'no-store' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const remote = await resp.json();
    const local = chrome.runtime.getManifest().version;
    const info = {
      local,
      latest: remote.version || local,
      hasUpdate: cmpVer(remote.version || local, local) > 0,
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
