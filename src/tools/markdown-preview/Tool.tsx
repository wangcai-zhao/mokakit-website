import { useState, useMemo } from 'preact/hooks';
import { marked } from 'marked';

const DEMO = `# 摩卡工具箱

一个**顺手好用**的在线工具集合。

## 支持语法
- 标题、列表、*斜体*、_强调_
- \`行内代码\` 与代码块
- [链接](https://mokakit.com)
- > 引用文字

\`\`\`js
console.log('hello mokakit');
\`\`\`

---

左侧输入，右侧实时预览。`;

export default function MarkdownPreview() {
  const [md, setMd] = useState(DEMO);

  const html = useMemo(() => {
    try {
      return marked.parse(md, { breaks: true, gfm: true }) as string;
    } catch {
      return '';
    }
  }, [md]);

  return (
    <div class="grid gap-3 md:grid-cols-2">
      <div>
        <label class="text-sm font-medium" for="md-input">
          Markdown 源
        </label>
        <textarea
          id="md-input"
          class="textarea textarea-bordered mt-2 w-full h-80 font-mono text-sm"
          value={md}
          onInput={(e) => setMd((e.target as HTMLTextAreaElement).value)}
        />
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
      `}</style>
    </div>
  );
}
