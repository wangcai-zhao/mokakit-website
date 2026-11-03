import { useState, useMemo, useEffect, useRef } from 'preact/hooks';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { copyText } from '@/tools/_shared/copy';

/**
 * 默认示例刻意用二级标题起头：
 * 一级标题会在预览区渲染成 <h1>，与工具页本身的「Markdown 预览」h1 撞车，
 * 一个页面出现两个 h1 会干扰搜索引擎对页面主题的判定。
 * 示例同时覆盖表格与任务列表——这两个 GFM 语法最常被用到，
 * 也让首屏直接展示工具的真实能力（description 承诺什么就演示什么）。
 */
const DEMO = `## 摩卡工具箱

一个**顺手好用**的在线工具集合。

## 支持语法
- 标题、列表、*斜体*、_强调_、~~删除线~~
- \`行内代码\` 与代码块
- [链接](https://mokakit.com)
- > 引用文字

## 任务列表与表格
- [x] 已完成的事项
- [ ] 待办事项

| 功能 | 状态 |
| --- | --- |
| 实时预览 | 支持 |
| 本地渲染 | 支持 |

\`\`\`js
console.log('hello mokakit');
\`\`\`

---

左侧输入，右侧实时预览。`;

export default function MarkdownPreview() {
  const [md, setMd] = useState(DEMO);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const html = useMemo(() => {
    try {
      const raw = marked.parse(md, { breaks: true, gfm: true }) as string;
      // SSR 阶段无 DOM，仅渲染可信的默认 DEMO；浏览器水合后对用户输入做净化，杜绝 XSS
      return typeof window === 'undefined' ? raw : DOMPurify.sanitize(raw);
    } catch {
      return '';
    }
  }, [md]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /** 在光标处插入 / 包裹文本，插入后把选区恢复到包裹内容上，方便继续输入 */
  const insert = (before: string, after = '', placeholder = '') => {
    const ta = taRef.current;
    const start = ta ? (ta.selectionStart ?? md.length) : md.length;
    const end = ta ? (ta.selectionEnd ?? start) : start;
    const sel = md.slice(start, end) || placeholder;
    setMd(md.slice(0, start) + before + sel + after + md.slice(end));
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + sel.length;
    });
  };

  /** 给选中的每一行加前缀（引用 / 无序 / 有序 / 任务列表） */
  const prefixLines = (prefix: string) => {
    const ta = taRef.current;
    const start = ta ? (ta.selectionStart ?? 0) : 0;
    const end = ta ? (ta.selectionEnd ?? start) : start;
    const block = md.slice(start, end);
    const added = prefix.length * (block ? block.split('\n').length : 1);
    setMd(
      md.slice(0, start) + block.split('\n').map((l) => prefix + l).join('\n') + md.slice(end)
    );
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      ta.selectionStart = start;
      ta.selectionEnd = end + added;
    });
  };

  const copyHtml = async () => {
    if (!html) return;
    await copyText(html);
    setCopiedHtml(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopiedHtml(false), 1800);
  };

  const buttons: { t: string; tip: string; cls?: string; run: () => void }[] = [
    { t: 'B', tip: '加粗', cls: 'font-bold', run: () => insert('**', '**', '加粗文字') },
    { t: 'I', tip: '斜体', cls: 'italic', run: () => insert('*', '*', '斜体文字') },
    { t: 'S', tip: '删除线', cls: 'line-through', run: () => insert('~~', '~~', '删除线') },
    { t: '行内代码', tip: '行内代码', run: () => insert('`', '`', 'code') },
    {
      t: '代码块',
      tip: '代码块',
      run: () => insert('\n```\n', '\n```\n', 'console.log("hello")'),
    },
    { t: '链接', tip: '链接', run: () => insert('[', '](https://)', '链接文字') },
    { t: '引用', tip: '引用', run: () => prefixLines('> ') },
    { t: '列表', tip: '无序列表', run: () => prefixLines('- ') },
    { t: '编号', tip: '有序列表', run: () => prefixLines('1. ') },
    { t: '任务', tip: '任务列表', run: () => prefixLines('- [ ] ') },
    {
      t: '表格',
      tip: '插入表格',
      run: () => insert('| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n'),
    },
  ];

  return (
    <div class="grid gap-3 md:grid-cols-2">
      <div>
        <div class="flex flex-wrap items-center gap-1 mb-2">
          {buttons.map((b) => (
            <button
              key={b.tip}
              type="button"
              class="btn btn-xs btn-ghost"
              title={b.tip}
              onClick={b.run}
            >
              <span class={b.cls}>{b.t}</span>
            </button>
          ))}
          <span class="ml-auto flex items-center gap-1">
            <button type="button" class="btn btn-xs btn-ghost" onClick={copyHtml}>
              {copiedHtml ? '已复制 HTML' : '复制 HTML'}
            </button>
            <button
              type="button"
              class="btn btn-xs btn-ghost text-error"
              onClick={() => setMd('')}
            >
              清空
            </button>
          </span>
        </div>
        <label class="text-sm font-medium" for="md-input">
          Markdown 源
        </label>
        <textarea
          id="md-input"
          ref={taRef}
          class="textarea textarea-bordered mt-2 w-full h-80 font-mono text-sm"
          value={md}
          onInput={(e) => setMd((e.target as HTMLTextAreaElement).value)}
        />
        <p class="mt-1 text-[11px] opacity-45">
          {md.length} 字符 · {md.split('\n').length} 行
        </p>
      </div>
      <div>
        <label class="text-sm font-medium mb-2 block">预览</label>
        <div
          class="md-body prose-sm h-80 overflow-auto rounded-lg border border-base-300 bg-base-200 p-4 text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <style>{`
        .md-body { line-height: 1.7; color: inherit; }
        .md-body h1 { font-size: 1.4rem; font-weight: 700; margin: .6em 0 .4em; }
        .md-body h2 { font-size: 1.15rem; font-weight: 700; margin: .6em 0 .4em; }
        .md-body h3 { font-size: 1rem; font-weight: 700; margin: .5em 0 .3em; }
        .md-body p { margin: .5em 0; }
        .md-body ul, .md-body ol { margin: .5em 0; padding-left: 1.4em; }
        .md-body ul { list-style: disc; }
        .md-body ol { list-style: decimal; }
        .md-body li { margin: .2em 0; }
        .md-body a { color: var(--color-primary, oklch(47% 0.072 55)); text-decoration: underline; }
        .md-body img { max-width: 100%; border-radius: .4em; }
        .md-body del { opacity: .55; }
        .md-body code {
          background: color-mix(in oklab, currentColor 8%, transparent); padding: .1em .35em; border-radius: .3em;
          font-family: ui-monospace, monospace; font-size: .85em;
        }
        .md-body pre {
          background: color-mix(in oklab, currentColor 8%, transparent); padding: .8em; border-radius: .5em;
          overflow: auto; margin: .6em 0;
        }
        .md-body pre code { background: transparent; padding: 0; }
        .md-body blockquote {
          border-left: 3px solid var(--color-primary, oklch(47% 0.072 55));
          padding-left: .8em; margin: .6em 0; opacity: .8;
        }
        .md-body hr { border: none; border-top: 1px solid color-mix(in oklab, currentColor 12%, transparent); margin: .8em 0; }
        .md-body table { border-collapse: collapse; margin: .6em 0; width: 100%; font-size: .92em; }
        .md-body th, .md-body td { border: 1px solid color-mix(in oklab, currentColor 18%, transparent); padding: .35em .6em; text-align: left; }
        .md-body th { background: color-mix(in oklab, currentColor 6%, transparent); font-weight: 600; }
        .md-body input[type="checkbox"] { margin-right: .45em; }
        .md-body li:has(input[type="checkbox"]) { list-style: none; margin-left: -1.3em; }
      `}</style>
    </div>
  );
}
