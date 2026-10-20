import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { ruleOf72 } from '@/lib/finance-tools';
import { parseNumber } from '@/lib/tool-result';

export default function RuleOf72() {
  const [rate, setRate] = useState('8');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const r = parseNumber(rate, { name: '年化利率' });
    if (!r.ok) return r;
    return ruleOf72(r.data);
  }, [rate]);

  const rows = result && result.ok
    ? [
        { label: '72 法则估算 (年)', val: `${result.data.approx}` },
        { label: '精确值 (年)', val: `${result.data.exact}` },
      ]
    : [];

  const copy = async () => {
    if (!result || !result.ok) return;
    await copyText(rows.map((r) => `${r.label}\t${r.val}`).join('\n'));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">年化利率 (%)</span>
          <input
            type="number"
            step="any"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={rate}
            onInput={(e) => setRate((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      {result && !result.ok && (
        <p class="text-sm text-error" role="alert">
          {result.error}
        </p>
      )}

      {result && result.ok && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">翻倍所需年限</span>
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
                {rows.map((r) => (
                  <tr>
                    <td>{r.label}</td>
                    <td class="text-right font-mono">{r.val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        计算在浏览器本地完成。用 72 除以年化利率即可快速估算本金翻倍所需年限（利率 8% 约 9 年），与精确公式 ln(2)/ln(1+r) 的对照见上表。
      </p>
    </div>
  );
}
