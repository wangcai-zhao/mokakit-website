import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/** ISBN 校验与 10 / 13 位互转，纯本地计算 */

/** 去掉连字符、空格等噪声并大写（X 校验位） */
function normalize(raw: string): string {
  return raw.replace(/[\s-\u2010-\u2015_.]/g, '').toUpperCase();
}

/** 由 ISBN-10 前 9 位算校验位，权重 10..2，模 11，10 记作 X */
function checkDigit10(first9: string): string {
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(first9[i]) * (10 - i);
  const r = (11 - (sum % 11)) % 11;
  return r === 10 ? 'X' : String(r);
}

/** 由 ISBN-13 前 12 位算校验位，权重 1/3 交替，模 10 */
function checkDigit13(first12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
  return String((10 - (sum % 10)) % 10);
}

/** 分组显示：978-7-115-54608-1 这样的粗略分段，仅作可读性提示 */
function pretty(isbn: string): string {
  if (isbn.length === 13) {
    return `${isbn.slice(0, 3)}-${isbn.slice(3, 4)}-${isbn.slice(4, 7)}-${isbn.slice(7, 12)}-${isbn.slice(12)}`;
  }
  if (isbn.length === 10) {
    return `${isbn.slice(0, 1)}-${isbn.slice(1, 4)}-${isbn.slice(4, 9)}-${isbn.slice(9)}`;
  }
  return isbn;
}

interface Result {
  ok: boolean;
  type: 'ISBN-10' | 'ISBN-13';
  input: string;
  /** 校验失败时给出的正确码 */
  corrected?: string;
  expected?: string;
  actual?: string;
  /** 转换结果，校验通过时才给 */
  converted?: string;
  convertedType?: 'ISBN-10' | 'ISBN-13';
  convertNote?: string;
}

function analyze(raw: string): { result?: Result; error?: string } {
  const s = normalize(raw);
  if (!s) return {};

  if (s.length !== 10 && s.length !== 13) {
    return { error: `去除分隔符后为 ${s.length} 位，ISBN 应为 10 位或 13 位` };
  }

  if (s.length === 10) {
    if (!/^\d{9}[\dX]$/.test(s)) {
      return { error: 'ISBN-10 应为 9 位数字加 1 位校验位（数字或 X）' };
    }
    const first9 = s.slice(0, 9);
    const expected = checkDigit10(first9);
    const actual = s[9]!;
    const ok = expected === actual;
    const result: Result = { ok, type: 'ISBN-10', input: s, expected, actual };
    if (ok) {
      const first12 = `978${first9}`;
      result.converted = first12 + checkDigit13(first12);
      result.convertedType = 'ISBN-13';
    } else {
      result.corrected = first9 + expected;
    }
    return { result };
  }

  if (!/^\d{13}$/.test(s)) {
    return { error: 'ISBN-13 应为 13 位纯数字' };
  }
  const first12 = s.slice(0, 12);
  const expected = checkDigit13(first12);
  const actual = s[12]!;
  const ok = expected === actual;
  const result: Result = { ok, type: 'ISBN-13', input: s, expected, actual };
  if (ok) {
    if (s.startsWith('978')) {
      const first9 = s.slice(3, 12);
      result.converted = first9 + checkDigit10(first9);
      result.convertedType = 'ISBN-10';
    } else {
      result.convertNote = `${s.slice(0, 3)} 前缀没有对应的 10 位书号，无法转换为 ISBN-10`;
    }
  } else {
    result.corrected = first12 + expected;
  }
  return { result };
}

const SAMPLES = ['978-7-115-54608-1', '0-306-40615-2', '9787020002207'];

export default function IsbnValidator() {
  const [raw, setRaw] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const { result, error } = useMemo(() => analyze(raw), [raw]);

  const copy = async (text: string, key: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium" for="isbn-input">
          输入 ISBN（10 位或 13 位，可含连字符）
        </label>
        <input
          id="isbn-input"
          class="input input-bordered mt-2 w-full font-mono text-sm tracking-wider"
          placeholder="例如 978-7-115-54608-1"
          value={raw}
          onInput={(e) => setRaw((e.target as HTMLInputElement).value)}
          spellcheck={false}
          autocomplete="off"
        />
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <span class="text-xs opacity-55">示例：</span>
          {SAMPLES.map((s) => (
            <button
              type="button"
              key={s}
              class="btn btn-xs btn-outline font-mono"
              onClick={() => setRaw(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <div class="alert alert-warning text-sm py-2">{error}</div>}

      {result && (
        <div class="space-y-3">
          <div
            class={`rounded-xl p-3 space-y-2 ${result.ok ? 'bg-success/10' : 'bg-error/10'}`}
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class={`badge badge-sm ${result.ok ? 'badge-success' : 'badge-error'}`}>
                {result.ok ? '校验通过' : '校验错误'}
              </span>
              <span class="badge badge-ghost badge-sm">{result.type}</span>
              <span class="font-mono text-sm break-all">{pretty(result.input)}</span>
            </div>
            {!result.ok && (
              <p class="text-xs opacity-75">
                末位校验位应为 <span class="font-mono font-bold">{result.expected}</span>，
                实际为 <span class="font-mono font-bold">{result.actual}</span>。
              </p>
            )}
          </div>

          {!result.ok && result.corrected && (
            <div class="rounded-xl bg-base-200 p-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium opacity-70">修正后的正确书号</span>
                <button
                  type="button"
                  class={`btn btn-xs ${copied === 'fix' ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => copy(result.corrected!, 'fix')}
                >
                  {copied === 'fix' ? '已复制' : '复制'}
                </button>
              </div>
              <code class="block font-mono text-sm break-all">{pretty(result.corrected)}</code>
            </div>
          )}

          {result.ok && result.converted && (
            <div class="rounded-xl bg-base-200 p-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium opacity-70">
                  转换为 {result.convertedType}
                </span>
                <button
                  type="button"
                  class={`btn btn-xs ${copied === 'conv' ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => copy(result.converted!, 'conv')}
                >
                  {copied === 'conv' ? '已复制' : '复制'}
                </button>
              </div>
              <code class="block font-mono text-sm break-all">{pretty(result.converted)}</code>
            </div>
          )}

          {result.ok && result.convertNote && (
            <p class="text-xs opacity-60">{result.convertNote}</p>
          )}
        </div>
      )}

      {!raw.trim() && (
        <p class="text-sm opacity-55 text-center py-4">
          粘贴一个 ISBN 即可自动校验，通过后会给出 10 位与 13 位的互转结果。
        </p>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        校验仅验证书号本身的数学正确性，不代表该书号已被实际分配或存在对应图书。
        分段显示为通用示意分组，实际的组区号与出版社号分段依国家和出版社而定。
      </p>
    </div>
  );
}
