import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { calcShippingFee, type WeightRounding } from '@/lib/misc-calc';

/** 千分位金额，保留两位小数 */
function money(n: number): string {
  const fixed = n.toFixed(2);
  const [int = '0', dec = '00'] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

/**
 * 计费重量进位与分段计价复用 src/lib/misc-calc.ts 的 calcShippingFee，
 * 与 MCP Server 共用同一份实现；组件只负责收集入参与渲染，不写公式。
 */

const ROUNDING_OPTIONS: { value: WeightRounding; label: string }[] = [
  { value: 'up-0.5', label: '按 0.5 公斤向上取整（通达系常见）' },
  { value: 'up-1', label: '按 1 公斤向上取整' },
  { value: 'actual', label: '按实际重量计费（不进位）' },
];

export default function ShippingFeeCalculator() {
  const [weight, setWeight] = useState('2.3');
  const [firstWeight, setFirstWeight] = useState('1');
  const [firstPrice, setFirstPrice] = useState('12');
  const [addPrice, setAddPrice] = useState('5');
  const [rounding, setRounding] = useState<WeightRounding>('up-0.5');
  const [remote, setRemote] = useState('0');
  const [insuredValue, setInsuredValue] = useState('0');
  const [insuredRate, setInsuredRate] = useState('0.5');
  const [discount, setDiscount] = useState('0');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const num = (v: string) => (v.trim() === '' ? 0 : Number(v.trim()));

  const result = useMemo(() => {
    const r = calcShippingFee({
      weightKg: num(weight),
      firstWeightKg: num(firstWeight),
      firstPrice: num(firstPrice),
      additionalPricePerKg: num(addPrice),
      rounding,
      remoteSurcharge: num(remote),
      insuredValue: num(insuredValue),
      insuredRatePct: num(insuredRate),
      discount: num(discount),
    });
    // 库里失败统一返回 { error }，原样透传
    if ('error' in r) return { error: r.error };
    return r;
  }, [weight, firstWeight, firstPrice, addPrice, rounding, remote, insuredValue, insuredRate, discount]);

  const summary =
    result && !('error' in result)
      ? `实际重量 ${result.weightKg} 公斤，计费重量 ${result.billableWeightKg} 公斤，运费合计 ${money(result.total)} 元（折合 ${money(result.perKg)} 元/公斤）`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label class="block">
            <span class="text-sm font-medium">实际重量（kg）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="0.1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={weight}
              onInput={(e) => setWeight((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">首重（kg）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="0.5"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={firstWeight}
              onInput={(e) => setFirstWeight((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">首重价（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="0.5"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={firstPrice}
              onInput={(e) => setFirstPrice((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">续重单价（元/kg）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="0.5"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={addPrice}
              onInput={(e) => setAddPrice((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">计费重量进位规则</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={rounding}
              onChange={(e) => setRounding((e.target as HTMLSelectElement).value as WeightRounding)}
            >
              {ROUNDING_OPTIONS.map((o) => (
                <option value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium">偏远地区附加费（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={remote}
              onInput={(e) => setRemote((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">保价声明价值（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="100"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={insuredValue}
              onInput={(e) => setInsuredValue((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">保价费率（%）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="0.1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={insuredRate}
              onInput={(e) => setInsuredRate((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">优惠减免（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={discount}
              onInput={(e) => setDiscount((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {result && 'error' in result && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && !('error' in result) && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">运费合计</p>
                <p class="text-3xl font-bold font-mono text-warning">{money(result.total)}</p>
              </div>
              <span class="badge badge-outline mb-1">计费重 {result.billableWeightKg} kg</span>
              <span class="badge badge-outline mb-1">折合 {money(result.perKg)} 元/kg</span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'sfc' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'sfc')}
              >
                {copied === 'sfc' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">实际重量 / 计费重量</td>
                    <td class="font-mono text-right">
                      {result.weightKg} kg / {result.billableWeightKg} kg
                    </td>
                  </tr>
                  <tr>
                    <td class="opacity-60">首重（{result.firstWeightKg} kg）</td>
                    <td class="font-mono text-right">{money(result.firstPrice)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">续重（{result.extraWeightKg} kg × {result.additionalPricePerKg} 元）</td>
                    <td class="font-mono text-right">{money(result.additionalFee)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">偏远地区附加费</td>
                    <td class="font-mono text-right">{money(result.remoteSurcharge)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">保价费（{money(result.insuredValue)} 元 × 费率）</td>
                    <td class="font-mono text-right">{money(result.insuranceFee)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">优惠减免</td>
                    <td class="font-mono text-right">−{money(result.discount)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">运费合计</td>
                    <td class="font-mono text-right text-warning font-medium">{money(result.total)} 元</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        运费 = 首重价 +（计费重量 − 首重）× 续重单价 + 偏远附加 + 保价费 − 优惠，合计不会为负。
        计费重量按所选规则进位：0.5 公斤档最常用，1 公斤档偏保守，实际重量档不进位。
        实际账单还可能涉及**体积重量**（长 × 宽 × 高 ÷ 抛重系数，取体积重与实际重的较大者）、月结协议价与最低收费，
        本工具按你填的单价做线性估算，不包含这些。计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
