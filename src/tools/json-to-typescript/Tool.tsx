import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

function toPascal(name: string): string {
  return (
    name
      .replace(/[^A-Za-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('') || 'Item'
  );
}

function isValidKey(k: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k);
}

interface Ctx {
  optional: boolean;
  exportAll: boolean;
  semi: boolean;
  interfaces: string[];
  used: Set<string>;
}

function typeOf(value: unknown, key: string, ctx: Ctx): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    if (!value.length) return 'unknown[]';
    // 数组元素类型取并集，简化为第一项推断 + unknown 兜底
    const kinds = new Set(value.map((v) => typeOf(v, key, { ...ctx, interfaces: ctx.interfaces })));
    if (kinds.size === 1) return `${[...kinds][0]}[]`;
    return `Array<${[...kinds].join(' | ')}>`;
  }
  if (typeof value === 'object') {
    const name = uniqueName(toPascal(key), ctx.used);
    const body = buildInterface(value as Record<string, unknown>, name, ctx);
    ctx.interfaces.push(body);
    return name;
  }
  if (typeof value === 'number') return Number.isInteger(value) ? 'number' : 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') return 'string';
  return 'unknown';
}

function uniqueName(base: string, used: Set<string>): string {
  let name = base;
  let i = 2;
  while (used.has(name)) {
    name = `${base}${i}`;
    i += 1;
  }
  used.add(name);
  return name;
}

function buildInterface(obj: Record<string, unknown>, name: string, ctx: Ctx): string {
  const lines = Object.entries(obj).map(([k, v]) => {
    const t = typeOf(v, k, ctx);
    const opt = ctx.optional ? '?' : '';
    const key = isValidKey(k) ? k : JSON.stringify(k);
    return `  ${key}${opt}: ${t};`;
  });
  return `${ctx.exportAll ? 'export ' : ''}interface ${name} {\n${lines.join('\n')}\n}`;
}

const SAMPLE = `{
  "id": 1024,
  "name": "摩卡工具箱",
  "published": true,
  "tags": ["tools", "astro"],
  "meta": { "version": "0.9.11", "stars": 128 }
}`;

export default function JsonToTypescriptTool() {
  const [input, setInput] = useState(SAMPLE);
  const [rootName, setRootName] = useState('Root');
  const [optional, setOptional] = useState(false);
  const [exportAll, setExportAll] = useState(true);
  const [copied, setCopied] = useState(false);

  const { code, error } = useMemo(() => {
    try {
      const data = JSON.parse(input);
      const ctx: Ctx = { optional, exportAll, semi: true, interfaces: [], used: new Set() };
      let rootType: string;
      if (Array.isArray(data)) {
        const item = data.length ? typeOf(data[0], rootName, ctx) : 'unknown';
        rootType = `${ctx.exportAll ? 'export ' : ''}type ${uniqueName(rootName, ctx.used)} = ${item}[];`;
      } else if (typeof data === 'object' && data !== null) {
        const name = uniqueName(rootName, ctx.used);
        const body = buildInterface(data as Record<string, unknown>, name, ctx);
        ctx.interfaces.push(body);
        rootType = '';
      } else {
        rootType = `${ctx.exportAll ? 'export ' : ''}type ${rootName} = ${typeof data};`;
      }
      // 子接口先声明，根类型排最后，读起来从上到下不用来回跳
      const out = [...ctx.interfaces, rootType].filter(Boolean).join('\n\n');
      return { code: out, error: '' };
    } catch (e) {
      return { code: '', error: `JSON 解析失败：${(e as Error).message}` };
    }
  }, [input, rootName, optional, exportAll]);

  return (
    <div class="space-y-4">
      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">JSON 数据</span>
          <button type="button" class="btn btn-xs btn-ghost" onClick={() => setInput(SAMPLE)}>
            填入示例
          </button>
        </div>
        <textarea
          class="textarea textarea-bordered w-full font-mono text-sm"
          rows={10}
          placeholder='粘贴接口返回的 JSON，例如 {"id":1,"name":"a"}'
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">根类型名</span>
          <input
            type="text"
            class="input input-bordered mt-1.5 w-full font-mono"
            value={rootName}
            onInput={(e) => setRootName((e.target as HTMLInputElement).value)}
          />
        </label>
        <div class="flex flex-col gap-2 justify-end">
          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              checked={optional}
              onChange={(e) => setOptional((e.target as HTMLInputElement).checked)}
            />
            全部字段设为可选（?）
          </label>
          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              checked={exportAll}
              onChange={(e) => setExportAll((e.target as HTMLInputElement).checked)}
            />
            加 export 关键字
          </label>
        </div>
      </div>

      {error && <p class="text-sm text-error">{error}</p>}

      {code && (
        <label class="block">
          <div class="mb-1.5 flex items-center justify-between">
            <span class="text-sm font-medium">TypeScript 类型</span>
            <button
              type="button"
              class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
              onClick={async () => {
                await copyText(code);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              }}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <pre class="max-h-96 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm whitespace-pre">
            {code}
          </pre>
        </label>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        类型由样例数据反推，只能覆盖这次出现的字段。后端同一个字段在不同情况下返回
        null 还是对象、数组里有没有多种元素类型，都需要你人工补成联合类型。
        空数组推断为 unknown[]，建议手动改成具体类型。全部在本地完成。
      </p>
    </div>
  );
}
