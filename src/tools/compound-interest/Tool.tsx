import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Freq = 'yearly' | 'monthly' | 'daily';

function num(n: number): string {
  return Number.isFinite(n) ? String(Number(n.toFixed(2))) : '—';
}

export default function CompoundInterest() {
  const [principal, setPrincipal] = useState('10000');
  const [rate, setRate] = useState('5');
  const [years, setYears] = useState('10');
  const [freq, setFreq] = useState<Freq>('monthly');
  const [contrib, setContrib] = useState('500');

  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const calc = useMemo(() => {
    const P = Number(principal);
    const r = Number(rate) / 100;
    const t = Number(years);
    const C = Number(contrib);
    const n = freq === 'yearly' ? 1 : freq === 'monthly' ? 12 : 365;
    if (![P, r, t, C, n].every(Number.isFinite) || t < 0) return null;
    const fvPrincipal = P * Math.pow(1 + r / n, n * t);
    let fvContrib: number;
    if (r === 0) fvContrib = C * n * t;
    else fvContrib = C * ((Math.pow(1 + r / n, n * t) - 1) / (r / n));
    const total = fvPrincipal + fvContrib;
    const invested = P + C * n * t;
    const interest = total - invested;
    const rows = [];
    let bal = P;
    for (let y = 1; y <= t; y++) {
      bal = bal * Math.pow(1 + r / n, n) + C * n * (Math.pow(1 + r / n, n) - 1) / (r / n);
      rows.push({ y, bal });
    }
    return { total, invested, interest, fvPrincipal, fvContrib, rows };
  }, [principal, rate, years, freq, contrib]);

  const summary = calc
    ? `本息合计 ${num(calc.total)}，其中利息 ${num(calc.interest)}`
    : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-xs opacity-60">本金</span>
            <input type="number" class="input input-bordered input-sm mt-1 w-full font-mono" value={principal} onInput={(e) => setPrincipal((e.target as HTMLInputElement).value)} />
          </label>
          <label class="block">
            <span class="text-xs opacity-60">年化利率（%）</span>
            <input type="number" class="input input-bordered input-sm mt-1 w-full font-mono" value={rate} onInput={(e) => setRate((e.target as HTMLInputElement).value)} />
          </label>
          <label class="block">
            <span class="text-xs opacity-60">期限（年）</span>
            <input type="number" class="input input-bordered input-sm mt-1 w-full font-mono" value={years} onInput={(e) => setYears((e.target as HTMLInputElement).value)} />
          </label>
          <label class="block">
            <span class="text-xs opacity-60">复利频次</span>
            <select class="select select-bordered select-sm mt-1 w-full" value={freq} onChange={(e) => setFreq((e.target as HTMLSelectElement).value as Freq)}>
              <option value="yearly">每年</option>
              <option value="monthly">每月</option>
              <option value="daily">每日</option>
            </select>
          </label>
          <label class="block sm:col-span-2">
            <span class="text-xs opacity-60">每月定投（可填 0）</span>
            <input type="number" class="input input-bordered input-sm mt-1 w-full font-mono" value={contrib} onInput={(e) => setContrib((e.target as HTMLInputElement).value)} />
          </label>
        </div>

        {!calc && <p class="mt-3 text-sm text-error">请输入有效数值</p>}

        {calc && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">本息合计</p>
                <p class="text-3xl font-bold font-mono">{num(calc.total)}</p>
              </div>
              <span class="badge badge-success">利息 {num(calc.interest)}</span>
              <button type="button" class={`btn btn-xs ml-auto ${copied === 'c' ? 'btn-success' : 'btn-ghost'}`} onClick={() => copy(summary, 'c')}>
                {copied === 'c' ? '已复制' : '复制'}
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr><td class="opacity-60">累计投入本金</td><td class="font-mono text-right">{num(calc.invested)}</td></tr>
                  <tr><td class="opacity-60">本金部分终值</td><td class="font-mono text-right">{num(calc.fvPrincipal)}</td></tr>
                  <tr><td class="opacity-60">定投部分终值</td><td class="font-mono text-right">{num(calc.fvContrib)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        <p class="mt-3 text-xs opacity-55">公式：终值 = 本金×(1+年利率/频次)^(频次×年数)</p>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        所有计算均在浏览器本地完成，不会上传任何数据。结果仅供参考，不构成投资建议。
      </p>
    </div>
  );
}
