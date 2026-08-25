import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

function parseNumbers(s: string): number[] {
  return s
    .split(/[\s,，、;；\n]+/)
    .map((t) => t.trim())
    .filter((t) => t !== '')
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

function num(n: number): string {
  return String(Number(n.toFixed(4)));
}

export default function AverageCalculator() {
  const [raw, setRaw] = useState('85 90 78 92 88');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const stats = useMemo(() => {
    const arr = parseNumbers(raw);
    if (arr.length === 0) return null;
    const sum = arr.reduce((a, b) => a + b, 0);
    const mean = sum / arr.length;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 1
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    const freq = new Map<number, number>();
    for (const v of arr) freq.set(v, (freq.get(v) ?? 0) + 1);
    const maxF = Math.max(...freq.values());
    const modes = [...freq.entries()]
      .filter(([, c]) => c === maxF)
      .map(([v]) => v)
      .sort((a, b) => a - b);
    const range = sorted[sorted.length - 1] - sorted[0];
    return {
      count: arr.length,
      sum,
      mean,
      median,
      modes,
      multiMode: maxF > 1,
      range,
    };
  }, [raw]);

  const summary = stats
    ? `均值 ${num(stats.mean)}，中位数 ${num(stats.median)}，众数 ${stats.modes
        .map(num)
        .join('/')}，共 ${stats.count} 个数`
    : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">输入数字</span>
          <span class="text-xs opacity-60"> 用空格、逗号或换行分隔</span>
          <textarea
            class="textarea textarea-bordered mt-1.5 w-full font-mono text-sm"
            rows={3}
            value={raw}
            onInput={(e) => setRaw((e.target as HTMLTextAreaElement).value)}
          />
        </label>

        {!stats && <p class="mt-3 text-sm text-error">请输入至少一个有效数字</p>}

        {stats && (
          <div class="mt-4 space-y-3">
            <div class="flex items-center gap-3">
              <span class="text-3xl font-bold font-mono">{num(stats.mean)}</span>
              <span class="badge badge-info">均值（算术平均）</span>
              <button
                type="button"
                class={`btn btn-xs ml-auto ${copied === 's' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 's')}
              >
                {copied === 's' ? '已复制' : '复制'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">数据个数</td>
                    <td class="font-mono text-right">{stats.count}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">总和</td>
                    <td class="font-mono text-right">{num(stats.sum)}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">中位数</td>
                    <td class="font-mono text-right">{num(stats.median)}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">众数</td>
                    <td class="font-mono text-right">
                      {stats.modes.map(num).join(' / ')}
                      {stats.multiMode ? '（多众数）' : ''}
                    </td>
                  </tr>
                  <tr>
                    <td class="opacity-60">极差（最大−最小）</td>
                    <td class="font-mono text-right">{num(stats.range)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        <p class="mt-3 text-xs opacity-55">
          公式：均值 = 总和 ÷ 个数；中位数 = 排序后居中位置的值。
        </p>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        所有计算均在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
