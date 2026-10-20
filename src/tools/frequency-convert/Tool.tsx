import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { frequencyConvert, type FreqUnit } from '@/lib/convert-tools';
import { parseNumber } from '@/lib/tool-result';

const UNITS: { id: FreqUnit; label: string }[] = [
  { id: 'Hz', label: '赫兹 Hz' },
  { id: 'kHz', label: '千赫 kHz' },
  { id: 'MHz', label: '兆赫 MHz' },
  { id: 'GHz', label: '吉赫 GHz' },
];

export default function FrequencyConvert() {
  const [value, setValue] = useState('2.4');
  const [from, setFrom] = useState<FreqUnit>('GHz');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const v = parseNumber(value, { name: '频率', min: 0 });
    if (!v.ok) return v;
    return frequencyConvert(v.data, from);
  }, [value, from]);

  const rows = result && result.ok
    ? (Object.keys(result.data) as FreqUnit[]).map((u) => ({ label: UNITS.find((x) => x.id === u)!.label, val: result.data[u] }))
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
              onChange={(e) => setFrom((e.target as HTMLSelectElement).value as FreqUnit)}
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
        换算在浏览器本地完成。相邻单位相差 1000 倍：1 GHz = 1000 MHz = 1,000,000 Hz。
      </p>
    </div>
  );
}
