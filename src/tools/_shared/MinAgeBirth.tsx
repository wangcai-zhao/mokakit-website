import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { parseDate, toInputValue, fmtFull, WEEK_LABEL } from './dates';

interface Props {
  title?: string;
}

export default function MinAgeBirth({ title }: Props) {
  const today = toInputValue(new Date());
  const [check, setCheck] = useState(today);
  const [age, setAge] = useState('18');
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    const c = parseDate(check);
    const a = Number(age);
    if (!c || !Number.isFinite(a) || a < 0) return null;
    const target = new Date(c.getFullYear() - a, c.getMonth(), c.getDate());
    // 若减龄后日期仍晚于核验日（如闰年 2/29），再往前一天
    if (target.getTime() > c.getTime()) {
      target.setDate(target.getDate() - 1);
    }
    return target;
  }, [check, age]);

  const copy = async (text: string) => {
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      {title && <p class="text-sm opacity-70">{title}</p>}

      <div class="grid gap-3 rounded-xl bg-base-200 p-3 sm:grid-cols-2 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">核验日期（如办证/签约日）</span>
          <input
            type="date"
            class="input input-bordered input-sm mt-1.5 w-full"
            value={check}
            onInput={(e) => setCheck((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">要求的最低年龄</span>
          <input
            type="number"
            min="0"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={age}
            onInput={(e) => setAge((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      {!res && <p class="text-sm text-error">请填写有效的核验日期与非负年龄</p>}

      {res && (
        <div class="flex items-center gap-2 rounded-xl bg-base-100 p-3">
          <div class="flex-1">
            <p class="text-xs opacity-60">
              须于 {fmtFull(parseDate(check)!)} 前（含当日）出生，才满 {age} 岁
            </p>
            <p class="text-lg font-semibold">{fmtFull(res)}</p>
            <code class="font-mono text-sm opacity-70">{toInputValue(res)}</code>
          </div>
          <button
            type="button"
            class={`btn btn-xs shrink-0 ${copied ? 'btn-success' : 'btn-ghost'}`}
            onClick={() => copy(toInputValue(res))}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        逻辑：最晚出生日 = 核验日减去相应年龄；若遇闰年 2 月 29 日等边界，自动回退一天。结果即「出生日期须不晚于该日」。仅供资格核验参考。
      </p>
    </div>
  );
}
