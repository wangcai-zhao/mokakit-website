import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Mode = 'round' | 'ceil' | 'floor' | 'banker';
type Unit = 'dec' | '10' | '100' | '1000';

function applyMode(x: number, mode: Mode): number {
  if (mode === 'ceil') return Math.ceil(x);
  if (mode === 'floor') return Math.floor(x);
  if (mode === 'banker') {
    const fl = Math.floor(x);
    const diff = x - fl;
    if (Math.abs(diff - 0.5) < 1e-9) {
      return fl % 2 === 0 ? fl : fl + 1;
    }
    return Math.round(x);
  }
  return Math.round(x);
}

function num(n: number): string {
  return String(Number(n.toFixed(8)));
}

export default function RoundingCalculator() {
  const [value, setValue] = useState('3.14159');
  const [mode, setMode] = useState<Mode>('round');
  const [unit, setUnit] = useState<Unit>('dec');
  const [decimals, setDecimals] = useState('2');
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
    const v = Number(value);
    if (!Number.isFinite(v)) return null;
    const factor =
      unit === 'dec' ? Math.pow(10, Math.max(0, Math.floor(Number(decimals) || 0)))
      : Number(unit);
    const scaled = applyMode(v * factor, mode) / factor;
    return scaled;
  }, [value, mode, unit, decimals]);

  const text = result !== null ? `结果 = ${num(result)}` : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="text-xs opacity-60">原始数字</span>
            <input type="number" step="any" class="input input-bordered input-sm mt-1 w-full font-mono" value={value} onInput={(e) => setValue((e.target as HTMLInputElement).value)} />
          </label>
          <label class="block">
            <span class="text-xs opacity-60">舍入方式</span>
            <select class="select select-bordered select-sm mt-1 w-full" value={mode} onChange={(e) => setMode((e.target as HTMLSelectElement).value as Mode)}>
              <option value="round">四舍五入</option>
              <option value="ceil">向上取整</option>
              <option value="floor">向下取整</option>
              <option value="banker">银行家舍入</option>
            </select>
          </label>
          <label class="block">
            <span class="text-xs opacity-60">取整粒度</span>
            <select class="select select-bordered select-sm mt-1 w-full" value={unit} onChange={(e) => setUnit((e.target as HTMLSelectElement).value as Unit)}>
              <option value="dec">保留小数位</option>
              <option value="10">到十位</option>
              <option value="100">到百位</option>
              <option value="1000">到千位</option>
            </select>
          </label>
        </div>

        {unit === 'dec' && (
          <label class="block mt-3">
            <span class="text-xs opacity-60">保留小数位数</span>
            <input type="number" min="0" class="input input-bordered input-sm mt-1 w-24 font-mono" value={decimals} onInput={(e) => setDecimals((e.target as HTMLInputElement).value)} />
          </label>
        )}

        {result === null && <p class="mt-3 text-sm text-error">请输入有效数字</p>}

        {result !== null && (
          <div class="mt-4 flex items-center gap-3">
            <span class="text-3xl font-bold font-mono">{num(result)}</span>
            <button type="button" class={`btn btn-xs ml-auto ${copied === 'r' ? 'btn-success' : 'btn-ghost'}`} onClick={() => copy(text, 'r')}>
              {copied === 'r' ? '已复制' : '复制'}
            </button>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        所有计算均在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
