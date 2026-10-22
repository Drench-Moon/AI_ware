// ===== 平台预设 =====
const PRESETS = {
  deepseek:    { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  siliconflow: { baseUrl: 'https://api.siliconflow.cn/v1', model: 'Qwen/Qwen2.5-32B-Instruct' },
  moonshot:    { baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  qwen:        { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  volc:        { baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-pro-32k-250115' },
  tencent:     { baseUrl: 'https://hunyuan.tencentcloudapi.com/v1', model: 'hunyuan-lite' },
  zhipu:       { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4' },
  openrouter:  { baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
  local:       { baseUrl: 'http://127.0.0.1:11434/v1', model: 'deepseek-coder' },
  custom:      { baseUrl: '', model: '' },
};

function $(id){ return document.getElementById(id); }
function setStatus(msg, ok){
  const el = $('status');
  el.textContent = msg;
  el.className = 'status ' + (ok ? 'ok' : 'err');
}

// 加载已有配置
(async () => {
  const cfg = await chrome.storage.local.get(null);
  if (cfg.baseUrl) $('baseUrl').value = cfg.baseUrl;
  if (cfg.model)   $('model').value   = cfg.model;
  if (cfg.apiKey)  $('apiKey').value  = cfg.apiKey;
  if (cfg.language) $('language').value = cfg.language;
  for (const [key, p] of Object.entries(PRESETS)) {
    if (key !== 'custom' && p.baseUrl === cfg.baseUrl && p.model === cfg.model) {
      $('preset').value = key; break;
    }
  }
})();

// 选平台 → 自动填
$('preset').addEventListener('change', e => {
  const p = PRESETS[e.target.value];
  if (p) {
    $('baseUrl').value = p.baseUrl;
    $('model').value   = p.model;
  }
});

// 保存
$('save').addEventListener('click', async () => {
  const baseUrl = $('baseUrl').value.trim();
  const apiKey  = $('apiKey').value.trim();
  const model   = $('model').value.trim();
  const language = $('language').value;
  if (!apiKey)  { setStatus('请填 API Key', false); return; }
  if (!baseUrl) { setStatus('请填接口地址', false); return; }
  if (!model)   { setStatus('请填模型名', false); return; }
  await chrome.storage.local.set({ baseUrl, apiKey, model, language });
  setStatus('✅ 已保存配置', true);
});

// 版本显示 + 更新提示
(async () => {
  try {
    document.querySelector('.head p').textContent += ' · v' + chrome.runtime.getManifest().version;
    const r = await chrome.runtime.sendMessage({ type: 'OJ_UPDATE_INFO' });
    if (r && r.ok && r.info && r.info.hasUpdate) {
      const s = $('status');
      s.textContent = '🎉 发现新版本 v' + r.info.latest + '，点这里去更新';
      s.className = 'status ok';
      s.style.cursor = 'pointer';
      s.style.textDecoration = 'underline';
      s.onclick = () => window.open(r.info.url, '_blank');
    }
  } catch (_) {}
})();

// 测试连通性
$('test').addEventListener('click', async () => {
  setStatus('⏳ 测试中...', false);
  try {
    const baseUrl = $('baseUrl').value.trim();
    const apiKey  = $('apiKey').value.trim();
    const model   = $('model').value.trim();
    if (!baseUrl || !apiKey || !model) { setStatus('请先填完配置', false); return; }
    await chrome.storage.local.set({ baseUrl, apiKey, model });
    const resp = await chrome.runtime.sendMessage({
      type: 'OJ_TEST',
      payload: { prompt: '只回复ok两个字' }
    });
    if (resp && resp.ok) setStatus('✅ 连通成功：' + (resp.answer || '').slice(0, 60), true);
    else setStatus('❌ ' + ((resp && resp.error) || '未知错误'), false);
  } catch(e) {
    setStatus('❌ ' + e.message, false);
  }
});
