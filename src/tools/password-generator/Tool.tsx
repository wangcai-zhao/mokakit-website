import { useState, useCallback, useEffect, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/** 字符集定义 */
const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digit: '0123456789',
  symbol: '!@#$%^&*()-_=+[]{};:,.<>?',
} as const;

/** 在多种常见字体下容易看混的字符 */
const AMBIGUOUS = new Set('0OoIl1|`\'"~,;:.'.split(''));

/**
 * 从字符集中安全地取一个随机字符。
 *
 * 关键：不能直接用 `random % charset.length`，那会产生模偏差
 * （modulo bias），让部分字符出现概率偏高，削弱密码强度。
 * 这里用拒绝采样（rejection sampling）：丢弃落在不完整区间的取样值。
 */
function secureRandomIndex(max: number): number {
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let v: number;
  do {
    crypto.getRandomValues(buf);
    v = buf[0]!;
  } while (v >= limit);
  return v % max;
}

/** Fisher-Yates 洗牌，同样使用加密级随机源 */
function secureShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = secureRandomIndex(i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

interface Options {
  length: number;
  lower: boolean;
  upper: boolean;
  digit: boolean;
  symbol: boolean;
  excludeAmbiguous: boolean;
}

function buildCharset(o: Options): string {
  let chars = '';
  if (o.lower) chars += SETS.lower;
  if (o.upper) chars += SETS.upper;
  if (o.digit) chars += SETS.digit;
  if (o.symbol) chars += SETS.symbol;
  if (o.excludeAmbiguous) {
    chars = chars
      .split('')
      .filter((c) => !AMBIGUOUS.has(c))
      .join('');
  }
  return chars;
}

function generate(o: Options): string {
  const charset = buildCharset(o);
  if (!charset) return '';

  // 先保证每个被勾选的类别至少出现一次，再补足剩余长度
  const required: string[] = [];
  const pools: string[] = [];
  const pick = (raw: string) => {
    const pool = o.excludeAmbiguous
      ? raw
          .split('')
          .filter((c) => !AMBIGUOUS.has(c))
          .join('')
      : raw;
    if (pool) {
      pools.push(pool);
      required.push(pool[secureRandomIndex(pool.length)]!);
    }
  };
  if (o.lower) pick(SETS.lower);
  if (o.upper) pick(SETS.upper);
  if (o.digit) pick(SETS.digit);
  if (o.symbol) pick(SETS.symbol);

  const out = required.slice(0, o.length);
  for (let i = out.length; i < o.length; i++) {
    out.push(charset[secureRandomIndex(charset.length)]!);
  }
  return secureShuffle(out).join('');
}

/** 熵 = log2(字符集大小 ^ 长度)。不引 zxcvbn，那个库压缩后仍有 800KB */
function entropyBits(o: Options): number {
  const size = buildCharset(o).length;
  if (size <= 1) return 0;
  return Math.log2(size) * o.length;
}

function strengthOf(bits: number) {
  if (bits < 40) return { label: '弱', cls: 'bg-error', pct: 20, tip: '容易被破解，建议增加长度' };
  if (bits < 60) return { label: '一般', cls: 'bg-warning', pct: 45, tip: '可用于不重要的账户' };
  if (bits < 80) return { label: '强', cls: 'bg-success', pct: 72, tip: '适合大多数场景' };
  return { label: '非常强', cls: 'bg-success', pct: 100, tip: '适合重要账户与主密码' };
}

export default function PasswordGenerator() {
  const [opts, setOpts] = useState<Options>({
    length: 16,
    lower: true,
    upper: true,
    digit: true,
    symbol: true,
    excludeAmbiguous: false,
  });
  const [password, setPassword] = useState('');
  const [batch, setBatch] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const noCharset = buildCharset(opts).length === 0;

  const regen = useCallback(() => {
    if (buildCharset(opts).length === 0) {
      setPassword('');
      return;
    }
    setPassword(generate(opts));
    setBatch([]);
  }, [opts]);

  // 选项变化时立即出一个新密码，用户不用先点按钮
  useEffect(() => {
    regen();
  }, [regen]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async (text: string, key: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const bits = entropyBits(opts);
  const s = strengthOf(bits);
  const set = (patch: Partial<Options>) => setOpts((o) => ({ ...o, ...patch }));

  const checkbox = (
    key: 'lower' | 'upper' | 'digit' | 'symbol' | 'excludeAmbiguous',
    label: string,
    hint?: string,
  ) => (
    <label class="flex items-center gap-2 cursor-pointer select-none py-1">
      <input
        type="checkbox"
        class="checkbox checkbox-sm checkbox-primary"
        checked={opts[key]}
        onChange={(e) => set({ [key]: (e.target as HTMLInputElement).checked })}
      />
      <span class="text-sm">
        {label}
        {hint && <span class="opacity-50 ml-1 text-xs">{hint}</span>}
      </span>
    </label>
  );

  return (
    <div>
      {/* 结果展示区 */}
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="flex items-center gap-2">
          <output
            class="flex-1 font-mono text-lg sm:text-xl break-all min-h-[1.75rem] select-all"
            aria-live="polite"
            aria-label="生成的密码"
          >
            {password || (
              <span class="opacity-40 text-base">请至少勾选一种字符类型</span>
            )}
          </output>
          <button
            type="button"
            class="btn btn-sm btn-ghost btn-square shrink-0"
            onClick={regen}
            aria-label="重新生成"
            title="重新生成"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          </button>
          <button
            type="button"
            class={`btn btn-sm shrink-0 ${copied === 'main' ? 'btn-success' : 'btn-primary'}`}
            onClick={() => copy(password, 'main')}
            disabled={!password}
          >
            {copied === 'main' ? '已复制' : '复制'}
          </button>
        </div>

        {/* 强度条 */}
        <div class="mt-3">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="opacity-70">
              强度：<strong class="opacity-100">{s.label}</strong>
              <span class="opacity-60 ml-2">约 {Math.round(bits)} 比特熵</span>
            </span>
            <span class="opacity-55 hidden sm:inline">{s.tip}</span>
          </div>
          <div
            class="h-1.5 w-full rounded-full bg-base-300 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(bits)}
            aria-valuemin={0}
            aria-valuemax={128}
            aria-label="密码强度"
          >
            <div
              class={`h-full rounded-full transition-all duration-300 ${s.cls}`}
              style={{ width: `${noCharset ? 0 : s.pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 选项区 */}
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            for="pw-length"
            class="flex items-center justify-between text-sm font-medium mb-1.5"
          >
            <span>密码长度</span>
            <span class="font-mono text-primary text-base">{opts.length}</span>
          </label>
          <input
            id="pw-length"
            type="range"
            min={4}
            max={64}
            value={opts.length}
            class="range range-primary range-sm"
            onInput={(e) =>
              set({ length: Number((e.target as HTMLInputElement).value) })
            }
          />
          <div class="flex justify-between text-[11px] opacity-45 mt-0.5 px-0.5">
            <span>4</span>
            <span>16</span>
            <span>32</span>
            <span>64</span>
          </div>
        </div>

        <div>
          <div class="text-sm font-medium mb-1">包含字符</div>
          <div class="grid grid-cols-2 gap-x-3">
            {checkbox('lower', '小写字母', 'a-z')}
            {checkbox('upper', '大写字母', 'A-Z')}
            {checkbox('digit', '数字', '0-9')}
            {checkbox('symbol', '符号', '!@#')}
          </div>
          {checkbox('excludeAmbiguous', '排除易混字符', '0O1lI')}
        </div>
      </div>

      {noCharset && (
        <p class="mt-3 text-sm text-error" role="alert">
          至少需要勾选一种字符类型才能生成密码。
        </p>
      )}

      {/* 批量生成 */}
      <div class="mt-4 pt-4 border-t border-base-300">
        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            class="btn btn-sm btn-outline"
            disabled={noCharset}
            onClick={() =>
              setBatch(Array.from({ length: 10 }, () => generate(opts)))
            }
          >
            一次生成 10 个
          </button>
          {batch.length > 0 && (
            <>
              <button
                type="button"
                class={`btn btn-sm ${copied === 'batch' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(batch.join('\n'), 'batch')}
              >
                {copied === 'batch' ? '已复制全部' : '复制全部'}
              </button>
              <button
                type="button"
                class="btn btn-sm btn-ghost"
                onClick={() => setBatch([])}
              >
                清空
              </button>
            </>
          )}
        </div>

        {batch.length > 0 && (
          <ul class="mt-3 rounded-xl bg-base-200 divide-y divide-base-300 overflow-hidden">
            {batch.map((p, i) => (
              <li
                key={`${i}-${p}`}
                class="flex items-center gap-2 px-3 py-2 hover:bg-base-300/40 transition-colors"
              >
                <span class="font-mono text-sm break-all flex-1 select-all">
                  {p}
                </span>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost shrink-0"
                  onClick={() => copy(p, `b${i}`)}
                >
                  {copied === `b${i}` ? '已复制' : '复制'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p class="mt-4 text-xs opacity-55 leading-relaxed">
        密码在你的浏览器本地生成，使用 Web Crypto 加密级随机数，不经过任何服务器。
        你可以断网后再使用本页面来验证这一点。
      </p>
    </div>
  );
}
