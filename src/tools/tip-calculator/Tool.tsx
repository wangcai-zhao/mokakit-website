import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const QUICK_RATES = [10, 15, 18, 20];

function money(n: number): string {
  const fixed = n.toFixed(2);
  const [int = '0', dec = '00'] = fixed.split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

type Result =
  | { ok: false; error: string }
  | {
      ok: true;
      tip: number;
      total: number;
      perPerson: number;
      perTip: number;
      roundedPer: number;
      people: number;
    };

export default function TipCalculator() {
  const [bill, setBill] = useState('200');
  const [rate, setRate] = useState('15');
  const [people, setPeople] = useState('2');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const result = useMemo<Result | null>(() => {
    const b = Number(bill.trim());
    const r = Number(rate.trim());
    const p = Math.round(Number(people.trim()));
    if (!Number.isFinite(b) || !Number.isFinite(r) || !Number.isFinite(p)) return null;
    if (b < 0) return { ok: false, error: '账单金额不能为负数' };
    if (r < 0) return { ok: false, error: '小费比例不能为负数' };
    if (p < 1) return { ok: false, error: '人数至少为 1' };
    const tip = (b * r) / 100;
    const total = b + tip;
    const perPerson = total / p;
    return {
      ok: true,
      tip,
      total,
      perPerson,
      perTip: tip / p,
      roundedPer: Math.ceil(perPerson),
      people: p,
    };
  }, [bill, rate, people]);

  const summary =
    result && result.ok
      ? `账单 ${money(Number(bill))}，小费 ${rate}%（${money(result.tip)}），总计 ${money(result.total)}，${result.people} 人每人 ${money(result.perPerson)}`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="text-sm font-medium">账单金额</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step={0.01}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 200"
              value={bill}
              onInput={(e) => setBill((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">小费比例（%）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step={0.5}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 15"
              value={rate}
              onInput={(e) => setRate((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">人数</span>
            <input
              type="number"
              inputmode="numeric"
              min={1}
              step={1}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 2"
              value={people}
              onInput={(e) => setPeople((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <span class="text-xs opacity-60">常用比例</span>
          {QUICK_RATES.map((r) => (
            <button
              type="button"
              class={`btn btn-xs ${Number(rate) === r ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setRate(String(r))}
            >
              {r}%
            </button>
          ))}
        </div>

        {!result && <p class="mt-3 text-sm text-error">请输入有效的账单信息</p>}
        {result && !result.ok && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && result.ok && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">每人应付</p>
                <p class="text-3xl font-bold font-mono">{money(result.perPerson)}</p>
              </div>
              <span class="badge badge-outline mb-1">{result.people} 人分摊</span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'tip' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'tip')}
              >
                {copied === 'tip' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">账单金额</td>
                    <td class="font-mono text-right">{money(Number(bill))}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">小费金额</td>
                    <td class="font-mono text-right text-warning">{money(result.tip)}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">含小费总额</td>
                    <td class="font-mono text-right font-medium">{money(result.total)}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">每人分摊小费</td>
                    <td class="font-mono text-right">{money(result.perTip)}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">人均向上取整</td>
                    <td class="font-mono text-right">{money(result.roundedPer)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        小费 = 账单 × 比例，人均 = 含小费总额 ÷
        人数。金额保留两位小数，分摊时可能存在几分钱的四舍五入误差，建议参考「人均向上取整」由一人补齐零头。所有计算在浏览器本地完成。
      </p>
    </div>
  );
}
