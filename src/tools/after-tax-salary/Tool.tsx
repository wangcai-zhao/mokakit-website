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

const BRACKETS = [
  { upper: 36000, rate: 0.03, quick: 0 },
  { upper: 144000, rate: 0.1, quick: 2520 },
  { upper: 300000, rate: 0.2, quick: 16920 },
  { upper: 420000, rate: 0.25, quick: 31920 },
  { upper: 660000, rate: 0.3, quick: 52920 },
  { upper: 960000, rate: 0.35, quick: 85920 },
  { upper: Infinity, rate: 0.45, quick: 181920 },
];

function taxOf(taxable: number) {
  if (taxable <= 0) return { tax: 0, rate: 0, quick: 0 };
  for (const b of BRACKETS) {
    if (taxable <= b.upper) return { tax: taxable * b.rate - b.quick, rate: b.rate, quick: b.quick };
  }
  return { tax: 0, rate: 0, quick: 0 };
}

/** 给定税前月薪，返回月税与税后月薪（按全年口径估算） */
function fromGross(monthlyGross: number, monthlySocial: number, monthlySpecial: number) {
  const annualGross = monthlyGross * 12;
  const annualSocial = monthlySocial * 12;
  const annualSpecial = monthlySpecial * 12;
  const taxable = annualGross - 60000 - annualSocial - annualSpecial;
  const { tax, rate } = taxOf(taxable);
  const finalTax = Math.max(0, tax);
  const afterTaxAnnual = annualGross - annualSocial - finalTax;
  return {
    annualGross,
    annualSocial,
    taxable,
    rate,
    tax: finalTax,
    afterTaxMonthly: afterTaxAnnual / 12,
    afterTaxAnnual,
  };
}

/** 给定目标税后月薪，二分反推税前月薪 */
function reverseGross(targetNet: number, monthlySocial: number, monthlySpecial: number) {
  let lo = Math.max(0, targetNet - monthlySocial);
  let hi = targetNet * 4 + 100000;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const net = fromGross(mid, monthlySocial, monthlySpecial).afterTaxMonthly;
    if (net < targetNet) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export default function AfterTaxSalary() {
  const [mode, setMode] = useState<'forward' | 'reverse'>('forward');
  const [gross, setGross] = useState('20000');
  const [net, setNet] = useState('15000');
  const [social, setSocial] = useState('3000');
  const [special, setSpecial] = useState('2000');
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
    const ms = Number(social.trim());
    const sp = Number(special.trim());
    if (![ms, sp].every(Number.isFinite) || ms < 0 || sp < 0) return { error: '三险一金 / 专项附加不能为负' };
    if (mode === 'forward') {
      const g = Number(gross.trim());
      if (!Number.isFinite(g) || g < 0) return { error: '税前工资不能为负' };
      return { ...fromGross(g, ms, sp), mode: 'forward' as const };
    }
    const n = Number(net.trim());
    if (!Number.isFinite(n) || n < 0) return { error: '税后工资不能为负' };
    const g = reverseGross(n, ms, sp);
    const fwd = fromGross(g, ms, sp);
    return { ...fwd, mode: 'reverse' as const, netTarget: n };
  }, [mode, gross, net, social, special]);

  const summary =
    result && !('error' in result)
      ? result.mode === 'forward'
        ? `税前月薪 ${money(result.annualGross / 12)} 元，月个税 ${money(result.tax / 12)} 元，税后到手 ${money(result.afterTaxMonthly)} 元/月（年 ${money(result.afterTaxAnnual)} 元）`
        : `税后月薪 ${money(result.netTarget)} 元，对应税前约 ${money(result.annualGross / 12)} 元，月个税约 ${money(result.tax / 12)} 元`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">计算模式</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={mode}
              onChange={(e) => setMode((e.target as HTMLSelectElement).value as 'forward' | 'reverse')}
            >
              <option value="forward">正算：税前工资 → 税后到手</option>
              <option value="reverse">反推：税后到手 → 税前工资</option>
            </select>
          </label>

          {mode === 'forward' ? (
            <label class="block sm:col-span-2">
              <span class="text-sm font-medium">每月税前工资（元）</span>
              <input
                type="number"
                inputmode="decimal"
                min={0}
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={gross}
                onInput={(e) => setGross((e.target as HTMLInputElement).value)}
              />
            </label>
          ) : (
            <label class="block sm:col-span-2">
              <span class="text-sm font-medium">每月税后到手（元）</span>
              <input
                type="number"
                inputmode="decimal"
                min={0}
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={net}
                onInput={(e) => setNet((e.target as HTMLInputElement).value)}
              />
            </label>
          )}

          <label class="block">
            <span class="text-sm font-medium">每月三险一金（个人，元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={social}
              onInput={(e) => setSocial((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">每月专项附加（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="子女教育/房贷利息等"
              value={special}
              onInput={(e) => setSpecial((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {result && 'error' in result && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && !('error' in result) && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">{result.mode === 'forward' ? '每月应缴个税' : '对应税前月薪'}</p>
                <p class="text-3xl font-bold font-mono text-warning">
                  {result.mode === 'forward'
                    ? money(result.tax / 12)
                    : money(result.annualGross / 12)}
                </p>
              </div>
              <span class="badge badge-outline mb-1">
                {result.mode === 'forward'
                  ? `税率 ${(result.rate * 100).toFixed(0)}%`
                  : `月个税约 ${money(result.tax / 12)} 元`}
              </span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'at' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'at')}
              >
                {copied === 'at' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  {result.mode === 'forward' ? (
                    <>
                      <tr>
                        <td class="opacity-60">税前月薪</td>
                        <td class="font-mono text-right">{money(result.annualGross / 12)} 元</td>
                      </tr>
                      <tr>
                        <td class="opacity-60">三险一金（个人，月）</td>
                        <td class="font-mono text-right">{money(result.annualSocial / 12)} 元</td>
                      </tr>
                      <tr>
                        <td class="opacity-60">每月应缴个税</td>
                        <td class="font-mono text-right text-warning">{money(result.tax / 12)} 元</td>
                      </tr>
                      <tr>
                        <td class="opacity-60">税后到手（月）</td>
                        <td class="font-mono text-right font-medium">{money(result.afterTaxMonthly)} 元</td>
                      </tr>
                      <tr>
                        <td class="opacity-60">税后到手（年）</td>
                        <td class="font-mono text-right font-medium">{money(result.afterTaxAnnual)} 元</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <td class="opacity-60">税后到手（目标）</td>
                        <td class="font-mono text-right">{money(result.netTarget)} 元</td>
                      </tr>
                      <tr>
                        <td class="opacity-60">对应税前月薪</td>
                        <td class="font-mono text-right font-medium">{money(result.annualGross / 12)} 元</td>
                      </tr>
                      <tr>
                        <td class="opacity-60">三险一金（个人，月）</td>
                        <td class="font-mono text-right">{money(result.annualSocial / 12)} 元</td>
                      </tr>
                      <tr>
                        <td class="opacity-60">每月应缴个税（约）</td>
                        <td class="font-mono text-right text-warning">{money(result.tax / 12)} 元</td>
                      </tr>
                      <tr>
                        <td class="opacity-60">税前年薪（约）</td>
                        <td class="font-mono text-right">{money(result.annualGross)} 元</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        按综合所得年度税率表计算：应纳税所得额 = 年税前 − 6 万基本减除 − 三险一金 − 专项附加扣除；税额 = 应纳税所得额 ×
        税率 − 速算扣除数。本工具按全年口径一次性估算（更接近年终汇算结果）。利息税等其他所得未计入；结果为估算参考，实际以税务机关为准；所有计算在浏览器本地完成，不上传数据。
      </p>
    </div>
  );
}
