import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { depreciation, type DeprecMethod } from '@/lib/finance-tools';
import { parseNumber } from '@/lib/tool-result';

const METHODS: { id: DeprecMethod; label: string }[] = [
  { id: 'straight', label: '年限平均法' },
  { id: 'sumyd', label: '年数总和法' },
  { id: 'declining', label: '双倍余额递减法' },
];

export default function DepreciationCalculator() {
  const [cost, setCost] = useState('10000');
  const [salvage, setSalvage] = useState('1000');
  const [life, setLife] = useState('5');
  const [method, setMethod] = useState<DeprecMethod>('straight');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const c = parseNumber(cost, { name: '资产原值' });
    if (!c.ok) return c;
    const s = parseNumber(salvage, { name: '残值' });
    if (!s.ok) return s;
    const l = parseNumber(life, { name: '使用年限' });
    if (!l.ok) return l;
    if (!Number.isInteger(l.data) || l.data < 1) {
      return { ok: false as const, error: '使用年限须为不小于 1 的整数' };
    }
    return depreciation(c.data, s.data, l.data, method);
  }, [cost, salvage, life, method]);

  const copy = async () => {
    if (!result || !result.ok) return;
    const header = '年份\t当年折旧\t累计折旧\t账面净值';
    const body = result.data
      .map((r) => `${r.year}\t${r.dep}\t${r.accum}\t${r.book}`)
      .join('\n');
    await copyText(`${header}\n${body}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">资产原值</span>
            <input
              type="number"
              step="any"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={cost}
              onInput={(e) => setCost((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">残值</span>
            <input
              type="number"
              step="any"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={salvage}
              onInput={(e) => setSalvage((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">使用年限</span>
            <input
              type="number"
              step="1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={life}
              onInput={(e) => setLife((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">折旧方法</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={method}
              onChange={(e) => setMethod((e.target as HTMLSelectElement).value as DeprecMethod)}
            >
              {METHODS.map((m) => (
                <option value={m.id}>{m.label}</option>
              ))}
            </select>
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
            <span class="text-sm font-medium">折旧明细</span>
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
              <thead>
                <tr>
                  <th>年份</th>
                  <th class="text-right">当年折旧</th>
                  <th class="text-right">累计折旧</th>
                  <th class="text-right">账面净值</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((r) => (
                  <tr>
                    <td>第 {r.year} 年</td>
                    <td class="text-right font-mono">{r.dep}</td>
                    <td class="text-right font-mono">{r.accum}</td>
                    <td class="text-right font-mono">{r.book}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        计算在浏览器本地完成。年限平均法逐年均摊；年数总和法与双倍余额递减法前期折旧多、后期少，末年不会击穿残值。
      </p>
    </div>
  );
}
