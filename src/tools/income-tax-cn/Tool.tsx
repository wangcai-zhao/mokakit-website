import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { calcIncomeTaxAnnual } from '@/lib/china-tax';

/** 千分位金额，保留两位小数 */
function money(n: number): string {
  const fixed = n.toFixed(2);
  const [int = '0', dec = '00'] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

export default function IncomeTaxCn() {
  const [monthlyGross, setMonthlyGross] = useState('20000');
  const [monthlySocial, setMonthlySocial] = useState('3000');
  const [annualSpecial, setAnnualSpecial] = useState('24000');
  const [annualOther, setAnnualOther] = useState('0');
  const [months, setMonths] = useState('12');
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
    const mg = Number(monthlyGross.trim());
    const ms = Number(monthlySocial.trim());
    const sp = Number(annualSpecial.trim());
    const ot = Number(annualOther.trim());
    const mo = Number(months.trim());
    if (![mg, ms, sp, ot, mo].every(Number.isFinite)) return null;
    if (mg < 0) return { error: '每月税前工资不能为负' };
    if (ms < 0) return { error: '三险一金不能为负' };
    if (mo <= 0 || mo > 12) return { error: '发薪月数需在 1–12 之间' };

    const annualGross = mg * mo;
    const annualSocial = ms * mo;
    const r = calcIncomeTaxAnnual({
      annualGross,
      annualSocialInsurance: annualSocial,
      annualSpecialAddition: Math.max(0, sp),
      annualOtherDeduction: Math.max(0, ot),
    });
    return { ...r, annualGross, annualSocial };
  }, [monthlyGross, monthlySocial, annualSpecial, annualOther, months]);

  const summary =
    result && 'tax' in result
      ? `税前年收 ${money(result.annualGross)} 元，三险一金 ${money(result.annualSocial)} 元；应纳税所得额 ${money(
          result.taxableIncome
        )} 元，税率 ${(result.rate * 100).toFixed(0)}%，全年个税 ${money(result.tax)} 元，税后到手 ${money(
          result.afterTaxAnnual
        )} 元（月均 ${money(result.afterTaxMonthly)}）`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">每月税前工资（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={monthlyGross}
              onInput={(e) => setMonthlyGross((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">每月三险一金（个人，元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={monthlySocial}
              onInput={(e) => setMonthlySocial((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">全年专项附加扣除（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={annualSpecial}
              onInput={(e) => setAnnualSpecial((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">全年其他扣除（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="年金/商业健康险等"
              value={annualOther}
              onInput={(e) => setAnnualOther((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">发薪月数</span>
            <input
              type="number"
              inputmode="numeric"
              min={1}
              max={12}
              class="input input-bordered input-sm mt-1.5 w-full font-mono sm:w-32"
              value={months}
              onInput={(e) => setMonths((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {result && 'error' in result && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && 'tax' in result && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">全年应缴个税</p>
                <p class="text-3xl font-bold font-mono text-warning">{money(result.tax)}</p>
              </div>
              <span class="badge badge-outline mb-1">
                税率 {(result.rate * 100).toFixed(0)}% · 速扣 {money(result.quickDeduction)}
              </span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'inc' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'inc')}
              >
                {copied === 'inc' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">税前年收入</td>
                    <td class="font-mono text-right">{money(result.annualGross)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">三险一金（个人）</td>
                    <td class="font-mono text-right">{money(result.annualSocial)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">基本减除 + 专项扣除后应纳税所得额</td>
                    <td class="font-mono text-right">{money(result.taxableIncome)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">全年应纳税额</td>
                    <td class="font-mono text-right text-warning">{money(result.tax)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">税后到手（年）</td>
                    <td class="font-mono text-right font-medium">{money(result.afterTaxAnnual)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">税后到手（月均）</td>
                    <td class="font-mono text-right font-medium">{money(result.afterTaxMonthly)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">实际税负率</td>
                    <td class="font-mono text-right">{(result.effectiveRate * 100).toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        按综合所得年度税率表计算：应纳税所得额 = 年税前 − 6 万基本减除 − 三险一金 − 专项附加扣除 − 其他扣除；
        税额 = 应纳税所得额 × 税率 − 速算扣除数。口径截至 2026 年，全年一次性奖金已单列处理（见年终奖计税计算器）。
        结果为估算参考，实际以税务机关汇算为准；所有计算在浏览器本地完成，不上传数据。
      </p>
    </div>
  );
}
