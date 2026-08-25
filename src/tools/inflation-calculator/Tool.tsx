import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

export default function InflationCalc() {
  const [amount, setAmount] = useState('10000');
  const [rate, setRate] = useState('3');
  const [years, setYears] = useState('10');
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    const m = Number(amount);
    const r = Number(rate) / 100;
    const y = Number(years);
    if (![m, r, y].every(Number.isFinite) || m < 0 || r < 0 || y < 0) return null;
    const factor = Math.pow(1 + r, y);
    return {
      need: m * factor,
      real: m / factor,
      factor,
    };
  }, [amount, rate, years]);

  const copy = async (t: string) => {
    await copyText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <label class="form-control">
          <span class="label-text">当前金额（元）</span>
          <input
            type="number"
            class="input input-bordered input-sm"
            value={amount}
            onInput={(e) => setAmount((e.target as HTMLInputElement).value)}
          />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <span class="label-text">年通胀率（%）</span>
            <input
              type="number"
              class="input input-bordered input-sm"
              value={rate}
              onInput={(e) => setRate((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="form-control">
            <span class="label-text">年数</span>
            <input
              type="number"
              class="input input-bordered input-sm"
              value={years}
              onInput={(e) => setYears((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
        {!res && <p class="text-sm text-error">请输入有效的非负数。</p>}
        {res && (
          <div class="space-y-2">
            <Row
              label={`${years} 年后需这么多才等价`}
              value={`¥${res.need.toFixed(2)}`}
              highlight
            />
            <Row label={`现在的 ¥${amount} 届时购买力`} value={`¥${res.real.toFixed(2)}`} />
            <button
              type="button"
              class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => copy(`${years}年后¥${amount}的购买力≈¥${res.real.toFixed(2)}`)}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        )}
      </div>
      <p class="text-xs opacity-55">按复利估算，仅作参考。计算在本地完成。</p>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div class="flex items-center justify-between">
      <span class="text-sm opacity-70">{label}</span>
      <span class={`font-mono font-bold ${highlight ? 'text-lg text-primary' : ''}`}>{value}</span>
    </div>
  );
}
