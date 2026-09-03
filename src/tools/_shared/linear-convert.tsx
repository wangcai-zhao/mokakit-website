import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

export interface LinUnit {
  id: string;
  name: string;
  symbol: string;
  /** 1 个该单位 = factor 个基准单位 */
  factor: number;
}

/**
 * 通用线性比例换算岛屿。
 * 所有同量纲单位互转（无零点偏移）都用它，避免 14 个工具重复同样的 UI 代码。
 * 调用方只需提供单位表（factor 相对统一基准）与一段说明文案。
 */
export default function LinearConvert({
  units,
  note,
}: {
  units: LinUnit[];
  note?: string;
}) {
  const [value, setValue] = useState('1');
  const [unitId, setUnitId] = useState(units[0]?.id ?? '');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const sel = units.find((u) => u.id === unitId) ?? units[0];

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const num = (n: number): string => {
    if (!Number.isFinite(n)) return '—';
    return String(Number(n.toPrecision(10)));
  };

  const result = useMemo(() => {
    const raw = value.trim();
    if (raw === '' || raw === '-' || raw === '−') return null;
    const v = Number(raw.replace('−', '-'));
    if (!Number.isFinite(v)) return null;
    const baseVal = v * sel.factor;
    return units.map((u) => ({ u, val: baseVal / u.factor }));
  }, [value, sel, units]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">输入数值</span>
          <div class="join mt-1.5 w-full">
            <input
              type="number"
              inputmode="decimal"
              step="any"
              class="input input-bordered input-sm join-item flex-1 font-mono"
              placeholder="例如 1"
              value={value}
              onInput={(e) => setValue((e.target as HTMLInputElement).value)}
            />
            <select
              class="select select-bordered select-sm join-item"
              value={unitId}
              onChange={(e) => setUnitId((e.target as HTMLSelectElement).value)}
            >
              {units.map((u) => (
                <option value={u.id}>
                  {u.symbol} {u.name}
                </option>
              ))}
            </select>
          </div>
        </label>

        {!result && <p class="mt-3 text-sm opacity-60">请输入一个数值开始换算</p>}

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

      {note && <p class="text-xs opacity-55 leading-relaxed">{note}</p>}
    </div>
  );
}
