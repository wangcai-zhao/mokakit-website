import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Kind = 'cn' | 'eu' | 'usw' | 'usm' | 'uk';
const KINDS: { k: Kind; label: string }[] = [
  { k: 'cn', label: '中国码（脚长 mm）' },
  { k: 'eu', label: '欧洲码 EU' },
  { k: 'usw', label: '美码（女）US' },
  { k: 'usm', label: '美码（男）US' },
  { k: 'uk', label: '英码 UK' },
];

function toFootCm(k: Kind, v: number): number | null {
  if (!Number.isFinite(v)) return null;
  switch (k) {
    case 'cn':
      return v / 10;
    case 'eu':
      return (v + 10) / 2;
    case 'usw':
      return (v + 41) / 2;
    case 'usm':
      return (v + 43) / 2;
    case 'uk':
      return (v + 42) / 2;
  }
}
function fmt(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

export default function ShoeSizeCalc() {
  const [kind, setKind] = useState<Kind>('eu');
  const [val, setVal] = useState('40');
  const [copied, setCopied] = useState(false);

  const r = useMemo(() => {
    const footCm = toFootCm(kind, Number(val));
    if (footCm == null || footCm <= 0 || footCm > 40) return null;
    const cn = footCm * 10;
    const eu = footCm * 2 - 10;
    const usw = eu - 31;
    const usm = eu - 33;
    const uk = eu - 32;
    return { cn, eu, usw, usm, uk, footCm };
  }, [kind, val]);

  const copy = async (t: string) => {
    await copyText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <label class="form-control">
          <span class="label-text">已知尺码类型</span>
          <select
            class="select select-bordered select-sm"
            value={kind}
            onChange={(e) => setKind((e.target as HTMLSelectElement).value as Kind)}
          >
            {KINDS.map((x) => (
              <option value={x.k}>{x.label}</option>
            ))}
          </select>
        </label>
        <label class="form-control">
          <span class="label-text">尺码数值</span>
          <input
            type="number"
            class="input input-bordered input-sm font-mono"
            value={val}
            onInput={(e) => setVal((e.target as HTMLInputElement).value)}
          />
        </label>
        {!r && <p class="text-sm text-error">请输入有效的尺码数值。</p>}
        {r && (
          <div class="space-y-2">
            <Row label="脚长" value={`${fmt(r.footCm)} cm`} highlight />
            <Row label="中国码" value={fmt(r.cn)} />
            <Row label="欧洲码 EU" value={fmt(r.eu)} />
            <Row label="美码（女）" value={fmt(r.usw)} />
            <Row label="美码（男）" value={fmt(r.usm)} />
            <Row label="英码 UK" value={fmt(r.uk)} />
            <button
              type="button"
              class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() =>
                copy(
                  `脚长${fmt(r.footCm)}cm ≈ 中国${fmt(r.cn)} / EU${fmt(r.eu)} / US女${fmt(r.usw)} / US男${fmt(r.usm)} / UK${fmt(r.uk)}`
                )
              }
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        )}
      </div>
      <p class="text-xs opacity-55">
        按通用换算近似，不同品牌/鞋型常有半码差异，购买请以实物为准。全部本地计算。
      </p>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div class="flex items-center justify-between">
      <span class="text-sm opacity-70">{label}</span>
      <span class={`font-mono font-bold ${highlight ? 'text-primary' : ''}`}>{value}</span>
    </div>
  );
}
