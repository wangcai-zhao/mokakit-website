import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { dataRateConvert, type DataRateUnit } from '@/lib/convert-tools';
import { parseNumber } from '@/lib/tool-result';

const UNITS: { id: DataRateUnit; label: string }[] = [
  { id: 'bps', label: 'bps' },
  { id: 'kbps', label: 'kbps' },
  { id: 'Mbps', label: 'Mbps' },
  { id: 'Gbps', label: 'Gbps' },
];

export default function DataRateConvert() {
  const [value, setValue] = useState('100');
  const [from, setFrom] = useState<DataRateUnit>('Mbps');
  const [base, setBase] = useState<1000 | 1024>(1000);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const v = parseNumber(value, { name: '速率', min: 0 });
    if (!v.ok) return v;
    return dataRateConvert(v.data, from, base);
  }, [value, from, base]);

  const rows = result && result.ok
    ? (Object.keys(result.data) as DataRateUnit[]).map((u) => ({ label: u, val: result.data[u] }))
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
              onChange={(e) => setFrom((e.target as HTMLSelectElement).value as DataRateUnit)}
            >
              {UNITS.map((u) => (
                <option value={u.id}>{u.label}</option>
              ))}
            </select>
          </label>
        </div>
        <label class="mt-3 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={base === 1024}
            onInput={(e) => setBase((e.target as HTMLInputElement).checked ? 1024 : 1000)}
          />
          使用二进制基准（1024，KiB/s 等）
        </label>
      </div>

      {result && !result.ok && (
        <p class="text-sm text-error" role="alert">
          {result.error}
        </p>
      )}

      {result && result.ok && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">换算结果（{base === 1024 ? '二进制' : '十进制'}）</span>
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
        换算在浏览器本地完成。网络带宽常用十进制（1 Mbps = 1,000,000 bps），存储系统常用二进制（1 MiB/s = 1,048,576 B/s）。
      </p>
    </div>
  );
}
