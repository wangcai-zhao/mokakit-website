import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { angleConvert, type AngleUnit } from '@/lib/convert-tools';
import { parseNumber } from '@/lib/tool-result';

const UNITS: { id: AngleUnit; label: string }[] = [
  { id: 'deg', label: '角度 (°)' },
  { id: 'rad', label: '弧度 (rad)' },
  { id: 'grad', label: '梯度 (grad)' },
];

export default function AngleConvert() {
  const [value, setValue] = useState('30');
  const [from, setFrom] = useState<AngleUnit>('deg');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const v = parseNumber(value, { name: '角度' });
    if (!v.ok) return v;
    return angleConvert(v.data, from);
  }, [value, from]);

  const rows = result && result.ok
    ? [
        { label: '角度 (°)', val: result.data.deg },
        { label: '弧度 (rad)', val: result.data.rad },
        { label: '梯度 (grad)', val: result.data.grad },
        { label: '度分秒 (DMS)', val: result.data.dms },
      ]
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
              onChange={(e) => setFrom((e.target as HTMLSelectElement).value as AngleUnit)}
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
        换算在浏览器本地完成。180 度等于 π 弧度，1 梯度 = 0.9 度，度分秒格式为 度′分″。
      </p>
    </div>
  );
}
