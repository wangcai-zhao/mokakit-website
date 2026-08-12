import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Unit = 'C' | 'F' | 'K';

const UNITS: { key: Unit; label: string; symbol: string }[] = [
  { key: 'C', label: '摄氏度', symbol: '℃' },
  { key: 'F', label: '华氏度', symbol: '℉' },
  { key: 'K', label: '开尔文', symbol: 'K' },
];

/** 常见温度参考点（摄氏度） */
const PRESETS = [
  { label: '绝对零度', c: -273.15 },
  { label: '水的冰点', c: 0 },
  { label: '常温', c: 25 },
  { label: '人体体温', c: 37 },
  { label: '水的沸点', c: 100 },
  { label: '烤箱 180 度', c: 180 },
];

/** 任意单位换算为摄氏度 */
function toCelsius(v: number, unit: Unit): number {
  if (unit === 'C') return v;
  if (unit === 'F') return ((v - 32) * 5) / 9;
  return v - 273.15;
}

/** 最多保留 4 位小数并去掉末尾多余的 0 */
function num(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return String(Number(n.toFixed(4)));
}

type Result =
  | { ok: false; error: string }
  | { ok: true; C: number; F: number; K: number };

export default function TemperatureConvert() {
  const [value, setValue] = useState('25');
  const [unit, setUnit] = useState<Unit>('C');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const result = useMemo<Result | null>(() => {
    const raw = value.trim();
    if (raw === '' || raw === '-' || raw === '−') return null;
    const v = Number(raw.replace('−', '-'));
    if (!Number.isFinite(v)) return { ok: false, error: '请输入有效的数值' };
    const c = toCelsius(v, unit);
    if (c < -273.15) return { ok: false, error: '低于绝对零度（−273.15℃），物理上不存在' };
    return {
      ok: true,
      C: c,
      F: (c * 9) / 5 + 32,
      K: c + 273.15,
    };
  }, [value, unit]);

  const applyPreset = (c: number) => {
    setUnit('C');
    setValue(String(c));
  };

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">输入温度</span>
          <div class="join mt-1.5 w-full">
            <input
              type="number"
              inputmode="decimal"
              step="any"
              class="input input-bordered input-sm join-item flex-1 font-mono"
              placeholder="例如 25"
              value={value}
              onInput={(e) => setValue((e.target as HTMLInputElement).value)}
            />
            <select
              class="select select-bordered select-sm join-item"
              value={unit}
              onChange={(e) => setUnit((e.target as HTMLSelectElement).value as Unit)}
            >
              {UNITS.map((u) => (
                <option value={u.key}>
                  {u.symbol} {u.label}
                </option>
              ))}
            </select>
          </div>
        </label>

        {!result && <p class="mt-3 text-sm opacity-60">请输入一个数值开始换算</p>}
        {result && !result.ok && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && result.ok && (
          <ul class="mt-4 space-y-2">
            {UNITS.map((u) => {
              const active = u.key === unit;
              const val = result[u.key];
              const text = `${num(val)} ${u.symbol}`;
              return (
                <li
                  class={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                    active ? 'bg-primary/10 border border-primary/30' : 'bg-base-100'
                  }`}
                >
                  <span class="w-20 shrink-0 text-sm opacity-60">{u.label}</span>
                  <code class="flex-1 font-mono text-lg font-semibold break-all">
                    {num(val)} {u.symbol}
                  </code>
                  {active && <span class="badge badge-primary badge-sm shrink-0">输入</span>}
                  <button
                    type="button"
                    class={`btn btn-xs shrink-0 ${copied === u.key ? 'btn-success' : 'btn-ghost'}`}
                    onClick={() => copy(text, u.key)}
                  >
                    {copied === u.key ? '已复制' : '复制'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <p class="text-sm font-medium">常见温度参考</p>
        <div class="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button type="button" class="btn btn-xs btn-outline" onClick={() => applyPreset(p.c)}>
              {p.label} {p.c}℃
            </button>
          ))}
        </div>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        换算公式：℃ = (℉ − 32) × 5 ÷ 9，℉ = ℃ × 9 ÷ 5 + 32，K = ℃ +
        273.15。结果最多保留 4 位小数。所有计算均在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
