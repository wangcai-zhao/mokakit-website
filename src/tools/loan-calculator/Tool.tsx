import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type TermUnit = 'year' | 'month';

/** 千分位金额，保留两位小数 */
function money(n: number): string {
  const fixed = n.toFixed(2);
  const [int = '0', dec = '00'] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

type Result =
  | { ok: false; error: string }
  | { ok: true; monthly: number; total: number; interest: number; n: number; ratio: number };

export default function LoanCalculator() {
  const [principal, setPrincipal] = useState('1000000');
  const [rate, setRate] = useState('3.85');
  const [term, setTerm] = useState('30');
  const [unit, setUnit] = useState<TermUnit>('year');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const result = useMemo<Result | null>(() => {
    const p = Number(principal.trim());
    const annual = Number(rate.trim());
    const t = Number(term.trim());
    if (!Number.isFinite(p) || !Number.isFinite(annual) || !Number.isFinite(t)) return null;
    if (p <= 0) return { ok: false, error: '贷款本金需大于 0' };
    if (annual < 0) return { ok: false, error: '年利率不能为负数' };
    const n = unit === 'year' ? Math.round(t * 12) : Math.round(t);
    if (n <= 0) return { ok: false, error: '还款期限需大于 0' };
    if (n > 720) return { ok: false, error: '还款期限过长，请控制在 60 年（720 期）以内' };

    const r = annual / 100 / 12;
    const monthly = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    if (!Number.isFinite(monthly)) return { ok: false, error: '数值超出可计算范围，请检查输入' };
    const total = monthly * n;
    const interest = total - p;
    return {
      ok: true,
      monthly,
      total,
      interest,
      n,
      ratio: (interest / p) * 100,
    };
  }, [principal, rate, term, unit]);

  const summary =
    result && result.ok
      ? `贷款 ${money(Number(principal))} 元，年利率 ${rate}%，共 ${result.n} 期；月供 ${money(result.monthly)} 元，总利息 ${money(result.interest)} 元，还款总额 ${money(result.total)} 元`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">贷款本金（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 1000000"
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
              step={0.01}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 3.85"
              value={rate}
              onInput={(e) => setRate((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">还款期限</span>
            <div class="join mt-1.5 w-full">
              <input
                type="number"
                inputmode="numeric"
                min={1}
                class="input input-bordered input-sm join-item flex-1 font-mono"
                placeholder="例如 30"
                value={term}
                onInput={(e) => setTerm((e.target as HTMLInputElement).value)}
              />
              <select
                class="select select-bordered select-sm join-item"
                value={unit}
                onChange={(e) => setUnit((e.target as HTMLSelectElement).value as TermUnit)}
              >
                <option value="year">年</option>
                <option value="month">月</option>
              </select>
            </div>
          </label>
        </div>

        {!result && <p class="mt-3 text-sm text-error">请填写完整且有效的贷款信息</p>}
        {result && !result.ok && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && result.ok && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">每月月供</p>
                <p class="text-3xl font-bold font-mono">{money(result.monthly)}</p>
              </div>
              <span class="badge badge-outline mb-1">共 {result.n} 期</span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'loan' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'loan')}
              >
                {copied === 'loan' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">贷款本金</td>
                    <td class="font-mono text-right">{money(Number(principal))} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">支付总利息</td>
                    <td class="font-mono text-right text-warning">{money(result.interest)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">还款总额</td>
                    <td class="font-mono text-right font-medium">{money(result.total)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">利息占本金比例</td>
                    <td class="font-mono text-right">{result.ratio.toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        采用等额本息公式测算：月供 = 本金 × 月利率 ×
        (1+月利率)^期数 ÷ ((1+月利率)^期数 − 1)。未计入手续费、保险费及利率浮动，结果仅供参考，实际还款以贷款合同为准。所有计算在浏览器本地完成。
      </p>
    </div>
  );
}
