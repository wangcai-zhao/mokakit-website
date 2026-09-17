import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

interface Heading {
  level: number;
  text: string;
  slug: string;
}

const seen = new Map<string, number>();
function slugify(text: string, style: 'github' | 'simple' | 'raw'): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  if (style === 'raw') return base.replace(/\s+/g, '-');
  if (style === 'simple') {
    return (
      base
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-') || 'section'
    );
  }
  // GitHub 风格：非字母数字与中日韩字符一律去掉，空格转连字符
  return (
    base
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-') || 'section'
  );
}

export default function MarkdownTocTool() {
  const [input, setInput] = useState(
    '# 标题一\n\n正文内容\n\n## 二级标题\n\n### 三级标题\n\n## 另一个二级标题\n\n正文内容\n',
  );
  const [maxLevel, setMaxLevel] = useState(3);
  const [style, setStyle] = useState<'github' | 'simple' | 'raw'>('github');
  const [listStyle, setListStyle] = useState<'-' | '*' | '+'>('-');
  const [asLinks, setAsLinks] = useState(true);
  const [skipFirst, setSkipFirst] = useState(true);
  const [copied, setCopied] = useState(false);

  const headings = useMemo<Heading[]>(() => {
    seen.clear();
    const out: Heading[] = [];
    let inFence = false;
    for (const line of input.split(/\r?\n/)) {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;
      const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      if (!m) continue;
      const level = m[1].length;
      if (level > maxLevel) continue;
      const text = m[2].trim();
      let slug = slugify(text, style);
      const n = seen.get(slug) ?? 0;
      seen.set(slug, n + 1);
      if (n > 0) slug = `${slug}-${n}`;
      out.push({ level, text, slug });
    }
    return skipFirst && out.length && out[0].level === 1 ? out.slice(1) : out;
  }, [input, maxLevel, style, skipFirst]);

  const toc = useMemo(() => {
    if (!headings.length) return '';
    const min = Math.min(...headings.map((h) => h.level));
    return headings
      .map((h) => {
        const indent = '  '.repeat(h.level - min);
        return asLinks
          ? `${indent}${listStyle} [${h.text}](#${h.slug})`
          : `${indent}${listStyle} ${h.text}`;
      })
      .join('\n');
  }, [headings, asLinks, listStyle]);

  return (
    <div class="space-y-4">
      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">Markdown 原文</span>
          <button type="button" class="btn btn-xs btn-ghost" onClick={() => setInput('')}>
            清空
          </button>
        </div>
        <textarea
          class="textarea textarea-bordered w-full font-mono text-sm"
          rows={9}
          placeholder="把 Markdown 文档粘贴进来"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="flex items-center justify-between text-sm font-medium">
            <span>收录到第几级标题</span>
            <span class="opacity-60">H{maxLevel}</span>
          </span>
          <input
            type="range"
            min="1"
            max="6"
            class="range range-primary mt-2 w-full"
            value={maxLevel}
            onInput={(e) => setMaxLevel(Number((e.target as HTMLInputElement).value))}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">锚点风格</span>
          <select
            class="select select-bordered mt-1.5 w-full"
            value={style}
            onChange={(e) =>
              setStyle((e.target as HTMLSelectElement).value as 'github' | 'simple' | 'raw')
            }
          >
            <option value="github">GitHub（去标点、空格转连字符）</option>
            <option value="simple">通用（保留中日韩与字母数字）</option>
            <option value="raw">原样（只把空格转连字符）</option>
          </select>
        </label>
      </div>

      <div class="flex flex-wrap gap-4 rounded-xl bg-base-200 px-4 py-3">
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={asLinks}
            onChange={(e) => setAsLinks((e.target as HTMLInputElement).checked)}
          />
          生成锚点链接
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={skipFirst}
            onChange={(e) => setSkipFirst((e.target as HTMLInputElement).checked)}
          />
          跳过一级标题（文章大标题）
        </label>
        <label class="flex items-center gap-2 text-sm">
          <span>列表符号</span>
          <div class="join">
            {(['-', '*', '+'] as const).map((s) => (
              <button
                type="button"
                key={s}
                class={`btn btn-xs join-item ${listStyle === s ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setListStyle(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </label>
      </div>

      <div class="flex flex-wrap gap-2">
        <span class="badge badge-ghost">识别到 {headings.length} 个标题</span>
      </div>

      {headings.length > 0 && (
        <>
          <div class="rounded-xl border border-base-300 bg-base-100 p-4">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium">目录结构</span>
              <button
                type="button"
                class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
                onClick={async () => {
                  await copyText(toc);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1800);
                }}
              >
                {copied ? '已复制' : '复制目录'}
              </button>
            </div>
            <ul class="space-y-1 text-sm">
              {headings.map((h, i) => (
                <li style={`padding-left:${(h.level - 1) * 16}px`} key={i}>
                  <span class="opacity-40">H{h.level}</span> {h.text}
                  {asLinks && <span class="ml-1 font-mono text-xs opacity-40">#{h.slug}</span>}
                </li>
              ))}
            </ul>
          </div>

          <label class="block">
            <span class="text-sm font-medium">Markdown 源码</span>
            <pre class="mt-1.5 max-h-64 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm whitespace-pre-wrap">
              {toc}
            </pre>
          </label>
        </>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        代码块里的 # 注释不会被误判成标题。生成的锚点尽量对齐 GitHub 的规则，
        但各家平台（知乎、掘金、微信公众号）的实现有细微差别，粘贴后如果点不动，
        把锚点风格切成「原样」再试一次。全部在本地完成。
      </p>
    </div>
  );
}
