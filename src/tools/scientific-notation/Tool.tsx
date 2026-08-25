import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

function toSci(x: number): { coeff: number; exp: number } {
  if (x === 0) return { coeff: 0, exp: 0 };
  const exp = Math.floor(Math.log10(Math.abs(x)));
  const coeff = x / Math.pow(10, exp);
  return { coeff, exp };
}

function toEngineering(x: number): { coeff: number; exp: number } {
  if (x === 0) return { coeff: 0, exp: 0 };
  const exp = Math.floor(Math.log10(Math.abs(x)));
  const e = Math.floor(exp / 3) * 3;
  const coeff = x / Math.pow(10, e);
  return { coeff, exp: e };
}

function fmt(c: number, e: number): string {
  const cs = Number(c.toFixed(6));
  const sup = String(e)
    .replace(/-/g, '⁻')
    .replace(/0/g, '⁰')
    .replace(/1/g, '¹')
    .replace(/2/g, '²')
    .replace(/3/g, '³')
    .replace(/4/g, '⁴')
    .replace(/5/g, '⁵')
    .replace(/6/g, '⁶')
    .replace(/7/g, '⁷')
    .replace(/8/g, '⁸')
    .replace(/9/g, '⁹');
  return `${cs} × 10${sup}`;
}

export default function ScientificNotation() {
  const [raw, setRaw] = useState('123000');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const res = useMemo(() => {
    const x = Number(raw);
    if (!Number.isFinite(x)) return null;
    const sci = toSci(x);
    const eng = toEngineering(x);
    return { x, sci, eng, plain: x.toPrecision(10).replace(/\.?0+$/, '') };
  }, [raw]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">输入数字</span>
          <span class="text-xs opacity-60"> 支持普通小数或 e 记数法（如 1.23e5）</span>
          <input
            type="text"
            class="input input-bordered mt-1.5 w-full font-mono"
            value={raw}
            onInput={(e) => setRaw((e.target as HTMLInputElement).value)}
          />
        </label>

        {!res && <p class="mt-3 text-sm text-error">请输入有效数字</p>}

        {res && (
          <div class="mt-4 space-y-3">
            <div class="flex items-center gap-3">
              <div>
                <p class="text-xs opacity-60">科学计数法</p>
                <p class="text-2xl font-bold font-mono">{fmt(res.sci.coeff, res.sci.exp)}</p>
              </div>
              <button type="button" class={`btn btn-xs ml-auto ${copied === 's' ? 'btn-success' : 'btn-ghost'}`} onClick={() => copy(fmt(res.sci.coeff, res.sci.exp), 's')}>
                {copied === 's' ? '已复制' : '复制'}
              </button>
            </div>
            <div class="flex items-center gap-3">
              <div>
                <p class="text-xs opacity-60">工程计数法</p>
                <p class="text-2xl font-bold font-mono">{fmt(res.eng.coeff, res.eng.exp)}</p>
              </div>
              <button type="button" class={`btn btn-xs ${copied === 'e' ? 'btn-success' : 'btn-ghost'}`} onClick={() => copy(fmt(res.eng.coeff, res.eng.exp), 'e')}>
                {copied === 'e' ? '已复制' : '复制'}
              </button>
            </div>
            <div class="flex items-center gap-3">
              <div>
                <p class="text-xs opacity-60">普通十进制</p>
                <p class="text-2xl font-bold font-mono">{res.plain}</p>
              </div>
              <button type="button" class={`btn btn-xs ${copied === 'p' ? 'btn-success' : 'btn-ghost'}`} onClick={() => copy(String(res.x), 'p')}>
                {copied === 'p' ? '已复制' : '复制'}
              </button>
            </div>
          </div>
        )}
        <p class="mt-3 text-xs opacity-55">科学计数法：系数 1≤|a|&lt;10；工程计数法：指数为 3 的倍数。</p>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        所有计算均在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
