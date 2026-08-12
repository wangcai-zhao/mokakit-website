import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { calcSocialSecurity, DEFAULT_SS_RATES } from '@/lib/china-social-security';

/** 千分位金额，保留两位小数 */
function money(n: number): string {
  const fixed = Number(n).toFixed(2);
  const [int = '0', dec = '00'] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

export default function SocialSecurityCn() {
  const [base, setBase] = useState('10000');
  const [floor, setFloor] = useState('');
  const [ceil, setCeil] = useState('');
  const [housingRate, setHousingRate] = useState('12');
  const [includeFund, setIncludeFund] = useState(true);
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
    const b = Number(base.trim());
    if (!Number.isFinite(b) || b <= 0) return null;
    const f = floor.trim() === '' ? undefined : Number(floor.trim());
    const c = ceil.trim() === '' ? undefined : Number(ceil.trim());
    const hr = Number(housingRate.trim());
    const rates = {
      ...DEFAULT_SS_RATES,
      housingFund: {
        personal: Number.isFinite(hr) ? hr : 12,
        employer: Number.isFinite(hr) ? hr : 12,
      },
    };
    return calcSocialSecurity({
      base: b,
      baseFloor: f,
      baseCeil: c,
      rates,
      housingFundEnabled: includeFund,
    });
  }, [base, floor, ceil, housingRate, includeFund]);

  const summary =
    result
      ? `五险一金：缴费基数 ${money(result.baseApplied)} 元；个人每月缴 ${money(
          result.personalTotal
        )} 元，单位每月缴 ${money(result.employerTotal)} 元，合计 ${money(
          result.combined
        )} 元（个人费率占基数 ${result.personalRatePct}%）`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">缴费基数（元/月）</span>
            <input
              type="number"
              min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={base}
              onInput={(e) => setBase((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">基数下限（可选）</span>
            <input
              type="number"
              min={0}
              placeholder="不填=不限"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={floor}
              onInput={(e) => setFloor((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">基数上限（可选）</span>
            <input
              type="number"
              min={0}
              placeholder="不填=不限"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={ceil}
              onInput={(e) => setCeil((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">公积金比例（%，个人＝单位）</span>
            <input
              type="number"
              min={0}
              max={12}
              step={1}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={housingRate}
              onInput={(e) => setHousingRate((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              checked={includeFund}
              onChange={(e) => setIncludeFund((e.target as HTMLInputElement).checked)}
            />
            <span class="text-sm font-medium">计算住房公积金</span>
          </label>
        </div>

        {!result && <p class="mt-3 text-sm text-error">请填写大于 0 的缴费基数</p>}

        {result && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">个人每月缴纳</p>
                <p class="text-3xl font-bold font-mono text-warning">{money(result.personalTotal)}</p>
              </div>
              <span class="badge badge-outline mb-1">单位每月 {money(result.employerTotal)}</span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'ss' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'ss')}
              >
                {copied === 'ss' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>项目</th>
                    <th class="text-right">个人</th>
                    <th class="text-right">单位</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((it) => (
                    <tr key={it.key}>
                      <td>{it.label}</td>
                      <td class="font-mono text-right">{money(it.personal)}</td>
                      <td class="font-mono text-right">{money(it.employer)}</td>
                    </tr>
                  ))}
                  <tr class="font-semibold">
                    <td>合计</td>
                    <td class="font-mono text-right">{money(result.personalTotal)}</td>
                    <td class="font-mono text-right">{money(result.employerTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>
                实际缴费基数：<b class="font-mono">{money(result.baseApplied)}</b> 元
                {result.clamped && <span class="text-warning">（已按上下限夹取）</span>}
              </span>
              <span>
                个人＋单位合计：<b class="font-mono">{money(result.combined)}</b> 元/月
              </span>
              <span>
                个人费率占基数：<b class="font-mono">{result.personalRatePct}%</b>
              </span>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        费率采用全国通用参考值（养老个人 8%/单位 16%、医疗 2%/8%、失业 0.5%/0.5%、工伤单位
        0.4%、生育单位 0.8%、公积金 12%/12%），各地实际比例与缴费基数上下限以当地社保/公积金中心公布为准。
        结果为估算参考，实际缴费以单位代扣与社保系统为准；所有计算在浏览器本地完成，不上传数据。
      </p>
    </div>
  );
}
