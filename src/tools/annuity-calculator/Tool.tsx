import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { annuity } from '@/lib/finance-tools';
import { parseNumber } from '@/lib/tool-result';

export default function AnnuityCalculator() {
  const [perPeriod, setPerPeriod] = useState('1000');
  const [periods, setPeriods] = useState('12');
  const [ratePct, setRatePct] = useState('1');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const p = parseNumber(perPeriod, { name: '每期金额' });
    if (!p.ok) return p;
    const n = parseNumber(periods, { name: '期数' });
    if (!n.ok) return n;
    if (!Number.isInteger(n.data) || n.data < 1) {
      return { ok: false as const, error: '期数须为不小于 1 的整数' };
    }
    const r = parseNumber(ratePct, { name: '每期利率' });
    if (!r.ok) return r;
    return annuity(p.data, n.data, r.data);
  }, [perPeriod, periods, ratePct]);

  const rows = result && result.ok
    ? [
        { label: '年金终值 (FV)', val: `${result.data.fv}` },
        { label: '年金现值 (PV)', val: `${result.data.pv}` },
        { label: '本金合计', val: `${result.data.totalPrincipal}` },
        { label: '利息合计', val: `${result.data.totalInterest}` },
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
            <span class="text-sm font-medium">每期金额</span>
            <input
              type="number"
              step="any"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={perPeriod}
              onInput={(e) => setPerPeriod((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">期数</span>
            <input
              type="number"
              step="1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={periods}
              onInput={(e) => setPeriods((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">每期利率 (%)</span>
            <input
              type="number"
              step="any"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={ratePct}
              onInput={(e) => setRatePct((e.target as HTMLInputElement).value)}
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
            <span class="text-sm font-medium">年金结果</span>
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
        计算在浏览器本地完成。普通年金（每期末收付）：终值 FV 是未来本息和，现值 PV 是折算到今天的金额；利率为 0 时两者都等于本金合计。
      </p>
    </div>
  );
}
