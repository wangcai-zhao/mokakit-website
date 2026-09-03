import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/**
 * 燃油效率是非线性换算：
 *  - "每距离耗油"（L/100km、L/100mi）与"每单位油跑距离"（km/L、mi/L、mpg）互为倒数。
 *  - 统一以 L/100km 为基准 x，其余单位用 toBase/fromBase 映射。
 */
interface FE {
  id: string;
  name: string;
  symbol: string;
  toBase: (v: number) => number; // -> L/100km
  fromBase: (x: number) => number; // L/100km -> 该单位
}

const UNITS: FE[] = [
  { id: 'l100km', name: '升/百公里', symbol: 'L/100km', toBase: (v) => v, fromBase: (x) => x },
  { id: 'kmpl', name: '公里/升', symbol: 'km/L', toBase: (v) => 100 / v, fromBase: (x) => 100 / x },
  { id: 'mipl', name: '英里/升', symbol: 'mi/L', toBase: (v) => 62.1371192 / v, fromBase: (x) => 62.1371192 / x },
  { id: 'mpgus', name: '英里/加仑(美)', symbol: 'mpg(US)', toBase: (v) => 235.214583 / v, fromBase: (x) => 235.214583 / x },
  { id: 'mpguk', name: '英里/加仑(英)', symbol: 'mpg(UK)', toBase: (v) => 282.480937 / v, fromBase: (x) => 282.480937 / x },
  { id: 'l100mi', name: '升/百英里', symbol: 'L/100mi', toBase: (v) => v / 1.609344, fromBase: (x) => 1.609344 * x },
];

function num(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return String(Number(n.toPrecision(10)));
}

export default function FuelEfficiencyConvert() {
  const [value, setValue] = useState('8');
  const [unitId, setUnitId] = useState('l100km');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const sel = UNITS.find((u) => u.id === unitId) ?? UNITS[0];

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const result = useMemo(() => {
    const raw = value.trim();
    if (raw === '' || raw === '-' || raw === '−') return null;
    const v = Number(raw.replace('−', '-'));
    if (!Number.isFinite(v) || v === 0) return null; // 能效类不能为 0，避免除零
    const baseX = sel.toBase(v);
    return UNITS.map((u) => ({ u, val: u.fromBase(baseX) }));
  }, [value, sel]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">输入燃油效率</span>
          <div class="join mt-1.5 w-full">
            <input
              type="number"
              inputmode="decimal"
              step="any"
              class="input input-bordered input-sm join-item flex-1 font-mono"
              placeholder="例如 8"
              value={value}
              onInput={(e) => setValue((e.target as HTMLInputElement).value)}
            />
            <select
              class="select select-bordered select-sm join-item"
              value={unitId}
              onChange={(e) => setUnitId((e.target as HTMLSelectElement).value)}
            >
              {UNITS.map((u) => (
                <option value={u.id}>
                  {u.symbol} {u.name}
                </option>
              ))}
            </select>
          </div>
        </label>

        {!result && (
          <p class="mt-3 text-sm opacity-60">
            {value.trim() === '0' ? '能效类数值不能为零，请输入大于 0 的数' : '请输入一个数值开始换算'}
          </p>
        )}

        {result && (
          <ul class="mt-4 space-y-2">
            {result.map(({ u, val }) => {
              const active = u.id === unitId;
              const text = `${num(val)} ${u.symbol}`;
              return (
                <li
                  class={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                    active ? 'bg-primary/10 border border-primary/30' : 'bg-base-100'
                  }`}
                >
                  <span class="w-28 shrink-0 text-sm opacity-60">{u.name}</span>
                  <code class="flex-1 font-mono text-lg font-semibold break-all">
                    {num(val)} {u.symbol}
                  </code>
                  {active && <span class="badge badge-primary badge-sm shrink-0">输入</span>}
                  <button
                    type="button"
                    class={`btn btn-xs shrink-0 ${copied === u.id ? 'btn-success' : 'btn-ghost'}`}
                    onClick={() => copy(text, u.id)}
                  >
                    {copied === u.id ? '已复制' : '复制'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        以升每百公里（L/100km）为统一基准中转。注意 L/100km 与 km/L、mpg 方向相反（一个越小越省，一个越大越省）；美制与英制加仑不同，30 mpg(US) ≈ 7.84 L/100km，30
        mpg(UK) ≈ 9.41 L/100km。全部计算均在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
