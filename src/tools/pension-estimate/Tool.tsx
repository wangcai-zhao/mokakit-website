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

type RetireAge = '50' | '55' | '60' | '65';

/** 个人账户养老金计发月数（国发〔2005〕38 号） */
const MONTHS: Record<RetireAge, number> = { '50': 195, '55': 170, '60': 139, '65': 101 };

export default function PensionEstimate() {
  const [age, setAge] = useState<RetireAge>('60');
  const [avgWage, setAvgWage] = useState('8000');
  const [index, setIndex] = useState('1');
  const [years, setYears] = useState('30');
  const [balance, setBalance] = useState('100000');
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
    const w = Number(avgWage.trim());
    const idx = Number(index.trim());
    const y = Number(years.trim());
    const b = Number(balance.trim());
    if (![w, idx, y, b].every(Number.isFinite) || w <= 0 || idx <= 0 || y <= 0 || b < 0)
      return { error: '请填写大于 0 的社平工资、缴费指数、缴费年限，储存额不小于 0' };
    const months = MONTHS[age];
    const base = w * ((1 + idx) / 2) * y * 0.01;
    const personal = b / months;
    const monthly = base + personal;
    const annual = monthly * 12;
    const replacement = monthly / (w * idx || 1);
    return { w, idx, y, b, months, base, personal, monthly, annual, replacement };
  }, [age, avgWage, index, years, balance]);

  const summary =
    result && !('error' in result)
      ? `${result.years}年缴费、平均指数${result.idx}，预计每月养老金 ${money(result.monthly)} 元（年 ${money(
          result.annual
        )} 元），替代率约 ${(result.replacement * 100).toFixed(1)}%`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">退休年龄</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={age}
              onChange={(e) => setAge((e.target as HTMLSelectElement).value as RetireAge)}
            >
              <option value="50">50 岁（计发 195 个月）</option>
              <option value="55">55 岁（计发 170 个月）</option>
              <option value="60">60 岁（计发 139 个月）</option>
              <option value="65">65 岁（计发 101 个月）</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium">当地上年度社平工资（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={avgWage}
              onInput={(e) => setAvgWage((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">本人平均缴费指数</span>
            <input
              type="number"
              inputmode="decimal"
              min={0.6}
              max={3}
              step="0.1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={index}
              onInput={(e) => setIndex((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">累计缴费年限（年）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={years}
              onInput={(e) => setYears((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">个人账户储存额（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={balance}
              onInput={(e) => setBalance((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {result && 'error' in result && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && !('error' in result) && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">预计每月养老金</p>
                <p class="text-3xl font-bold font-mono text-warning">{money(result.monthly)}</p>
              </div>
              <span class="badge badge-outline mb-1">替代率 {(result.replacement * 100).toFixed(1)}%</span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'pe' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'pe')}
              >
                {copied === 'pe' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">基础养老金</td>
                    <td class="font-mono text-right">{money(result.base)} 元/月</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">个人账户养老金（÷{result.months}）</td>
                    <td class="font-mono text-right">{money(result.personal)} 元/月</td>
                  </tr>
                  <tr>
                    <td class="opacity-60 font-medium">每月养老金合计</td>
                    <td class="font-mono text-right font-medium">{money(result.monthly)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">每年养老金</td>
                    <td class="font-mono text-right font-medium">{money(result.annual)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">替代率（占缴费工资）</td>
                    <td class="font-mono text-right">{(result.replacement * 100).toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        按月领公式估算：基础养老金 = 社平 ×（1＋平均缴费指数）÷ 2 × 缴费年限 × 1%；个人账户养老金 = 储存额 ÷ 计发月数（60 岁 139、55 岁 170、50 岁 195、65 岁 101）。未含过渡性养老金、地方补贴、账户利息增值与未来社平增长，结果偏保守，仅作规划参考，最终以社保经办机构核定为准；本地计算，不上传数据。
      </p>
    </div>
  );
}
