import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/** 千分位金额，保留两位小数 */
function money(n: number): string {
  const fixed = n.toFixed(2);
  const [int = '0', dec = '00'] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

type Mode = 'once' | 'compound' | 'monthly';

const MODE_LABEL: Record<Mode, string> = {
  once: '到期一次性还本付息（单利）',
  compound: '自动转存（复利）',
  monthly: '按月付息（按月取息）',
};

const PRESETS: { label: string; years: number }[] = [
  { label: '3 个月', years: 0.25 },
  { label: '6 个月', years: 0.5 },
  { label: '1 年', years: 1 },
  { label: '2 年', years: 2 },
  { label: '3 年', years: 3 },
  { label: '5 年', years: 5 },
];

export default function DepositInterest() {
  const [principal, setPrincipal] = useState('100000');
  const [rate, setRate] = useState('2.0');
  const [years, setYears] = useState('3');
  const [mode, setMode] = useState<Mode>('compound');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const result = useMemo(() => {
    const p = Number(principal.trim());
    const r = Number(rate.trim());
    const y = Number(years.trim());
    if (![p, r, y].every(Number.isFinite)) return { error: '请输入有效的本金、利率与存期' };
    if (p < 0) return { error: '本金不能为负' };
    if (r < 0) return { error: '利率不能为负' };
    if (y <= 0) return { error: '存期需大于 0' };
    const annualRate = r / 100;
    let interest: number;
    let monthly = 0;
    if (mode === 'once') {
      interest = p * annualRate * y;
    } else if (mode === 'compound') {
      interest = p * (Math.pow(1 + annualRate, y) - 1);
    } else {
      monthly = (p * annualRate) / 12;
      interest = monthly * y * 12;
    }
    const total = p + interest;
    return { p, r, y, interest, total, monthly, mode };
  }, [principal, rate, years, mode]);

  const summary =
    result && !('error' in result)
      ? `本金 ${money(result.p)} 元，年利率 ${result.r}%，存 ${result.y} 年（${MODE_LABEL[result.mode]}）；利息 ${money(result.interest)} 元，到期本息 ${money(result.total)} 元`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">本金（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={principal}
              onInput={(e) => setPrincipal((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">年利率（%）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="0.01"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={rate}
              onInput={(e) => setRate((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">存期（年，可填小数，如 0.25 为 3 个月）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="0.25"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={years}
              onInput={(e) => setYears((e.target as HTMLInputElement).value)}
            />
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              {PRESETS.map((pr) => (
                <button
                  type="button"
                  class="btn btn-xs btn-outline"
                  onClick={() => setYears(String(pr.years))}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">计息方式</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={mode}
              onChange={(e) => setMode((e.target as HTMLSelectElement).value as Mode)}
            >
              <option value="once">到期一次性还本付息（单利）</option>
              <option value="compound">自动转存（复利）</option>
              <option value="monthly">按月付息（按月取息）</option>
            </select>
          </label>
        </div>

        {result && 'error' in result && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && !('error' in result) && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">到期利息</p>
                <p class="text-3xl font-bold font-mono text-warning">{money(result.interest)}</p>
              </div>
              <span class="badge badge-outline mb-1">本息合计 {money(result.total)} 元</span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'di' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'di')}
              >
                {copied === 'di' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">本金</td>
                    <td class="font-mono text-right">{money(result.p)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">年利率 / 存期</td>
                    <td class="font-mono text-right">
                      {result.r}% / {result.y} 年
                    </td>
                  </tr>
                  <tr>
                    <td class="opacity-60">计息方式</td>
                    <td class="font-mono text-right">{MODE_LABEL[result.mode]}</td>
                  </tr>
                  {result.mode === 'monthly' && (
                    <tr>
                      <td class="opacity-60">每月利息</td>
                      <td class="font-mono text-right">{money(result.monthly)} 元</td>
                    </tr>
                  )}
                  <tr>
                    <td class="opacity-60">利息合计</td>
                    <td class="font-mono text-right text-warning">{money(result.interest)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">到期本息合计</td>
                    <td class="font-mono text-right font-medium">{money(result.total)} 元</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        一次性付息按单利（本金 × 年利率 × 年数）；自动转存按年复利（本金 × (1+年利率)^年数 − 本金）；按月付息每月派息、本金期末归还，本质为单利。自 2008
        年起储蓄存款利息暂免个税，本工具按免税口径计算。利率为年化利率；大额存单提前支取通常按活期计息，实际收益以银行挂牌与合同为准；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
