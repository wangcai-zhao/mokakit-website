import { useState, useMemo } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';
import { punyEncode, punyDecode } from '@/tools/_shared/punycode';

function encodeLabel(label: string): string {
  // 仅当标签含非 ASCII 时才编码；纯 ASCII 原样保留
  if (/^[\x00-\x7F]*$/.test(label)) return label;
  return 'xn--' + punyEncode(label);
}

function decodeLabel(label: string): string {
  if (label.startsWith('xn--') || label.startsWith('XN--')) {
    try {
      return punyDecode(label.slice(4));
    } catch {
      return label;
    }
  }
  return label;
}

export default function PunycodeTool() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [domainMode, setDomainMode] = useState(true);
  const [input, setInput] = useState('例子.com\n中文域名.中国\nmokakit.com');

  const result = useMemo(() => {
    if (input.trim() === '') return '';
    try {
      if (domainMode) {
        const lines = input.split('\n');
        return lines
          .map((line) => {
            const labels = line.split('.');
            const out = labels.map((l) => (mode === 'encode' ? encodeLabel(l) : decodeLabel(l)));
            return out.join('.');
          })
          .join('\n');
      }
      // 单标签模式
      return mode === 'encode' ? punyEncode(input.trim()) : punyDecode(input.trim());
    } catch (e) {
      return `错误：${(e as Error).message}`;
    }
  }, [mode, domainMode, input]);

  return (
    <DevTool
      input={input}
      setInput={setInput}
      output={result}
      placeholder={mode === 'encode' ? '输入中文域名或标签，每行一个…' : '输入 xn--… 编码，每行一个…'}
      note="按 RFC 3492 本地计算，与 Node/浏览器标准库一致。整域名模式会逐段处理（例：例子.com → xn--fsqu00a.com）。识别钓鱼域名时，把 xn-- 解码看清真实 ASCII。"
    >
      <div class="flex flex-wrap gap-2">
        <div class="form-control">
          <select
            class="select select-bordered select-sm"
            value={mode}
            onChange={(e) => setMode((e.target as HTMLSelectElement).value as typeof mode)}
          >
            <option value="encode">编码（中文 → xn--）</option>
            <option value="decode">解码（xn-- → 中文）</option>
          </select>
        </div>
        <label class="label cursor-pointer gap-2">
          <input
            type="checkbox"
            class="toggle toggle-sm toggle-primary"
            checked={domainMode}
            onChange={(e) => setDomainMode((e.target as HTMLInputElement).checked)}
          />
          <span class="label-text">整域名（逐段处理）</span>
        </label>
      </div>
    </DevTool>
  );
}
