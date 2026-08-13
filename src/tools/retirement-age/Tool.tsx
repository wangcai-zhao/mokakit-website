import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Category = 'male' | 'female-cadre' | 'female-worker';

interface Rule {
  baseAge: number; // 原法定年龄（岁）
  targetAge: number; // 目标年龄上限
  baselineY: number;
  baselineM: number; // 起始受影响出生年月（含）
  stepMonths: number; // 每多少个月延迟 1 个月
}

const RULES: Record<Category, Rule> = {
  male: { baseAge: 60, targetAge: 63, baselineY: 1965, baselineM: 1, stepMonths: 4 },
  'female-cadre': { baseAge: 55, targetAge: 58, baselineY: 1970, baselineM: 1, stepMonths: 4 },
  'female-worker': { baseAge: 50, targetAge: 55, baselineY: 1975, baselineM: 1, stepMonths: 2 },
};

const CAT_LABEL: Record<Category, string> = {
  male: '男职工',
  'female-cadre': '女职工 / 女干部',
  'female-worker': '女工人',
};

function monthNum(y: number, m: number) {
  return y * 12 + (m - 1);
}

export default function RetirementAge() {
  const [year, setYear] = useState('1972');
  const [month, setMonth] = useState('6');
  const [cat, setCat] = useState<Category>('male');
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
    const y = Number(year.trim());
    const m = Number(month.trim());
    if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
    if (y < 1940 || y > 2010) return { error: '请输入 1940–2010 之间的出生年份' };
    if (m < 1 || m > 12) return { error: '月份需在 1–12 之间' };
    const rule = RULES[cat];
    const birth = monthNum(y, m);
    const base = monthNum(rule.baselineY, rule.baselineM);
    const diff = birth - base;
    let delayMonths = 0;
    if (diff > 0) delayMonths = Math.floor(diff / rule.stepMonths);
    const maxDelay = (rule.targetAge - rule.baseAge) * 12;
    delayMonths = Math.min(delayMonths, maxDelay);
    const retireAgeMonths = rule.baseAge * 12 + delayMonths;
    const retireAgeYears = Math.floor(retireAgeMonths / 12);
    const retireAgeExtra = retireAgeMonths % 12;
    const retireTotal = birth + retireAgeMonths;
    const ry = Math.floor(retireTotal / 12);
    const rm = (retireTotal % 12) + 1;
    return {
      retireAgeYears,
      retireAgeExtra,
      delayMonths,
      ry,
      rm,
      changed: delayMonths > 0,
    };
  }, [year, month, cat]);

  const summary =
    result && 'ry' in result
      ? `法定退休年龄 ${result.retireAgeYears} 岁${
          result.retireAgeExtra ? result.retireAgeExtra + ' 个月' : ''
        }，退休时间 ${result.ry} 年 ${result.rm} 月（较原政策延迟 ${result.delayMonths} 个月）`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">出生年份</span>
            <input
              type="number"
              inputmode="numeric"
              min={1940}
              max={2010}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={year}
              onInput={(e) => setYear((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">出生月份</span>
            <input
              type="number"
              inputmode="numeric"
              min={1}
              max={12}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={month}
              onInput={(e) => setMonth((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">人员类别</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={cat}
              onChange={(e) => setCat((e.target as HTMLSelectElement).value as Category)}
            >
              <option value="male">男职工（原 60 → 63）</option>
              <option value="female-cadre">女职工 / 女干部（原 55 → 58）</option>
              <option value="female-worker">女工人（原 50 → 55）</option>
            </select>
          </label>
        </div>

        {result && 'error' in result && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && 'ry' in result && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">法定退休年龄</p>
                <p class="text-3xl font-bold font-mono text-primary">
                  {result.retireAgeYears} 岁{result.retireAgeExtra ? ` ${result.retireAgeExtra} 个月` : ''}
                </p>
              </div>
              <span class="badge badge-outline mb-1">
                {result.changed ? `较原政策延迟 ${result.delayMonths} 个月` : '未受影响（按原年龄）'}
              </span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'r' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'r')}
              >
                {copied === 'r' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">预计退休年月</td>
                    <td class="font-mono text-right font-medium">
                      {result.ry} 年 {result.rm} 月
                    </td>
                  </tr>
                  <tr>
                    <td class="opacity-60">延迟月数</td>
                    <td class="font-mono text-right">{result.delayMonths} 个月</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">原法定年龄（{CAT_LABEL[cat]}）</td>
                    <td class="font-mono text-right">{RULES[cat].baseAge} 岁</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">目标年龄（上限）</td>
                    <td class="font-mono text-right">{RULES[cat].targetAge} 岁</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        依据 2025 年起实施的渐进式延迟退休政策：男职工每 4 个月延迟 1 个月（60→63），原 55 周岁的女职工每 4 个月延迟 1 个月（55→58），原 50 周岁的女工人每 2 个月延迟 1
        个月（50→55）。按出生年月精确套用，出生在政策起始月之前者不受影响。最低缴费年限同步从 15 年逐步提高至 20 年（2030 起）。本结果为政策推算，具体以人社部门规定为准；计算在浏览器本地完成，不上传数据。
      </p>
    </div>
  );
}
