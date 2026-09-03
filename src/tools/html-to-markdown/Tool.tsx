import { useState, useMemo } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';

const BLOCK = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'blockquote', 'ul', 'ol', 'table', 'hr', 'li'];

function render(node: Node): string {
  if (node.nodeType === 3) return node.textContent || '';
  if (node.nodeType === 8) return '';
  if (node.nodeType !== 1) return '';
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const inline = () =>
    Array.from(el.childNodes)
      .map(render)
      .join('')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{2,}/g, '\n');

  switch (tag) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return '#'.repeat(parseInt(tag[1], 10)) + ' ' + inline() + '\n\n';
    case 'p':
      return inline() + '\n\n';
    case 'br':
      return '\n';
    case 'hr':
      return '---\n\n';
    case 'pre':
      return '```\n' + (el.textContent || '').replace(/\n+$/, '') + '\n```\n\n';
    case 'blockquote':
      return '> ' + inline().replace(/\n/g, '\n> ') + '\n\n';
    case 'code':
      return '`' + (el.textContent || '') + '`';
    case 'strong':
    case 'b':
      return '**' + inline() + '**';
    case 'em':
    case 'i':
      return '*' + inline() + '*';
    case 'del':
    case 's':
    case 'strike':
      return '~~' + inline() + '~~';
    case 'a':
      return '[' + inline() + '](' + (el.getAttribute('href') || '') + ')';
    case 'img':
      return '![' + (el.getAttribute('alt') || '') + '](' + (el.getAttribute('src') || '') + ')';
    case 'ul':
    case 'ol':
      return listItems(el, tag === 'ol') + '\n';
    case 'table':
      return tableToMd(el) + '\n';
    case 'li':
      return inline();
    default:
      return inline();
  }
}

function listItems(ul: HTMLElement, ordered: boolean): string {
  const items = Array.from(ul.children).filter((c) => c.tagName.toLowerCase() === 'li');
  let out = '';
  let n = 1;
  for (const li of items) {
    const marker = ordered ? `${n}. ` : '- ';
    const content = Array.from(li.childNodes).map(render).join('').trim();
    out += marker + content + '\n';
    n++;
  }
  return out;
}

function tableToMd(table: HTMLElement): string {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return '';
  const cellText = (tr: Element) =>
    Array.from(tr.children)
      .filter((c) => ['TD', 'TH'].includes(c.tagName.toUpperCase()))
      .map((c) => (c.textContent || '').replace(/\|/g, '\\|').trim());
  const header = cellText(rows[0]);
  const lines = [`| ${header.join(' | ')} |`, `| ${header.map(() => '---').join(' | ')} |`];
  for (let r = 1; r < rows.length; r++) {
    lines.push(`| ${cellText(rows[r]).join(' | ')} |`);
  }
  return lines.join('\n');
}

export default function HtmlToMarkdownTool() {
  const [input, setInput] = useState(
    '<h2>标题</h2>\n<p>这是一段 <strong>加粗</strong> 与 <em>斜体</em> 文本。</p>\n<ul>\n  <li>项目一</li>\n  <li>项目二</li>\n</ul>\n<p><a href="https://mokakit.com">链接</a></p>',
  );

  const result = useMemo(() => {
    if (input.trim() === '') return '';
    try {
      const doc = new DOMParser().parseFromString(input, 'text/html');
      const md = Array.from(doc.body.childNodes).map(render).join('');
      return md.replace(/\n{3,}/g, '\n\n').trim();
    } catch (e) {
      return `错误：${(e as Error).message}`;
    }
  }, [input]);

  return (
    <DevTool
      input={input}
      setInput={setInput}
      output={result}
      placeholder="粘贴 HTML 片段…"
      note="把常见 HTML 标签转成 Markdown（标题/段落/列表/链接/图片/表格/代码等）。基于浏览器 DOMParser，本地处理。"
    />
  );
}
