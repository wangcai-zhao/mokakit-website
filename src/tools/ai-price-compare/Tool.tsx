import { useState, useMemo, useEffect } from 'preact/hooks';
import {
  LLMS,
  VISUAL,
  PROVIDERS,
  SNAPSHOT_DATE,
  costOf,
  monthlyCost,
  type LLM,
} from './data';

const RATE_KEY = 'ai-price-rate';
const DEFAULT_RATE = 7.2;

const usd = (n: number) => `$${n.toFixed(2)}`;

type SortKey = 'in' | 'out' | 'name';

export interface AiPriceCompareProps {
  /** 子页预填：打开即只勾选该模型 */
  initialModel?: string;
  /** 子页预填：打开即切到视觉 Tab 并高亮该产品 */
  initialVisual?: string;
}

export default function AiPriceCompare({ initialModel, initialVisual }: AiPriceCompareProps) {
  const [tab, setTab] = useState<'llm' | 'visual'>(initialVisual ? 'visual' : 'llm');
  // 模型级勾选：默认全选；子页预填时只选指定模型
  const [activeModels, setActiveModels] = useState<string[]>(() => {
    if (initialModel && LLMS.some((m) => m.model === initialModel)) return [initialModel];
    return LLMS.map((m) => m.model);
  });
  const [sort, setSort] = useState<SortKey>('in');
  const [inTok, setInTok] = useState(1000);
  const [outTok, setOutTok] = useState(500);
  const [dailyCalls, setDailyCalls] = useState(100);
  // 汇率可调，刷新后保持（localStorage，SSR 阶段不访问 window）
  const [rate, setRate] = useState(DEFAULT_RATE);
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(RATE_KEY));
      if (Number.isFinite(v) && v > 0) setRate(v);
    } catch {
      /* localStorage 被禁用时用默认汇率 */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(RATE_KEY, String(rate));
    } catch {
      /* 忽略写入失败 */
    }
  }, [rate]);

  const cny = (n: number) => `¥${(n * rate).toFixed(1)}`;

  /** 厂商按钮：旗下模型全亮 → 全灭；否则全亮 */
  const toggleProvider = (p: string) => {
    const own = LLMS.filter((m) => m.provider === p).map((m) => m.model);
    const allOn = own.every((m) => activeModels.includes(m));
    setActiveModels((prev) =>
      allOn ? prev.filter((m) => !own.includes(m)) : [...new Set([...prev, ...own])],
    );
  };

  const rows = useMemo(
    () =>
      LLMS.filter((m) => activeModels.includes(m.model)).sort((a, b) => {
        if (sort === 'name') return (a.provider + a.model).localeCompare(b.provider + b.model);
        const av = sort === 'in' ? a.in : a.out ?? Infinity;
        const bv = sort === 'in' ? b.in : b.out ?? Infinity;
        return av - bv;
      }),
    [activeModels, sort],
  );

  const calc = useMemo(
    () =>
      LLMS.filter((m) => activeModels.includes(m.model))
        .map((m) => ({ m, cost: costOf(m, inTok, outTok), month: monthlyCost(m, inTok, outTok, dailyCalls) }))
        .filter((r): r is { m: LLM; cost: number; month: number } => r.cost != null && r.month != null)
        .sort((a, b) => a.cost - b.cost),
    [activeModels, inTok, outTok, dailyCalls],
  );

  const providerOn = (p: string) =>
    LLMS.filter((m) => m.provider === p).every((m) => activeModels.includes(m.model));

  return (
    <div class="space-y-5">
      <div class="alert alert-info text-xs">
        价格更新于 <b>{SNAPSHOT_DATE.slice(0, 7)}</b>（快照 {SNAPSHOT_DATE}），为人工维护的参考快照；大模型与视觉平台调价频繁，正式采购请以各厂商官网公示价为准。人民币按 1 USD ≈ ¥{rate} 折算。
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="join">
          <button class={`btn btn-sm join-item ${tab === 'llm' ? 'btn-primary' : ''}`} onClick={() => setTab('llm')}>
            大模型 Token 价格
          </button>
          <button class={`btn btn-sm join-item ${tab === 'visual' ? 'btn-primary' : ''}`} onClick={() => setTab('visual')}>
            视觉生成价格
          </button>
        </div>
        <label class="flex items-center gap-2 text-sm ml-auto">
          <span class="opacity-70">汇率 USD→CNY</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            class="input input-sm input-bordered w-24"
            value={rate}
            onInput={(e) => {
              const v = Number((e.target as HTMLInputElement).value);
              setRate(Number.isFinite(v) && v > 0 ? v : DEFAULT_RATE);
            }}
          />
        </label>
      </div>

      {tab === 'llm' && (
        <div class="space-y-5">
          <div class="space-y-2">
            <div class="flex flex-wrap gap-2 items-center">
              <span class="text-sm opacity-70">厂商：</span>
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  class={`btn btn-xs ${providerOn(p) ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => toggleProvider(p)}
                >
                  {p}
                </button>
              ))}
              <button class="btn btn-xs btn-outline" onClick={() => setActiveModels(LLMS.map((m) => m.model))}>
                全选模型
              </button>
              <button class="btn btn-xs btn-outline" onClick={() => setActiveModels([])}>
                清空
              </button>
              <select
                class="select select-xs select-bordered ml-auto"
                value={sort}
                onChange={(e) => setSort((e.target as HTMLSelectElement).value as SortKey)}
              >
                <option value="in">按输入价排序</option>
                <option value="out">按输出价排序</option>
                <option value="name">按名称排序</option>
              </select>
            </div>
            <details class="text-sm">
              <summary class="cursor-pointer opacity-70 select-none">模型级勾选（点击展开，可只对比某几个模型）</summary>
              <div class="flex flex-wrap gap-x-4 gap-y-1 pt-2">
                {LLMS.map((m) => (
                  <label key={m.model} class="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-xs"
                      checked={activeModels.includes(m.model)}
                      onChange={(e) => {
                        const on = (e.target as HTMLInputElement).checked;
                        setActiveModels((prev) => (on ? [...prev, m.model] : prev.filter((x) => x !== m.model)));
                      }}
                    />
                    <span class="text-xs">
                      {m.provider} {m.model}
                    </span>
                  </label>
                ))}
              </div>
            </details>
          </div>

          <div class="overflow-x-auto">
            <table class="table table-sm table-zebra w-full">
              <thead>
                <tr>
                  <th>厂商</th>
                  <th>模型</th>
                  <th>上下文</th>
                  <th>输入 / 1M</th>
                  <th>输出 / 1M</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr>
                    <td class="whitespace-nowrap">{m.provider}</td>
                    <td class="whitespace-nowrap font-medium">{m.model}</td>
                    <td class="whitespace-nowrap opacity-70">{m.ctx}</td>
                    <td class="whitespace-nowrap">
                      <div>{usd(m.in)}</div>
                      <div class="text-xs opacity-60">{cny(m.in)}</div>
                    </td>
                    <td class="whitespace-nowrap">
                      {m.out == null ? (
                        <span class="opacity-50">—</span>
                      ) : (
                        <>
                          <div>{usd(m.out)}</div>
                          <div class="text-xs opacity-60">{cny(m.out)}</div>
                        </>
                      )}
                    </td>
                    <td class="text-xs opacity-60">{m.note ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div class="card bg-base-200 p-4 space-y-3">
            <div class="font-medium">💡 场景成本估算</div>
            <div class="flex flex-wrap gap-3 items-end">
              <label class="form-control w-32">
                <span class="label-text text-xs">输入 token 数</span>
                <input
                  type="number"
                  class="input input-sm input-bordered"
                  value={inTok}
                  onInput={(e) => setInTok(Math.max(0, +(e.target as HTMLInputElement).value || 0))}
                />
              </label>
              <label class="form-control w-32">
                <span class="label-text text-xs">输出 token 数</span>
                <input
                  type="number"
                  class="input input-sm input-bordered"
                  value={outTok}
                  onInput={(e) => setOutTok(Math.max(0, +(e.target as HTMLInputElement).value || 0))}
                />
              </label>
              <label class="form-control w-32">
                <span class="label-text text-xs">每日调用次数</span>
                <input
                  type="number"
                  class="input input-sm input-bordered"
                  value={dailyCalls}
                  onInput={(e) => setDailyCalls(Math.max(0, +(e.target as HTMLInputElement).value || 0))}
                />
              </label>
              <span class="text-xs opacity-60">按当前勾选的模型排序；月成本 = 单次成本 × 30 × 次数</span>
            </div>
            <div class="overflow-x-auto max-h-72">
              <table class="table table-sm w-full">
                <thead>
                  <tr>
                    <th>模型</th>
                    <th>单次 (USD)</th>
                    <th>月成本 (USD)</th>
                    <th>月成本约 (CNY)</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.map((r) => (
                    <tr>
                      <td class="whitespace-nowrap">
                        <span class="opacity-60">{r.m.provider} </span>
                        <span class="font-medium">{r.m.model}</span>
                      </td>
                      <td class="whitespace-nowrap">{usd(r.cost)}</td>
                      <td class="whitespace-nowrap font-medium">{usd(r.month)}</td>
                      <td class="whitespace-nowrap opacity-70">{cny(r.month)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'visual' && (
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VISUAL.map((v) => (
            <div
              class={`card bg-base-200 p-4 space-y-1 ${initialVisual === v.name ? 'ring-2 ring-primary' : ''}`}
            >
              <div class="flex items-center justify-between">
                <div class="font-medium">
                  {v.name} <span class="text-xs opacity-60">· {v.vendor}</span>
                </div>
                {v.ref && <span class="badge badge-ghost badge-xs">参考价</span>}
              </div>
              <div class="text-sm">{v.type}</div>
              <div class="text-sm font-medium">{v.price}</div>
              {v.sub && <div class="text-xs opacity-70">{v.sub}</div>}
              {v.note && <div class="text-xs opacity-60">{v.note}</div>}
            </div>
          ))}
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        价格为人工维护的参考快照（{SNAPSHOT_DATE}），字段结构参考 LiteLLM 开源价格库；汇率可自行调整并记忆在本机浏览器。所有计算均在本地完成，不上传。
      </p>
    </div>
  );
}
