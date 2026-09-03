import { useState, useMemo } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';

function parseQuery(input: string): { key: string; val: string }[] {
  let qs = input.trim();
  const h = qs.indexOf('#');
  if (h >= 0) qs = qs.slice(0, h); // 去掉锚点
  const q = qs.indexOf('?');
  if (q >= 0) qs = qs.slice(q + 1);
  if (qs === '') return [];
  return qs.split('&').map((pair) => {
    const i = pair.indexOf('=');
    if (i < 0) return { key: pair, val: '' };
    return { key: pair.slice(0, i), val: pair.slice(i + 1) };
  });
}

export default function QueryParamsTool() {
  const [sort, setSort] = useState(false);
  const [dedupe, setDedupe] = useState(false);
  const [decode, setDecode] = useState(true);
  const [input, setInput] = useState('https://example.com/search?q=摩卡工具箱&page=2&sort=desc&q=重复');

  const output = useMemo(() => {
    let pairs = parseQuery(input);
    if (decode) pairs = pairs.map((p) => ({ key: safeDecode(p.key), val: safeDecode(p.val) }));
    if (dedupe) {
      const seen = new Set<string>();
      pairs = pairs.filter((p) => {
        const k = p.key;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    if (sort) pairs = [...pairs].sort((a, b) => a.key.localeCompare(b.key));
    if (pairs.length === 0) return '（无查询参数）';
    const lines = pairs.map((p) => {
      const disp = decode ? p.val : encodeURIComponent(p.val);
      return `${p.key} = ${disp}`;
    });
    const rebuilt = pairs
      .map((p) => `${p.key}=${encodeURIComponent(decode ? p.val : p.val)}`)
      .join('&');
    return `${lines.join('\n')}\n\n# 重新拼接:\n${rebuilt}`;
  }, [input, sort, dedupe, decode]);

  return (
    <DevTool
      input={input}
      setInput={setInput}
      output={output}
      placeholder="粘贴整条 URL 或 key=val&... 片段"
      note="解析、排序、去重、重新拼接 URL 查询参数。可切换解码/编码视图，全部本地处理。"
    >
      <div class="flex flex-wrap gap-4 text-sm">
        <label class="flex items-center gap-2">
          <input type="checkbox" class="checkbox checkbox-sm" checked={decode} onChange={(e) => setDecode((e.target as HTMLInputElement).checked)} />
          解码值
        </label>
        <label class="flex items-center gap-2">
          <input type="checkbox" class="checkbox checkbox-sm" checked={sort} onChange={(e) => setSort((e.target as HTMLInputElement).checked)} />
          按 key 排序
        </label>
        <label class="flex items-center gap-2">
          <input type="checkbox" class="checkbox checkbox-sm" checked={dedupe} onChange={(e) => setDedupe((e.target as HTMLInputElement).checked)} />
          去重（保留末次）
        </label>
      </div>
    </DevTool>
  );
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    return s;
  }
}
