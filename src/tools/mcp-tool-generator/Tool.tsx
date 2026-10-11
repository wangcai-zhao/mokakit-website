import { useState } from 'preact/hooks';

interface Param {
  name: string;
  type: string;
  desc: string;
  required: boolean;
}

const TYPES = ['string', 'number', 'integer', 'boolean', 'array', 'object'];

export default function McpToolGenerator() {
  const [name, setName] = useState('search_docs');
  const [desc, setDesc] = useState('在知识库里检索与查询词相关的文档片段');
  const [params, setParams] = useState<Param[]>([
    { name: 'query', type: 'string', desc: '检索关键词', required: true },
    { name: 'top_k', type: 'integer', desc: '返回条数，默认 5', required: false },
  ]);
  const [copied, setCopied] = useState(false);

  const update = (i: number, patch: Partial<Param>) =>
    setParams((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const add = () => setParams((prev) => [...prev, { name: '', type: 'string', desc: '', required: false }]);
  const remove = (i: number) => setParams((prev) => prev.filter((_, idx) => idx !== i));

  const build = () => {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const p of params) {
      if (!p.name.trim()) continue;
      const entry: Record<string, unknown> = { type: p.type, description: p.desc || p.name };
      if (p.type === 'array') entry.items = { type: 'string' };
      if (p.type === 'object') entry.properties = {};
      properties[p.name.trim()] = entry;
      if (p.required) required.push(p.name.trim());
    }
    return {
      name: name.trim() || 'my_tool',
      description: desc.trim(),
      inputSchema: {
        type: 'object',
        properties,
        ...(required.length ? { required } : {}),
      },
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
          <span class="label-text text-xs mb-1">工具名（name）</span>
          <input class="input input-sm input-bordered" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
        </label>
        <label class="form-control">
          <span class="label-text text-xs mb-1">工具描述</span>
          <input class="input input-sm input-bordered" value={desc} onInput={(e) => setDesc((e.target as HTMLInputElement).value)} />
        </label>
      </div>

      <div class="text-xs font-medium opacity-70">参数（inputSchema.properties）</div>
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
        <button class="btn btn-xs btn-outline" onClick={add}>+ 加参数</button>
      </div>

      <div class="divider my-1">MCP tool 定义</div>
      <div class="relative">
        <pre class="mockup-code text-xs max-h-80 overflow-auto"><code>{json}</code></pre>
        <button class="btn btn-xs btn-primary absolute right-2 top-2" onClick={copy}>{copied ? '已复制' : '复制'}</button>
      </div>
      <p class="text-xs opacity-60">把这段放进你的 MCP Server 的 tools 列表，支持 MCP 的客户端即可识别调用。</p>
    </div>
  );
}
