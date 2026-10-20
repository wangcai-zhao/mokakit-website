import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { calcCagr } from '@/lib/finance-tools';
import { parseNumber } from '@/lib/tool-result';

export default function CagrCalculator() {
  const [start, setStart] = useState('100');
  const [end, setEnd] = useState('200');
  const [years, setYears] = useState('5');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const s = parseNumber(start, { name: '期初值' });
    if (!s.ok) return s;
    const e = parseNumber(end, { name: '期末值' });
    if (!e.ok) return e;
    const y = parseNumber(years, { name: '年数' });
    if (!y.ok) return y;
    return calcCagr(s.data, e.data, y.data);
  }, [start, end, years]);

  const rows = result && result.ok
    ? [
        { label: '年化增长率 (CAGR)', val: `${result.data.cagr}%` },
        { label: '增长倍数', val: `${result.data.multiple}×` },
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
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="text-sm font-medium">期初值</span>
            <input
              type="number"
              step="any"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={start}
              onInput={(e) => setStart((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">期末值</span>
            <input
              type="number"
              step="any"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={end}
              onInput={(e) => setEnd((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">年数</span>
            <input
              type="number"
              step="any"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={years}
              onInput={(e) => setYears((e.target as HTMLInputElement).value)}
            />
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
            <span class="text-sm font-medium">计算结果</span>
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
        计算在浏览器本地完成。CAGR 衡量期初到期末的等效年化复合增长率，公式为 (期末/期初)^(1/年数)-1，适合评估投资、营收和用户的长期增长。
      </p>
    </div>
  );
}
