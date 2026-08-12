import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

interface Props {
  title?: string;
}

const QUARTERS = [
  { q: 1, start: 1, end: 3 },
  { q: 2, start: 4, end: 6 },
  { q: 3, start: 7, end: 9 },
  { q: 4, start: 10, end: 12 },
];

const MONTHS = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];

export default function MonthToQuarter({ title }: Props) {
  const [month, setMonth] = useState('8');
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    const m = Number(month);
    if (!Number.isFinite(m) || m < 1 || m > 12) return null;
    return QUARTERS[Math.ceil(m / 3) - 1];
  }, [month]);

  const copy = async (text: string) => {
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      {title && <p class="text-sm opacity-70">{title}</p>}

      <label class="block">
        <span class="text-sm font-medium">输入月份（1-12）</span>
        <input
          type="number"
          min="1"
          max="12"
          class="input input-bordered input-sm mt-1.5 w-full font-mono"
          value={month}
          onInput={(e) => setMonth((e.target as HTMLInputElement).value)}
        />
      </label>

      {!res && <p class="text-sm text-error">请输入 1 到 12 之间的月份</p>}

      {res && (
        <div class="flex items-center gap-2 rounded-xl bg-base-100 p-3">
          <div class="flex-1">
            <p class="text-xs opacity-60">{MONTHS[res.start - 1]} 属于</p>
            <p class="text-lg font-semibold">第 {res.q} 季度（Q{res.q}）</p>
            <code class="font-mono text-sm opacity-70">
              {MONTHS[res.start - 1]} ~ {MONTHS[res.end - 1]}
            </code>
          </div>
          <button
            type="button"
            class={`btn btn-xs shrink-0 ${copied ? 'btn-success' : 'btn-ghost'}`}
            onClick={() => copy(`Q${res.q}`)}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        公历按自然月划分：Q1=1~3 月，Q2=4~6 月，Q3=7~9 月，Q4=10~12 月。全部本地计算。
      </p>
    </div>
  );
}
