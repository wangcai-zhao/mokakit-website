import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import {
  calcEarlyRepayment,
  type RepayMethod,
  type EarlyMode,
} from '@/lib/mortgage';

/** 千分位金额，保留两位小数 */
function money(n: number): string {
  const fixed = Number(n).toFixed(2);
  const [int = '0', dec = '00'] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

/** 期数 → 年+月 文案 */
function fmtPeriod(p: number): string {
  const y = Math.floor(p / 12);
  const m = p % 12;
  if (y === 0) return `${m} 个月`;
  if (m === 0) return `${y} 年`;
  return `${y} 年 ${m} 个月`;
}

type ResultOrErr =
  | { error: string }
  | (ReturnType<typeof calcEarlyRepayment> & { _ok: true });

export default function MortgageEarlyRepayment() {
  const [principal, setPrincipal] = useState('1000000');
  const [rate, setRate] = useState('3.85');
  const [termYears, setTermYears] = useState('30');
  const [paidMonths, setPaidMonths] = useState('0');
  const [prepay, setPrepay] = useState('200000');
  const [method, setMethod] = useState<RepayMethod>('equal-payment');
  const [mode, setMode] = useState<EarlyMode>('shorten');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const result = useMemo<ResultOrErr | null>(() => {
    const p = Number(principal.trim());
    const annual = Number(rate.trim());
    const ty = Number(termYears.trim());
    const pm = Number(paidMonths.trim());
    const pr = Number(prepay.trim());
    if (![p, annual, ty, pm, pr].every(Number.isFinite)) return null;
    if (p <= 0) return { error: '贷款本金需大于 0' };
    if (annual < 0) return { error: '年利率不能为负数' };
    if (ty <= 0) return { error: '贷款期限需大于 0' };
    const periods = Math.round(ty * 12);
    if (periods <= 0 || periods > 720) return { error: '期限请控制在 60 年（720 期）内' };
    if (pm < 0 || pm >= periods) return { error: '已还月数需在 0 到总期数之间' };
    if (pr <= 0) return { error: '提前还款金额需大于 0' };
    try {
      return { ...calcEarlyRepayment({ principal: p, annualRatePct: annual, periods, method, paidPeriods: pm, prepayAmount: pr, mode }), _ok: true };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [principal, rate, termYears, paidMonths, prepay, method, mode]);

  const summary =
    result && '_ok' in result
      ? `房贷提前还款（${method === 'equal-payment' ? '等额本息' : '等额本金'}，${
          mode === 'shorten' ? '缩短期限' : '减少月供'
        }）：提前还 ${money(result.prepayAmount)} 元，提前还款前剩余本金 ${money(
          result.remainingBeforePrepay
        )}，新本金 ${money(result.newPrincipal)}，新期限 ${fmtPeriod(
          result.newPeriods
        )}，预计节省利息 ${money(result.savedInterest)} 元`
      : '';

  const origMonthly =
    result && '_ok' in result
      ? method === 'equal-payment'
        ? result.originalMonthly
        : '—'
      : '—';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">贷款本金（元）</span>
            <input
              type="number"
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
              min={0}
              step={0.01}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={rate}
              onInput={(e) => setRate((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">原贷款期限（年）</span>
            <input
              type="number"
              min={1}
              step={1}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={termYears}
              onInput={(e) => setTermYears((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">已还月数</span>
            <input
              type="number"
              min={0}
              step={1}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={paidMonths}
              onInput={(e) => setPaidMonths((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">本次提前还款金额（元）</span>
            <input
              type="number"
              min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={prepay}
              onInput={(e) => setPrepay((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">还款方式</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={method}
              onChange={(e) => setMethod((e.target as HTMLSelectElement).value as RepayMethod)}
            >
              <option value="equal-payment">等额本息</option>
              <option value="equal-principal">等额本金</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium">提前还款处理</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={mode}
              onChange={(e) => setMode((e.target as HTMLSelectElement).value as EarlyMode)}
            >
              <option value="shorten">缩短期限（月供不变）</option>
              <option value="reduce">减少月供（期限不变）</option>
            </select>
          </label>
        </div>

        {result && 'error' in result && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && '_ok' in result && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">预计节省利息</p>
                <p class="text-3xl font-bold font-mono text-success">{money(result.savedInterest)}</p>
              </div>
              <span class="badge badge-outline mb-1">
                {mode === 'shorten' ? '新期限' : '期限不变'} · {fmtPeriod(result.newPeriods)}
              </span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'er' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'er')}
              >
                {copied === 'er' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">原方案{origMonthly !== '—' ? '月供' : '首月月供'}</td>
                    <td class="font-mono text-right">
                      {origMonthly !== '—'
                        ? money(origMonthly as number)
                        : money((result.originalFirstMonthly as number) ?? 0)} 元
                    </td>
                  </tr>
                  {Number(paidMonths) > 0 && (
                    <>
                      <tr>
                        <td class="opacity-60">已还本金</td>
                        <td class="font-mono text-right">{money(result.paidPrincipal)} 元</td>
                      </tr>
                      <tr>
                        <td class="opacity-60">已还利息</td>
                        <td class="font-mono text-right">{money(result.paidInterest)} 元</td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td class="opacity-60">提前还款前剩余本金</td>
                    <td class="font-mono text-right">{money(result.remainingBeforePrepay)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">本次提前还款</td>
                    <td class="font-mono text-right text-warning">{money(result.prepayAmount)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">提前还款后新本金</td>
                    <td class="font-mono text-right font-medium">{money(result.newPrincipal)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">新方案{method === 'equal-payment' ? '月供' : '首月月供'}</td>
                    <td class="font-mono text-right">
                      {money(
                        (method === 'equal-payment'
                          ? result.newMonthly
                          : result.newFirstMonthly) as number
                      )} 元
                    </td>
                  </tr>
                  <tr>
                    <td class="opacity-60">新方案总利息</td>
                    <td class="font-mono text-right">{money(result.newTotalInterest)} 元</td>
                  </tr>
                  <tr class="font-semibold">
                    <td>相比不提前还款节省</td>
                    <td class="font-mono text-right text-success">{money(result.savedInterest)} 元</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        采用标准房贷还款公式逐期测算：等额本息月供 = 本金×月利率×(1+月利率)^期数 ÷
        ((1+月利率)^期数−1)；等额本金每期本金固定、利息递减。提前还款后新方案按「缩短期限（月供不变重算期数）」或「减少月供（期限不变重算月供）」重新生成计划。
        未计入违约金、利率浮动及银行特殊规定，结果仅供参考，实际以贷款合同与银行核算为准；所有计算在浏览器本地完成。
      </p>
    </div>
  );
}
