import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { parseDate, toInputValue, fmtFull, daysBetween, addDays, WEEK_LABEL } from './dates';

interface Props {
  title?: string;
}

export default function PregnantWeeks({ title }: Props) {
  const today = toInputValue(new Date());
  const [lmp, setLmp] = useState('2026-05-01');
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    const d = parseDate(lmp);
    if (!d) return null;
    const now = new Date();
    const diffDays = daysBetween(d, now);
    if (diffDays < 0) return { negative: true, diffDays };
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    const due = addDays(d, 280); // 40 周
    return { negative: false, diffDays, weeks, days, due };
  }, [lmp]);

  const copy = async (text: string) => {
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      {title && <p class="text-sm opacity-70">{title}</p>}

      <label class="block">
        <span class="text-sm font-medium">末次月经（LMP）日期</span>
        <input
          type="date"
          class="input input-bordered input-sm mt-1.5 w-full"
          value={lmp}
          onInput={(e) => setLmp((e.target as HTMLInputElement).value)}
        />
      </label>

      {!res && <p class="text-sm text-error">请填写有效的末次月经日期</p>}

      {res && res.negative && (
        <p class="text-sm text-warning">末次月经日期晚于今天，请核对是否填反。</p>
      )}

      {res && !res.negative && (
        <div class="space-y-3">
          <div class="flex items-center gap-2 rounded-xl bg-base-100 p-3">
            <div class="flex-1">
              <p class="text-xs opacity-60">今天（{fmtFull(new Date())}）怀孕</p>
              <p class="text-lg font-semibold">
                {res.weeks} 周 {res.days} 天
              </p>
              <code class="font-mono text-sm opacity-70">共 {res.diffDays} 天</code>
            </div>
            <button
              type="button"
              class={`btn btn-xs shrink-0 ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => copy(`${res.weeks}周${res.days}天`)}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <div class="rounded-xl bg-base-200 p-3">
            <p class="text-xs opacity-60">预计预产期（LMP + 280 天）</p>
            <p class="text-lg font-semibold">{fmtFull(res.due)}</p>
            <code class="font-mono text-sm opacity-70">{toInputValue(res.due)}</code>
          </div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        按医学惯例以「周 + 天」显示孕周，预产期按末次月经加 280 天（40 周）估算。仅供参考，请以产检为准。
      </p>
    </div>
  );
}
