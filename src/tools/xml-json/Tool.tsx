import { useState, useMemo } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';

function xmlToObj(node: Element): unknown {
  const obj: Record<string, unknown> = {};
  if (node.attributes) {
    for (let i = 0; i < node.attributes.length; i++) {
      const a = node.attributes[i];
      obj['@' + a.nodeName] = a.nodeValue;
    }
  }
  const kids: Node[] = [];
  node.childNodes.forEach((c) => {
    if (c.nodeType === 3 && (c.textContent || '').trim() === '') return;
    kids.push(c);
  });
  if (kids.length === 0) return node.textContent ?? '';
  const childArr = kids as (Element | CharacterData)[];
  for (const c of childArr) {
    if (c.nodeType === 3) {
      obj['#text'] = (c.textContent || '').trim();
      continue;
    }
    const el = c as Element;
    const v = xmlToObj(el);
    const name = el.nodeName;
    if (obj[name] === undefined) obj[name] = v;
    else if (Array.isArray(obj[name])) (obj[name] as unknown[]).push(v);
    else obj[name] = [obj[name], v];
  }
  return obj;
}

function jsonToXml(value: unknown, root: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/<//g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const walk = (v: unknown, tag: string): string => {
    if (v === null || v === undefined) return `<${tag}/>`;
    if (typeof v === 'object') {
      if (Array.isArray(v)) {
        return v.map((item) => walk(item, tag)).join('');
      }
      const inner = Object.entries(v as Record<string, unknown>)
        .map(([k, val]) => {
          if (k.startsWith('@')) return '';
          if (k === '#text') return String(val);
          return walk(val, k);
        })
        .join('');
      const attrs = Object.entries(v as Record<string, unknown>)
        .filter(([k]) => k.startsWith('@'))
        .map(([k, val]) => ` ${k.slice(1)}="${esc(String(val))}"`)
        .join('');
      return `<${tag}${attrs}>${inner}</${tag}>`;
    }
    return `<${tag}>${esc(String(v))}</${tag}>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>\n` + walk(value, root);
}

export default function XmlJsonTool() {
  const [mode, setMode] = useState<'xml2json' | 'json2xml'>('xml2json');
  const [input, setInput] = useState('<root><name>张三</name><age>28</age><hobby>篮球</hobby><hobby>足球</hobby></root>');

  const result = useMemo(() => {
    if (input.trim() === '') return '';
    try {
      if (mode === 'xml2json') {
        const doc = new DOMParser().parseFromString(input, 'application/xml');
        const err = doc.querySelector('parsererror');
        if (err) return `XML 解析错误：${err.textContent}`;
        const root = doc.documentElement;
        if (!root) return '（空文档）';
        return JSON.stringify(xmlToObj(root), null, 2);
      }
      const obj = JSON.parse(input);
      return jsonToXml(obj, 'root');
    } catch (e) {
      return `错误：${(e as Error).message}`;
    }
  }, [mode, input]);

  return (
    <DevTool
      input={input}
      setInput={setInput}
      output={result}
      placeholder={mode === 'xml2json' ? '粘贴 XML…' : '粘贴 JSON…'}
      note="XML 与 JSON 互转（属性以 @ 前缀、文本以 #text 表示）。基于浏览器 DOMParser，本地处理。"
    >
      <div class="form-control">
        <select
          class="select select-bordered select-sm w-full"
          value={mode}
          onChange={(e) => setMode((e.target as HTMLSelectElement).value as typeof mode)}
        >
          <option value="xml2json">XML → JSON</option>
          <option value="json2xml">JSON → XML</option>
        </select>
      </div>
    </DevTool>
  );
}
