import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Dir = 'to' | 'from';

const TABLE: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return '';
  let s = '';
  for (const [v, sym] of TABLE) {
    while (n >= v) {
      s += sym;
      n -= v;
    }
  }
  return s;
}

const MAP: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

function fromRoman(s: string): number {
  const up = s.trim().toUpperCase();
  if (!up) return NaN;
  for (const ch of up) if (!(ch in MAP)) return NaN;
  let total = 0;
  for (let i = 0; i < up.length; i++) {
    const cur = MAP[up[i]];
    const next = i + 1 < up.length ? MAP[up[i + 1]] : 0;
    total += cur < next ? -cur : cur;
  }
  return total;
}

export default function RomanNumeral() {
  const [dir, setDir] = useState<Dir>('to');
  const [arabic, setArabic] = useState('2026');
  const [roman, setRoman] = useState('MMXXVI');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const toResult = useMemo(() => {
    const n = Number(arabic);
    const r = toRoman(n);
    return r ? r : null;
  }, [arabic]);

  const fromResult = useMemo(() => {
    const n = fromRoman(roman);
    return Number.isFinite(n) && n >= 1 && n <= 3999 ? n : null;
  }, [roman]);

  const out = dir === 'to' ? toResult : fromResult;
  const label = dir === 'to' ? '罗马数字' : '阿拉伯数字';
  const copyText_ = dir === 'to' ? `${arabic} = ${toResult ?? '—'}` : `${roman} = ${fromResult ?? '—'}`;

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="join">
          <button type="button" class={`btn btn-sm join-item ${dir === 'to' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setDir('to')}>阿拉伯 → 罗马</button>
          <button type="button" class={`btn btn-sm join-item ${dir === 'from' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setDir('from')}>罗马 → 阿拉伯</button>
        </div>

        <div class="mt-3">
          {dir === 'to' ? (
            <label class="block">
              <span class="text-xs opacity-60">阿拉伯数字（1–3999）</span>
              <input type="number" class="input input-bordered input-sm mt-1 w-full font-mono" value={arabic} onInput={(e) => setArabic((e.target as HTMLInputElement).value)} />
            </label>
          ) : (
            <label class="block">
              <span class="text-xs opacity-60">罗马数字（I V X L C D M）</span>
              <input type="text" class="input input-bordered input-sm mt-1 w-full font-mono uppercase" value={roman} onInput={(e) => setRoman((e.target as HTMLInputElement).value)} />
            </label>
          )}
        </div>

        {!out && <p class="mt-3 text-sm text-error">输入超出范围或包含非法字符（仅支持 1–3999）</p>}

        {out && (
          <div class="mt-4 flex items-center gap-3">
            <div>
              <p class="text-xs opacity-60">{label}</p>
              <p class="text-3xl font-bold font-mono tracking-wider">{out}</p>
            </div>
            <button type="button" class={`btn btn-xs ml-auto ${copied === 'r' ? 'btn-success' : 'btn-ghost'}`} onClick={() => copy(copyText_, 'r')}>
              {copied === 'r' ? '已复制' : '复制'}
            </button>
          </div>
        )}
        <p class="mt-3 text-xs opacity-55">规则：小数位在大数左侧表示减（IV=4），最多连续三个相同符号。</p>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        所有计算均在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
