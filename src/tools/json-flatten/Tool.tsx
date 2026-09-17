import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Mode = 'flatten' | 'unflatten';

function flatten(obj: unknown, prefix = '', sep = '.', out: Record<string, unknown> = {}) {
  if (obj === null || typeof obj !== 'object') {
    if (prefix) out[prefix] = obj;
    return out;
  }
  if (Array.isArray(obj)) {
    if (!obj.length && prefix) out[prefix] = [];
    obj.forEach((v, i) => flatten(v, prefix ? `${prefix}${sep}${i}` : `${i}`, sep, out));
    return out;
  }
  const entries = Object.entries(obj as Record<string, unknown>);
  if (!entries.length && prefix) out[prefix] = {};
  for (const [k, v] of entries) {
    flatten(v, prefix ? `${prefix}${sep}${k}` : k, sep, out);
  }
  return out;
}

function unflatten(input: Record<string, unknown>, sep = '.'): unknown {
  const isIndex = (k: string) => /^\d+$/.test(k);
  const root: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(input)) {
    const keys = path.split(sep);
    let cur: Record<string, unknown> = root;
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const last = i === keys.length - 1;
      const nextKey = keys[i + 1];
      if (last) {
        cur[key] = value;
      } else {
        if (typeof cur[key] !== 'object' || cur[key] === null) {
          cur[key] = isIndex(nextKey) ? [] : {};
        }
        cur = cur[key] as Record<string, unknown>;
      }
    }
  }
  // 把「数字键的对象」还原成数组
  const normalize = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(normalize);
    if (v && typeof v === 'object') {
      const keys = Object.keys(v as Record<string, unknown>);
      if (keys.length && keys.every((k) => isIndex(k))) {
        const arr: unknown[] = [];
        for (const k of keys) arr[Number(k)] = normalize((v as Record<string, unknown>)[k]);
        return arr;
      }
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = normalize(val);
      return out;
    }
    return v;
  };
  return normalize(root);
}

const SAMPLE = `{
  "user": { "name": "张三", "age": 30 },
  "tags": ["a", "b"],
  "active": true
}`;

export default function JsonFlattenTool() {
  const [mode, setMode] = useState<Mode>('flatten');
  const [input, setInput] = useState(SAMPLE);
  const [sep, setSep] = useState('.');
  const [copied, setCopied] = useState(false);

  const { output, error } = useMemo(() => {
    try {
      const data = JSON.parse(input);
      const result = mode === 'flatten' ? flatten(data, '', sep) : unflatten(data as Record<string, unknown>, sep);
      return { output: JSON.stringify(result, null, 2), error: '' };
    } catch (e) {
      return { output: '', error: `JSON 解析失败：${(e as Error).message}` };
    }
  }, [input, mode, sep]);

  const keyCount = useMemo(() => {
    try {
      return Object.keys(JSON.parse(output)).length;
    } catch {
      return 0;
    }
  }, [output]);

  return (
    <div class="space-y-4">
      <div class="tabs tabs-box w-full">
        <button
          type="button"
          class={`tab flex-1 ${mode === 'flatten' ? 'tab-active' : ''}`}
          onClick={() => setMode('flatten')}
        >
          扁平化
        </button>
        <button
          type="button"
          class={`tab flex-1 ${mode === 'unflatten' ? 'tab-active' : ''}`}
          onClick={() => setMode('unflatten')}
        >
          还原层级
        </button>
      </div>

      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">{mode === 'flatten' ? '嵌套 JSON' : '扁平 JSON'}</span>
          <button
            type="button"
            class="btn btn-xs btn-ghost"
            onClick={() =>
              setInput(
                mode === 'flatten'
                  ? SAMPLE
                  : '{\n  "user.name": "张三",\n  "user.age": 30,\n  "tags.0": "a",\n  "tags.1": "b",\n  "active": true\n}',
              )
            }
          >
            填入示例
          </button>
        </div>
        <textarea
          class="textarea textarea-bordered w-full font-mono text-sm"
          rows={9}
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <label class="block">
        <span class="text-sm font-medium">路径分隔符</span>
        <div class="mt-1.5 flex gap-2">
          {['.', '_', '/', ':'].map((s) => (
            <button
              type="button"
              key={s}
              class={`btn btn-sm ${sep === s ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSep(s)}
            >
              {s === '.' ? '点 .' : s === '_' ? '下划线 _' : s === '/' ? '斜杠 /' : '冒号 :'}
            </button>
          ))}
          <input
            type="text"
            class="input input-bordered input-sm w-24 font-mono"
            maxlength="2"
            value={sep}
            onInput={(e) => setSep((e.target as HTMLInputElement).value || '.')}
          />
        </div>
      </label>

      {error && <p class="text-sm text-error">{error}</p>}

      {output && (
        <>
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-ghost">
              {mode === 'flatten' ? `${keyCount} 个扁平键` : '已还原嵌套结构'}
            </span>
          </div>

          <label class="block">
            <div class="mb-1.5 flex items-center justify-between">
              <span class="text-sm font-medium">结果</span>
              <button
                type="button"
                class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
                onClick={async () => {
                  await copyText(output);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1800);
                }}
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
            <pre class="max-h-80 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm whitespace-pre-wrap break-all">
              {output}
            </pre>
          </label>
        </>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        扁平化常用来把接口返回的嵌套数据塞进表格或 CSV（一层键就是一列），
        也方便做「只改某几个字段」的补丁请求。还原时数字键会自动拼回数组。
        注意：如果原始键名里本身含有分隔符，来回转换会有歧义，建议换成不冲突的符号。
        全部在本地完成。
      </p>
    </div>
  );
}
