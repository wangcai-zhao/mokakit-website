import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const PRESETS = [2, 8, 10, 16, 32, 36] as const;
const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

function parseRadix(str: string, radix: number): bigint | null {
  const s = str.trim().toLowerCase().replace(/_/g, '');
  if (s === '') return null;
  if (radix < 2 || radix > 36) return null;
  const r = BigInt(radix);
  let result = 0n;
  let seen = false;
  for (const ch of s) {
    const idx = DIGITS.indexOf(ch);
    if (idx < 0 || idx >= radix) return null;
    result = result * r + BigInt(idx);
    seen = true;
  }
  return seen ? result : null;
}

function toRadix(n: bigint, radix: number): string {
  if (radix < 2 || radix > 36) return '进制需在 2-36 之间';
  if (n === 0n) return '0';
  const r = BigInt(radix);
  const neg = n < 0n;
  let x = neg ? -n : n;
  let out = '';
  while (x > 0n) {
    out = DIGITS[Number(x % r)]! + out;
    x = x / r;
  }
  return neg ? '-' + out : out;
}

function clampBase(v: number): number {
  if (!Number.isFinite(v)) return 10;
  return Math.min(36, Math.max(2, Math.round(v)));
}

type SetNum = (n: number) => void;

export default function BaseConverter() {
  const [value, setValue] = useState('');
  const [from, setFrom] = useState(10);
  const [to, setTo] = useState(16);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const big = useMemo(() => parseRadix(value, from), [value, from]);
  const out = useMemo(() => (big === null ? null : toRadix(big, to)), [big, to]);

  const copy = async (text: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const basePicker = (label: string, base: number, setBase: SetNum) => (
    <div>
      <div class="text-sm font-medium mb-1.5">{label}</div>
      <div class="flex items-center gap-2 flex-wrap">
        <div class="join">
          {PRESETS.map((b) => (
            <button
              type="button"
              class={`btn btn-sm join-item ${base === b ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setBase(b)}
            >
              {b}
            </button>
          ))}
        </div>
        <input
          type="number"
          min={2}
          max={36}
          class="input input-bordered input-sm w-20"
          value={base}
          onInput={(e) => setBase(clampBase(Number((e.target as HTMLInputElement).value)))}
        />
      </div>
    </div>
  );

  return (
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium" for="base-value">
          数值
        </label>
        <input
          id="base-value"
          type="text"
          class="input input-bordered mt-2 w-full font-mono"
          placeholder="支持下划线分组，如 1_000_000"
          value={value}
          onInput={(e) => setValue((e.target as HTMLInputElement).value)}
        />
      </div>

      {basePicker('原进制', from, setFrom)}
      {basePicker('目标进制', to, setTo)}

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-outline"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
        >
          交换进制
        </button>
      </div>

      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-sm font-medium">转换结果（{to} 进制）</span>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-primary'}`}
            onClick={() => out && copy(out)}
            disabled={!out}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <output class="block font-mono text-sm break-all bg-base-100 rounded-lg px-3 py-2 min-h-[2.5rem]">
          {out ?? <span class="opacity-40">请输入该进制下的有效数值</span>}
        </output>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        支持 2 到 36 进制，使用 BigInt 任意精度，超长数字也不会丢精度。所有计算均在本地完成。
      </p>
    </div>
  );
}
