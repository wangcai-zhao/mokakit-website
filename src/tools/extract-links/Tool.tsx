import { useState, useMemo } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';

const URL_RE = /https?:\/\/[^\s"'<>()]+/gi;

export default function ExtractLinksTool() {
  const [mode, setMode] = useState<'text' | 'html'>('text');
  const [dedupe, setDedupe] = useState(true);
  const [groupByDomain, setGroupByDomain] = useState(false);
  const [input, setInput] = useState(
    '访问 https://www.mokakit.com/ 与 https://www.mokakit.com/tools/ 了解更多，英文站 https://www.mokakit.com/en/ 也有。',
  );

  const output = useMemo(() => {
    const v = input;
    let links: string[] = [];
    if (mode === 'html') {
      try {
        const doc = new DOMParser().parseFromString(v, 'text/html');
        doc.querySelectorAll('a[href], img[src], link[href]').forEach((el) => {
          const href = el.getAttribute('href') || el.getAttribute('src');
          if (href && /^https?:\/\//i.test(href)) links.push(href);
        });
      } catch {
        /* ignore */
      }
    } else {
      links = v.match(URL_RE) || [];
    }
    if (dedupe) links = Array.from(new Set(links));
    if (links.length === 0) return '（未提取到链接）';
    if (groupByDomain) {
      const map = new Map<string, string[]>();
      for (const l of links) {
        let host = l;
        try {
          host = new URL(l).host;
        } catch {
          /* keep raw */
        }
        if (!map.has(host)) map.set(host, []);
        map.get(host)!.push(l);
      }
      return Array.from(map.entries())
        .map(([h, ls]) => `## ${h} (${ls.length})\n${ls.join('\n')}`)
        .join('\n\n');
    }
    return links.join('\n');
  }, [input, mode, dedupe, groupByDomain]);

  return (
    <DevTool
      input={input}
      setInput={setInput}
      output={output}
      placeholder="粘贴纯文本或 HTML 片段"
      note="从文本（正则）或 HTML（解析 a/img/link）批量提取 http(s) 链接，可去重、按域名分组。本地解析，不访问链接。"
    >
      <div class="flex flex-wrap gap-4 text-sm">
        <select
          class="select select-bordered select-sm"
          value={mode}
          onChange={(e) => setMode((e.target as HTMLSelectElement).value as typeof mode)}
        >
          <option value="text">文本模式（正则提取）</option>
          <option value="html">HTML 模式（解析标签）</option>
        </select>
        <label class="flex items-center gap-2">
          <input type="checkbox" class="checkbox checkbox-sm" checked={dedupe} onChange={(e) => setDedupe((e.target as HTMLInputElement).checked)} />
          去重
        </label>
        <label class="flex items-center gap-2">
          <input type="checkbox" class="checkbox checkbox-sm" checked={groupByDomain} onChange={(e) => setGroupByDomain((e.target as HTMLInputElement).checked)} />
          按域名分组
        </label>
      </div>
    </DevTool>
  );
}
