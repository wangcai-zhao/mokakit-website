import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

export default function ProvidentFundCalc() {
  const [base, setBase] = useState('10000');
  const [personal, setPersonal] = useState('12');
  const [company, setCompany] = useState('12');
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    const b = Number(base);
    const p = Number(personal) / 100;
    const c = Number(company) / 100;
    if (!Number.isFinite(b) || b < 0) return null;
    if (!Number.isFinite(p) || p < 0 || p > 1) return null;
    if (!Number.isFinite(c) || c < 0 || c > 1) return null;
    const pMonthly = b * p;
    const cMonthly = b * c;
    const total = pMonthly + cMonthly;
    return { pMonthly, cMonthly, total, year: total * 12 };
  }, [base, personal, company]);

  const copy = async (t: string) => {
    await copyText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <label class="form-control">
          <span class="label-text">缴存基数（元/月）</span>
          <input
            type="number"
            class="input input-bordered input-sm"
            value={base}
            onInput={(e) => setBase((e.target as HTMLInputElement).value)}
          />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <span class="label-text">个人比例（%）</span>
            <input
              type="number"
              class="input input-bordered input-sm"
              value={personal}
              onInput={(e) => setPersonal((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="form-control">
            <span class="label-text">单位比例（%）</span>
            <input
              type="number"
              class="input input-bordered input-sm"
              value={company}
              onInput={(e) => setCompany((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
        {!res && <p class="text-sm text-error">请输入有效正数，比例在 0–100 之间。</p>}
        {res && (
          <div class="mt-2 space-y-2">
            <Row label="个人月缴存" value={`¥${res.pMonthly.toFixed(2)}`} />
            <Row label="单位月缴存" value={`¥${res.cMonthly.toFixed(2)}`} />
            <Row label="每月合计" value={`¥${res.total.toFixed(2)}`} highlight />
            <Row label="全年合计" value={`¥${res.year.toFixed(2)}`} highlight />
            <button
              type="button"
              class={`btn btn-xs mt-1 ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() =>
                copy(`每月公积金合计 ¥${res.total.toFixed(2)}（全年 ¥${res.year.toFixed(2)}）`)
              }
            >
              {copied ? '已复制' : '复制结果'}
            </button>
          </div>
        )}
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        结果仅供参考，实际以当地公积金中心核定为准。计算均在浏览器本地完成。
      </p>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div class="flex items-center justify-between">
      <span class="text-sm opacity-70">{label}</span>
      <span class={`font-mono font-bold ${highlight ? 'text-lg text-primary' : 'text-base'}`}>
        {value}
      </span>
    </div>
  );
}
