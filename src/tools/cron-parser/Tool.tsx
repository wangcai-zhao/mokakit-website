import { useState, useEffect } from 'preact/hooks';

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

interface Exp {
  isAll: boolean;
  values: number[];
}

function expand(field: string, min: number, max: number): Exp {
  if (field === '*' || field === '?') return { isAll: true, values: [] };
  const vals = new Set<number>();
  for (const part of field.split(',')) {
    if (part.includes('/')) {
      const [range, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);
      let lo: number;
      let hi: number;
      if (range === '*' || range === '?') {
        lo = min;
        hi = max;
      } else if (range.includes('-')) {
        [lo, hi] = range.split('-').map((x) => parseInt(x, 10));
      } else {
        lo = hi = parseInt(range, 10);
      }
      if (!isNaN(step) && step > 0) {
        for (let v = lo; v <= hi; v += step) vals.add(v);
      }
    } else if (part.includes('-')) {
      const [a, b] = part.split('-').map((x) => parseInt(x, 10));
      for (let v = a; v <= b; v++) vals.add(v);
    } else {
      const v = parseInt(part, 10);
      if (!isNaN(v)) vals.add(v);
    }
  }
  return { isAll: false, values: [...vals].sort((a, b) => a - b) };
}

function describe(field: string, unit: string, map?: string[]): string {
  const e = expand(field, 0, 59);
  if (e.isAll) return `每${unit}`;
  if (e.values.length === 1) return `第${e.values[0]}${unit}`;
  return e.values.map((v) => `${map ? map[v] ?? v : v}${unit}`).join('、');
}

export default function CronParser() {
  const [expr, setExpr] = useState('0 9 * * 1-5');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const t = expr.trim();
    if (!t) {
      setResult('');
      setError('');
      return;
    }
    const parts = t.split(/\s+/);
    if (parts.length !== 5) {
      setResult('');
      setError('需要 5 段（分 时 日 月 周），用空格分隔');
      return;
    }
    try {
      const [m, h, dom, mon, dow] = parts;
      const minute = describe(m, '分钟');
      const hour = describe(h, '点');
      const day = describe(dom, '日');
      const month = describe(mon, '月', MONTHS);
      const week = describe(dow, '', WEEK);
      setResult(`在 ${day} ${hour}${minute}（${month}，周：${week}）执行`);
      setError('');
    } catch {
      setResult('');
      setError('解析失败，请检查表达式语法');
    }
  }, [expr]);

  return (
    <div class="space-y-4">
      <label class="text-sm font-medium opacity-70" for="cron-input">Cron 表达式</label>
      <input
        id="cron-input"
        class="input input-bordered w-full text-sm font-mono"
        placeholder="例如：0 9 * * 1-5"
        value={expr}
        onInput={(e) => setExpr((e.target as HTMLInputElement).value)}
      />

      <div class="flex flex-wrap gap-1 text-xs">
        {['0 9 * * 1-5', '*/15 * * * *', '0 0 1 * *', '30 18 * * *', '0 0 * * 0'].map((ex) => (
          <button
            type="button"
            key={ex}
            class="btn btn-outline btn-xs font-mono"
            onClick={() => setExpr(ex)}
          >
            {ex}
          </button>
        ))}
      </div>

      {error && <div class="alert alert-error text-sm py-2">{error}</div>}

      {result && (
        <div class="rounded-xl bg-base-200 p-4">
          <div class="text-xs opacity-60 mb-1">解读</div>
          <div class="text-sm font-medium leading-relaxed">{result}</div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        支持标准 5 段语法：<code>*</code> 任意、<code>,</code> 列举、<code>-</code> 区间、<code>/</code> 步长。
        暂不支持秒级（6 段）与宏（如 @daily）。
      </p>
    </div>
  );
}
