import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

function gcd2(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function parseInts(s: string): number[] {
  return s
    .split(/[\s,，、;；\n]+/)
    .map((t) => t.trim())
    .filter((t) => t !== '')
    .map(Number)
    .filter((n) => Number.isInteger(n) && Number.isFinite(n));
}

export default function GcdLcm() {
  const [raw, setRaw] = useState('12 18 24');
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
    const arr = parseInts(raw);
    if (arr.length < 2) return null;
    let g = Math.abs(arr[0]);
    for (let i = 1; i < arr.length; i++) g = gcd2(g, arr[i]);
    let l = Math.abs(arr[0]) || 1;
    for (let i = 1; i < arr.length; i++) {
      const b = Math.abs(arr[i]) || 1;
      l = (l * b) / gcd2(l, b);
    }
    return { gcd: g, lcm: l, count: arr.length };
  }, [raw]);

  const text = res ? `最大公约数(GCD) = ${res.gcd}，最小公倍数(LCM) = ${res.lcm}` : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">输入整数</span>
          <span class="text-xs opacity-60"> 至少两个，用空格或逗号分隔</span>
          <input
            type="text"
            class="input input-bordered mt-1.5 w-full font-mono"
            value={raw}
            onInput={(e) => setRaw((e.target as HTMLInputElement).value)}
          />
        </label>

        {!res && <p class="mt-3 text-sm text-error">请输入至少两个有效整数</p>}

        {res && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">最大公约数 GCD</p>
                <p class="text-3xl font-bold font-mono">{res.gcd}</p>
              </div>
              <div>
                <p class="text-xs opacity-60">最小公倍数 LCM</p>
                <p class="text-3xl font-bold font-mono">{res.lcm}</p>
              </div>
              <button type="button" class={`btn btn-xs ml-auto ${copied === 'g' ? 'btn-success' : 'btn-ghost'}`} onClick={() => copy(text, 'g')}>
                {copied === 'g' ? '已复制' : '复制'}
              </button>
            </div>
            <p class="text-xs opacity-55">提示：a × b = GCD × LCM（两数时成立）</p>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        所有计算均在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
