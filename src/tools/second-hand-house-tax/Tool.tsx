import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { calcSecondHandHouseTax } from '@/lib/china-calc-extra';

/** 千分位金额，保留两位小数 */
function money(n: number): string {
  const fixed = n.toFixed(2);
  const [int = '0', dec = '00'] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

/**
 * 增值税征收率（3%）、附加税费减半、个税 20% 差额 / 1% 核定全部复用
 * src/lib/china-calc-extra.ts 的 calcSecondHandHouseTax，与 MCP Server 共用同一份实现。
 *
 * ⚠️ 政策口径已按财政部 税务总局公告 2025 年第 17 号更新为「满 2 年全额免征、
 * 未满 2 年按 3%」，组件里不保留任何旧口径常量，避免 UI 与库漂移。
 */

export default function SecondHandHouseTax() {
  const [price, setPrice] = useState('3000000');
  const [original, setOriginal] = useState('');
  const [costs, setCosts] = useState('');
  const [held2, setHeld2] = useState(false);
  const [only5, setOnly5] = useState(false);
  const [hasProof, setHasProof] = useState(false);
  const [cityRate, setCityRate] = useState('7');
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
    const p = Number(price.trim());
    if (!Number.isFinite(p) || p <= 0) return { error: '请输入大于 0 的成交价' };
    const r = calcSecondHandHouseTax({
      salePriceInclusive: p,
      originalPrice: original.trim() ? Number(original.trim()) : 0,
      reasonableCosts: costs.trim() ? Number(costs.trim()) : 0,
      heldOver2Years: held2,
      onlyHomeOver5Years: only5,
      hasOriginalProof: hasProof,
      cityTaxRatePct: Number(cityRate),
    });
    if ('error' in r) return { error: r.error };
    return r;
  }, [price, original, costs, held2, only5, hasProof, cityRate]);

  const summary =
    result && !('error' in result)
      ? `成交价 ${money(result.salePriceInclusive)} 元，增值税 ${money(result.vat)} 元、附加税费 ${money(result.surcharge)} 元、` +
        `个人所得税 ${money(result.personalTax)} 元，卖方税费合计 ${money(result.totalTax)} 元，税后到手 ${money(result.netProceeds)} 元`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">含税成交价（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="10000"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={price}
              onInput={(e) => setPrice((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">原购房发票金额（元，选填）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="10000"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={original}
              onInput={(e) => setOriginal((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">合理费用合计（元，选填）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="1000"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={costs}
              onInput={(e) => setCosts((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">城市维护建设税档</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={cityRate}
              onChange={(e) => setCityRate((e.target as HTMLSelectElement).value)}
            >
              <option value="7">市区 7%</option>
              <option value="5">县城与镇 5%</option>
              <option value="1">其他 1%</option>
            </select>
          </label>
          <div class="space-y-2">
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                checked={held2}
                onInput={(e) => setHeld2((e.target as HTMLInputElement).checked)}
              />
              <span class="text-sm">持有已满 2 年（含）</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                checked={only5}
                onInput={(e) => setOnly5((e.target as HTMLInputElement).checked)}
              />
              <span class="text-sm">满五唯一（家庭唯一住房且满 5 年）</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                checked={hasProof}
                onInput={(e) => setHasProof((e.target as HTMLInputElement).checked)}
              />
              <span class="text-sm">能提供房屋原值凭证</span>
            </label>
          </div>
        </div>

        {result && 'error' in result && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && !('error' in result) && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">卖方税费合计</p>
                <p class="text-3xl font-bold font-mono text-warning">{money(result.totalTax)}</p>
              </div>
              <div>
                <p class="text-xs opacity-60">税后到手</p>
                <p class="text-2xl font-bold font-mono text-success">{money(result.netProceeds)}</p>
              </div>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'shh' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'shh')}
              >
                {copied === 'shh' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">不含增值税转让收入</td>
                    <td class="font-mono text-right">{money(result.vatExclusivePrice)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">增值税{result.vatRatePct > 0 && `（${result.vatRatePct}%）`}</td>
                    <td class="font-mono text-right">{money(result.vat)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">附加税费（{result.surchargeRatePct}%，已减半）</td>
                    <td class="font-mono text-right">{money(result.surcharge)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">个人所得税{result.personalTaxRatePct > 0 && `（${result.personalTaxRatePct}%）`}</td>
                    <td class="font-mono text-right">{money(result.personalTax)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">印花税（个人销售住房暂免）</td>
                    <td class="font-mono text-right">{money(result.stampDuty)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">卖方税费合计</td>
                    <td class="font-mono text-right text-warning font-medium">{money(result.totalTax)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">税后到手</td>
                    <td class="font-mono text-right text-success font-medium">{money(result.netProceeds)} 元</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <ul class="space-y-1 text-xs opacity-70 leading-relaxed list-disc pl-4">
              {result.notes.map((n) => (
                <li>{n}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        自 2026-01-01 起（财政部 税务总局公告 2025 年第 17 号）：个人销售购买 2 年以上（含）的住房免征增值税，
        不再区分普通住宅与非普通住宅、不设地域差异；购买不足 2 年的按 3% 征收率全额简易计税（原为 5%）。
        购房年限按契税完税证明或房产证登记时间孰先认定。附加税费以实缴增值税为基数，城建税（市区 7% / 县城与镇 5% / 其他 1%） +
        教育费附加 3% + 地方教育附加 2%，小规模纳税人减半征收（财政部 税务总局公告 2023 年第 12 号，执行至 2027-12-31）。
        个人所得税：满五唯一免征；能提供原值凭证按差额 20%，不能提供按全额 1% 核定（各地核定率 1% 至 2% 不等）。
        个人销售住房暂免印花税。本工具只算卖方一侧，买方契税请用「契税计算器」；结果为估算，具体以税务机关核定为准，计算在本地完成、不上传数据。
      </p>
    </div>
  );
}
