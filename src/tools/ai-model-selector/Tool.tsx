import { useState } from 'preact/hooks';

interface Model {
  name: string;
  coding: number;
  longCtx: number;
  chinese: number;
  cheap: number;
  vision: number;
  reasoning: number;
}

const MODELS: Model[] = [
  { name: 'GPT-5.4', coding: 9, longCtx: 9, chinese: 7, cheap: 4, vision: 8, reasoning: 9 },
  { name: 'Claude Opus 4.8', coding: 9, longCtx: 9, chinese: 7, cheap: 3, vision: 8, reasoning: 9 },
  { name: 'Claude Sonnet 4.6', coding: 8, longCtx: 7, chinese: 7, cheap: 5, vision: 8, reasoning: 8 },
  { name: 'Gemini 3.1 Pro', coding: 8, longCtx: 9, chinese: 7, cheap: 5, vision: 9, reasoning: 8 },
  { name: 'Gemini 3.5 Flash', coding: 7, longCtx: 9, chinese: 7, cheap: 8, vision: 8, reasoning: 7 },
  { name: 'DeepSeek V4-Flash', coding: 8, longCtx: 9, chinese: 9, cheap: 10, vision: 4, reasoning: 8 },
  { name: 'Qwen-Max', coding: 8, longCtx: 9, chinese: 9, cheap: 5, vision: 7, reasoning: 8 },
  { name: 'GLM-4.6', coding: 7, longCtx: 9, chinese: 9, cheap: 8, vision: 6, reasoning: 7 },
  { name: 'Kimi K2', coding: 7, longCtx: 8, chinese: 9, cheap: 7, vision: 4, reasoning: 7 },
  { name: 'Doubao 旗舰', coding: 6, longCtx: 8, chinese: 10, cheap: 8, vision: 7, reasoning: 6 },
  { name: 'o3', coding: 9, longCtx: 7, chinese: 6, cheap: 3, vision: 5, reasoning: 10 },
  { name: 'GPT-4o', coding: 7, longCtx: 6, chinese: 6, cheap: 6, vision: 8, reasoning: 6 },
];

const SCENARIOS: { id: keyof Omit<Model, 'name'>; label: string }[] = [
  { id: 'coding', label: '写代码' },
  { id: 'longCtx', label: '长文档 / 长上下文' },
  { id: 'chinese', label: '中文场景' },
  { id: 'cheap', label: '省钱优先' },
  { id: 'vision', label: '多模态（图 / 视频）' },
  { id: 'reasoning', label: '复杂推理' },
];

export default function AiModelSelector() {
  const [picks, setPicks] = useState<Set<string>>(new Set(['coding']));

  const toggle = (id: string) =>
    setPicks((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const ranked = MODELS.map((m) => {
    const score = [...picks].reduce((s, k) => s + (m as unknown as Record<string, number>)[k], 0);
    return { m, score };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div class="space-y-4">
      <div class="text-xs font-medium opacity-70">选择你的场景（可多选）</div>
      <div class="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            class={`btn btn-xs ${picks.has(s.id) ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => toggle(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div class="space-y-2">
        {ranked.map(({ m, score }, i) => (
          <div class="card bg-base-200 p-3 space-y-1">
            <div class="flex items-center justify-between">
              <div class="font-medium">
                <span class="badge badge-xs badge-primary mr-2">#{i + 1}</span>
                {m.name}
              </div>
              <div class="text-xs opacity-60">综合 {score}</div>
            </div>
            <div class="flex flex-wrap gap-1 text-[11px] opacity-70">
              {SCENARIOS.map((s) =>
                picks.has(s.id) ? (
                  <span class="badge badge-ghost badge-xs">{s.label} {(m as unknown as Record<string, number>)[s.id]}/10</span>
                ) : null,
              )}
            </div>
          </div>
        ))}
      </div>
      <p class="text-xs opacity-60">评分为基于公开能力的规则匹配，属起点参考；最终以你实际压测为准。价格为 2026-10 参考快照。</p>
    </div>
  );
}
