import { useState } from 'preact/hooks';

interface Param {
  name: string;
  type: string;
  desc: string;
  required: boolean;
}

const TYPES = ['string', 'number', 'integer', 'boolean', 'array', 'object'];

export default function FunctionCallingGenerator() {
  const [fnName, setFnName] = useState('get_weather');
  const [fnDesc, setFnDesc] = useState('根据城市名查询当前天气');
  const [params, setParams] = useState<Param[]>([
    { name: 'city', type: 'string', desc: '城市名称，如 北京', required: true },
    { name: 'unit', type: 'string', desc: '温度单位：celsius / fahrenheit', required: false },
  ]);
  const [format, setFormat] = useState<'openai' | 'anthropic'>('openai');
  const [copied, setCopied] = useState(false);

  const update = (i: number, patch: Partial<Param>) =>
    setParams((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const addParam = () => setParams((prev) => [...prev, { name: '', type: 'string', desc: '', required: false }]);
  const remove = (i: number) => setParams((prev) => prev.filter((_, idx) => idx !== i));

  const build = () => {
    const props: Record<string, unknown> = {};
    const required: string[] = [];
    for (const p of params) {
      if (!p.name.trim()) continue;
      props[p.name.trim()] = { type: p.type, description: p.desc || p.name };
      if (p.required) required.push(p.name.trim());
    }
    const schema = { type: 'object', properties: props, ...(required.length ? { required } : {}) };
    if (format === 'openai') {
      return {
        name: fnName.trim() || 'my_function',
        description: fnDesc.trim(),
        parameters: schema,
      };
    }
    return {
      name: fnName.trim() || 'my_function',
      description: fnDesc.trim(),
      input_schema: schema,
    };
  };

  const json = JSON.stringify(build(), null, 2);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div class="space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="form-control">
          <span class="label-text text-xs mb-1">函数名</span>
          <input class="input input-sm input-bordered" value={fnName} onInput={(e) => setFnName((e.target as HTMLInputElement).value)} />
        </label>
        <label class="form-control">
          <span class="label-text text-xs mb-1">函数描述</span>
          <input class="input input-sm input-bordered" value={fnDesc} onInput={(e) => setFnDesc((e.target as HTMLInputElement).value)} />
        </label>
      </div>

      <div class="text-xs font-medium opacity-70">参数</div>
      <div class="space-y-2">
        {params.map((p, i) => (
          <div class="flex flex-wrap items-end gap-2">
            <input class="input input-xs input-bordered w-32" placeholder="名称" value={p.name} onInput={(e) => update(i, { name: (e.target as HTMLInputElement).value })} />
            <select class="select select-xs select-bordered" value={p.type} onChange={(e) => update(i, { type: (e.target as HTMLSelectElement).value })}>
              {TYPES.map((t) => (
                <option value={t}>{t}</option>
              ))}
            </select>
            <input class="input input-xs input-bordered flex-1 min-w-40" placeholder="描述" value={p.desc} onInput={(e) => update(i, { desc: (e.target as HTMLInputElement).value })} />
            <label class="label cursor-pointer gap-1">
              <span class="label-text text-xs">必填</span>
              <input type="checkbox" class="checkbox checkbox-xs" checked={p.required} onChange={(e) => update(i, { required: (e.target as HTMLInputElement).checked })} />
            </label>
            <button class="btn btn-xs btn-ghost" onClick={() => remove(i)}>✕</button>
          </div>
        ))}
        <button class="btn btn-xs btn-outline" onClick={addParam}>+ 加参数</button>
      </div>

      <div class="form-control">
        <span class="label-text text-xs mb-1">输出格式</span>
        <select class="select select-sm select-bordered w-48" value={format} onChange={(e) => setFormat((e.target as HTMLSelectElement).value as 'openai' | 'anthropic')}>
          <option value="openai">OpenAI (parameters)</option>
          <option value="anthropic">Anthropic (input_schema)</option>
        </select>
      </div>

      <div class="relative">
        <pre class="mockup-code text-xs max-h-80 overflow-auto"><code>{json}</code></pre>
        <button class="btn btn-xs btn-primary absolute right-2 top-2" onClick={copy}>{copied ? '已复制' : '复制'}</button>
      </div>
    </div>
  );
}
