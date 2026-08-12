import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Mode = 'ratio' | 'change' | 'growth';

const TABS: { key: Mode; label: string }[] = [
  { key: 'ratio', label: 'A 是 B 的百分之几' },
  { key: 'change', label: 'A 增减 P% 后' },
  { key: 'growth', label: '求增长率' },
];

/** 最多保留 4 位小数并去掉末尾多余的 0 */
function num(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return String(Number(n.toFixed(4)));
}

function parse(s: string): number | null {
  const v = s.trim();
  if (v === '' || v === '-') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type RatioResult = { ok: false; error: string } | { ok: true; pct: number; text: string };
type GrowthResult =
  | { ok: false; error: string }
  | { ok: true; pct: number; up: boolean; text: string };

export default function PercentageCalculator() {
  const [mode, setMode] = useState<Mode>('ratio');

  const [ratioA, setRatioA] = useState('30');
  const [ratioB, setRatioB] = useState('120');

  const [changeA, setChangeA] = useState('200');
  const [changeP, setChangeP] = useState('15');
  const [direction, setDirection] = useState<'up' | 'down'>('up');

  const [oldVal, setOldVal] = useState('80');
  const [newVal, setNewVal] = useState('100');

  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const ratio = useMemo<RatioResult | null>(() => {
    const a = parse(ratioA);
    const b = parse(ratioB);
    if (a === null || b === null) return null;
    if (b === 0) return { ok: false, error: '被比较的数 B 不能为 0' };
    const pct = (a / b) * 100;
    return { ok: true, pct, text: `${num(a)} 是 ${num(b)} 的 ${num(pct)}%` };
  }, [ratioA, ratioB]);

  const change = useMemo(() => {
    const a = parse(changeA);
    const p = parse(changeP);
    if (a === null || p === null) return null;
    const factor = direction === 'up' ? 1 + p / 100 : 1 - p / 100;
    const value = a * factor;
    const delta = value - a;
    return {
      value,
      delta,
      text: `${num(a)} ${direction === 'up' ? '增加' : '减少'} ${num(p)}% 后是 ${num(value)}`,
    };
  }, [changeA, changeP, direction]);

  const growth = useMemo<GrowthResult | null>(() => {
    const o = parse(oldVal);
    const n = parse(newVal);
    if (o === null || n === null) return null;
    if (o === 0) return { ok: false, error: '原数不能为 0，否则增长率无意义' };
    const pct = ((n - o) / o) * 100;
    const up = pct >= 0;
    return {
      ok: true,
      pct,
      up,
      text: `从 ${num(o)} 到 ${num(n)}，${up ? '增长' : '下降'} ${num(Math.abs(pct))}%`,
    };
  }, [oldVal, newVal]);

  return (
    <div class="space-y-5">
      <div class="join flex-wrap">
        {TABS.map((t) => (
          <button
            type="button"
            class={`btn btn-sm join-item ${mode === t.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mode === 'ratio' && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <p class="text-sm font-medium">A 是 B 的百分之几</p>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="text-xs opacity-60">数值 A</span>
              <input
                type="number"
                inputmode="decimal"
                class="input input-bordered input-sm mt-1 w-full font-mono"
                value={ratioA}
                onInput={(e) => setRatioA((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="block">
              <span class="text-xs opacity-60">数值 B（基数）</span>
              <input
                type="number"
                inputmode="decimal"
                class="input input-bordered input-sm mt-1 w-full font-mono"
                value={ratioB}
                onInput={(e) => setRatioB((e.target as HTMLInputElement).value)}
              />
            </label>
          </div>
          {!ratio && <p class="mt-3 text-sm text-error">请输入有效数值</p>}
          {ratio && !ratio.ok && <p class="mt-3 text-sm text-error">{ratio.error}</p>}
          {ratio && ratio.ok && (
            <>
              <div class="mt-4 flex items-center gap-3">
                <span class="text-3xl font-bold font-mono">{num(ratio.pct)}%</span>
                <button
                  type="button"
                  class={`btn btn-xs ml-auto ${copied === 'ratio' ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => copy(ratio.text, 'ratio')}
                >
                  {copied === 'ratio' ? '已复制' : '复制'}
                </button>
              </div>
              <p class="mt-1 text-sm opacity-70">{ratio.text}</p>
            </>
          )}
          <p class="mt-3 text-xs opacity-55">公式：A ÷ B × 100%</p>
        </div>
      )}

      {mode === 'change' && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <p class="text-sm font-medium">某个数增加或减少百分之几后是多少</p>
          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <label class="block">
              <span class="text-xs opacity-60">原数 A</span>
              <input
                type="number"
                inputmode="decimal"
                class="input input-bordered input-sm mt-1 w-full font-mono"
                value={changeA}
                onInput={(e) => setChangeA((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="block">
              <span class="text-xs opacity-60">变化方向</span>
              <select
                class="select select-bordered select-sm mt-1 w-full"
                value={direction}
                onChange={(e) =>
                  setDirection((e.target as HTMLSelectElement).value as 'up' | 'down')
                }
              >
                <option value="up">增加</option>
                <option value="down">减少</option>
              </select>
            </label>
            <label class="block">
              <span class="text-xs opacity-60">百分比 P（%）</span>
              <input
                type="number"
                inputmode="decimal"
                class="input input-bordered input-sm mt-1 w-full font-mono"
                value={changeP}
                onInput={(e) => setChangeP((e.target as HTMLInputElement).value)}
              />
            </label>
          </div>
          {!change && <p class="mt-3 text-sm text-error">请输入有效数值</p>}
          {change && (
            <>
              <div class="mt-4 flex items-center gap-3">
                <span class="text-3xl font-bold font-mono">{num(change.value)}</span>
                <span class={`badge ${change.delta >= 0 ? 'badge-success' : 'badge-error'}`}>
                  {change.delta >= 0 ? '+' : ''}
                  {num(change.delta)}
                </span>
                <button
                  type="button"
                  class={`btn btn-xs ml-auto ${copied === 'change' ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => copy(change.text, 'change')}
                >
                  {copied === 'change' ? '已复制' : '复制'}
                </button>
              </div>
              <p class="mt-1 text-sm opacity-70">{change.text}</p>
            </>
          )}
          <p class="mt-3 text-xs opacity-55">公式：A × (1 ± P ÷ 100)</p>
        </div>
      )}

      {mode === 'growth' && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <p class="text-sm font-medium">已知原数与新数，求增长率</p>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="text-xs opacity-60">原数</span>
              <input
                type="number"
                inputmode="decimal"
                class="input input-bordered input-sm mt-1 w-full font-mono"
                value={oldVal}
                onInput={(e) => setOldVal((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="block">
              <span class="text-xs opacity-60">新数</span>
              <input
                type="number"
                inputmode="decimal"
                class="input input-bordered input-sm mt-1 w-full font-mono"
                value={newVal}
                onInput={(e) => setNewVal((e.target as HTMLInputElement).value)}
              />
            </label>
          </div>
          {!growth && <p class="mt-3 text-sm text-error">请输入有效数值</p>}
          {growth && !growth.ok && <p class="mt-3 text-sm text-error">{growth.error}</p>}
          {growth && growth.ok && (
            <>
              <div class="mt-4 flex items-center gap-3">
                <span
                  class={`text-3xl font-bold font-mono ${growth.up ? 'text-success' : 'text-error'}`}
                >
                  {growth.up ? '+' : '−'}
                  {num(Math.abs(growth.pct))}%
                </span>
                <span class={`badge ${growth.up ? 'badge-success' : 'badge-error'}`}>
                  {growth.up ? '增长' : '下降'}
                </span>
                <button
                  type="button"
                  class={`btn btn-xs ml-auto ${copied === 'growth' ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => copy(growth.text, 'growth')}
                >
                  {copied === 'growth' ? '已复制' : '复制'}
                </button>
              </div>
              <p class="mt-1 text-sm opacity-70">{growth.text}</p>
            </>
          )}
          <p class="mt-3 text-xs opacity-55">公式：(新数 − 原数) ÷ 原数 × 100%</p>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        结果最多保留 4 位小数并自动去除末尾多余的零。所有计算均在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
