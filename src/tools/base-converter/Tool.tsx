import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import {
  PRESETS,
  parseRadix,
  toRadix,
  clampBase,
  formatRadix,
  float64ToHex,
  ieee754Parts,
} from './radix';

export interface BaseConverterProps {
  /** 子页预填：源进制 */
  initialFrom?: number;
  /** 子页预填：目标进制 */
  initialTo?: number;
}

const clampInit = (v: number | undefined, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? clampBase(v) : fallback;

export default function BaseConverter({ initialFrom, initialTo }: BaseConverterProps) {
  const [value, setValue] = useState('');
  const [from, setFrom] = useState(() => clampInit(initialFrom, 10));
  const [to, setTo] = useState(() => clampInit(initialTo, 16));
  const [group, setGroup] = useState(false);
  const [prefix, setPrefix] = useState(false);
  const [copied, setCopied] = useState('');
  // IEEE 754 折叠区输入
  const [f64in, setF64in] = useState('3.14');

  const big = useMemo(() => parseRadix(value, from), [value, from]);
  const out = useMemo(() => (big === null ? null : toRadix(big, to)), [big, to]);

  /** 全进制一览：常用预设各转一份 */
  const allRadix = useMemo(
    () =>
      big === null
        ? []
        : PRESETS.map((b) => ({ radix: b, text: toRadix(big, b) })),
    [big],
  );

  const f64 = useMemo(() => {
    const n = Number(f64in);
    if (f64in.trim() === '' || !Number.isFinite(n)) return null;
    const hex = float64ToHex(n);
    return { hex, parts: ieee754Parts(hex) };
  }, [f64in]);

  const copy = async (text: string, id: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(id);
    window.setTimeout(() => setCopied(''), 1800);
  };

  const basePicker = (label: string, base: number, setBase: (n: number) => void) => (
    <div>
      <div class="text-sm font-medium mb-1.5">{label}</div>
      <div class="flex items-center gap-2 flex-wrap">
        <div class="join">
          {PRESETS.map((b) => (
            <button
              type="button"
              key={b}
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

      <div class="flex items-center gap-2 flex-wrap">
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
        <label class="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            class="checkbox checkbox-xs"
            checked={group}
            onChange={(e) => setGroup((e.target as HTMLInputElement).checked)}
          />
          分组显示（每 4 位）
        </label>
        <label class="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            class="checkbox checkbox-xs"
            checked={prefix}
            onChange={(e) => setPrefix((e.target as HTMLInputElement).checked)}
          />
          0x / 0b 前缀
        </label>
      </div>

      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-sm font-medium">转换结果（{to} 进制）</span>
          <button
            type="button"
            class={`btn btn-xs ${copied === 'main' ? 'btn-success' : 'btn-primary'}`}
            onClick={() => out && copy(out, 'main')}
            disabled={!out}
          >
            {copied === 'main' ? '已复制' : '复制'}
          </button>
        </div>
        <output class="block font-mono text-sm break-all bg-base-100 rounded-lg px-3 py-2 min-h-[2.5rem]">
          {out ? (
            formatRadix(out, to, { group, prefix })
          ) : (
            <span class="opacity-40">请输入该进制下的有效数值</span>
          )}
        </output>
      </div>

      {/* 全进制一览：输入有效后同屏展示常用进制 */}
      {allRadix.length > 0 && (
        <div class="space-y-2">
          <div class="text-sm font-medium">全进制一览</div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allRadix.map((r) => (
              <div key={r.radix} class="rounded-lg bg-base-200 p-2.5">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs opacity-70">{r.radix} 进制</span>
                  <button
                    type="button"
                    class="btn btn-xs btn-ghost"
                    onClick={() => copy(r.text, `r${r.radix}`)}
                  >
                    {copied === `r${r.radix}` ? '已复制' : '复制'}
                  </button>
                </div>
                <div class="font-mono text-sm break-all">{formatRadix(r.text, r.radix, { group, prefix })}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IEEE 754 浮点 → 十六进制折叠区（兑现 description 承诺） */}
      <details class="rounded-xl bg-base-200 p-3 sm:p-4">
        <summary class="cursor-pointer text-sm font-medium select-none">
          IEEE 754 浮点进制说明（十进制小数 → 双精度十六进制）
        </summary>
        <div class="space-y-3 pt-3">
          <label class="form-control w-40">
            <span class="label-text text-xs">十进制小数</span>
            <input
              type="text"
              class="input input-sm input-bordered font-mono"
              value={f64in}
              onInput={(e) => setF64in((e.target as HTMLInputElement).value)}
              placeholder="如 3.14"
            />
          </label>
          {f64 ? (
            <div class="space-y-2 text-sm">
              <div class="flex flex-wrap gap-x-6 gap-y-1 font-mono">
                <span>
                  十六进制：<b class="break-all">{f64.hex}</b>
                </span>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost"
                  onClick={() => copy(f64.hex, 'f64')}
                >
                  {copied === 'f64' ? '已复制' : '复制'}
                </button>
              </div>
              <div class="font-mono text-xs opacity-70 break-all">
                符号位 {f64.parts.sign}（{f64.parts.sign === '0' ? '正' : '负'}）· 指数 {f64.parts.exponent}（=
                {f64.parts.exponentValue - 1023}）· 尾数 {f64.parts.mantissa.slice(0, 26)}…
              </div>
              <p class="text-xs opacity-60 leading-relaxed">
                这就是「0.1 + 0.2 ≠ 0.3」的根源：0.1 的双精度表示是 0x3FB999999999999A，与精确值存在约
                5.55e-17 的误差，累加后即显现。整数部分用 BigInt 精确转换，小数部分按 IEEE 754
                双精度（64 位 = 1 符号 + 11 指数 + 52 尾数）表示。
              </p>
            </div>
          ) : (
            <p class="text-xs opacity-50">输入一个有限小数，如 3.14、0.1、255.5</p>
          )}
        </div>
      </details>

      <p class="text-xs opacity-55 leading-relaxed">
        支持 2 到 36 进制，使用 BigInt 任意精度，超长数字也不会丢精度。所有计算均在本地完成。
      </p>
    </div>
  );
}
