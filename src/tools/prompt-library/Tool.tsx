import { useState, useEffect, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/* ============================================================
 * 提示词工坊 = 我的收藏 + 随机生成（合并版）
 * ============================================================ */

interface PromptItem {
  id: string;
  title: string;
  content: string;
  tags: string;
  createdAt: string;
}

const KEY = 'mokakit_prompt_library';

function encodeShare(obj: unknown): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function decodeShare(b64: string): any {
  const bin = atob(b64.trim());
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
}
function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function downloadFile(filename: string, text: string, mime = 'text/markdown') {
  const blob = new Blob([text], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- 随机生成：维度定义 ---------- */
interface Dim {
  id: string;
  label: string;
  enabled: boolean;
  pool: string;
}
const DEFAULT_DIMS: Dim[] = [
  {
    id: 'role',
    label: '角色',
    enabled: true,
    pool: [
      '资深广告文案',
      '毒舌影评人',
      '佛系程序员',
      '戏精历史老师',
      '硬核科普博主',
      '玄学占卜师',
      '社畜嘴替',
      '二次元考据党',
      '杠精辩论冠军',
      '温柔树洞',
      '退休老干部',
      '街头采访记者',
    ].join('\n'),
  },
  {
    id: 'task',
    label: '任务',
    enabled: true,
    pool: [
      '写一段让人忍不住下单的产品卖点',
      '点评一下用户今天的运势',
      '编一个冷到结冰的谐音梗笑话',
      '给甲方画一张不大但管饱的饼',
      '用大白话解释一个听起来很高深的概念',
      '写一段真诚的劝退文案',
      '吐槽一下周一早晨',
      '安利一件你根本买不起的东西',
      '写一封给三年后自己的信',
      '想五个发朋友圈的凡尔赛文案',
      '列一份周末躺平指南',
      '出一套灵魂拷问式面试题',
    ].join('\n'),
  },
  {
    id: 'format',
    label: '格式',
    enabled: true,
    pool: [
      '用不超过 50 个字',
      '写成七言绝句',
      '用 bullet 列表分三点',
      '用小品台词的形式',
      '写成一条朋友圈图文文案',
      '用代码注释的风格',
      '用一封正式邮件的语气',
      '写成分镜脚本',
      '用三句递进式排比',
      '写成产品说明书的口吻',
      '用微博热搜体',
      '用脱口秀段子的节奏',
    ].join('\n'),
  },
  {
    id: 'tone',
    label: '语气',
    enabled: true,
    pool: [
      '阴阳怪气但不失礼貌',
      '一本正经地胡说八道',
      'emo 文学风',
      '霸总口吻',
      '温柔鼓励型',
      '热血中二',
      '丧系躺平',
      '学术严肃',
      '老干部做报告风',
      '深夜电台治愈风',
    ].join('\n'),
  },
  {
    id: 'extra',
    label: '约束',
    enabled: true,
    pool: [
      '全程至少包含一个 emoji',
      '结尾留一个让人细思极恐的开放问题',
      '必须押韵',
      '中途突然切换成英文',
      '加入一句看似无关的名言',
      '用谐音梗收尾',
      '（无额外约束）',
    ].join('\n'),
  },
];

function pickLine(pool: string): string | null {
  const lines = pool.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return null;
  return lines[Math.floor(Math.random() * lines.length)];
}

function buildPrompt(dims: Dim[], keyword: string): string {
  const get = (id: string): string | null => {
    const d = dims.find((x) => x.id === id);
    if (!d || !d.enabled) return null;
    return pickLine(d.pool);
  };
  const role = get('role');
  const task = get('task');
  const format = get('format');
  const tone = get('tone');
  const extra = get('extra');

  let s = '';
  if (role) s += `你是一位${role}。`;
  if (task) {
    s += `请${task}`;
    if (keyword.trim()) s += `（围绕主题「${keyword.trim()}」）`;
    s += '，';
  }
  const reqs: string[] = [];
  if (format) reqs.push(`格式要求：${format}`);
  if (tone) reqs.push(`语气：${tone}`);
  if (extra && !extra.includes('无额外')) reqs.push(`额外约束：${extra}`);
  if (reqs.length) s += reqs.join('；') + '。';
  if (!s) s = '请随便说点什么。';
  return s;
}

export default function PromptLibrary() {
  const [tab, setTab] = useState<'library' | 'dice'>('library');

  /* ---------- 我的收藏 state ---------- */
  const [items, setItems] = useState<PromptItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [toast, setToast] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);

  /* ---------- 随机生成 state ---------- */
  const [dims, setDims] = useState<Dim[]>(() => DEFAULT_DIMS.map((d) => ({ ...d })));
  const [keyword, setKeyword] = useState('');
  const [genText, setGenText] = useState('');
  const [genCopied, setGenCopied] = useState(false);
  const genTimer = useRef<number | undefined>(undefined);

  const flash = (msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(''), 2200);
  };

  /* ---------- 收藏库：读取 / 持久化 ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, loaded]);

  /* ---------- 进入随机生成 Tab 时自动生成一条 ---------- */
  useEffect(() => {
    if (tab === 'dice' && !genText) {
      setGenText(buildPrompt(dims, keyword));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* ---------- 收藏库操作 ---------- */
  const add = (forceTitle?: string, forceContent?: string, forceTags?: string) => {
    const t = forceTitle ?? title;
    const c = forceContent ?? content;
    const tg = forceTags ?? tags;
    if (!t.trim() && !c.trim()) return;
    const item: PromptItem = {
      id: newId(),
      title: t.trim() || '未命名提示词',
      content: c,
      tags: tg.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setItems((prev) => [item, ...prev]);
    if (forceContent === undefined) {
      setTitle('');
      setContent('');
      setTags('');
    }
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const copy = async (item: PromptItem) => {
    await copyText(item.content);
    setCopiedId(item.id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopiedId(null), 1800);
  };

  const share = (item: PromptItem) => {
    const code = encodeShare({
      v: 1,
      type: 'item',
      title: item.title,
      content: item.content,
      tags: item.tags,
    });
    setShareCode(code);
    copyText(code).then(
      () => flash('分享码已复制，把这段发给好友即可导入'),
      () => flash('分享码已生成，可在顶部粘贴框导入'),
    );
  };

  const download = (item: PromptItem) => {
    const md = `# ${item.title}\n\n标签：${item.tags || '（无）'}\n创建：${item.createdAt}\n\n---\n\n${item.content}`;
    const safe = (item.title || 'prompt').replace(/[\\/:*?"<>|]/g, '_');
    downloadFile(`${safe}.md`, md);
    flash('已导出 Markdown 文件');
  };

  const doImport = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    try {
      const data = decodeShare(text);
      if (data.type === 'item' && data.content != null) {
        const item: PromptItem = {
          id: newId(),
          title: data.title || '导入的提示词',
          content: data.content,
          tags: data.tags || '',
          createdAt: new Date().toISOString().slice(0, 10),
        };
        setItems((prev) => [item, ...prev]);
        flash('已导入 1 条提示词');
        setImportText('');
        setShowImport(false);
      } else if (Array.isArray(data.items)) {
        const imported = data.items
          .filter((d: any) => d && d.content != null)
          .map((d: any) => ({
            id: newId(),
            title: d.title || '导入的提示词',
            content: d.content,
            tags: d.tags || '',
            createdAt: new Date().toISOString().slice(0, 10),
          }));
        if (!imported.length) {
          flash('分享码里没有有效提示词');
          return;
        }
        setItems((prev) => [...imported, ...prev]);
        flash(`已导入 ${imported.length} 条提示词`);
        setImportText('');
        setShowImport(false);
      } else {
        flash('分享码格式不支持');
      }
    } catch {
      flash('分享码无法解析，请检查是否复制完整');
    }
  };

  const exportAll = () => {
    if (items.length === 0) {
      flash('收藏库为空，无可导出');
      return;
    }
    downloadFile(
      'mokakit-prompts.json',
      JSON.stringify(items, null, 2),
      'application/json',
    );
    flash('已导出全部为 JSON 文件');
  };

  const onFile = (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
            ? data.items
            : null;
        if (!arr) {
          flash('文件格式不支持');
          return;
        }
        const imported = arr
          .filter((d: any) => d && d.content != null)
          .map((d: any) => ({
            id: newId(),
            title: d.title || '导入的提示词',
            content: d.content,
            tags: d.tags || '',
            createdAt: new Date().toISOString().slice(0, 10),
          }));
        if (!imported.length) {
          flash('文件中没有有效提示词');
          return;
        }
        setItems((prev) => [...imported, ...prev]);
        flash(`已导入 ${imported.length} 条提示词`);
      } catch {
        flash('文件解析失败，请确认是本站导出的 JSON');
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  const filtered = items.filter((i) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (i.title + i.content + i.tags).toLowerCase().includes(q);
  });

  /* ---------- 随机生成操作 ---------- */
  const toggleDim = (id: string) =>
    setDims((prev) => prev.map((d) => (d.id === id ? { ...d, enabled: !d.enabled } : d)));
  const editDim = (id: string, val: string) =>
    setDims((prev) => prev.map((d) => (d.id === id ? { ...d, pool: val } : d)));
  const reroll = () => {
    setGenText(buildPrompt(dims, keyword));
    setGenCopied(false);
  };
  const copyGen = async () => {
    if (!genText) return;
    await copyText(genText);
    setGenCopied(true);
    window.clearTimeout(genTimer.current);
    genTimer.current = window.setTimeout(() => setGenCopied(false), 1800);
  };
  const saveGen = () => {
    if (!genText.trim()) return;
    add(
      '随机生成的提示词 ' + new Date().toLocaleString('zh-CN', { hour12: false }),
      genText,
      '随机生成',
    );
    flash('已保存到收藏库（切到「我的收藏」查看）');
  };

  return (
    <div class="space-y-4">
      {/* Tab 切换 */}
      <div class="flex gap-2">
        <button
          type="button"
          class={`btn btn-sm ${tab === 'library' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('library')}
        >
          我的收藏
        </button>
        <button
          type="button"
          class={`btn btn-sm ${tab === 'dice' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('dice')}
        >
          🎲 随机生成
        </button>
      </div>

      {/* ===================== 我的收藏 ===================== */}
      {tab === 'library' && (
        <div class="space-y-4">
          <div class="rounded-xl bg-base-200 p-4 space-y-3">
            <div class="grid gap-3 sm:grid-cols-2">
              <input
                class="input input-bordered w-full text-sm"
                placeholder="标题（可选）"
                value={title}
                onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
              />
              <input
                class="input input-bordered w-full text-sm"
                placeholder="标签，逗号分隔（可选）"
                value={tags}
                onInput={(e) => setTags((e.target as HTMLInputElement).value)}
              />
            </div>
            <textarea
              class="textarea textarea-bordered w-full h-28 text-sm"
              placeholder="提示词内容……"
              value={content}
              onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
            />
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn btn-primary btn-sm" onClick={() => add()}>
                保存到收藏库
              </button>
              <button
                type="button"
                class="btn btn-outline btn-sm"
                onClick={() => setShowImport((v) => !v)}
              >
                粘贴分享码 / 导入
              </button>
              <button type="button" class="btn btn-ghost btn-sm" onClick={exportAll}>
                导出全部 JSON
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                onClick={() => fileRef.current?.click()}
              >
                导入文件
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                class="hidden"
                onChange={onFile}
              />
            </div>
          </div>

          {showImport && (
            <div class="rounded-xl border border-base-300 p-3 space-y-2">
              <textarea
                class="textarea textarea-bordered w-full h-20 text-xs"
                placeholder="把好友发来的分享码粘贴到这里……"
                value={importText}
                onInput={(e) => setImportText((e.target as HTMLTextAreaElement).value)}
              />
              <div class="flex gap-2">
                <button
                  type="button"
                  class="btn btn-primary btn-xs"
                  onClick={() => doImport(importText)}
                >
                  导入这条分享码
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs"
                  onClick={() => {
                    setImportText('');
                    setShowImport(false);
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {shareCode && (
            <div class="rounded-xl bg-base-100 border border-base-300 p-3 space-y-1">
              <div class="text-xs opacity-60">本条分享码（已复制到剪贴板，也可手动复制发给好友）：</div>
              <textarea
                class="textarea textarea-bordered w-full h-20 text-xs font-mono"
                readOnly
                value={shareCode}
                onFocus={(e) => (e.target as HTMLTextAreaElement).select()}
              />
            </div>
          )}

          <div>
            <input
              class="input input-bordered w-full text-sm"
              placeholder="搜索标题 / 内容 / 标签"
              value={query}
              onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            />
          </div>

          {items.length === 0 ? (
            <p class="text-sm opacity-55 text-center py-6">
              还没有收藏，先在上方添加一条，或到「🎲 随机生成」玩玩。
            </p>
          ) : filtered.length === 0 ? (
            <p class="text-sm opacity-55 text-center py-6">
              没有匹配「{query}」的提示词。
            </p>
          ) : (
            <ul class="space-y-3">
              {filtered.map((i) => (
                <li class="rounded-xl border border-base-300 p-3">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <div class="font-medium truncate">{i.title}</div>
                      {i.tags && (
                        <div class="text-xs opacity-55 mt-0.5">
                          {i.tags
                            .split(',')
                            .map((t) => t.trim())
                            .filter(Boolean)
                            .map((t) => `#${t}`)
                            .join(' ')}
                        </div>
                      )}
                    </div>
                    <div class="flex gap-1 shrink-0 flex-wrap justify-end">
                      <button
                        type="button"
                        class={`btn btn-xs ${copiedId === i.id ? 'btn-success' : 'btn-ghost'}`}
                        onClick={() => copy(i)}
                      >
                        {copiedId === i.id ? '已复制' : '复制'}
                      </button>
                      <button
                        type="button"
                        class="btn btn-xs btn-ghost"
                        onClick={() => download(i)}
                      >
                        下载
                      </button>
                      <button
                        type="button"
                        class="btn btn-xs btn-ghost"
                        onClick={() => share(i)}
                      >
                        分享码
                      </button>
                      <button
                        type="button"
                        class="btn btn-xs btn-ghost text-error"
                        onClick={() => remove(i.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <pre class="mt-2 whitespace-pre-wrap break-words text-sm opacity-80 max-h-40 overflow-auto">
                    {i.content}
                  </pre>
                </li>
              ))}
            </ul>
          )}

          <p class="text-xs opacity-55 leading-relaxed">
            收藏仅保存在当前浏览器本地（localStorage），不会上传服务器，清除浏览器数据会一并清空。
            可通过「分享码」或「导出文件」把提示词带走，再在另一台设备上「粘贴分享码 / 导入文件」恢复。
          </p>
        </div>
      )}

      {/* ===================== 随机生成 ===================== */}
      {tab === 'dice' && (
        <div class="space-y-4">
          <div class="alert alert-warning text-sm leading-relaxed">
            <span>🎲 本功能仅供娱乐与测试，生成结果为随机拼接，不保证有实际效用。</span>
          </div>

          <div class="space-y-2">
            {dims.map((d) => (
              <div class="rounded-xl border border-base-300 p-3 space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    checked={d.enabled}
                    onChange={() => toggleDim(d.id)}
                  />
                  <span class="font-medium text-sm">{d.label}</span>
                  <span class="text-xs opacity-50">（每行一个候选，随机抽选；可自行增删）</span>
                </label>
                <textarea
                  class="textarea textarea-bordered w-full h-20 text-xs font-mono"
                  value={d.pool}
                  disabled={!d.enabled}
                  onInput={(e) => editDim(d.id, (e.target as HTMLTextAreaElement).value)}
                />
              </div>
            ))}
          </div>

          <div class="rounded-xl border border-base-300 p-3 space-y-2">
            <label class="text-sm font-medium">注入主题关键词（可选）</label>
            <input
              class="input input-bordered w-full text-sm"
              placeholder="例如：猫咪、减肥、国产大模型"
              value={keyword}
              onInput={(e) => setKeyword((e.target as HTMLInputElement).value)}
            />
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn btn-primary btn-sm" onClick={reroll}>
              🎲 再抛一次
            </button>
            <button
              type="button"
              class={`btn btn-sm ${genCopied ? 'btn-success' : 'btn-ghost'}`}
              onClick={copyGen}
              disabled={!genText}
            >
              {genCopied ? '已复制' : '复制提示词'}
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              onClick={saveGen}
              disabled={!genText}
            >
              保存到收藏库
            </button>
          </div>

          {genText && (
            <pre class="whitespace-pre-wrap break-words rounded-lg bg-base-200 p-3 text-sm leading-relaxed">
              {genText}
            </pre>
          )}

          <p class="text-xs opacity-55 leading-relaxed">
            勾选/取消维度可控制参与拼接的环节；在文本框里增删候选，就能让随机结果更贴合你的脑洞。
            生成后可一键「保存到收藏库」，在「我的收藏」里统一管理。
          </p>
        </div>
      )}

      {toast && (
        <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-neutral text-neutral-content px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
