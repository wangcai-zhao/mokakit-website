import { useState, useMemo } from 'preact/hooks';

function money(n: number): string {
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}

/**
 * 按月复利推算攒够目标需要多少个月。
 * 每月末存入 monthly，月初余额按月利率 r 增长一个月：
 *   FV(n) = P0*(1+r)^n + monthly * ((1+r)^n - 1) / r   （r > 0）
 *   FV(n) = P0 + monthly * n                            （r = 0）
 */
function monthsToGoal(
  target: number,
  initial: number,
  monthly: number,
  annualPct: number,
  cap = 1200,
): number | null {
  if (initial >= target) return 0;
  if (monthly <= 0) return null; // 不存钱永远到不了（除非已有本金就够）
  const r = annualPct / 100 / 12;
  // 二分/线性混合：先用公式反解，公式不适用的场景退化为逐月模拟
  if (r > 0) {
    // FV = P0*(1+r)^n + monthly*((1+r)^n -1)/r = target
    // 令 x = (1+r)^n → x*(P0 + monthly/r) - monthly/r = target
    const x = (target + monthly / r) / (initial + monthly / r);
    if (x > 0) {
      const n = Math.log(x) / Math.log(1 + r);
      if (Number.isFinite(n)) return Math.max(1, Math.ceil(n));
    }
  }
  for (let n = 1; n <= cap; n++) {
    if (initial + monthly * n >= target) return n;
  }
  return null;
}

/** 给定月份数算最终本息（含复利） */
function futureValue(initial: number, monthly: number, annualPct: number, months: number): number {
  const r = annualPct / 100 / 12;
  if (r === 0) return initial + monthly * months;
  const growth = Math.pow(1 + r, months);
  return initial * growth + monthly * ((growth - 1) / r);
}

/** 反推：要在 months 个月内达标，每月需存多少 */
function monthlyNeeded(target: number, initial: number, annualPct: number, months: number): number {
  const r = annualPct / 100 / 12;
  const shortfallOnInitial = initial * Math.pow(1 + r, months);
  const gap = target - shortfallOnInitial;
  if (r === 0) return months > 0 ? gap / months : NaN;
  // gap = monthly * ((1+r)^n - 1)/r
  return gap / ((Math.pow(1 + r, months) - 1) / r);
}

/** 日期：从今天起推 n 个月 */
function dateAfterMonths(months: number): string {
  const d = new Date();
  d.setDate(1); // 避免 31 号加一个月溢出
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
}

type Mode = 'forward' | 'reverse';

export default function SavingsGoalCalculator() {
  const [mode, setMode] = useState<Mode>('forward');
  const [target, setTarget] = useState('100000');
  const [initial, setInitial] = useState('5000');
  const [monthly, setMonthly] = useState('3000');
  const [annualPct, setAnnualPct] = useState('2');
  const [limitMonths, setLimitMonths] = useState('24');

  const result = useMemo(() => {
    const t = Number(target.trim());
    const p0 = Number(initial.trim());
    const pm = Number(monthly.trim());
    const ap = Number(annualPct.trim());
    const lm = Number(limitMonths.trim());
    if (![t, p0, ap].every(Number.isFinite)) return { error: '请输入有效数字' };
    if (t <= 0) return { error: '目标金额需大于 0' };
    if (p0 < 0) return { error: '已有本金不能为负数' };
    if (ap < 0) return { error: '年化收益率不能为负数' };
    if (ap > 50) return { error: '年化收益率超过 50%，储蓄类工具不支持这么高的假设' };

    if (p0 >= t) {
      return { done: true as const, target: t, initial: p0 };
    }

    if (mode === 'forward') {
      if (!Number.isFinite(pm)) return { error: '请输入有效数字' };
      if (pm <= 0) return { error: '每月存入金额需大于 0' };
      const n = monthsToGoal(t, p0, pm, ap);
      if (n === null) return { error: '按当前进度超过 100 年才能达成，请提高每月存入金额' };
      const fv = futureValue(p0, pm, ap, n);
      return {
        ok: true as const,
        months: n,
        totalPrincipal: p0 + pm * n,
        fv,
        interest: Math.max(0, fv - (p0 + pm * n)),
        date: dateAfterMonths(n),
        target: t,
      };
    }

    if (!Number.isInteger(lm) || lm < 1) return { error: '期限需是大于 0 的整数月' };
    if (lm > 600) return { error: '期限请控制在 600 个月（50 年）以内' };
    const need = monthlyNeeded(t, p0, ap, lm);
    if (!Number.isFinite(need)) return { error: '无法计算所需月存额' };
    return {
      ok: true as const,
      months: lm,
      monthlyNeeded: Math.max(0, need),
      date: dateAfterMonths(lm),
      target: t,
      modePlan52: null,
    };
  }, [mode, target, initial, monthly, annualPct, limitMonths]);

  // 52 周存钱法：第 n 周存 n×10 元，累计 sum = 10 * n(n+1)/2
  const plan52 = useMemo(() => {
    const week1 = 10;
    const total = ((week1 * 52) * 53) / 2; // 10*(1+2+...+52)
    return { firstWeek: week1, lastWeek: week1 * 52, total };
  }, []);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="flex gap-2 mb-3">
          <button
            type="button"
            class={`btn btn-sm ${mode === 'forward' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('forward')}
          >
            按月存：多久达成
          </button>
          <button
            type="button"
            class={`btn btn-sm ${mode === 'reverse' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('reverse')}
          >
            按期限：每月存多少
          </button>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">目标金额（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="any"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={target}
              onInput={(e) => setTarget((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">已有本金（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="any"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={initial}
              onInput={(e) => setInitial((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">年化收益率（%）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="0.1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={annualPct}
              onInput={(e) => setAnnualPct((e.target as HTMLInputElement).value)}
            />
          </label>
          {mode === 'forward' ? (
            <label class="block">
              <span class="text-sm font-medium">每月存入（元）</span>
              <input
                type="number"
                inputmode="decimal"
                min={0}
                step="any"
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={monthly}
                onInput={(e) => setMonthly((e.target as HTMLInputElement).value)}
              />
            </label>
          ) : (
            <label class="block">
              <span class="text-sm font-medium">计划期限（个月）</span>
              <input
                type="number"
                inputmode="numeric"
                min={1}
                step={1}
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={limitMonths}
                onInput={(e) => setLimitMonths((e.target as HTMLInputElement).value)}
              />
            </label>
          )}
        </div>

        {'error' in result && result.error && (
          <p class="mt-3 text-sm text-error">{result.error}</p>
        )}

        {result.done && (
          <p class="mt-4 text-sm">
            已有本金 <span class="font-mono font-semibold">{money(result.initial)}</span> 元已经达到目标{' '}
            <span class="font-mono font-semibold">{money(result.target)}</span> 元，目标已达成。
          </p>
        )}

        {result.ok && (
          <div class="mt-4">
            <div class="mb-3">
              <p class="text-xs opacity-60">
                {result.monthlyNeeded != null ? '每月需存入' : '达成所需时间'}
              </p>
              <p class="text-3xl font-bold font-mono">
                {result.monthlyNeeded != null
                  ? `${money(result.monthlyNeeded)} 元`
                  : `${result.months} 个月`}
              </p>
              <p class="mt-1 text-sm opacity-70">
                预计在 <span class="font-medium">{result.date}</span> 达成{' '}
                {money(result.target)} 元目标
              </p>
            </div>

            {result.monthlyNeeded == null && (
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <td class="opacity-60">累计存入本金</td>
                      <td class="font-mono text-right">{money(result.totalPrincipal)} 元</td>
                    </tr>
                    <tr>
                      <td class="opacity-60">到期本息合计</td>
                      <td class="font-mono text-right font-medium">{money(result.fv)} 元</td>
                    </tr>
                    <tr>
                      <td class="opacity-60">其中利息收入</td>
                      <td class="font-mono text-right text-warning">{money(result.interest)} 元</td>
                    </tr>
                    <tr>
                      <td class="opacity-60">折合年数</td>
                      <td class="font-mono text-right">
                        {(result.months / 12).toFixed(1)} 年
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <p class="text-sm font-medium mb-2">对照：经典 52 周存钱法</p>
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <tbody>
              <tr>
                <td class="opacity-60">第 1 周存入</td>
                <td class="font-mono text-right">{plan52.firstWeek} 元</td>
              </tr>
              <tr>
                <td class="opacity-60">第 52 周存入</td>
                <td class="font-mono text-right">{plan52.lastWeek} 元</td>
              </tr>
              <tr>
                <td class="opacity-60">全年累计</td>
                <td class="font-mono text-right font-medium">{money(plan52.total)} 元</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-2 text-xs opacity-60">
          规则是每周比上一周多存 10 元，一年下来共 13780 元。压力集中在最后几周，收入不稳定可以把顺序倒过来存。
        </p>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        按月末存入、按月复利计算：到期本息 = 本金 ×（1+月利率）^期数 + 月存额
        ×（（1+月利率）^期数 − 1）÷ 月利率。实际收益受申购确认日、利率变动与税费影响，结果仅供参考。所有计算在浏览器本地完成。
      </p>
    </div>
  );
}
