import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { calcDeedTax, type DeedTaxTier } from '@/lib/china-calc-extra';

/** 千分位金额，保留两位小数 */
function money(n: number): string {
  const fixed = n.toFixed(2);
  const [int = '0', dec = '00'] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

/**
 * 契税税率与计税依据统一复用 src/lib/china-calc-extra.ts 的 calcDeedTax，
 * 与 MCP Server 共用同一份实现 —— 不再在组件里另写一份。
 *
 * 背景（2026-09-23 真实事故）：面积分界线曾同时在库与组件各硬编码一份 90㎡，
 * 而 2024-12-01 起政策口径已改为 140㎡（财政部/税务总局/住建部 2024 年第 16 号公告），
 * 只改库等于没改，线上按 2% 多算了税（200 万房子差 2 万元）。
 * 从此只有库里一个数字，前端与 MCP 不可能再漂移。
 */

const TIER_LABEL: Record<DeedTaxTier, string> = {
  first: '家庭唯一住房（首套）',
  second: '家庭第二套改善性住房',
  third: '第三套及以上',
};

export default function DeedTax() {
  const [priceWan, setPriceWan] = useState('300');
  const [area, setArea] = useState('89');
  const [tier, setTier] = useState<DeedTaxTier>('first');
  const [inclusive, setInclusive] = useState(false);
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
    const wan = Number(priceWan.trim());
    const a = Number(area.trim());
    if (!Number.isFinite(wan) || !Number.isFinite(a)) return { error: '请输入有效的价格与面积' };
    if (wan <= 0) return { error: '成交价格需大于 0' };
    if (a <= 0) return { error: '面积需大于 0' };
    const r = calcDeedTax({ priceWan: wan, area: a, tier, vatInclusive: inclusive });
    if ('error' in r) return { error: r.error };
    // 库里叫 taxableBase，组件内部沿用 base，这里做一次字段名对齐
    return {
      totalPrice: r.totalPrice,
      base: r.taxableBase,
      rate: r.rate,
      tax: r.tax,
      a: r.area,
      tier: r.tier,
    };
  }, [priceWan, area, tier, inclusive]);

  const summary =
    result && !('error' in result)
      ? `房屋${result.a}㎡，属${TIER_LABEL[result.tier]}，契税税率 ${(result.rate * 100).toFixed(1)}%，计税依据 ${money(
          result.base
        )} 元，应缴契税 ${money(result.tax)} 元`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">成交价格（万元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={priceWan}
              onInput={(e) => setPriceWan((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">建筑面积（㎡）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="0.01"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={area}
              onInput={(e) => setArea((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">家庭住房套数</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={tier}
              onChange={(e) => setTier((e.target as HTMLSelectElement).value as DeedTaxTier)}
            >
              <option value="first">家庭唯一住房（首套）</option>
              <option value="second">家庭第二套改善性住房</option>
              <option value="third">第三套及以上</option>
            </select>
          </label>
          <label class="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              checked={inclusive}
              onInput={(e) => setInclusive((e.target as HTMLInputElement).checked)}
            />
            <span class="text-sm">成交价含 5% 增值税（勾选后自动剔除再计税）</span>
          </label>
        </div>

        {result && 'error' in result && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && !('error' in result) && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">应缴契税</p>
                <p class="text-3xl font-bold font-mono text-warning">{money(result.tax)}</p>
              </div>
              <span class="badge badge-outline mb-1">税率 {(result.rate * 100).toFixed(1)}%</span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'dt' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'dt')}
              >
                {copied === 'dt' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">房屋面积 / 类别</td>
                    <td class="font-mono text-right">
                      {result.a}㎡ · {TIER_LABEL[result.tier]}
                    </td>
                  </tr>
                  <tr>
                    <td class="opacity-60">成交总价</td>
                    <td class="font-mono text-right">{money(result.totalPrice)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">计税依据（不含税）</td>
                    <td class="font-mono text-right">{money(result.base)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">适用税率</td>
                    <td class="font-mono text-right">{(result.rate * 100).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">应缴契税</td>
                    <td class="font-mono text-right text-warning font-medium">{money(result.tax)} 元</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        契税计税依据为不含增值税的成交价格；家庭唯一住房 ≤140㎡ 按 1%、&gt;140㎡ 按 1.5%，第二套改善性住房 ≤140㎡ 按 1%、&gt;140㎡ 按
        2%（面积分界线自 2024-12-01 起由 90㎡ 上调为 140㎡），第三套及以上通常按 3%（部分城市可上浮至 4%，以当地为准）。个人购买住宅暂免印花税。本工具为买方契税估算，具体以税务与不动产登记窗口核定为准；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
