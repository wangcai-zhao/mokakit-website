import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { rateLimit } from '@/lib/dev-tools';
import { parseNumber } from '@/lib/tool-result';

export default function RateLimitCalculator() {
  const [ratePerSec, setRatePerSec] = useState('10');
  const [burst, setBurst] = useState('20');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const r = parseNumber(ratePerSec, { name: '速率', min: 0 });
    if (!r.ok) return r;
    const b = parseNumber(burst, { name: '突发容量', min: 1 });
    if (!b.ok) return b;
    return rateLimit(r.data, b.data, 'token-bucket');
  }, [ratePerSec, burst]);

  const copy = async () => {
    if (!result || !result.ok) return;
    const text =
      `桶容量\t${result.data.bucketCapacity}\n` +
      `补充间隔(ms)\t${result.data.refillIntervalMs}\n` +
      `每次补充令牌\t${result.data.refillTokens}\n` +
      `建议\t${result.data.recommended}`;
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">平均速率 (次/秒)</span>
            <input
              type="number"
              step="any"
              min="0"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={ratePerSec}
              onInput={(e) => setRatePerSec((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">突发容量</span>
            <input
              type="number"
              step="1"
              min="1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={burst}
              onInput={(e) => setBurst((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
      </div>

      {result && !result.ok && (
        <p class="text-sm text-error" role="alert">
          {result.error}
        </p>
      )}

      {result && result.ok && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">限流参数（令牌桶）</span>
            <button
              type="button"
              class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
              onClick={copy}
            >
              {copied ? '已复制' : '复制结果'}
            </button>
          </div>
          <div class="mt-3 overflow-x-auto">
            <table class="table table-sm">
              <tbody>
                <tr>
                  <td>桶容量</td>
                  <td class="text-right font-mono">{result.data.bucketCapacity}</td>
                </tr>
                <tr>
                  <td>补充间隔</td>
                  <td class="text-right font-mono">{result.data.refillIntervalMs} ms</td>
                </tr>
                <tr>
                  <td>每次补充令牌</td>
                  <td class="text-right font-mono">{result.data.refillTokens}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-3 rounded bg-base-100 p-2 text-xs opacity-70">{result.data.recommended}</p>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        计算在浏览器本地完成。令牌桶算法用「容量 + 固定间隔补充」来允许短时突发、同时约束长期平均速率，是 API 限流的常用方案。
      </p>
    </div>
  );
}
