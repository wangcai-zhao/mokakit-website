import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import {
  calcGeneralVat,
  calcSimpleVat,
  excludeTax,
} from '@/lib/china-vat';

/** 千分位金额，保留两位小数 */
function money(n: number): string {
  const fixed = Number(n).toFixed(2);
  const [int = '0', dec = '00'] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

type VatMode = 'general' | 'simple';

export default function VatCalc() {
  const [mode, setMode] = useState<VatMode>('general');
  const [sales, setSales] = useState('1000000');
  const [salesRate, setSalesRate] = useState('13');
  const [purchase, setPurchase] = useState('600000');
  const [purchaseRate, setPurchaseRate] = useState('13');
  const [inclusive, setInclusive] = useState(false);
  const [simpleSales, setSimpleSales] = useState('1000000');
  const [levy, setLevy] = useState('3');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const general = useMemo(() => {
    const s = Number(sales.trim());
    const sr = Number(salesRate.trim());
    const p = Number(purchase.trim());
    const pr = Number(purchaseRate.trim());
    if (![s, sr, p, pr].every(Number.isFinite)) return null;
    if (s < 0 || p < 0) return { error: '金额不能为负' };
    const sBase = inclusive ? excludeTax(s, sr) : s;
    const pBase = inclusive ? excludeTax(p, pr) : p;
    return calcGeneralVat({ salesAmount: sBase, salesRate: sr, purchaseAmount: pBase, purchaseRate: pr });
  }, [sales, salesRate, purchase, purchaseRate, inclusive]);

  const simple = useMemo(() => {
    const s = Number(simpleSales.trim());
    const l = Number(levy.trim());
    if (![s, l].every(Number.isFinite)) return null;
    if (s < 0) return { error: '金额不能为负' };
    return calcSimpleVat({ salesAmount: s, levyRate: l });
  }, [simpleSales, levy]);

  const active = mode === 'general' ? general : simple;

  const summary =
    active && !('error' in active)
      ? mode === 'general'
        ? `增值税（一般计税）：销项税 ${money(active.outputTax)} 元，进项税 ${money(
            active.inputTax
          )} 元，应纳税额 ${money(active.payable)} 元${
            active.carryForward > 0 ? `，留抵 ${money(active.carryForward)} 元` : ''
          }`
        : `增值税（简易计税）：应纳税额 ${money(active.tax)} 元`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="tabs tabs-boxed mb-3">
          <button
            type="button"
            class={`tab ${mode === 'general' ? 'tab-active' : ''}`}
            onClick={() => setMode('general')}
          >
            一般计税
          </button>
          <button
            type="button"
            class={`tab ${mode === 'simple' ? 'tab-active' : ''}`}
            onClick={() => setMode('simple')}
          >
            简易计税
          </button>
        </div>

        {mode === 'general' && (
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm font-medium">销项销售额（{inclusive ? '含税' : '不含税'}）</span>
              <input
                type="number"
                min={0}
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={sales}
                onInput={(e) => setSales((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">销项税率（%）</span>
              <input
                type="number"
                min={0}
                step={1}
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={salesRate}
                onInput={(e) => setSalesRate((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">进项采购额（{inclusive ? '含税' : '不含税'}）</span>
              <input
                type="number"
                min={0}
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={purchase}
                onInput={(e) => setPurchase((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">进项税率（%）</span>
              <input
                type="number"
                min={0}
                step={1}
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={purchaseRate}
                onInput={(e) => setPurchaseRate((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex items-center gap-2 sm:col-span-2 mt-1">
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                checked={inclusive}
                onChange={(e) => setInclusive((e.target as HTMLInputElement).checked)}
              />
              <span class="text-sm font-medium">销售额为含税价（自动 ÷(1+税率) 还原）</span>
            </label>
          </div>
        )}

        {mode === 'simple' && (
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm font-medium">销售额（不含税）</span>
              <input
                type="number"
                min={0}
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={simpleSales}
                onInput={(e) => setSimpleSales((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">征收率（%）</span>
              <input
                type="number"
                min={0}
                step={1}
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={levy}
                onInput={(e) => setLevy((e.target as HTMLInputElement).value)}
              />
            </label>
          </div>
        )}

        {active && 'error' in active && <p class="mt-3 text-sm text-error">{active.error}</p>}

        {active && !('error' in active) && mode === 'general' && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">本期应纳税额</p>
                <p class="text-3xl font-bold font-mono text-warning">{money(active.payable)}</p>
              </div>
              {active.carryForward > 0 && (
                <span class="badge badge-outline mb-1">留抵 {money(active.carryForward)} 元</span>
              )}
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'vat' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'vat')}
              >
                {copied === 'vat' ? '已复制' : '复制结果'}
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">销项税额</td>
                    <td class="font-mono text-right">{money(active.outputTax)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">进项税额</td>
                    <td class="font-mono text-right">{money(active.inputTax)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">销项 − 进项</td>
                    <td class="font-mono text-right">{money(active.net)} 元</td>
                  </tr>
                  <tr class="font-semibold">
                    <td>本期应纳税额</td>
                    <td class="font-mono text-right text-warning">{money(active.payable)} 元</td>
                  </tr>
                  {active.carryForward > 0 && (
                    <tr>
                      <td class="opacity-60">留抵税额（结转下期）</td>
                      <td class="font-mono text-right text-info">{money(active.carryForward)} 元</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {active && !('error' in active) && mode === 'simple' && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">本期应纳税额</p>
                <p class="text-3xl font-bold font-mono text-warning">{money(active.tax)}</p>
              </div>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'vat' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'vat')}
              >
                {copied === 'vat' ? '已复制' : '复制结果'}
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">不含税销售额</td>
                    <td class="font-mono text-right">{money(Number(simpleSales))} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">征收率</td>
                    <td class="font-mono text-right">{levy}%</td>
                  </tr>
                  <tr class="font-semibold">
                    <td>应纳税额</td>
                    <td class="font-mono text-right text-warning">{money(active.tax)} 元</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        一般计税：应纳税额 = 销项税额 − 进项税额（销项 = 不含税销售额 × 税率，进项同理）；
        进项大于销项时形成留抵税额结转下期。简易计税：应纳税额 = 不含税销售额 × 征收率。
        含税销售额可勾选「金额为含税价」自动还原。税率为百分数，结果仅供参考，实际以税务机关核定为准；所有计算在浏览器本地完成。
      </p>
    </div>
  );
}
