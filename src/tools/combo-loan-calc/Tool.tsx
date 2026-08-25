import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/** 等额本息：返回月供、总还款、总利息（单位：元） */
function amortize(principalYuan: number, annualRatePct: number, years: number) {
  const months = Math.round(years * 12);
  if (months <= 0 || principalYuan <= 0) {
    return { monthly: 0, totalPay: 0, totalInterest: 0, months };
  }
  const r = annualRatePct / 100 / 12;
  let monthly: number;
  if (r === 0) {
    monthly = principalYuan / months;
  } else {
    const pow = Math.pow(1 + r, months);
    monthly = (principalYuan * r * pow) / (pow - 1);
  }
  const totalPay = monthly * months;
  return { monthly, totalPay, totalInterest: totalPay - principalYuan, months };
}

/** 万元 → 元；空/非法返回 null */
function wanToYuan(s: string): number | null {
  const v = s.trim();
  if (v === '' || v === '-') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n * 10000 : null;
}

function yuan(n: number, d = 2): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function wan(n: number, d = 2): string {
  if (!Number.isFinite(n)) return '—';
  return (n / 10000).toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function ComboLoanCalc() {
  const [fundWan, setFundWan] = useState('60');
  const [fundRate, setFundRate] = useState('2.85');
  const [fundYears, setFundYears] = useState('30');

  const [commWan, setCommWan] = useState('100');
  const [commRate, setCommRate] = useState('3.95');
  const [commYears, setCommYears] = useState('30');

  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const fund = useMemo(() => {
    const p = wanToYuan(fundWan);
    const rate = Number(fundRate);
    const yrs = Number(fundYears);
    if (p === null || !Number.isFinite(rate) || !Number.isFinite(yrs)) return null;
    return amortize(p, rate, yrs);
  }, [fundWan, fundRate, fundYears]);

  const comm = useMemo(() => {
    const p = wanToYuan(commWan);
    const rate = Number(commRate);
    const yrs = Number(commYears);
    if (p === null || !Number.isFinite(rate) || !Number.isFinite(yrs)) return null;
    return amortize(p, rate, yrs);
  }, [commWan, commRate, commYears]);

  const combo = useMemo(() => {
    if (!fund || !comm) return null;
    return {
      monthly: fund.monthly + comm.monthly,
      totalPay: fund.totalPay + comm.totalPay,
      totalInterest: fund.totalInterest + comm.totalInterest,
    };
  }, [fund, comm]);

  const summary = combo
    ? `组合贷月供合计 ${yuan(combo.monthly)} 元/月，总利息 ${wan(combo.totalInterest)} 万元，还款总额 ${wan(combo.totalPay)} 万元`
    : '';

  return (
    <div class="space-y-5">
      {/* 公积金贷款 */}
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <p class="text-sm font-medium">公积金贷款</p>
        <div class="mt-3 grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="text-xs opacity-60">贷款金额（万元）</span>
            <input
              type="number"
              inputmode="decimal"
              class="input input-bordered input-sm mt-1 w-full font-mono"
              value={fundWan}
              onInput={(e) => setFundWan((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-xs opacity-60">年利率（%）</span>
            <input
              type="number"
              inputmode="decimal"
              class="input input-bordered input-sm mt-1 w-full font-mono"
              value={fundRate}
              onInput={(e) => setFundRate((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-xs opacity-60">贷款年限（年）</span>
            <input
              type="number"
              inputmode="decimal"
              class="input input-bordered input-sm mt-1 w-full font-mono"
              value={fundYears}
              onInput={(e) => setFundYears((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
        {!fund && <p class="mt-3 text-sm text-error">请输入有效数值</p>}
        {fund && (
          <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span class="opacity-70">月供</span>
            <span class="font-bold font-mono">{yuan(fund.monthly)} 元/月</span>
            <span class="opacity-60">· 总利息 {wan(fund.totalInterest)} 万</span>
          </div>
        )}
      </div>

      {/* 商业贷款 */}
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <p class="text-sm font-medium">商业贷款</p>
        <div class="mt-3 grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="text-xs opacity-60">贷款金额（万元）</span>
            <input
              type="number"
              inputmode="decimal"
              class="input input-bordered input-sm mt-1 w-full font-mono"
              value={commWan}
              onInput={(e) => setCommWan((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-xs opacity-60">年利率（%）</span>
            <input
              type="number"
              inputmode="decimal"
              class="input input-bordered input-sm mt-1 w-full font-mono"
              value={commRate}
              onInput={(e) => setCommRate((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-xs opacity-60">贷款年限（年）</span>
            <input
              type="number"
              inputmode="decimal"
              class="input input-bordered input-sm mt-1 w-full font-mono"
              value={commYears}
              onInput={(e) => setCommYears((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
        {!comm && <p class="mt-3 text-sm text-error">请输入有效数值</p>}
        {comm && (
          <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span class="opacity-70">月供</span>
            <span class="font-bold font-mono">{yuan(comm.monthly)} 元/月</span>
            <span class="opacity-60">· 总利息 {wan(comm.totalInterest)} 万</span>
          </div>
        )}
      </div>

      {/* 合计 */}
      <div class="rounded-xl border border-primary/40 bg-base-100 p-4">
        <div class="flex items-center gap-3">
          <span class="text-2xl font-bold font-mono">{combo ? yuan(combo.monthly) : '—'}</span>
          <span class="text-sm opacity-70">元/月（公积金 + 商贷合计）</span>
          <button
            type="button"
            class={`btn btn-xs ml-auto ${copied === 'summary' ? 'btn-success' : 'btn-ghost'}`}
            onClick={() => copy(summary, 'summary')}
            disabled={!summary}
          >
            {copied === 'summary' ? '已复制' : '复制'}
          </button>
        </div>
        {combo && (
          <div class="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            <div class="flex justify-between">
              <span class="opacity-60">组合贷总利息</span>
              <span class="font-mono">{wan(combo.totalInterest)} 万元</span>
            </div>
            <div class="flex justify-between">
              <span class="opacity-60">组合贷还款总额</span>
              <span class="font-mono">{wan(combo.totalPay)} 万元</span>
            </div>
          </div>
        )}
        <p class="mt-3 text-xs opacity-55">
          均为等额本息；公式：月供 = 本金 × 月利率 × (1+月利率)^期数 ÷ ((1+月利率)^期数 − 1)
        </p>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        所有计算在浏览器本地完成，不上传任何数据。利率与年限以贷款合同为准，结果仅作估算参考。
      </p>
    </div>
  );
}
