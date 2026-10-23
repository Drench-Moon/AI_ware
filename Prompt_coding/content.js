/* OJ 助手 · 扩展 content script */
(function(){if(window.__ojhGuard)return;window.__ojhGuard=true;
  if (window.__ojhInjected) { console.log('[OJ] 已注入，跳过'); return; }
  window.__ojhInjected = true;

  const HISTORY_KEY = 'oj_helper_history_v1';
  const MAX_HISTORY = 50;

  const style = document.createElement('style');
  style.textContent = `
    #ojh-fab{position:fixed;left:16px;bottom:76px;z-index:2147483647;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;font-size:20px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(37,99,235,.4);user-select:none;font-family:system-ui;touch-action:none}
    #ojh-fab:hover{transform:scale(1.06)}
    #ojh-drawer{position:fixed;top:0;left:0;width:min(480px,90vw);height:100vh;z-index:2147483647;background:#fff;color:#0f172a;box-shadow:4px 0 24px rgba(0,0,0,.2);transform:translateX(-102%);transition:transform .25s;display:flex;flex-direction:column;font-family:system-ui,'Microsoft YaHei',sans-serif;font-size:14px;min-width:320px;min-height:300px}
    #ojh-drawer.ojh-open{transform:translate3d(var(--ojh-x,0),var(--ojh-y,0),0) !important;transition:none}
    #ojh-drawer.ojh-open.from-left{transform:translate3d(0,0,0)}
    #ojh-resize{position:absolute;right:0;bottom:0;width:24px;height:24px;cursor:nwse-resize;background:linear-gradient(135deg,transparent 50%,#2563eb 50%,#2563eb 60%,transparent 60%,transparent 70%,#2563eb 70%,#2563eb 80%,transparent 80%);z-index:2}
    #ojh-hd{cursor:move;user-select:none}
    #ojh-drawer.ojh-minimized .ojh-body{display:none}
    #ojh-drawer.ojh-minimized{height:auto;transform:translate3d(var(--ojh-x,0),var(--ojh-miny,calc(100vh - 42px)),0) !important}
    #ojh-drawer *{box-sizing:border-box}
    .ojh-hd{background:linear-gradient(135deg,#1e40af,#2563eb);color:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between}
    .ojh-hd h3{margin:0;font-size:15px}
    .ojh-body{flex:1;overflow-y:auto;padding:14px}
    .ojh-close{background:rgba(255,255,255,.15);border:none;color:#fff;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:16px}
    .ojh-field{margin-bottom:10px}
    .ojh-field label{display:block;font-size:12px;color:#64748b;margin-bottom:3px}
    .ojh-field input,.ojh-field select,.ojh-field textarea{width:100%;padding:7px 9px;border:1px solid #e2e8f0;border-radius:6px;font:inherit;background:#fff}
    .ojh-field textarea{min-height:200px;resize:vertical;font-family:ui-monospace,Consolas,monospace;font-size:12px;line-height:1.5}
    .ojh-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .ojh-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
    .ojh-btn{padding:7px 12px;border-radius:6px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;font-weight:500}
    .ojh-btn.primary{background:#2563eb;color:#fff;border-color:#2563eb}
    .ojh-btn.primary:hover{background:#1d4ed8}
    .ojh-btn.danger{color:#dc2626;border-color:#fecaca}
    .ojh-hint{background:#eff6ff;border-left:3px solid #2563eb;color:#1e40af;padding:8px 10px;border-radius:4px;font-size:12px;margin:10px 0}
    .ojh-result{margin-top:12px;border:1px dashed #e2e8f0;border-radius:6px;padding:10px;background:#fafbfc;font-size:12px;max-height:40vh;overflow-y:auto}
    .ojh-tabs{display:flex;border-bottom:1px solid #e2e8f0;margin-bottom:10px}
    .ojh-tab{padding:7px 14px;cursor:pointer;font-size:13px;color:#64748b;border-bottom:2px solid transparent}
    .ojh-tab.active{color:#2563eb;border-bottom-color:#2563eb;font-weight:600}
    .ojh-pane{display:none}.ojh-pane.active{display:block}
    .ojh-hist{border-bottom:1px solid #e2e8f0;padding:8px 4px;cursor:pointer}
    .ojh-hist:hover{background:#f8fafc}
    .ojh-hist-t{font-size:13px;font-weight:600}
    .ojh-hist-m{font-size:11px;color:#64748b;margin-top:2px}
    .ojh-pill{position:fixed;top:8px;left:8px;z-index:2147483646;background:#22c55e;color:#fff;font-size:11px;padding:3px 10px;border-radius:10px;font-family:ui-monospace,monospace;box-shadow:0 1px 3px rgba(0,0,0,.2);pointer-events:none}
    #ojh-toast{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-10px);background:#0f172a;color:#fff;padding:9px 18px;border-radius:6px;font-size:13px;opacity:0;transition:.25s;z-index:2147483647;pointer-events:none}
    #ojh-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
    #ojh-update-banner{display:flex;align-items:center;justify-content:space-between;gap:8px;background:linear-gradient(90deg,#f59e0b,#f97316);color:#fff;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;flex-shrink:0}
    #ojh-update-banner:hover{filter:brightness(1.07)}
    #ojh-update-banner .ojh-up-btn{background:#fff;color:#b45309;border-radius:6px;padding:3px 12px;font-weight:700;white-space:nowrap;cursor:pointer;flex-shrink:0}
    #ojh-update-banner .ojh-up-btn:hover{background:#fff7ed}
    #ojh-fab .ojh-dot{position:absolute;top:-2px;right:-2px;width:14px;height:14px;background:#ef4444;border:2px solid #fff;border-radius:50%;pointer-events:none}
  `;
  (document.head||document.documentElement).appendChild(style);

  const fab = document.createElement('div');
  fab.id = 'ojh-fab'; fab.textContent = 'OJ'; fab.title = 'OJ 助手 (Alt+G)';
  document.documentElement.appendChild(fab);

  const drawer = document.createElement('div');
  drawer.id = 'ojh-drawer';
  drawer.innerHTML = `
    <div class="ojh-hd"><h3>OJ 助手 · 注入版</h3><button class="ojh-close" id="ojh-close">✕</button></div>
    <div class="ojh-body">
      <div class="ojh-tabs">
        <div class="ojh-tab active" data-pane="gen">抓题生成</div>
        <div class="ojh-tab" data-pane="hist">历史记录</div>
      </div>
      <div class="ojh-pane active" id="ojh-pane-gen">
        <div class="ojh-field"><label>题目名称</label><input id="ojh-title" placeholder="可选"></div>
        <div class="ojh-row">
          <div class="ojh-field"><label>语言</label><select id="ojh-lang"><option>C++17</option><option>C++20</option><option>Python3</option><option>Java</option><option>Go</option><option>Rust</option></select></div>
          <div class="ojh-field"><label>模式</label><select id="ojh-mode"><option value="study">先思路后代码</option><option value="code">只要代码</option><option value="hint">只给提示</option></select></div>
        </div>
        <div class="ojh-field"><label>题目描述（自动抓取，可编辑）</label><textarea id="ojh-problem"></textarea></div>
        <div class="ojh-actions">
          <button class="ojh-btn primary" id="ojh-auto">🚀 直接生成（不切屏）</button>
          <button class="ojh-btn" id="ojh-gen">只复制 Prompt</button>
          <button class="ojh-btn" id="ojh-refetch">重新抓取</button>
        </div>
        <div class="ojh-hint" id="ojh-hint" style="display:none"><b>已复制！</b><br>如果走本地 API，答案会直接在下方面板生成；如果切到其他 AI 对话框，粘 Prompt 拿回答后粘回下方点"确认保存"。</div>
        <div class="ojh-field" style="margin-top:12px"><label>AI 返回的回答</label><textarea id="ojh-answer" style="min-height:140px"></textarea></div>
        <div class="ojh-actions">
          <button class="ojh-btn primary" id="ojh-save">确认保存并渲染</button>
          <button class="ojh-btn" id="ojh-skip">跳过</button>
        </div>
        <div class="ojh-result" id="ojh-result">还没有结果。</div>
      </div>
      <div class="ojh-pane" id="ojh-pane-hist">
        <input id="ojh-hq" placeholder="搜索" style="width:100%;padding:6px 8px;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:8px">
        <div id="ojh-histlist"></div>
        <button class="ojh-btn danger" id="ojh-ch" style="margin-top:8px">清空历史</button>
      </div>
    </div>
    <div id="ojh-resize" title="拖动调整大小"></div>
  `;
  document.documentElement.appendChild(drawer);

  const toast = document.createElement('div'); toast.id = 'ojh-toast';
  document.documentElement.appendChild(toast);

  // ===== 新版本检查：有更新时 OJ 按钮加红点 + 面板顶部显示横幅 =====
  (function checkUpdate(){
    if(!chrome.runtime||!chrome.runtime.sendMessage) return;
    try{
      chrome.runtime.sendMessage({type:'OJ_UPDATE_INFO'}, r=>{
        const le=chrome.runtime.lastError; if(le||!r||!r.ok||!r.info||!r.info.hasUpdate) return;
        const info=r.info;
        if(!fab.querySelector('.ojh-dot')){const dot=document.createElement('span');dot.className='ojh-dot';fab.appendChild(dot)}
        fab.title='发现新版本 v'+info.latest+'，点击查看';
        if(drawer.querySelector('#ojh-update-banner')) return;
        const b=document.createElement('div');
        b.id='ojh-update-banner';
        b.innerHTML='<span>🎉 新版本 v'+esc(info.latest)+' 已发布（当前 v'+esc(info.local)+'）</span><span class="ojh-up-btn">点此更新</span>';
        b.onclick=()=>window.open(info.url||'https://github.com/Drench-Moon/AI_ware','_blank');
        const upBtn=b.querySelector('.ojh-up-btn');
        if(upBtn)upBtn.onclick=ev=>{
          ev.stopPropagation();
          const a=document.createElement('a');
          a.href=info.zipUrl||'https://github.com/Drench-Moon/AI_ware/archive/refs/heads/main.zip';
          document.body.appendChild(a);a.click();a.remove();
        };
        drawer.insertBefore(b,drawer.firstChild);
      });
    }catch(_){}
  })();

  function showToast(m){toast.textContent=m;toast.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>toast.classList.remove('show'),2200)}
  function copyText(t){return new Promise(r=>{navigator.clipboard.writeText(t).then(()=>{showToast('已复制');r(true)}).catch(()=>{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');showToast('已复制');r(true)}catch(_){showToast('复制失败');r(false)}document.body.removeChild(a)})})}
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
  async function loadH(){try{return JSON.parse((await chrome.storage.local.get(HISTORY_KEY))[HISTORY_KEY]||'[]')}catch(_){return[]}}
  async function saveH(h){await chrome.storage.local.set({[HISTORY_KEY]: JSON.stringify(h)}).catch(()=>{})}

  const WEAK=/^(输入描述|输入格式|输出描述|输出格式|样例输入\s*\d*|样例输出\s*\d*|示例\s*\d*|Input|Output|Sample Input\s*\d*|Sample Output\s*\d*|Examples?|Notes?|Constraints?|数据范围)$/i;
  const STRONG=/^(题目描述|题目背景|Problem Statement|Description)$/i;
  function tx(el){return (el.innerText||el.textContent||'').replace(/\s+/g,' ').trim()}
  function gather(doc){
    const a=[];
    let root, walker;
    try{
      if(doc && typeof doc.createTreeWalker==='function'){
        root=doc.body||doc;
        walker=doc.createTreeWalker(root,NodeFilter.SHOW_ELEMENT);
      }else if(doc && doc.nodeType===1){
        root=doc;
        walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT);
      }else{return a}
    }catch(e){return a}
    let n;
    while(n=walker.nextNode()){
      const t=n.tagName;if(!t)continue;
      if(/^(H[1-6]|STRONG|B|TH|TD|SPAN|DIV|P|LABEL|DT)$/.test(t)){
        const s=tx(n);if(!s)continue;
        if(STRONG.test(s)){a.push({el:n,strong:true});continue}
        if(WEAK.test(s))a.push({el:n,strong:false})
      }
    }
    return a
  }
  function lca(a,b){const s=new Set();let x=a;while(x){s.add(x);x=x.parentElement}let y=b;while(y){if(s.has(y))return y;y=y.parentElement}return null}
  function expand(n){let c=n;for(let i=0;i<6;i++){if(!c.parentElement)break;if(tx(c).length>=150&&c.parentElement)break;const a=gather(c);let w=0,s=0;a.forEach(x=>{if(x.strong)s++;else w++});if((w>=2||s>=1)&&tx(c).length>=150)break;c=c.parentElement}return c}
  function extractTitle(d){for(let i=1;i<=5;i++){const h=d.querySelector('h'+i);if(h&&tx(h))return tx(h)}return d.title}
  function extractLeetCode(){try{if(!/leetcode\.(cn|com)$/.test(location.hostname))return null;let text='';const desc=document.querySelector('[data-track-load="description_content"]');if(desc&&tx(desc).length>60)text=tx(desc);if(!text){const d=document.querySelector('div[data-cy="description-content"]');if(d&&tx(d).length>60)text=tx(d)}let sig='';const vl=document.querySelector('.monaco-editor .view-lines');if(vl)sig=(vl.innerText||'').replace(/\u00a0/g,' ').split('\n').filter(s=>s.trim()).slice(0,40).join('\n').trim();if(!text&&!sig)return null;let out=text;if(sig)out+=(out?'\n\n':'')+'【代码模板/函数签名】\n'+sig;return {title:extractTitle(document),text:out}}catch(_){return null}}
  function extract(){const lc=extractLeetCode();if(lc&&lc.text&&lc.text.length>=60)return lc;const docs=[document];document.querySelectorAll('iframe').forEach(f=>{try{if(f.contentDocument && typeof f.contentDocument.createTreeWalker==='function')docs.push(f.contentDocument)}catch(_){}});let best=null,bs=0;docs.forEach(doc=>{const a=gather(doc);if(!a.length)return;const st=a.filter(x=>x.strong),wk=a.filter(x=>!x.strong);let r;if(wk.length>=2){r=wk[0].el;for(let i=1;i<wk.length;i++)r=lca(r,wk[i].el)}else if(st.length)r=st[0].el;else r=a[0].el;if(!r)return;r=expand(r);const t=tx(r);if(t.length<80)return;const ag=gather(r);let s=0,w=0;ag.forEach(x=>{if(x.strong)s++;else w++});const sc=t.length+s*50+w*30;if(sc>bs){bs=sc;best={title:extractTitle(doc),text:t}}});if(best)return best;let f=null,fl=0;document.querySelectorAll('main,article,section,[role=main],.problem,.content,.description').forEach(e=>{const t=tx(e);if(t.length>fl){fl=t.length;f=e}});if(f)return{title:extractTitle(document),text:tx(f)};return{title:document.title,text:document.body.innerText}}
  function buildPrompt(p){const m={study:'先给「## 思路」（关键观察、算法、正确性、复杂度），再给「## 代码」（完整可提交，带中文注释），最后给「## 边界与易错点」（3~5 条）。',code:'直接给完整可提交的代码，带必要中文注释，不要解释。',hint:'只给分步提示（每步一句话），不要给完整代码。'}[p.mode]||'';const isCpp=p.language.startsWith('C++');const FN=/class\s+Solution\b|def\s+\w+\s*\(\s*self\b/.test(p.problem||'');const langRule=isCpp?(FN?`这是「函数式题目」（LeetCode 风格）。必须用 ${p.language} 标准 C++ 语法：只给出完整的 class Solution 类并保持函数签名、方法名、参数、返回类型完全不变；不要写 main 函数；不要任何 cin/cout/printf/scanf 输入输出；不要自行构造测试数据；禁止 #include <bits/stdc++.h>，通常不需要任何 #include（平台已有默认环境）。`:`必须严格遵守 ${p.language} 现代 C++ 风格：

【输入输出模板】（必须照这个写，禁止 printf/scanf/puts/gets）
\`\`\`cpp
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;            // 读取整数
    vector<int> a(n);
    for(int i=0;i<n;i++) cin >> a[i];  // 读取数组
    cout << ans << endl;   // 输出答案
    return 0;
}
\`\`\`

【禁止清单】出现以下任意一个都算错误答案：
- printf / scanf / puts / gets / getchar
- #include <stdio.h> / #include <cstdio>
- %d %lld %s 等 C 风格格式符

【必须使用】cin、cout、std::string、std::vector、std::map、std::set 等 C++ STL

【头文件】禁止 #include <bits/stdc++.h> 万能头（编译很慢），必须按需引入：用 vector 引 <vector>，用 string 引 <string>，用 sort/min/max 引 <algorithm>，用 map/set 引 <map>/<set>，用 queue/stack 引 <queue>/<stack>，用 pair 引 <utility>，用 sqrt/pow 引 <cmath>，用 INT_MAX 引 <climits>

【精度控制】需要保留 N 位小数时，必须 #include <iomanip>，然后写：
    cout << fixed << setprecision(N) << x << endl;
禁止用 printf("%.Nf", x) 这种 C 风格精度控制

【换行】输出换行必须用 endl，禁止在字符串里写 "\\n" 换行`):(FN?`使用 ${p.language} 标准语法，只给出完整的类/函数实现（保持函数签名不变），不要 main 函数，不要读输入输出。`:`必须使用 ${p.language} 标准语法。`);return `你是一名算法竞赛教练。请根据下面的题目，用${p.language}给出解答。\n\n${langRule}\n\n${m}\n\n要求：${FN?'代码只包含类定义（不要 main 函数、不要读输入输出），平台会自动调用它评测；':'代码必须能直接提交评测，用标准输入输出；'}不要读写文件，不要执行命令，不要调用工具；用 Markdown 格式回答。\n\n【题目】${p.title||'(未命名)'}\n\n${p.problem}`}

  const $=id=>drawer.querySelector(id);
  const title=$('#ojh-title'),lang=$('#ojh-lang'),mode=$('#ojh-mode'),problem=$('#ojh-problem'),answer=$('#ojh-answer'),result=$('#ojh-result'),hint=$('#ojh-hint');
  function refetch(){const e=extract();title.value=e.title||'';problem.value=e.text||'';showToast('已抓取 '+problem.value.length+' 字')}
  $('#ojh-refetch').onclick=refetch;
  async function generate(){refetch();await new Promise(r=>setTimeout(r,300));if(problem.value.length<20){showToast('题目太短，请先抓取');return}const p={title:title.value.trim(),language:lang.value,mode:mode.value,problem:problem.value.trim()};window.__ojhCur=p;await copyText(buildPrompt(p));hint.style.display='block';answer.value=''}
  $('#ojh-gen').onclick=generate;
  $('#ojh-auto').onclick=async()=>{
    if(window.__ojhBusy){showToast('正在生成中，请稍候');return}
    window.__ojhBusy=true;
    const btn=$('#ojh-auto');
    refetch();
    const p={title:title.value.trim(),language:lang.value,mode:mode.value,problem:problem.value.trim()};
    if(p.problem.length<20){showToast('题目太短，请先抓取');return}
    window.__ojhCur=p;
    btn.disabled=true;btn.textContent='生成中…';hint.style.display='block';
    hint.innerHTML='<b>正在调用模型…</b><br>结果会直接显示在下方，全程不用切窗口。';
    try{
      const d=await (async ()=>{
  for(let attempt=0; attempt<3; attempt++){
    try{
      if(!chrome.runtime||!chrome.runtime.sendMessage) throw new Error('EXT_RELOAD');
      return await new Promise((res,rej)=>{
        try{chrome.runtime.sendMessage({type:'OJ_CHAT',payload:p},r=>{const le=chrome.runtime.lastError; if(le) rej(new Error(le.message)); else res(r||{});});}catch(e){rej(e);}
      });
    }catch(e){
      const isConnectErr = (e.message||'').includes('Receiving end')||(e.message||'').includes('Could not establish');
      if(isConnectErr && attempt<2){ await new Promise(r=>setTimeout(r,600)); continue; }
      if(e.message==='EXT_RELOAD'){ showToast('扩展已更新，请刷新答题页 (F5)'); throw new Error('扩展连接丢失'); }
      throw e;
    }
  }
})();
      if(!d.ok)throw new Error(d.error||'未知错误');
      // 强制把 C 风格 IO 转成 C++ 风格（模型不听话时兜底）
      let fixedAnswer = d.answer;
      if(p.language.startsWith('C++')){
        // 先记录 printf 里用到的最高精度（%.Nf），后面统一加 setprecision
        let maxPrec = 0;
        (fixedAnswer.match(/%\.\d+f/g)||[]).forEach(m=>{const v=parseInt(m.slice(2,-1)); if(v>maxPrec) maxPrec=v;});
        fixedAnswer = fixedAnswer
          .replace(/#include\s*<stdio\.h>/g,'#include <iostream>')
          .replace(/#include\s*<cstdio>/g,'#include <iostream>')
          // 处理带精度的 printf("%.7f\n", x) → cout << fixed << setprecision(7) << x << "\n"
          .replace(/\bprintf\s*\(\s*"([^"]*%\.\d+f[^"]*)"\s*,\s*([^)]+)\)/g,(m,fmt,args)=>{
            const precM = fmt.match(/%\.(\d+)f/);
            const prec = precM ? precM[1] : '6';
            const argList = args.split(',').map(s=>s.trim()).filter(s=>s);
            const mainArg = argList[0]||'ans';
            let out = 'cout << fixed << setprecision(' + prec + ') << ' + mainArg;
            if(fmt.includes('\\n')) out += ' << endl';
            else if(fmt.includes(' ')) out += ' << " "';
            return out;
          })
          // 普通 scanf → cin
          .replace(/\bscanf\s*\(\s*"([^"]*)"\s*,\s*&?(\w+)\s*\)/g,'cin >> $2')
          // 普通 printf（无精度）→ cout
          .replace(/\bprintf\s*\(\s*"([^"]*%[dfsu][^"]*)"\s*,\s*([^)]+)\)/g,(m,fmt,args)=>{
            const argList = args.split(',').map(s=>s.trim()).filter(s=>s);
            if(argList.length===0) return m;
            let out = 'cout';
            // 把格式串拆成文本段 + %x 占位
            const segs = fmt.split(/%[dfsu]/);
            let ai = 0;
            for(let i=0;i<segs.length;i++){
              const seg = segs[i].replace(/\\n/g,'').trim();
              if(seg) out += ' << "' + seg + '"';
              if(ai < argList.length){ out += ' << ' + argList[ai]; ai++; }
            }
            if(fmt.includes('\\n')) out += ' << endl';
            return out;
          })
          // 纯文本 printf("hello\n") → cout << "hello" << endl
          .replace(/\bprintf\s*\(\s*"([^"%]*)"\s*\)/g,(m,s)=>{const t=s.replace(/\\n$/,'');return 'cout << "'+t+'"'+(s.endsWith('\\n')?' << endl':'')})
          .replace(/\bputs\s*\(\s*(\w+)\s*\)/g,'cout << $1 << endl')
          .replace(/\bputchar\s*\(\s*(['\w][^)]*)\s*\)/g,'cout << $1');
        // '\n' → endl（换行统一用 endl，模型不听话时兜底）
        fixedAnswer = fixedAnswer.replace(/<<\s*'\\n'/g,'<< endl').replace(/<<\s*"\\n"/g,'<< endl');
        // bits/stdc++.h 万能头 → 按需拆解成用到的头文件
        if(/bits\/stdc\+\+\.h/.test(fixedAnswer)){
          const hs=new Set(['iostream','vector','string','algorithm']);
          if(/\bmap\s*</.test(fixedAnswer))hs.add('map');
          if(/\bset\s*</.test(fixedAnswer))hs.add('set');
          if(/\bunordered_map\s*</.test(fixedAnswer))hs.add('unordered_map');
          if(/\bunordered_set\s*</.test(fixedAnswer))hs.add('unordered_set');
          if(/\b(priority_queue|queue)\s*</.test(fixedAnswer))hs.add('queue');
          if(/\bstack\s*</.test(fixedAnswer))hs.add('stack');
          if(/\bdeque\s*</.test(fixedAnswer))hs.add('deque');
          if(/\bpair\s*</.test(fixedAnswer)||/\bmake_pair\b/.test(fixedAnswer))hs.add('utility');
          if(/\b(accumulate|iota|partial_sum)\b/.test(fixedAnswer))hs.add('numeric');
          if(/\b(sqrt|pow|fabs|floor|ceil|round|fmod)\b/.test(fixedAnswer))hs.add('cmath');
          if(/\b(INT_MAX|INT_MIN|LLONG_MAX|LLONG_MIN)\b/.test(fixedAnswer))hs.add('climits');
          if(/\b(function|greater|less)\s*</.test(fixedAnswer))hs.add('functional');
          if(/setprecision/.test(fixedAnswer))hs.add('iomanip');
          const inc=[...hs].map(h=>'#include <'+h+'>').join('\n');
          fixedAnswer=fixedAnswer.replace(/#include\s*<bits\/stdc\+\+\.h>[^\n]*\n?/,inc+'\n');
        }
        // 如果用到 setprecision 但没 iomanip，自动补 include
        if(fixedAnswer.includes('setprecision') && !fixedAnswer.includes('iomanip')){
          fixedAnswer = fixedAnswer.replace(/(#include\s*<iostream>)/,'$1\n#include <iomanip>');
        }
        // 去重重复的 #include（如 bits 拆解后与模型自带的重复）
        {const seen=new Set();fixedAnswer=fixedAnswer.split('\n').filter(line=>{const mm=line.match(/^\s*#include\s*[<"]([^>"]+)[>"]/);if(!mm)return true;if(seen.has(mm[1]))return false;seen.add(mm[1]);return true}).join('\n')}
        // 去重 using namespace std;（模型有时会输出多份）
        {let seenUns=false;fixedAnswer=fixedAnswer.replace(/^[ \t]*using namespace std;[ \t]*\r?\n?/gm,m=>{if(seenUns)return '';seenUns=true;return m})}
        // 如果没有 iostream 但有 main（且不是函数式题目），加 using namespace std
        const FNmode=/class\s+Solution\b|def\s+\w+\s*\(\s*self\b/.test(p.problem||'');
        if(!FNmode && !fixedAnswer.includes('iostream') && fixedAnswer.includes('int main')){
          fixedAnswer = fixedAnswer.replace(/(#include[^\n]*\n)/,'$1#include <iostream>\nusing namespace std;\n');
        }
        // 提示用户做了替换
        if(fixedAnswer !== d.answer){
          showToast('已自动把 printf/scanf 转成 cin/cout');
        }
      }
      answer.value=fixedAnswer;result.innerHTML=renderMd(fixedAnswer);
      const h=await loadH();if(Array.isArray(h)){h.unshift({id:Date.now().toString(36),time:Date.now(),...p,result:fixedAnswer});while(h.length>MAX_HISTORY)h.pop();saveH(h)}
      hint.innerHTML='<b>生成完成 ✅</b><br>代码块右上角有「复制」，复制后粘到右侧编辑器提交即可。';
      showToast('生成完成');
    }catch(e){hint.innerHTML='<b>生成失败：</b>'+esc(e.message); showToast('生成失败：'+e.message.slice(0,30))}
    finally{btn.disabled=false;btn.textContent='🚀 直接生成（不切屏）';window.__ojhBusy=false}
  };
  const btnCopy=drawer.querySelector('#ojh-copy');if(btnCopy)btnCopy.onclick=async()=>{refetch();await new Promise(r=>setTimeout(r,300));if(problem.value.length<20){showToast('题目太短');return}const p={title:title.value.trim(),language:lang.value,mode:mode.value,problem:problem.value.trim()};await copyText(buildPrompt(p))};
  $('#ojh-save').onclick=async ()=>{const t=answer.value.trim();if(t.length<30){showToast('回答太短');return}if(!window.__ojhCur){showToast('先生成 Prompt');return}const h=await loadH();if(Array.isArray(h)){h.unshift({id:Date.now().toString(36),time:Date.now(),...window.__ojhCur,result:t});while(h.length>MAX_HISTORY)h.pop();saveH(h)}result.innerHTML=renderMd(t);showToast('已保存并渲染');renderHist()};
  $('#ojh-skip').onclick=()=>{answer.value='';hint.style.display='none';showToast('已跳过')};
  $('#ojh-close').onclick=()=>drawer.classList.remove('ojh-open');
  const storage={get:async k=>{try{return(await chrome.storage.local.get(k))[k]}catch(_){return null}},set:async(k,v)=>{try{await chrome.storage.local.set({[k]:v})}catch(_){}}};
  fab.ondblclick=()=>{drawer.style.removeProperty('--ojh-x');drawer.style.removeProperty('--ojh-y');drawer.style.removeProperty('--ojh-miny');drawer.classList.remove('ojh-minimized','ojh-open');savePos({});fab.style.removeProperty('left');fab.style.removeProperty('top');fab.style.removeProperty('bottom');storage.set(FAB_POS_KEY,null).catch(()=>{});showToast('已重置位置')};
  fab.onclick=()=>{if(fabMoved){fabMoved=false;return}const wasOpen=drawer.classList.contains('ojh-open'); if(wasOpen){refetch()} else {applyOpen(); refetch()}};
  // ===== OJ 按钮可拖动（位置自动保存，双击按钮复位）=====
  const FAB_POS_KEY='ojh_fab_pos_v1';
  storage.get(FAB_POS_KEY).then(p=>{if(p&&typeof p.x==='number'){fab.style.left=p.x+'px';fab.style.top=p.y+'px';fab.style.bottom='auto'}}).catch(()=>{});
  let fabDrag=null,fabMoved=false;
  fab.addEventListener('pointerdown',e=>{fabDrag={mx:e.clientX,my:e.clientY,x:fab.getBoundingClientRect().left,y:fab.getBoundingClientRect().top};fab.setPointerCapture(e.pointerId)});
  fab.addEventListener('pointermove',e=>{
    if(!fabDrag)return;
    const dx=e.clientX-fabDrag.mx,dy=e.clientY-fabDrag.my;
    if(!fabMoved&&Math.abs(dx)+Math.abs(dy)<6)return;
    fabMoved=true;
    const x=Math.max(0,Math.min(window.innerWidth-fab.offsetWidth,fabDrag.x+dx));
    const y=Math.max(0,Math.min(window.innerHeight-fab.offsetHeight,fabDrag.y+dy));
    fab.style.left=x+'px';fab.style.top=y+'px';fab.style.bottom='auto';
  });
  fab.addEventListener('pointerup',()=>{if(fabDrag&&fabMoved)storage.set(FAB_POS_KEY,{x:parseFloat(fab.style.left)||0,y:parseFloat(fab.style.top)||0}).catch(()=>{});fabDrag=null});
  drawer.querySelectorAll('.ojh-tab').forEach(t=>{t.onclick=()=>{drawer.querySelectorAll('.ojh-tab').forEach(x=>x.classList.remove('active'));drawer.querySelectorAll('.ojh-pane').forEach(x=>x.classList.remove('active'));t.classList.add('active');$('#ojh-pane-'+t.dataset.pane).classList.add('active');if(t.dataset.pane==='hist')renderHist()}});
  $('#ojh-hq').oninput=renderHist;
  $('#ojh-ch').onclick=async ()=>{if(confirm('清空全部历史？')){await chrome.storage.local.remove(HISTORY_KEY);renderHist()}};
  async function renderHist(){let list=await loadH();if(!Array.isArray(list))list=[];const q=$('#ojh-hq').value.trim().toLowerCase();const f=q?list.filter(h=>(h.title||'').toLowerCase().includes(q)||(h.result||'').toLowerCase().includes(q)):list;const c=$('#ojh-histlist');if(!f.length){c.innerHTML='<div style="text-align:center;color:#94a3b8;padding:20px;font-size:12px">暂无历史</div>';return}c.innerHTML=f.map(h=>{const p=(h.result||'').slice(0,100).replace(/[`*_#-]/g,'').replace(/\n/g,' ');const d=new Date(h.time);const ts=(d.getMonth()+1)+'/'+d.getDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');return `<div class="ojh-hist" data-id="${h.id}"><div class="ojh-hist-t">${esc((h.title||'(无标题)').slice(0,30))}</div><div class="ojh-hist-m">${ts} · ${p.slice(0,50)}</div></div>`}).join('');c.querySelectorAll('.ojh-hist').forEach(el=>{el.onclick=()=>{const h=list.find(x=>x.id===el.dataset.id);if(!h)return;title.value=h.title||'';lang.value=h.language||'C++17';mode.value=h.mode||'study';problem.value=h.problem||'';window.__ojhCur={title:h.title,language:h.language,mode:h.mode,problem:h.problem};result.innerHTML=renderMd(h.result||'');drawer.querySelector('[data-pane="gen"]').click()}})}

  function renderMd(md){const lines=md.replace(/\r\n?/g,'\n').split('\n');let out='';let inCode=false,buf=[],inList=false,lt='';const cl=()=>{if(inList){out+='</'+lt+'>';inList=false}};const cc=()=>{if(!inCode)return;out+='<div style="position:relative"><button class="ojh-cp" data-code="'+encodeURIComponent(buf.join('\n'))+'" style="position:absolute;top:6px;right:6px;background:#334155;color:#fff;border:none;border-radius:4px;padding:2px 8px;font-size:11px;cursor:pointer">复制</button><pre style="background:#1e293b;color:#e2e8f0;padding:10px;border-radius:6px;overflow-x:auto;font-size:12px;margin:6px 0"><code>'+esc(buf.join('\n'))+'</code></pre></div>';inCode=false;buf=[]};lines.forEach(ln=>{if(ln.startsWith('```')){cl();if(!inCode){inCode=true;buf=[]}else cc();return}if(inCode){buf.push(ln);return}if(/^\d+\.\s+/.test(ln)){if(!inList||lt!=='ol'){cl();out+='<ol>';inList=true;lt='ol'}out+='<li>'+inline(esc(ln.replace(/^\d+\.\s+/,'')))+'</li>';return}if(/^[-*]\s+/.test(ln)){if(!inList||lt!=='ul'){cl();out+='<ul>';inList=true;lt='ul'}out+='<li>'+inline(esc(ln.replace(/^[-*]\s+/,'')))+'</li>';return}cl();if(ln.startsWith('#')){const m=ln.match(/^(#{1,3})\s+(.+)/);const l=m?m[1].length:1;const tx2=m?m[2]:ln.replace(/^#+\s*/,'');out+='<h'+l+' style="margin:12px 0 6px;font-size:'+(18-l*2)+'px">'+esc(tx2)+'</h'+l+'>';return}if(ln.trim()==='')return;out+='<p style="margin:4px 0">'+inline(esc(ln))+'</p>'});cc();cl();return out}
  function inline(s){return s.replace(/`([^`]+)`/g,'<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:11px">$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>')}

    /* ==== 拖动 + 缩放 + 持久化 ==== */
  const STORAGE_KEY = 'ojh_pos_v1';
  async function loadPos(){try{return await storage.get(STORAGE_KEY)||null}catch(_){return null}}
  async function savePos(pos){try{await storage.set(STORAGE_KEY, pos)}catch(_){}}

  // 打开时：如果有保存的位置就用保存位置，否则保持从左边滑出
  function applyOpen(){
    drawer.classList.remove('ojh-open'); void drawer.offsetHeight;
    drawer.classList.add('ojh-open','from-left');
    loadPos().then(pos=>{
      if(!pos) return;
      if(pos.x!==undefined){drawer.style.setProperty('--ojh-x', pos.x+'px')}
      if(pos.y!==undefined){drawer.style.setProperty('--ojh-y', pos.y+'px')}
      if(pos.w) drawer.style.width = pos.w+'px';
      if(pos.h) drawer.style.height = pos.h+'px';
      drawer.classList.remove('from-left');
    });
  }

  let dragState=null;
  const hdDrag=drawer.querySelector('.ojh-hd'); if(hdDrag) hdDrag.addEventListener('pointerdown', e=>{
    if(e.target.closest('#ojh-close')) return;
    if(e.detail===2){ // 双击标题栏 = 最小化/还原
      if(drawer.classList.contains('ojh-minimized')){drawer.classList.remove('ojh-minimized');savePos({x:parseFloat(drawer.style.getPropertyValue('--ojh-x'))||0,y:parseFloat(drawer.style.getPropertyValue('--ojh-y'))||0,w:drawer.offsetWidth,h:drawer.offsetHeight})}
      else{drawer.classList.add('ojh-minimized');const y=parseFloat(drawer.style.getPropertyValue('--ojh-y'))||0;drawer.style.setProperty('--ojh-miny', Math.min(y, window.innerHeight-40)+'px');savePos({x:parseFloat(drawer.style.getPropertyValue('--ojh-x'))||0,y:y,w:drawer.offsetWidth,h:40})}
      return;
    }
    const r=drawer.getBoundingClientRect();
    const tx=parseFloat(drawer.style.getPropertyValue('--ojh-x'))||0;
    const ty=parseFloat(drawer.style.getPropertyValue('--ojh-y'))||0;
    dragState={type:'drag', mx:e.clientX, my:e.clientY, tx, ty, rect:r};
    drawer.style.transition='none';
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
  });

  let resizeState=null;
  const rs=drawer.querySelector('#ojh-resize'); if(rs) rs.addEventListener('pointerdown', e=>{
    const r=drawer.getBoundingClientRect();
    resizeState={type:'resize', mx:e.clientX, my:e.clientY, w:r.width, h:r.height};
    drawer.style.transition='none';
    e.preventDefault(); e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId);
  });

  document.addEventListener('pointermove', e=>{
    if(dragState){
      const dx=e.clientX-dragState.mx, dy=e.clientY-dragState.my;
      let x=dragState.tx+dx, y=dragState.ty+dy;
      // 夹边界：不能出屏幕
      const r=drawer.getBoundingClientRect();
      const w=Math.max(320, r.width), h=Math.max(300, r.height);
      x=Math.max(-w+60, Math.min(window.innerWidth-30, x));
      y=Math.max(0, Math.min(window.innerHeight-30, y));
      drawer.style.setProperty('--ojh-x', x+'px');
      drawer.style.setProperty('--ojh-y', y+'px');
    }
    if(resizeState){
      const dx=e.clientX-resizeState.mx, dy=e.clientY-resizeState.my;
      const w=Math.max(320, Math.min(window.innerWidth, resizeState.w+dx));
      const h=Math.max(300, Math.min(window.innerHeight, resizeState.h+dy));
      drawer.style.width=w+'px';
      drawer.style.height=h+'px';
    }
  });

  document.addEventListener('pointerup', ()=>{
    if(dragState||resizeState){
      savePos({
        x:parseFloat(drawer.style.getPropertyValue('--ojh-x'))||0,
        y:parseFloat(drawer.style.getPropertyValue('--ojh-y'))||0,
        w:drawer.offsetWidth,
        h:drawer.offsetHeight
      });
      dragState=null; resizeState=null;
    }
  });

  document.addEventListener('keydown',e=>{if(e.altKey&&e.key.toLowerCase()==='g'&&!e.repeat&&!e.repeat){e.preventDefault();applyOpen();refetch();$('#ojh-auto').click()}});
  drawer.addEventListener('click',e=>{const b=e.target.closest('.ojh-cp');if(b)copyText(decodeURIComponent(b.dataset.code))});

  const pill=document.createElement('div');pill.className='ojh-pill';pill.textContent='OJ 注入 OK';document.documentElement.appendChild(pill);setTimeout(()=>pill.remove(),3000);
  // 根据用户配置的 API 更新标签（默认"AI 返回的回答"）
  (async ()=>{
    try{
      const cfg = await chrome.storage.local.get(['model','baseUrl']);
      const model = (cfg.model||'').split('/').pop() || 'AI';
      $('label[for="ojh-answer"], label[id$="-answer"]').forEach(el=>{});
      const lbls = document.querySelectorAll('label');
      for(const l of lbls){
        if(l.textContent.includes('AI 返回的回答')){
          l.textContent = cfg.model ? (cfg.model + ' 返回的回答') : 'AI 返回的回答';
          break;
        }
      }
    }catch(_){}
  })();
    console.log('[OJ] 注入成功。点击左下角 OJ 按钮或按 Alt+G。');
  showToast('OJ 助手已就绪，按 Alt+G 使用');
})();

  window.addEventListener('resize', ()=>{
    const r=drawer.getBoundingClientRect();
    let x=parseFloat(drawer.style.getPropertyValue('--ojh-x'))||0;
    let y=parseFloat(drawer.style.getPropertyValue('--ojh-y'))||0;
    const w=drawer.offsetWidth, h=drawer.offsetHeight;
    if(r.right>window.innerWidth) x=window.innerWidth-w;
    if(r.bottom>window.innerHeight) y=window.innerHeight-h;
    if(r.left<0) x=-Math.min(30, w);
    if(r.top<0) y=0;
    if(x!==parseFloat(drawer.style.getPropertyValue('--ojh-x'))||y!==parseFloat(drawer.style.getPropertyValue('--ojh-y'))){
      drawer.style.setProperty('--ojh-x', x+'px');
      drawer.style.setProperty('--ojh-y', y+'px');
      savePos({x,y,w,h});
    }
  });