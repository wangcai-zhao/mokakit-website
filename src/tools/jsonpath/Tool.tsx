import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Step =
  | { type: 'key'; key: string }
  | { type: 'index'; index: number }
  | { type: 'wildcard' }
  | { type: 'recursive' }
  | { type: 'recursive-key'; key: string };

function parsePath(path: string): Step[] {
  const p = path.trim();
  if (!p.startsWith('$')) throw new Error('JSONPath 必须以 $ 开头');
  const body = p.slice(1);
  const re = /\.\.([\w$]+)|\['([^']+)'\]|\.([\w$]+)|\[(\d+)\]|\[\*\]|\.\./g;
  const steps: Step[] = [];
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(body))) {
    if (m.index !== last) throw new Error(`无法解析路径片段：「${body.slice(last, m.index)}」`);
    last = re.lastIndex;
    if (m[1] !== undefined) steps.push({ type: 'recursive-key', key: m[1] });
    else if (m[2] !== undefined) steps.push({ type: 'key', key: m[2] });
    else if (m[3] !== undefined) steps.push({ type: 'key', key: m[3] });
    else if (m[4] !== undefined) steps.push({ type: 'index', index: parseInt(m[4], 10) });
    else if (m[0] === '[*]') steps.push({ type: 'wildcard' });
    else steps.push({ type: 'recursive' });
  }
  if (last !== body.length) throw new Error(`无法解析路径片段：「${body.slice(last)}」`);
  return steps;
}

function query(steps: Step[], data: unknown): unknown[] {
  let current: unknown[] = [data];
  for (const step of steps) {
    const next: unknown[] = [];
    for (const v of current) {
      if (step.type === 'key') {
        if (v && typeof v === 'object' && !Array.isArray(v) && step.key in (v as Record<string, unknown>)) {
          next.push((v as Record<string, unknown>)[step.key]);
        }
      } else if (step.type === 'index') {
        if (Array.isArray(v) && step.index < v.length) next.push(v[step.index]);
      } else if (step.type === 'wildcard') {
        if (Array.isArray(v)) next.push(...v);
        else if (v && typeof v === 'object') next.push(...Object.values(v as Record<string, unknown>));
      } else if (step.type === 'recursive') {
        const stack = [v];
        while (stack.length) {
          const n = stack.pop();
          if (n && typeof n === 'object') {
            next.push(n);
            const vals = Array.isArray(n) ? n : Object.values(n as Record<string, unknown>);
            stack.push(...(vals as unknown[]));
          }
        }
      } else if (step.type === 'recursive-key') {
        const stack = [v];
        while (stack.length) {
          const n = stack.pop();
          if (n && typeof n === 'object') {
            if (!Array.isArray(n) && step.key in (n as Record<string, unknown>)) {
              next.push((n as Record<string, unknown>)[step.key]);
            }
            const vals = Array.isArray(n) ? n : Object.values(n as Record<string, unknown>);
            stack.push(...(vals as unknown[]));
          }
        }
      }
    }
    current = next;
  }
  return current;
}

export default function JsonPathTool() {
  const [json, setJson] = useState('{\n  "store": {\n    "book": [\n      { "title": "A", "price": 8 },\n      { "title": "B", "price": 12 }\n    ]\n  }\n}');
  const [path, setPath] = useState('$.store.book[*].price');
  const [copied, setCopied] = useState(false);

  const out = useMemo(() => {
    if (json.trim() === '' && path.trim() === '') return '';
    try {
      const data = JSON.parse(json);
      const steps = parsePath(path);
      const res = query(steps, data);
      return JSON.stringify(res.length === 1 ? res[0] : res, null, 2);
    } catch (e) {
      return `错误：${(e as Error).message}`;
    }
  }, [json, path]);

  const copy = async () => {
    if (!out) return;
    await copyText(out);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <label class="block">
        <span class="text-sm font-medium">JSON 数据</span>
        <textarea
          class="textarea textarea-bordered mt-1.5 w-full font-mono text-sm"
          rows={8}
          value={json}
          onInput={(e) => setJson((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
        />
      </label>
      <label class="block">
        <span class="text-sm font-medium">JSONPath</span>
        <input
          class="input input-bordered w-full font-mono text-sm mt-1.5"
          value={path}
          onInput={(e) => setPath((e.target as HTMLInputElement).value)}
          placeholder="$.store.book[*].price"
        />
      </label>
      <label class="block">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">结果</span>
          <button type="button" class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`} onClick={copy}>
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="textarea textarea-bordered mt-1.5 w-full whitespace-pre-wrap break-all bg-base-200 font-mono text-sm">
          {out || '（结果将显示在这里）'}
        </pre>
      </label>
      <p class="text-xs opacity-55 leading-relaxed">
        支持 $.key、['key']、[n]、[*] 通配，以及 ..key / .. 递归搜索。本地计算，不上传。
      </p>
    </div>
  );
}
