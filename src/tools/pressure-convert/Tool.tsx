import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { CATEGORY_BY_ID, findUnit, convert, type Unit } from '@/tools/unit-convert/units';

const CAT = CATEGORY_BY_ID.get('pressure')!;
const UNITS: Unit[] = CAT.units; // 9 个单位，含 pa，系数唯一真源来自 unit-convert

/** 最多保留 10 位有效数字并去掉末尾多余的 0 */
function num(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return String(Number(n.toPrecision(10)));
}

export default function PressureConvert() {
  const [value, setValue] = useState('1');
  const [unitId, setUnitId] = useState('bar');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const sel = findUnit('pressure', unitId)!;

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
    if (!Number.isFinite(v)) return null;
    // 压力单位均为纯比例换算，无零点偏移，直接用集中式 convert
    return UNITS.map((u) => ({ u, val: convert(v, sel, u) }));
  }, [value, sel]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">输入压力</span>
          <div class="join mt-1.5 w-full">
            <input
              type="number"
              inputmode="decimal"
              step="any"
              class="input input-bordered input-sm join-item flex-1 font-mono"
              placeholder="例如 2.5"
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
                  <span class="w-24 shrink-0 text-sm opacity-60">{u.name}</span>
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
        所有换算以帕斯卡（Pa）为统一基准，例如 1 bar = 100,000 Pa、1 atm = 101,325
        Pa、1 psi ≈ 6,894.76 Pa、1 mmHg ≈ 133.322 Pa。结果保留有效数字。全部计算均在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
