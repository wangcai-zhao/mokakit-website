import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { calcBonusTaxSeparate, compareBonus } from '@/lib/china-tax';

/** 千分位金额，保留两位小数 */
function money(n: number): string {
  const fixed = n.toFixed(2);
  const [int = '0', dec = '00'] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

export default function BonusTaxCn() {
  const [bonus, setBonus] = useState('50000');
  const [comprehensive, setComprehensive] = useState('');
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
    const b = Number(bonus.trim());
    if (!Number.isFinite(b) || b <= 0) return { error: '请输入大于 0 的年终奖金额' };
    const sep = calcBonusTaxSeparate(b);

    const comp = comprehensive.trim() === '' ? null : Number(comprehensive.trim());
    if (comp !== null && (!Number.isFinite(comp) || comp < 0)) {
      return { error: '综合所得应纳税所得额需为非负数字' };
    }
    const cmp = comp !== null ? compareBonus(b, comp) : null;
    return { sep, cmp };
  }, [bonus, comprehensive]);

  const summary =
    result && 'sep' in result
      ? `年终奖 ${money(Number(bonus))} 元，单独计税税额 ${money(result.sep.tax)} 元，税后到手 ${money(
          result.sep.net
        )} 元（月均 ${money(result.sep.monthlyNet)}）`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">全年一次性奖金（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 50000"
              value={bonus}
              onInput={(e) => setBonus((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">
              当年综合所得应纳税所得额（元，可选）
            </span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="留空则不对比；可填工资薪金汇算后的应税金额"
              value={comprehensive}
              onInput={(e) => setComprehensive((e.target as HTMLInputElement).value)}
            />
            <span class="mt-1 block text-xs opacity-50">
              填了这项会对比「单独计税」与「并入综合所得」哪种更省
            </span>
          </label>
        </div>

        {result && 'error' in result && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && 'sep' in result && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">单独计税 · 税后到手</p>
                <p class="text-3xl font-bold font-mono">{money(result.sep.net)}</p>
              </div>
              <span class="badge badge-outline mb-1">
                税率 {(result.sep.rate * 100).toFixed(0)}% · 速扣 {money(result.sep.quickDeduction)}
              </span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'bonus' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'bonus')}
              >
                {copied === 'bonus' ? '已复制' : '复制结果'}
              </button>
            </div>

            {result.sep.blindSpot && (
              <div class="rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">
                <p class="font-medium text-warning">⚠️ 税率盲区提醒</p>
                <p class="mt-1 opacity-80">{result.sep.blindNote}</p>
              </div>
            )}

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">年终奖金额</td>
                    <td class="font-mono text-right">{money(Number(bonus))} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">应纳税额（单独计税）</td>
                    <td class="font-mono text-right text-warning">{money(result.sep.tax)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">税后到手</td>
                    <td class="font-mono text-right font-medium">{money(result.sep.net)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">月均到手（÷12）</td>
                    <td class="font-mono text-right">{money(result.sep.monthlyNet)} 元</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {result.cmp && (
              <div class="rounded-lg bg-base-100 p-3">
                <p class="text-sm font-semibold mb-2">单独计税 vs 并入综合所得</p>
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <td class="opacity-60">单独计税税额</td>
                      <td class="font-mono text-right">{money(result.cmp.separateTax)} 元</td>
                    </tr>
                    <tr>
                      <td class="opacity-60">并入综合所得增量税额</td>
                      <td class="font-mono text-right">{money(result.cmp.mergedIncrementalTax)} 元</td>
                    </tr>
                    <tr>
                      <td class="font-medium">
                        {result.cmp.better === 'separate'
                          ? '更省方案'
                          : result.cmp.better === 'merged'
                            ? '更省方案'
                            : '两方案'}
                      </td>
                      <td class="font-mono text-right font-bold text-success">
                        {result.cmp.better === 'separate'
                          ? '单独计税'
                          : result.cmp.better === 'merged'
                            ? '并入综合所得'
                            : '基本持平'}
                        （差 {money(result.cmp.diff)} 元）
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        单独计税：税率与速算扣除数按「奖金 ÷ 12」对应的月度税率表确定，税额 = 奖金 × 税率 − 速算扣除数。
        该政策延续至 2027-12-31。并入综合所得则把奖金加进工资薪金一并按年度税率表汇算。结果为估算参考，实际以税务机关汇算为准；
        所有计算在浏览器本地完成，不上传数据。
      </p>
    </div>
  );
}
