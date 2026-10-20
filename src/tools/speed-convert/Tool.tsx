import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { speedConvert, type SpeedUnit } from '@/lib/convert-tools';
import { parseNumber } from '@/lib/tool-result';

const UNITS: { id: SpeedUnit; label: string }[] = [
  { id: 'kmh', label: '公里/时 km/h' },
  { id: 'mph', label: '英里/时 mph' },
  { id: 'ms', label: '米/秒 m/s' },
  { id: 'knot', label: '节 kn' },
];

export default function SpeedConvert() {
  const [value, setValue] = useState('100');
  const [from, setFrom] = useState<SpeedUnit>('kmh');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const v = parseNumber(value, { name: '速度', min: 0 });
    if (!v.ok) return v;
    return speedConvert(v.data, from);
  }, [value, from]);

  const rows = result && result.ok
    ? (Object.keys(result.data) as SpeedUnit[]).map((u) => ({ label: UNITS.find((x) => x.id === u)!.label, val: result.data[u] }))
    : [];

  const copy = async () => {
    if (!result || !result.ok) return;
    await copyText(rows.map((r) => `${r.label}\t${r.val}`).join('\n'));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">数值</span>
            <input
              type="number"
              step="any"
              min="0"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={value}
              onInput={(e) => setValue((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">原单位</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={from}
              onChange={(e) => setFrom((e.target as HTMLSelectElement).value as SpeedUnit)}
            >
              {UNITS.map((u) => (
                <option value={u.id}>{u.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {result && !result.ok && (
        <p class="text-sm text-error" role="alert">
          {result.error}
        </p>
      )}

      {result && result.ok && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">换算结果</span>
            <button
              type="button"
              class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
              onClick={copy}
            >
              {copied ? '已复制' : '复制结果'}
            </button>
          </div>
          <div class="mt-3 overflow-x-auto">
            <table class="table table-sm">
              <tbody>
                {rows.map((r) => (
                  <tr>
                    <td>{r.label}</td>
                    <td class="text-right font-mono">{r.val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        换算在浏览器本地完成。1 英里 ≈ 1.609 公里，1 节 = 1.852 公里/时。
      </p>
    </div>
  );
}
