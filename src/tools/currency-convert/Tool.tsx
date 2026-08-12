import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

interface Rate {
  code: string;
  name: string;
  /** 1 单位该货币 = rate 单位基准货币(USD) */
  rate: number;
}

// 参考汇率（相对 USD），最后更新 2026-08。仅作估算用途。
const DEFAULT_RATES: Rate[] = [
  { code: 'CNY', name: '人民币', rate: 7.18 },
  { code: 'USD', name: '美元', rate: 1 },
  { code: 'EUR', name: '欧元', rate: 0.92 },
  { code: 'JPY', name: '日元', rate: 156 },
  { code: 'GBP', name: '英镑', rate: 0.79 },
  { code: 'HKD', name: '港币', rate: 7.81 },
  { code: 'KRW', name: '韩元', rate: 1380 },
  { code: 'AUD', name: '澳元', rate: 1.52 },
  { code: 'CAD', name: '加元', rate: 1.37 },
  { code: 'SGD', name: '新加坡元', rate: 1.35 },
  { code: 'TWD', name: '新台币', rate: 32.3 },
  { code: 'THB', name: '泰铢', rate: 36.5 },
];

export default function CurrencyConvert() {
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('CNY');
  const [showAdv, setShowAdv] = useState(false);
  const [rates, setRates] = useState<Record<string, number>>(
    () => Object.fromEntries(DEFAULT_RATES.map((r) => [r.code, r.rate])),
  );
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const rateMap = useMemo(() => ({ ...rates }), [rates]);

  const result = useMemo(() => {
    const amt = parseFloat(amount);
    if (!isFinite(amt)) return null;
    const rf = rateMap[from];
    const rt = rateMap[to];
    if (!rf || !rt) return null;
    const usd = amt * rf; // 先转成基准 USD
    return usd / rt; // 再转成目标货币
  }, [amount, from, to, rateMap]);

  const unitRate = useMemo(() => {
    const rf = rateMap[from];
    const rt = rateMap[to];
    if (!rf || !rt || rf === 0) return 0;
    return rt / rf;
  }, [from, to, rateMap]);

  const copy = async () => {
    if (result == null) return;
      await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="grid gap-3 sm:grid-cols-3">
        <div>
          <label class="text-sm font-medium" for="cc-amount">
            金额
          </label>
          <input
            id="cc-amount"
            type="number"
            class="input input-bordered mt-2 w-full"
            value={amount}
            onInput={(e) => setAmount((e.target as HTMLInputElement).value)}
          />
        </div>
        <div>
          <label class="text-sm font-medium" for="cc-from">
            从
          </label>
          <select
            id="cc-from"
            class="select select-bordered mt-2 w-full"
            value={from}
            onChange={(e) => setFrom((e.target as HTMLSelectElement).value)}
          >
            {DEFAULT_RATES.map((r) => (
              <option value={r.code}>
                {r.code} · {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label class="text-sm font-medium" for="cc-to">
            到
          </label>
          <select
            id="cc-to"
            class="select select-bordered mt-2 w-full"
            value={to}
            onChange={(e) => setTo((e.target as HTMLSelectElement).value)}
          >
            {DEFAULT_RATES.map((r) => (
              <option value={r.code}>
                {r.code} · {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div class="rounded-xl bg-base-200 p-4 text-center">
        <div class="text-xs opacity-60">换算结果</div>
        <div class="mt-1 font-mono text-2xl font-bold text-primary">
          {result == null ? '—' : `${result.toLocaleString('zh-CN', { maximumFractionDigits: 4 })} ${to}`}
        </div>
        <div class="mt-1 text-xs opacity-55">
          1 {from} ≈ {unitRate ? unitRate.toLocaleString('zh-CN', { maximumFractionDigits: 6 }) : '—'} {to}
        </div>
      </div>

      <button
        type="button"
        class="btn btn-sm btn-ghost"
        onClick={() => setShowAdv((v) => !v)}
      >
        {showAdv ? '收起' : '展开'}自定义汇率
      </button>

      {showAdv && (
        <div class="rounded-xl border border-base-300 p-3">
          <div class="text-xs opacity-60 mb-2">
            相对基准（USD）的汇率，修改后立即生效
          </div>
          <div class="grid gap-2 sm:grid-cols-3">
            {DEFAULT_RATES.map((r) => (
              <label class="flex items-center gap-2 text-sm">
                <span class="w-12 font-medium">{r.code}</span>
                <input
                  type="number"
                  step="any"
                  class="input input-bordered input-sm w-full"
                  value={rates[r.code]}
                  onInput={(e) =>
                    setRates((prev) => ({
                      ...prev,
                      [r.code]: parseFloat((e.target as HTMLInputElement).value) || 0,
                    }))
                  }
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <div class="flex items-center justify-between">
        <p class="text-xs opacity-55 leading-relaxed">
          汇率为参考值（更新于 2026-08），与银行实际牌价有差异，仅作估算。
        </p>
        <button
          type="button"
          class={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
          onClick={copy}
          disabled={result == null}
        >
          {copied ? '已复制' : '复制结果'}
        </button>
      </div>
    </div>
  );
}
