import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const ENCODE_SAMPLE = '<a href="/docs">文档 & 教程</a>';
const DECODE_SAMPLE = '&lt;a href=&quot;/docs&quot;&gt;文档 &amp; 教程&lt;/a&gt;';

const NAMED: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
};

function encodeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decodeHtml(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&[a-z]+;/gi, (m) => (m in NAMED ? NAMED[m] : m));
}

export default function HtmlEscape() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const output = useMemo(() => {
    if (!input) return '';
    return mode === 'encode' ? encodeHtml(input) : decodeHtml(input);
  }, [input, mode]);

  const switchMode = (next: 'encode' | 'decode') => {
    setMode(next);
    setInput('');
  };

  const copy = async (text: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="join">
        <button
          type="button"
          class={`btn btn-sm join-item ${mode === 'encode' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => switchMode('encode')}
        >
          编码转义
        </button>
        <button
          type="button"
          class={`btn btn-sm join-item ${mode === 'decode' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => switchMode('decode')}
        >
          解码还原
        </button>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <label class="text-sm font-medium" for="he-input">
            {mode === 'encode' ? '原始文本' : 'HTML 实体文本'}
          </label>
          <button
            type="button"
            class="btn btn-xs btn-ghost"
            onClick={() => setInput(mode === 'encode' ? ENCODE_SAMPLE : DECODE_SAMPLE)}
          >
            填入示例
          </button>
        </div>
        <textarea
          id="he-input"
          class="textarea textarea-bordered w-full font-mono text-sm"
          rows={6}
          placeholder={mode === 'encode' ? ENCODE_SAMPLE : DECODE_SAMPLE}
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">{mode === 'encode' ? '转义结果' : '还原结果'}</span>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
            onClick={() => copy(output)}
            disabled={!output}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="max-h-80 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm break-all whitespace-pre-wrap">
          {output || <span class="opacity-40">结果会显示在这里</span>}
        </pre>
      </div>

      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>字符</th>
              <th>实体</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-mono">&amp;</td>
              <td class="font-mono">&amp;amp;</td>
              <td>和号，必须最先转义</td>
            </tr>
            <tr>
              <td class="font-mono">&lt;</td>
              <td class="font-mono">&amp;lt;</td>
              <td>小于号，标签起始</td>
            </tr>
            <tr>
              <td class="font-mono">&gt;</td>
              <td class="font-mono">&amp;gt;</td>
              <td>大于号，标签结束</td>
            </tr>
            <tr>
              <td class="font-mono">"</td>
              <td class="font-mono">&amp;quot;</td>
              <td>双引号，属性值边界</td>
            </tr>
            <tr>
              <td class="font-mono">'</td>
              <td class="font-mono">&amp;#39;</td>
              <td>单引号，属性值边界</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-xs leading-relaxed opacity-55">
        解码同时支持 &amp;#39; 十进制与 &amp;#x27; 十六进制数字实体。全部转换在本地浏览器完成，内容不上传。
      </p>
    </div>
  );
}
