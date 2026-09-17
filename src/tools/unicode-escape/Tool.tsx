import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Direction = 'escape' | 'unescape';
type Style = 'u' | 'uplus' | 'percent' | 'html' | 'x';

const STYLES: { key: Style; label: string; sample: string }[] = [
  { key: 'u', label: '\\uXXXX（JS / JSON）', sample: '\\u4E2D\\u6587' },
  { key: 'uplus', label: 'U+XXXX（Unicode 码点）', sample: 'U+4E2D U+6587' },
  { key: 'x', label: '\\xXX（按字节）', sample: '\\xE4\\xB8\\xAD' },
  { key: 'percent', label: '%XX（URL 编码）', sample: '%E4%B8%AD' },
  { key: 'html', label: '&#xXXXX;（HTML 实体）', sample: '&#x4E2D;' },
];

const hex = (n: number, len = 4) => n.toString(16).toUpperCase().padStart(len, '0');

export default function UnicodeEscapeTool() {
  const [input, setInput] = useState('中文 MokaKit 😎');
  const [dir, setDir] = useState<Direction>('escape');
  const [style, setStyle] = useState<Style>('u');
  const [copied, setCopied] = useState(false);

  const escapeText = (text: string, s: Style): string => {
    if (s === 'percent') return encodeURIComponent(text);
    if (s === 'x') {
      return [...new TextEncoder().encode(text)].map((b) => `\\x${hex(b, 2)}`).join('');
    }
    return [...text]
      .map((ch) => {
        const cp = ch.codePointAt(0) ?? 0;
        if (cp < 128 && s !== 'html') return ch;
        if (s === 'u') {
          return cp > 0xffff
            ? `\\u${hex(0xd800 + ((cp - 0x10000) >> 10))}\\u${hex(0xdc00 + ((cp - 0x10000) & 0x3ff))}`
            : `\\u${hex(cp)}`;
        }
        if (s === 'uplus') return `U+${hex(cp)}`;
        if (s === 'html') return `&#x${hex(cp)};`;
        return ch;
      })
      .join('');
  };

  const unescapeText = (text: string): string => {
    let t = text;
    // 先处理 %XX
    if (/%[0-9a-fA-F]{2}/.test(t) && !/\\[uUx]/.test(t)) {
      try {
        t = decodeURIComponent(t);
      } catch {
        /* 不是合法 URL 编码就跳过 */
      }
      return t;
    }
    t = t.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    );
    t = t.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    t = t.replace(/U\+([0-9a-fA-F]{4,6})/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
    t = t.replace(/&#x([0-9a-fA-F]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
    t = t.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
    t = t.replace(/\\x([0-9a-fA-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
    return t;
  };

  const output = useMemo(
    () => (dir === 'escape' ? escapeText(input, style) : unescapeText(input)),
    [input, dir, style],
  );

  return (
    <div class="space-y-4">
      <div class="tabs tabs-box w-full">
        <button
          type="button"
          class={`tab flex-1 ${dir === 'escape' ? 'tab-active' : ''}`}
          onClick={() => setDir('escape')}
        >
          转义
        </button>
        <button
          type="button"
          class={`tab flex-1 ${dir === 'unescape' ? 'tab-active' : ''}`}
          onClick={() => setDir('unescape')}
        >
          反转义
        </button>
      </div>

      {dir === 'escape' && (
        <div>
          <span class="text-sm font-medium">转义格式</span>
          <div class="mt-2 space-y-2">
            {STYLES.map((s) => (
              <button
                type="button"
                key={s.key}
                class={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left transition ${
                  style === s.key ? 'border-primary bg-primary/5' : 'border-base-300'
                }`}
                onClick={() => setStyle(s.key)}
              >
                <span class="text-sm">{s.label}</span>
                <span class="font-mono text-xs opacity-55">{s.sample}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <label class="block">
        <span class="text-sm font-medium">{dir === 'escape' ? '原始文本' : '转义后的文本'}</span>
        <textarea
          class="textarea textarea-bordered mt-1.5 w-full font-mono text-sm"
          rows={5}
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">{dir === 'escape' ? '转义结果' : '还原结果'}</span>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
            disabled={!output}
            onClick={async () => {
              await copyText(output);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            }}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="max-h-56 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm whitespace-pre-wrap break-all">
          {output || <span class="opacity-40">结果会实时显示在这里</span>}
        </pre>
      </label>

      {dir === 'escape' && (
        <div>
          <span class="text-sm font-medium">各格式对照</span>
          <div class="mt-2 space-y-1 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-xs">
            {STYLES.map((s) => (
              <div class="flex gap-3" key={s.key}>
                <span class="w-44 shrink-0 opacity-60">{s.label}</span>
                <span class="break-all">{escapeText(input || '中文', s.key)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        反转义会自动识别 \uXXXX、U+XXXX、&amp;#xXXXX;、&amp;#12345;、%XX 与 \xXX 六种写法，
        混在一起也能一次还原。emoji 等超出 BMP 的字符在 \uXXXX 下会用代理对表示，
        这是 JavaScript 字符串的标准行为。全部在本地完成。
      </p>
    </div>
  );
}
