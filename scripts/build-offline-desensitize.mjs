/**
 * build-offline-desensitize.mjs
 * -------------------------------------------------------------
 * 把站内「文档脱敏」工具打包成一份**离线单文件 HTML**，供下载后双击使用。
 *
 * 为什么单独做一个离线版：
 *   脱敏处理的往往是最敏感的东西（客户名单、合同、病历）。站内版虽然也是纯前端、
 *   不上传服务器，但用的人未必愿意相信一个网页 —— 于是干脆把整个工具打包给他们，
 *   断网也能跑，连"有没有偷偷发请求"都不用猜。
 *
 * 关键约束：**算法必须与站内同源**。
 *   引擎直接从 src/tools/doc-desensitize/desensitize.ts 经 esbuild 打包，
 *   不复制、不重写。站内改了规则，重跑本脚本即可同步，避免两份规则各走各的
 *   （这正是财金工具历史上踩过的坑）。
 *
 * 用法：node scripts/build-offline-desensitize.mjs
 * 产物：public/download/mokakit-doc-desensitize.html  →  站点 /download/ 可直接下载
 */
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const ROOT = path.resolve('.');
const ENTRY = path.join(ROOT, 'src', 'tools', 'doc-desensitize', 'desensitize.ts');
const OUT_DIR = path.join(ROOT, 'public', 'download');
const OUT_FILE = path.join(OUT_DIR, 'mokakit-doc-desensitize.html');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

/** 把 TS 引擎打成浏览器可直接执行的 IIFE，挂到 window.DES */
async function buildEngine() {
  const res = await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    format: 'iife',
    globalName: 'DES',
    target: ['es2018'],
    minify: true,
    write: false,
    legalComments: 'none',
  });
  return res.outputFiles[0].text;
}

/* ----------------------------- 前端应用 ----------------------------- */
/**
 * 这段会被塞进 <script> 里，不能用模板字符串外层的反引号，
 * 所以整体写成普通函数再 toString()，与 build-workbench 的做法一致。
 */
function frontend() {
  const D = window.DES;
  const $ = (id) => document.getElementById(id);
  const DEFAULT_ON = [
    'mobile', 'idcard', 'bankcard', 'email', 'name', 'address',
    'ip', 'plate', 'creditCode',
  ];
  const MODES = [
    { key: 'partial', label: '保留首尾', desc: '138****5678，还能看出是什么类型' },
    { key: 'full', label: '全部打码', desc: '整段变星号，信息量最少' },
    { key: 'label', label: '换成类型标签', desc: '【手机号】，读的人知道这里有个号' },
    { key: 'code', label: '换成稳定代号', desc: '手机号#a3f2，同一号码每次代号一致' },
  ];
  const SAMPLE = [
    '客户信息登记表',
    '',
    '姓名：张伟，联系电话 13812345678，邮箱 zhangwei@example.com',
    '身份证号：110101199003071233',
    '收货地址：北京市朝阳区建国路88号SOHO现代城3栋1201室',
    '公司统一社会信用代码：91110000MA01ABCD2X',
    '办公座机 010-88886666，车牌 京A12345',
    '联系QQ 12345678，微信号：zhangwei_2026',
    '服务器地址 192.168.10.24',
  ].join('\n');

  const state = {
    input: '',
    enabled: DEFAULT_ON.slice(),
    extraNames: [],
    customs: [],
    whitelist: '',
    mode: 'partial',
    maskChar: '*',
    perType: true,
    head: 3,
    tail: 4,
    showRaw: false,
    srcName: '',
  };

  /* ---- 渲染类型勾选 ---- */
  $('types').innerHTML = D.RULES.map(
    (r) => `<label class="pick">
      <input type="checkbox" data-type="${r.type}" ${state.enabled.includes(r.type) ? 'checked' : ''}>
      <span><b>${r.label}</b><i>${r.hint}</i></span>
    </label>`,
  ).join('');

  $('extras').innerHTML = D.EXTRA_NAME_RULES.map(
    (r) => `<label class="pick">
      <input type="checkbox" data-extra="${r.key}">
      <span><b>${r.label}</b><i>${r.hint}</i></span>
    </label>`,
  ).join('');

  $('modes').innerHTML = MODES.map(
    (m) => `<button type="button" class="mode${state.mode === m.key ? ' on' : ''}" data-mode="${m.key}">
      <b>${m.label}</b><i>${m.desc}</i>
    </button>`,
  ).join('');

  /* ---- 事件 ---- */
  $('types').addEventListener('change', (e) => {
    const t = e.target.dataset.type;
    if (!t) return;
    state.enabled = e.target.checked
      ? state.enabled.concat([t])
      : state.enabled.filter((x) => x !== t);
    run();
  });

  $('extras').addEventListener('change', (e) => {
    const k = e.target.dataset.extra;
    if (!k) return;
    state.extraNames = e.target.checked
      ? state.extraNames.concat([k])
      : state.extraNames.filter((x) => x !== k);
    run();
  });

  $('modes').addEventListener('click', (e) => {
    const btn = e.target.closest('.mode');
    if (!btn) return;
    state.mode = btn.dataset.mode;
    Array.from(document.querySelectorAll('.mode')).forEach((b) => {
      b.classList.toggle('on', b.dataset.mode === state.mode);
    });
    syncInputs();
    run();
  });

  $('input').addEventListener('input', (e) => {
    state.input = e.target.value;
    state.srcName = '';
    run();
  });

  ['maskChar', 'head', 'tail'].forEach((k) => {
    $(k).addEventListener('input', (e) => {
      state[k] = k === 'maskChar' ? e.target.value : Math.max(0, Number(e.target.value) || 0);
      run();
    });
  });
  $('perType').addEventListener('change', (e) => {
    state.perType = e.target.checked;
    syncInputs();
    run();
  });
  $('whitelist').addEventListener('input', (e) => {
    state.whitelist = e.target.value;
    run();
  });
  $('showRaw').addEventListener('change', (e) => {
    state.showRaw = e.target.checked;
    renderHits();
  });

  $('addRule').addEventListener('click', () => {
    state.customs.push({ pattern: '', flags: 'g' });
    renderCustoms();
    run();
  });

  $('pick').addEventListener('click', () => $('file').click());
  $('file').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.input = String(reader.result || '');
      state.srcName = f.name;
      $('input').value = state.input;
      run();
    };
    reader.readAsText(f, 'utf-8');
    e.target.value = '';
  });

  $('sample').addEventListener('click', () => {
    state.input = SAMPLE;
    state.srcName = '';
    $('input').value = SAMPLE;
    run();
  });

  $('clear').addEventListener('click', () => {
    state.input = '';
    state.srcName = '';
    $('input').value = '';
    run();
  });

  $('copy').addEventListener('click', async () => {
    if (!lastText) return;
    try {
      await navigator.clipboard.writeText(lastText);
      flash($('copy'), '已复制');
    } catch {
      // file:// 下 clipboard 可能被拒，退回复选框方案
      const ta = document.createElement('textarea');
      ta.value = lastText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      flash($('copy'), '已复制');
    }
  });

  $('download').addEventListener('click', () => {
    if (!lastText) return;
    const base = state.srcName
      ? state.srcName.replace(/\.[^.]+$/, '')
      : 'desensitized';
    const blob = new Blob([lastText], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = base + '.desensitized.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    flash($('download'), '已下载');
  });

  function flash(btn, text) {
    const old = btn.textContent;
    btn.textContent = text;
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = old;
      btn.disabled = false;
    }, 1400);
  }

  function renderCustoms() {
    const wrap = $('customs');
    wrap.innerHTML = state.customs.map(
      (c, i) => `<div class="rule">
        <input type="text" class="mono" placeholder="正则，例如 EMP-\\d{6}" value="${escAttr(c.pattern)}" data-cp="${i}">
        <input type="text" class="mono flags" placeholder="flags" value="${escAttr(c.flags)}" data-cf="${i}">
        <button type="button" class="del" data-cd="${i}">删除</button>
      </div>`,
    ).join('');
    wrap.querySelectorAll('[data-cp]').forEach((el) => {
      el.addEventListener('input', () => {
        state.customs[Number(el.dataset.cp)].pattern = el.value;
        run();
      });
    });
    wrap.querySelectorAll('[data-cf]').forEach((el) => {
      el.addEventListener('input', () => {
        state.customs[Number(el.dataset.cf)].flags = el.value;
        run();
      });
    });
    wrap.querySelectorAll('[data-cd]').forEach((el) => {
      el.addEventListener('click', () => {
        state.customs.splice(Number(el.dataset.cd), 1);
        renderCustoms();
        run();
      });
    });
  }

  function escAttr(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function syncInputs() {
    $('head').disabled = state.perType || state.mode !== 'partial';
    $('tail').disabled = state.perType || state.mode !== 'partial';
    $('maskChar').disabled = state.mode !== 'partial';
  }

  let lastText = '';
  let lastHits = [];

  function run() {
    const customOk = state.customs.filter((c) => c.pattern.trim());
    const res = D.desensitize(state.input, {
      enabled: state.enabled,
      extraNames: state.extraNames,
      whitelist: state.whitelist.split(/[\n,，]/),
      customPatterns: customOk,
      mode: state.mode,
      maskChar: state.maskChar || '*',
      perType: state.perType,
      head: state.head,
      tail: state.tail,
    });
    lastText = res.text;
    lastHits = res.hits;

    $('result').textContent = res.text || '';
    $('result').className = res.text ? 'out' : 'out empty';

    const total = Object.values(res.counts).reduce((a, b) => a + b, 0);
    $('stats').innerHTML =
      `<span class="badge primary">命中 ${total} 处</span>` +
      Object.keys(res.counts)
        .map((k) => `<span class="badge">${k} ${res.counts[k]}</span>`)
        .join('') +
      (total === 0 && state.input.trim() ? '<span class="badge warn">没识别到敏感信息，可多开几种类型</span>' : '');

    $('copy').disabled = !res.text;
    $('download').disabled = !res.text;
    renderHits();
  }

  function renderHits() {
    const box = $('hits');
    if (!lastHits.length) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    $('hitTitle').textContent = '命中明细（' + lastHits.length + ' 条）';
    const raw = state.showRaw;
    $('rawWarn').hidden = !raw;
    $('rawTh').hidden = !raw;
    $('hitBody').innerHTML = lastHits
      .slice(0, 300)
      .map(
        (h) =>
          `<tr><td>${h.label}</td><td class="mono">${escAttr(h.masked)}</td>${
            raw ? `<td class="mono dim">${escAttr(h.raw)}</td>` : ''
          }</tr>`,
      )
      .join('');
  }

  renderCustoms();
  syncInputs();
  run();
}

/* ----------------------------- 组装 HTML ----------------------------- */
function shell(engine) {
  const css = `
:root{
  --bg:#f7f4ef; --card:#fff; --line:#e6ded2; --text:#2c2620; --muted:#7d7166;
  --brand:#8b5e3c; --accent:#c98a4b; --ok:#3f8f5e; --warn:#b5722a; --err:#b4483c;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);line-height:1.55;
  font-family:-apple-system,'PingFang SC','Microsoft YaHei',Segoe UI,system-ui,sans-serif;
  padding:24px 16px 60px}
.wrap{max-width:900px;margin:0 auto}
header{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;
  flex-wrap:wrap;border-bottom:2px solid var(--brand);padding-bottom:14px;margin-bottom:20px}
h1{font-size:22px;margin:0;color:var(--brand);letter-spacing:.3px}
.sub{color:var(--muted);font-size:13px;margin-top:4px}
.offline{background:#eef6f0;color:var(--ok);border:1px solid #cfe4d6;
  font-size:11.5px;font-weight:700;padding:3px 10px;border-radius:99px;white-space:nowrap}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;
  padding:16px 18px;margin-bottom:14px;box-shadow:0 1px 2px rgba(90,70,50,.04)}
.lbl{font-size:13.5px;font-weight:600;display:block;margin-bottom:8px}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
button{font:inherit;cursor:pointer;border-radius:9px;border:1px solid var(--line);
  background:#fdfbf8;color:var(--text);padding:6px 13px;font-size:13px;transition:.15s}
button:hover:not(:disabled){border-color:var(--accent);color:var(--brand)}
button:disabled{opacity:.42;cursor:not-allowed}
button.primary{background:var(--brand);border-color:var(--brand);color:#fff}
button.primary:hover:not(:disabled){background:#7a5234;color:#fff}
textarea,input[type=text],input[type=number]{font:inherit;width:100%;color:var(--text);
  background:#fff;border:1px solid var(--line);border-radius:10px;padding:9px 11px;font-size:13.5px}
textarea{resize:vertical}
textarea:focus,input:focus{outline:2px solid rgba(201,138,75,.28);border-color:var(--accent)}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.hint{color:var(--muted);font-size:12px;margin:6px 0 0}
.grid{display:grid;gap:8px;grid-template-columns:repeat(2,1fr);margin-top:10px}
@media(max-width:640px){.grid{grid-template-columns:1fr}}
.pick{display:flex;gap:9px;align-items:flex-start;border:1px solid var(--line);
  border-radius:11px;padding:9px 11px;cursor:pointer;background:#fdfbf8}
.pick:hover{border-color:var(--accent)}
.pick input{margin-top:3px;accent-color:var(--brand)}
.pick b{display:block;font-size:13px;font-weight:600}
.pick i{display:block;font-style:normal;font-size:11.5px;color:var(--muted);line-height:1.4}
.modes{display:grid;gap:8px;grid-template-columns:repeat(2,1fr);margin-top:10px}
@media(max-width:640px){.modes{grid-template-columns:1fr}}
.mode{text-align:left;padding:10px 12px;background:#fdfbf8}
.mode b{display:block;font-size:13px}
.mode i{display:block;font-style:normal;font-size:11.5px;color:var(--muted);margin-top:2px}
.mode.on{border-color:var(--brand);background:#fbf3ea;box-shadow:0 0 0 1px var(--brand) inset}
.three{display:grid;gap:10px;grid-template-columns:repeat(3,1fr);margin-top:10px}
@media(max-width:640px){.three{grid-template-columns:1fr}}
.three label{font-size:12.5px;color:var(--muted)}
.badges{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0}
.badge{background:#f1ebe2;color:var(--muted);font-size:11.5px;padding:2px 9px;border-radius:99px}
.badge.primary{background:var(--brand);color:#fff}
.badge.warn{background:#fbf0dd;color:var(--warn)}
.out{background:#fbf8f3;border:1px solid var(--line);border-radius:10px;padding:12px;
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;
  white-space:pre-wrap;word-break:break-all;max-height:340px;overflow:auto;margin:0}
.out.empty{color:var(--muted)}
.hits{margin-top:14px}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th{text-align:left;color:var(--muted);font-weight:600;padding:6px 8px;border-bottom:1px solid var(--line)}
td{padding:6px 8px;border-bottom:1px dashed var(--line)}
.dim{color:var(--muted)}
.warnline{color:var(--err);font-size:12px;margin:6px 0}
.note{color:var(--muted);font-size:12px;line-height:1.65;margin-top:4px}
.foot{color:var(--muted);font-size:11.5px;text-align:center;margin-top:26px;line-height:1.7}
.rule{display:flex;gap:8px;margin-bottom:8px;align-items:center}
.rule .flags{width:78px;flex:none}
.rule .del{flex:none;color:var(--err)}
`;
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>文档脱敏 · MokaKit 离线版</title>
<meta name="robots" content="noindex">
<style>${css}</style>
</head>
<body>
<div class="wrap">
  <header>
    <div>
      <h1>文档脱敏 · 离线版</h1>
      <div class="sub">识别并打码姓名、手机号、身份证、银行卡等 13 类敏感信息</div>
    </div>
    <span class="offline">离线运行 · 不联网 · 不上传</span>
  </header>

  <section class="card">
    <div class="row" style="justify-content:space-between">
      <span class="lbl" style="margin:0">待脱敏文档</span>
      <div class="row">
        <button type="button" id="pick">导入文件</button>
        <button type="button" id="sample">填入示例</button>
        <button type="button" id="clear">清空</button>
      </div>
    </div>
    <textarea id="input" rows="9" class="mono" style="margin-top:10px"
      placeholder="粘贴合同、名单、日志等含敏感信息的文本，或点「导入文件」选一个 txt / csv / json"></textarea>
    <input type="file" id="file" accept=".txt,.md,.csv,.json,.log,.xml,.yml,.yaml,text/plain" hidden>
  </section>

  <section class="card">
    <span class="lbl">识别哪些信息</span>
    <div class="grid" id="types"></div>
  </section>

  <section class="card">
    <span class="lbl">姓名识别增强（误报会变多）</span>
    <div class="grid" id="extras"></div>
  </section>

  <section class="card">
    <div class="row" style="justify-content:space-between">
      <span class="lbl" style="margin:0">自定义正则（可选）</span>
      <button type="button" id="addRule">+ 加一条</button>
    </div>
    <div id="customs" style="margin-top:10px"></div>
    <p class="hint">内部工号、订单号这类自家格式，可以自己写一条规则。</p>
  </section>

  <section class="card">
    <span class="lbl">白名单（命中含这些词就不处理，每行或用逗号分隔）</span>
    <textarea id="whitelist" rows="2" placeholder="例如：4008200001、客服电话"></textarea>
  </section>

  <section class="card">
    <span class="lbl">脱敏方式</span>
    <div class="modes" id="modes"></div>
    <div class="three">
      <label>掩码字符<input type="text" id="maskChar" class="mono" maxlength="2" value="*"></label>
      <label>保留前几位<input type="number" id="head" min="0" max="20" value="3"></label>
      <label>保留后几位<input type="number" id="tail" min="0" max="20" value="4"></label>
    </div>
    <label class="pick" style="margin-top:10px">
      <input type="checkbox" id="perType" checked>
      <span><b>按类型自动决定保留位数</b><i>手机号 3/4、身份证 6/4、银行卡 4/4</i></span>
    </label>
  </section>

  <section class="card">
    <div class="row" style="justify-content:space-between">
      <span class="lbl" style="margin:0">脱敏结果</span>
      <div class="row">
        <button type="button" id="copy" disabled>复制结果</button>
        <button type="button" id="download" class="primary" disabled>下载 txt</button>
      </div>
    </div>
    <div class="badges" id="stats"></div>
    <pre id="result" class="out empty" style="margin-top:12px">脱敏后的内容会实时显示在这里</pre>

    <div class="hits" id="hits" hidden>
      <div class="row" style="justify-content:space-between">
        <span class="lbl" id="hitTitle" style="margin:0">命中明细</span>
        <label class="pick" style="padding:4px 9px;border:none;background:none">
          <input type="checkbox" id="showRaw">
          <span><b style="font-size:12px">显示原文对照</b></span>
        </label>
      </div>
      <p class="warnline" id="rawWarn" hidden>原文含未脱敏信息，截图或投屏前记得关掉这个开关。</p>
      <div style="max-height:260px;overflow:auto;margin-top:6px">
        <table>
          <thead><tr><th>类型</th><th>脱敏后</th><th id="rawTh" hidden>原文</th></tr></thead>
          <tbody id="hitBody"></tbody>
        </table>
      </div>
    </div>

    <p class="note">
      识别靠正则与校验位（身份证校验位、银行卡 Luhn），漏报和误报都可能存在，
      正式外发前请人工过一遍。本页不发起任何网络请求，断网可用。
    </p>
  </section>

  <p class="foot">
    MokaKit 摩卡工具箱 · 文档脱敏离线版 v__VERSION__<br>
    与站内 <span class="mono">mokakit.com/tools/doc-desensitize/</span> 使用同一套识别规则
  </p>
</div>
<script>${engine}</script>
<script>(${frontend.toString()})();</script>
</body>
</html>`;
}

const engine = await buildEngine();
const html = shell(engine).replace(/__VERSION__/g, PKG.version);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, html, 'utf8');

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
console.log('✅ 离线版已生成 → ' + OUT_FILE);
console.log('   文件大小: ' + kb + ' KB（引擎 ' + (Buffer.byteLength(engine, 'utf8') / 1024).toFixed(1) + ' KB）');
console.log('   站点路径: /download/mokakit-doc-desensitize.html');
