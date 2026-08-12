import { useState, useRef, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const TIP_PRESETS = [0, 5, 10, 15, 20];

/** 金额格式化：千分位 + 两位小数 */
function money(n: number): string {
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BillSplitTool() {
  const [total, setTotal] = useState('300');
  const [people, setPeople] = useState('4');
  const [withTip, setWithTip] = useState(false);
  const [tip, setTip] = useState('10');
  const [roundUp, setRoundUp] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const calc = useMemo(() => {
    const amount = Number(total);
    const n = Math.trunc(Number(people));
    const tipPct = withTip ? Number(tip) : 0;

    if (total.trim() === '' || !Number.isFinite(amount) || amount < 0) {
      return { ok: false as const, error: '请输入有效的总金额（不小于 0）。' };
    }
    if (people.trim() === '' || !Number.isFinite(n) || n < 1) {
      return { ok: false as const, error: '人数必须是不小于 1 的整数。' };
    }
    if (withTip && (!Number.isFinite(tipPct) || tipPct < 0)) {
      return { ok: false as const, error: '小费比例必须是不小于 0 的数字。' };
    }

    const grand = amount * (1 + tipPct / 100);
    const tipAmount = grand - amount;
    const raw = grand / n;
    // 取整模式向上取到整元，保证凑得齐；否则精确到分
    const each = roundUp ? Math.ceil(raw) : Math.round(raw * 100) / 100;
    const collected = each * n;
    // 尾差：实收 - 应收，正数表示多收
    const diff = Math.round((collected - grand) * 100) / 100;

    return {
      ok: true as const,
      amount,
      n,
      tipPct,
      grand,
      tipAmount,
      each,
      collected,
      diff,
    };
  }, [total, people, withTip, tip, roundUp]);

  const summary = useMemo(() => {
    if (!calc.ok) return '';
    const lines = [
      `总金额：${money(calc.amount)} 元`,
      calc.tipPct > 0
        ? `小费 ${calc.tipPct}%：${money(calc.tipAmount)} 元，合计 ${money(calc.grand)} 元`
        : '',
      `参与人数：${calc.n} 人`,
      `每人应付：${money(calc.each)} 元`,
    ].filter(Boolean);
    return lines.join('\n');
  }, [calc]);

  const copy = async (text: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      {/* 输入区 */}
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label for="bs-total" class="block text-sm font-medium mb-1.5">
            总金额（元）
          </label>
          <input
            id="bs-total"
            type="number"
            min={0}
            step="0.01"
            class="input input-bordered input-sm w-full"
            value={total}
            onInput={(e) => setTotal((e.target as HTMLInputElement).value)}
          />
        </div>
        <div>
          <label for="bs-people" class="block text-sm font-medium mb-1.5">
            参与人数
          </label>
          <input
            id="bs-people"
            type="number"
            min={1}
            step="1"
            class="input input-bordered input-sm w-full"
            value={people}
            onInput={(e) => setPeople((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      {/* 小费设置 */}
      <div class="rounded-xl bg-base-200 p-3">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            class="checkbox checkbox-sm checkbox-primary"
            checked={withTip}
            onChange={(e) => setWithTip((e.target as HTMLInputElement).checked)}
          />
          <span class="text-sm font-medium">含小费 / 服务费</span>
        </label>

        {withTip && (
          <div class="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label for="bs-tip" class="block text-xs opacity-70 mb-1">
                比例（%）
              </label>
              <input
                id="bs-tip"
                type="number"
                min={0}
                step="0.5"
                class="input input-bordered input-sm w-24"
                value={tip}
                onInput={(e) => setTip((e.target as HTMLInputElement).value)}
              />
            </div>
            <div class="join">
              {TIP_PRESETS.map((t) => (
                <button
                  key={t}
                  type="button"
                  class={`btn btn-xs join-item ${Number(tip) === t ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTip(String(t))}
                >
                  {t}%
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <label class="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          class="checkbox checkbox-sm checkbox-primary"
          checked={roundUp}
          onChange={(e) => setRoundUp((e.target as HTMLInputElement).checked)}
        />
        <span class="text-sm">每人金额向上取整到元</span>
      </label>

      {!calc.ok && (
        <p class="text-sm text-error" role="alert">
          {calc.error}
        </p>
      )}

      {/* 结果区 */}
      {calc.ok && (
        <>
          <div class="rounded-xl bg-base-200 p-4 text-center" aria-live="polite">
            <div class="text-xs opacity-60">每人应付</div>
            <div class="mt-1 font-mono text-3xl sm:text-4xl font-semibold tabular-nums text-primary">
              ¥ {money(calc.each)}
            </div>
            <div class="mt-2 text-sm opacity-70">
              {calc.n} 人均摊 · 合计 ¥ {money(calc.grand)}
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div class="rounded-xl bg-base-100 px-3 py-2.5 shadow-sm">
              <div class="text-xs opacity-60">账单原价</div>
              <div class="mt-0.5 font-mono text-base tabular-nums">¥ {money(calc.amount)}</div>
            </div>
            <div class="rounded-xl bg-base-100 px-3 py-2.5 shadow-sm">
              <div class="text-xs opacity-60">小费 {calc.tipPct}%</div>
              <div class="mt-0.5 font-mono text-base tabular-nums">¥ {money(calc.tipAmount)}</div>
            </div>
            <div class="rounded-xl bg-base-100 px-3 py-2.5 shadow-sm">
              <div class="text-xs opacity-60">实际收齐</div>
              <div class="mt-0.5 font-mono text-base tabular-nums">¥ {money(calc.collected)}</div>
            </div>
          </div>

          {calc.diff !== 0 && (
            <div class="rounded-xl bg-warning/10 border border-warning/30 px-3 py-2.5 text-sm">
              <span class="badge badge-sm badge-warning mr-2">尾差</span>
              {calc.diff > 0 ? (
                <>
                  按每人 ¥{money(calc.each)} 收齐后会多出 ¥{money(Math.abs(calc.diff))}，可退还给其中一人或计入下次。
                </>
              ) : (
                <>
                  按每人 ¥{money(calc.each)} 收齐后还差 ¥{money(Math.abs(calc.diff))}，建议由其中一人多付这部分。
                </>
              )}
            </div>
          )}

          <button
            type="button"
            class={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
            onClick={() => copy(summary)}
          >
            {copied ? '已复制' : '复制分摊结果'}
          </button>
        </>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        计算公式为「总金额 ×（1 + 小费比例）÷ 人数」，结果保留两位小数。全部在浏览器本地计算，金额数据不会上传。
      </p>
    </div>
  );
}
