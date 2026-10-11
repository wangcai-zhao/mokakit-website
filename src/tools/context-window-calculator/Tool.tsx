import { useState } from 'preact/hooks';

interface Model {
  name: string;
  ctxK: number; // 上下文窗口（千 token）
}

/** 主流大模型上下文长度（千 token），参考快照 2026-10 */
const MODELS: Model[] = [
  { name: 'GPT-5.4', ctxK: 1000 },
  { name: 'Claude Opus 4.8', ctxK: 1000 },
  { name: 'Claude Sonnet 4.6', ctxK: 200 },
  { name: 'Gemini 3.1 Pro', ctxK: 1000 },
  { name: 'Gemini 3.5 Flash', ctxK: 1000 },
  { name: 'DeepSeek V4-Pro', ctxK: 128 },
  { name: 'DeepSeek V4-Flash', ctxK: 1000 },
  { name: 'Qwen-Max', ctxK: 1000 },
  { name: 'GLM-4.6', ctxK: 1000 },
  { name: 'Kimi K2', ctxK: 256 },
  { name: 'Doubao 旗舰', ctxK: 256 },
  { name: 'MiniMax', ctxK: 256 },
  { name: 'o3', ctxK: 200 },
  { name: 'GPT-4o', ctxK: 128 },
];

export default function ContextWindowCalculator() {
  const [model, setModel] = useState(MODELS[0].name);
  const [sysTok, setSysTok] = useState(500);
  const [inTok, setInTok] = useState(300);
  const [outTok, setOutTok] = useState(500);

  const m = MODELS.find((x) => x.name === model) ?? MODELS[0];
  const ctx = m.ctxK * 1000;
  const perTurn = inTok + outTok;
  const usable = ctx - sysTok;
  const maxTurns = perTurn > 0 ? Math.floor(usable / perTurn) : Infinity;
  const overflow = sysTok >= ctx;

  return (
    <div class="space-y-4">
      <label class="form-control">
        <span class="label-text text-xs mb-1">模型（上下文窗口 {m.ctxK}K token）</span>
        <select class="select select-sm select-bordered" value={model} onChange={(e) => setModel((e.target as HTMLSelectElement).value)}>
          {MODELS.map((x) => (
            <option value={x.name}>{x.name}（{x.ctxK}K）</option>
          ))}
        </select>
      </label>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label class="form-control">
          <span class="label-text text-xs mb-1">系统提示词 token</span>
          <input type="number" class="input input-sm input-bordered" value={sysTok} onInput={(e) => setSysTok(Math.max(0, +(e.target as HTMLInputElement).value || 0))} />
        </label>
        <label class="form-control">
          <span class="label-text text-xs mb-1">每轮输入 token</span>
          <input type="number" class="input input-sm input-bordered" value={inTok} onInput={(e) => setInTok(Math.max(0, +(e.target as HTMLInputElement).value || 0))} />
        </label>
        <label class="form-control">
          <span class="label-text text-xs mb-1">每轮输出 token</span>
          <input type="number" class="input input-sm input-bordered" value={outTok} onInput={(e) => setOutTok(Math.max(0, +(e.target as HTMLInputElement).value || 0))} />
        </label>
      </div>

      <div class="stats shadow w-full">
        <div class="stat">
          <div class="stat-title text-xs">可用窗口</div>
          <div class="stat-value text-lg">{overflow ? '溢出' : usable.toLocaleString()}</div>
          <div class="stat-desc text-xs">扣除系统提示词后</div>
        </div>
        <div class="stat">
          <div class="stat-title text-xs">每轮消耗</div>
          <div class="stat-value text-lg">{perTurn.toLocaleString()}</div>
          <div class="stat-desc text-xs">输入 + 输出</div>
        </div>
        <div class="stat">
          <div class="stat-title text-xs">大约能聊</div>
          <div class={`stat-value text-lg ${maxTurns < 10 ? 'text-error' : 'text-success'}`}>
            {overflow ? '—' : isFinite(maxTurns) ? `${maxTurns} 轮` : '∞'}
          </div>
          <div class="stat-desc text-xs">不超限的轮数</div>
        </div>
      </div>

      {!overflow && maxTurns < 10 && (
        <div class="alert alert-warning text-xs">历史很快占满窗口，建议压缩系统提示词、缩短输出，或换更长上下文模型。</div>
      )}
      {overflow && <div class="alert alert-error text-xs">系统提示词已超出上下文窗口，模型无法工作，请大幅压缩。</div>}
      <p class="text-xs opacity-60">token 数为估算（中文约 1.5–2 字 / token），精确值以各模型 tokenizer 为准；窗口长度为 2026-10 参考快照。</p>
    </div>
  );
}
