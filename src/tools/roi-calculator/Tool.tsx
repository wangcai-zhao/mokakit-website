import { useState, useMemo, useRef, useEffect } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/** 千分位 + 两位小数 */
function money(n: number): string {
  const safe = Number.isFinite(n) ? n : 0;
  const fixed = safe.toFixed(2);
  const parts = fixed.split('.');
  const int = parts[0] ?? '0';
  const dec = parts[1] ?? '00';
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

function pct(n: number, digits = 2): string {
  const safe = Number.isFinite(n) ? n : 0;
  return `${(safe * 100).toFixed(digits)}%`;
}

interface Result {
  ok: boolean;
  error?: string;
  profit: number;
  roi: number;
  annual: number | null;
  annualNote: string;
  daily: number;
  paybackDays: number | null;
  paybackText: string;
}

const INVALID: Result = {
  ok: false,
  error: '',
  profit: 0,
  roi: 0,
  annual: null,
  annualNote: '',
  daily: 0,
  paybackDays: null,
  paybackText: '',
};

function fail(error: string): Result {
  return { ...INVALID, error };
}

export default function RoiCalculator() {
  const [invest, setInvest] = useState('100000');
  const [finalValue, setFinalValue] = useState('118000');
  const [days, setDays] = useState('365');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const result = useMemo<Result>(() => {
    const iRaw = invest.trim();
    const fRaw = finalValue.trim();
    const dRaw = days.trim();
    if (!iRaw || !fRaw || !dRaw) return fail('初始投资额、期末收回金额和持有天数都要填写');
    const init = Number(iRaw);
    const fin = Number(fRaw);
    const n = Number(dRaw);
    if (!Number.isFinite(init) || !Number.isFinite(fin) || !Number.isFinite(n)) {
      return fail('请填写有效数字，不要输入字母或多余符号');
    }
    if (init <= 0) return fail('初始投资额必须大于 0');
    const holdDays = Math.round(n);
    if (holdDays <= 0) return fail('持有天数必须是大于 0 的整数，请至少填 1 天');
    if (holdDays > 36500) return fail('持有天数最多支持 36500 天（约 100 年），请核对');

    const profit = fin - init;
    const roi = profit / init;

    // 亏损超过本金时 (1 + roi) 为负，分数次幂无实数解，不能硬算
    let annual: number | null = null;
    let annualNote = '';
    if (1 + roi > 0) {
      annual = Math.pow(1 + roi, 365 / holdDays) - 1;
    } else if (1 + roi === 0) {
      annual = -1;
      annualNote = '本金已全部亏完，年化收益率按 -100% 计';
    } else {
      annualNote = '亏损已超过本金，无法折算年化收益率';
    }

    const daily = profit / holdDays;
    let paybackDays: number | null = null;
    let paybackText = '';
    if (profit > 0) {
      paybackDays = init / daily;
      paybackText = `已回本。持有 ${holdDays} 天净赚 ${money(profit)} 元，按这个速度，再赚回等额本金约需 ${Math.round(
        paybackDays,
      ).toLocaleString('zh-CN')} 天（约 ${(paybackDays / 365).toFixed(2)} 年）。`;
    } else if (profit === 0) {
      paybackText = `刚好持平：本金已全部收回，但这 ${holdDays} 天没有产生任何额外收益，等于白白占用了资金。`;
    } else {
      paybackText = `尚未回本，距回到本金还差 ${money(-profit)} 元。按当前折算，平均每持有一天净亏 ${money(
        -daily,
      )} 元，需要价格回升 ${pct(-roi)} 才能填平。`;
    }

    return {
      ok: true,
      profit,
      roi,
      annual,
      annualNote,
      daily,
      paybackDays,
      paybackText,
    };
  }, [invest, finalValue, days]);

  const summary = useMemo(() => {
    if (!result.ok) return '';
    const lines = [
      `初始投资 ${money(Number(invest))} 元，期末收回 ${money(Number(finalValue))} 元，持有 ${days} 天`,
      `净利润 ${money(result.profit)} 元，ROI ${pct(result.roi)}`,
    ];
    lines.push(
      result.annual === null
        ? `年化收益率：${result.annualNote || '无法计算'}`
        : `年化收益率 ${pct(result.annual)}`,
    );
    return lines.join('\n');
  }, [result, invest, finalValue, days]);

  const copy = async (text: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const tone = (n: number): string => (n > 0 ? 'text-success' : n < 0 ? 'text-error' : '');

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="text-sm font-medium">初始投资额（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step={1000}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 100000"
              value={invest}
              onInput={(e) => setInvest((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">期末收回金额（元）</span>
            <input
              type="number"
              inputmode="decimal"
              step={1000}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 118000"
              value={finalValue}
              onInput={(e) => setFinalValue((e.target as HTMLInputElement).value)}
            />
            <span class="text-xs opacity-55">小于初始投资额即为亏损</span>
          </label>
          <label class="block">
            <span class="text-sm font-medium">持有天数</span>
            <input
              type="number"
              inputmode="numeric"
              min={1}
              step={1}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 365"
              value={days}
              onInput={(e) => setDays((e.target as HTMLInputElement).value)}
            />
            <span class="text-xs opacity-55">资金实际占用的自然日</span>
          </label>
        </div>

        {result.error && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result.ok && (
          <div class="mt-4 space-y-3">
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div class="rounded-xl bg-base-100 p-3">
                <p class="text-xs opacity-60">净利润</p>
                <p class={`font-mono text-xl font-bold tabular-nums ${tone(result.profit)}`}>
                  {money(result.profit)}
                </p>
                <p class="text-[11px] opacity-50">元</p>
              </div>
              <div class="rounded-xl bg-base-100 p-3">
                <p class="text-xs opacity-60">投资回报率 ROI</p>
                <p class={`font-mono text-xl font-bold tabular-nums ${tone(result.roi)}`}>{pct(result.roi)}</p>
                <p class="text-[11px] opacity-50">净利润 ÷ 初始投资额</p>
              </div>
              <div class="rounded-xl bg-base-100 p-3">
                <p class="text-xs opacity-60">年化收益率</p>
                <p
                  class={`font-mono text-xl font-bold tabular-nums text-primary ${
                    result.annual === null ? 'text-base-content opacity-50' : tone(result.annual)
                  }`}
                >
                  {result.annual === null ? '无法计算' : pct(result.annual)}
                </p>
                <p class="text-[11px] opacity-50">按 365 天折算</p>
              </div>
              <div class="rounded-xl bg-base-100 p-3">
                <p class="text-xs opacity-60">日均净收益</p>
                <p class={`font-mono text-xl font-bold tabular-nums ${tone(result.daily)}`}>{money(result.daily)}</p>
                <p class="text-[11px] opacity-50">元/天</p>
              </div>
            </div>

            {result.annualNote && <p class="text-xs text-warning">{result.annualNote}</p>}

            <div class="rounded-xl bg-base-100 p-3">
              <p class="text-xs opacity-60">回本说明</p>
              <p class="mt-1 text-sm leading-relaxed">{result.paybackText}</p>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">初始投资额</td>
                    <td class="font-mono text-right tabular-nums">{money(Number(invest))}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">期末收回金额</td>
                    <td class="font-mono text-right tabular-nums">{money(Number(finalValue))}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">净利润</td>
                    <td class={`font-mono text-right tabular-nums ${tone(result.profit)}`}>{money(result.profit)}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">ROI</td>
                    <td class={`font-mono text-right tabular-nums ${tone(result.roi)}`}>{pct(result.roi)}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">年化 ROI</td>
                    <td class="font-mono text-right tabular-nums">
                      {result.annual === null ? '无法计算' : pct(result.annual)}
                    </td>
                  </tr>
                  <tr>
                    <td class="opacity-60">持有期长度</td>
                    <td class="font-mono text-right tabular-nums">
                      {Math.round(Number(days))} 天（{(Math.round(Number(days)) / 365).toFixed(2)} 年）
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex items-center justify-end">
              <button
                type="button"
                class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary)}
              >
                {copied ? '已复制' : '复制计算结果'}
              </button>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        ROI =（期末收回金额 - 初始投资额）÷ 初始投资额；年化收益率 =（1 + ROI）的 365/持有天数 次方 减 1，按复利折算，持有不足一年时年化数字会被放大，横向对比请连同持有天数一起看。亏损时 ROI 与年化均为负值，本工具不做任何美化处理。所有计算在浏览器本地完成。
      </p>
    </div>
  );
}
