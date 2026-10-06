import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { calcLaborIncomeTax, type NonWageIncomeKind } from '@/lib/china-tax';

/** 千分位金额，保留两位小数 */
function money(n: number): string {
  const fixed = n.toFixed(2);
  const [int = '0', dec = '00'] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

/**
 * 减除费用、稿酬减征与三级预扣率表全部复用 src/lib/china-tax.ts 的
 * calcLaborIncomeTax，与 MCP Server 共用同一份实现，组件内不写税率常量。
 */

const KIND_OPTIONS: { value: NonWageIncomeKind; label: string }[] = [
  { value: 'labor', label: '劳务报酬（兼职、咨询、设计、讲学等）' },
  { value: 'royalty', label: '稿酬（出版、发表作品）' },
  { value: 'franchise', label: '特许权使用费（专利、著作权等授权）' },
];

const KIND_LABEL: Record<NonWageIncomeKind, string> = {
  labor: '劳务报酬',
  royalty: '稿酬',
  franchise: '特许权使用费',
};

export default function LaborIncomeTax() {
  const [income, setIncome] = useState('10000');
  const [kind, setKind] = useState<NonWageIncomeKind>('labor');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const result = useMemo(() => {
    const v = Number(income.trim());
    if (!Number.isFinite(v) || v <= 0) return { error: '请输入大于 0 的收入金额' };
    const r = calcLaborIncomeTax({ income: v, kind });
    if ('error' in r) return { error: r.error };
    return r;
  }, [income, kind]);

  const summary =
    result && !('error' in result)
      ? `${KIND_LABEL[result.kind]}收入 ${money(result.income)} 元，减除费用 ${money(result.expense)} 元，` +
        `预扣率 ${(result.rate * 100).toFixed(0)}%，预扣税额 ${money(result.tax)} 元，到手 ${money(result.net)} 元`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">收入金额（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="100"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={income}
              onInput={(e) => setIncome((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">所得类型</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={kind}
              onChange={(e) => setKind((e.target as HTMLSelectElement).value as NonWageIncomeKind)}
            >
              {KIND_OPTIONS.map((o) => (
                <option value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        {result && 'error' in result && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && !('error' in result) && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">预扣预缴税额</p>
                <p class="text-3xl font-bold font-mono text-warning">{money(result.tax)}</p>
              </div>
              <div>
                <p class="text-xs opacity-60">实际到手</p>
                <p class="text-2xl font-bold font-mono text-success">{money(result.net)}</p>
              </div>
              <span class="badge badge-outline mb-1">预扣率 {(result.rate * 100).toFixed(0)}%</span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'lit' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'lit')}
              >
                {copied === 'lit' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">收入金额</td>
                    <td class="font-mono text-right">{money(result.income)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">减除费用</td>
                    <td class="font-mono text-right">−{money(result.expense)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">收入额{result.kind === 'royalty' && '（稿酬减按 70%）'}</td>
                    <td class="font-mono text-right">{money(result.incomeAmount)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">应纳税所得额</td>
                    <td class="font-mono text-right">{money(result.taxable)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">预扣率 / 速算扣除</td>
                    <td class="font-mono text-right">
                      {(result.rate * 100).toFixed(0)}% / {money(result.quickDeduction)} 元
                    </td>
                  </tr>
                  <tr>
                    <td class="opacity-60">实际税负</td>
                    <td class="font-mono text-right">{(result.effectiveRate * 100).toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">扣税后到手</td>
                    <td class="font-mono text-right text-success font-medium">{money(result.net)} 元</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p class="text-xs opacity-70 leading-relaxed">{result.note}</p>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        预扣预缴口径依据国家税务总局公告 2018 年第 61 号《个人所得税扣缴申报管理办法》：收入不超过 4000 元减除费用 800 元，
        超过 4000 元减除 20%；稿酬所得收入额减按 70% 计算；劳务报酬按 20% / 30% / 40% 三级预扣率（速算扣除 0 / 2000 / 7000）计征，
        稿酬与特许权使用费按 20% 计征。次年 3 月至 6 月年度汇算时并入综合所得重新计税，多退少补。本工具按单笔收入估算，
        不含增值税及附加与代开的经营所得口径，具体以扣缴义务人申报与税务机关汇算为准；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
