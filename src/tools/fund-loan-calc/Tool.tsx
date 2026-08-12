import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { buildSchedule, type RepayMethod } from '@/lib/mortgage';

/** 千分位金额，保留两位小数 */
function money(n: number): string {
  const fixed = Number(n).toFixed(2);
  const [int = '0', dec = '00'] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

type RatePreset = 'first' | 'second' | 'custom';

export default function FundLoanCalc() {
  const [principal, setPrincipal] = useState('1000000');
  const [rate, setRate] = useState('2.85');
  const [preset, setPreset] = useState<RatePreset>('first');
  const [termYears, setTermYears] = useState('30');
  const [method, setMethod] = useState<RepayMethod>('equal-payment');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const onPreset = (p: RatePreset) => {
    setPreset(p);
    if (p === 'first') setRate('2.85');
    else if (p === 'second') setRate('3.325');
  };

  const result = useMemo(() => {
    const p = Number(principal.trim());
    const annual = Number(rate.trim());
    const ty = Number(termYears.trim());
    if (![p, annual, ty].every(Number.isFinite)) return null;
    if (p <= 0) return { error: '贷款金额需大于 0' };
    if (annual < 0) return { error: '利率不能为负数' };
    const periods = Math.round(ty * 12);
    if (periods <= 0 || periods > 360) return { error: '公积金贷款期限通常 ≤ 30 年（360 期）' };
    return buildSchedule(p, annual, periods, method);
  }, [principal, rate, termYears, method]);

  const isPrincipal = method === 'equal-principal';
  const monthlyLabel = isPrincipal ? '首月月供' : '每月月供';
  const monthlyValue =
    result && !('error' in result)
      ? isPrincipal
        ? (result.firstMonthly as number)
        : (result.monthly as number)
      : 0;

  const summary =
    result && !('error' in result)
      ? `公积金贷款 ${money(Number(principal))} 元，年利率 ${rate}%，共 ${
          Number(termYears) * 12
        } 期（${
          isPrincipal ? '等额本金' : '等额本息'
        }）；${monthlyLabel} ${money(monthlyValue)} 元，总利息 ${money(
          result.totalInterest
        )} 元，还款总额 ${money(result.totalPayment)} 元`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">贷款金额（元）</span>
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
              step={0.005}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={rate}
              onInput={(e) => {
                setRate((e.target as HTMLInputElement).value);
                setPreset('custom');
              }}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">利率预设</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={preset}
              onChange={(e) => onPreset((e.target as HTMLSelectElement).value as RatePreset)}
            >
              <option value="first">首套 5 年以上 2.85%</option>
              <option value="second">二套 5 年以上 3.325%</option>
              <option value="custom">自定义</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium">贷款期限（年）</span>
            <input
              type="number"
              min={1}
              max={30}
              step={1}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={termYears}
              onInput={(e) => setTermYears((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block sm:col-span-2">
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
        </div>

        {result && 'error' in result && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && !('error' in result) && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">{monthlyLabel}</p>
                <p class="text-3xl font-bold font-mono">{money(monthlyValue)}</p>
              </div>
              <span class="badge badge-outline mb-1">共 {Number(termYears) * 12} 期</span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'fund' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'fund')}
              >
                {copied === 'fund' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">贷款金额</td>
                    <td class="font-mono text-right">{money(Number(principal))} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">{monthlyLabel}</td>
                    <td class="font-mono text-right font-medium">{money(monthlyValue)} 元</td>
                  </tr>
                  {isPrincipal && (
                    <tr>
                      <td class="opacity-60">每月递减</td>
                      <td class="font-mono text-right">{money(result.monthlyDecrease as number)} 元</td>
                    </tr>
                  )}
                  <tr>
                    <td class="opacity-60">支付总利息</td>
                    <td class="font-mono text-right text-warning">{money(result.totalInterest)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">还款总额</td>
                    <td class="font-mono text-right font-medium">{money(result.totalPayment)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">利息占本金比例</td>
                    <td class="font-mono text-right">
                      {((result.totalInterest / Number(principal)) * 100).toFixed(2)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        采用标准房贷还款公式测算：等额本息月供 = 本金×月利率×(1+月利率)^期数 ÷
        ((1+月利率)^期数−1)；等额本金每期本金固定、利息递减。利率预置首套/二套参考值，可手动修改。
        未计入组合贷中的商贷部分、利率浮动及担保费，结果仅供参考，实际以公积金中心审批与借款合同为准；所有计算在浏览器本地完成。
      </p>
    </div>
  );
}
