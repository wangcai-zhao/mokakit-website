import { useState } from 'preact/hooks';

type StepType = 'model' | 'tool' | 'condition';

interface Step {
  name: string;
  type: StepType;
  desc: string;
}

const TYPE_LABEL: Record<StepType, string> = {
  model: '模型推理',
  tool: '调用工具',
  condition: '条件分支',
};

export default function AgentWorkflowGenerator() {
  const [steps, setSteps] = useState<Step[]>([
    { name: '理解需求', type: 'model', desc: '解析用户输入，明确意图' },
    { name: '检索资料', type: 'tool', desc: '调用搜索 / 知识库' },
    { name: '是否需要追问', type: 'condition', desc: '信息不足则反问，否则继续' },
    { name: '生成答复', type: 'model', desc: '基于资料产出最终回答' },
  ]);
  const [copied, setCopied] = useState(false);

  const update = (i: number, patch: Partial<Step>) =>
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const add = () => setSteps((prev) => [...prev, { name: '', type: 'model', desc: '' }]);
  const remove = (i: number) => setSteps((prev) => prev.filter((_, idx) => idx !== i));

  const workflow = {
    nodes: steps
      .filter((s) => s.name.trim())
      .map((s, i) => ({
        id: `step_${i + 1}`,
        name: s.name.trim(),
        type: s.type,
        detail: s.desc.trim(),
        next: i < steps.filter((x) => x.name.trim()).length - 1 ? `step_${i + 2}` : null,
      })),
  };
  const json = JSON.stringify(workflow, null, 2);

  const readable = steps
    .filter((s) => s.name.trim())
    .map((s, i) => `${i + 1}. [${TYPE_LABEL[s.type]}] ${s.name.trim()}${s.desc.trim() ? ` — ${s.desc.trim()}` : ''}`)
    .join('\n');

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
      <div class="text-xs font-medium opacity-70">步骤（按执行顺序）</div>
      <div class="space-y-2">
        {steps.map((s, i) => (
          <div class="flex flex-wrap items-end gap-2">
            <input class="input input-xs input-bordered w-36" placeholder="步骤名" value={s.name} onInput={(e) => update(i, { name: (e.target as HTMLInputElement).value })} />
            <select class="select select-xs select-bordered" value={s.type} onChange={(e) => update(i, { type: (e.target as HTMLSelectElement).value as StepType })}>
              <option value="model">模型推理</option>
              <option value="tool">调用工具</option>
              <option value="condition">条件分支</option>
            </select>
            <input class="input input-xs input-bordered flex-1 min-w-40" placeholder="说明" value={s.desc} onInput={(e) => update(i, { desc: (e.target as HTMLInputElement).value })} />
            <button class="btn btn-xs btn-ghost" onClick={() => remove(i)}>✕</button>
          </div>
        ))}
        <button class="btn btn-xs btn-outline" onClick={add}>+ 加步骤</button>
      </div>

      <div class="divider my-1">可读流程</div>
      <pre class="mockup-code text-xs max-h-48 overflow-auto"><code>{readable || '添加步骤…'}</code></pre>

      <div class="divider my-1">工作流 JSON</div>
      <div class="relative">
        <pre class="mockup-code text-xs max-h-72 overflow-auto"><code>{json}</code></pre>
        <button class="btn btn-xs btn-primary absolute right-2 top-2" onClick={copy}>{copied ? '已复制' : '复制'}</button>
      </div>
      <p class="text-xs opacity-60">复制到 n8n / Dify / LangGraph 后，按框架节点格式再细化即可。</p>
    </div>
  );
}
