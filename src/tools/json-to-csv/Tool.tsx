import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const SAMPLE = `[
  { "name": "张三", "age": 28, "city": "北京" },
  { "name": "李四", "age": 34, "city": "上海, 浦东", "tag": "VIP" }
]`;

function toCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export default function JsonToCsvTool() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const result = useMemo(() => {
    const text = input.trim();
    if (!text) return { csv: '', error: '', rows: 0, cols: 0 };
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { csv: '', error: 'JSON 解析失败：' + (e as Error).message, rows: 0, cols: 0 };
    }
    if (!Array.isArray(data)) {
      return { csv: '', error: '顶层需为对象数组（[ {...}, {...} ]）', rows: 0, cols: 0 };
    }
    const arr = data as Record<string, unknown>[];
    if (arr.length === 0) return { csv: '', error: '', rows: 0, cols: 0 };
    const headers: string[] = [];
    for (const row of arr) {
      if (isPlainObject(row)) {
        for (const k of Object.keys(row)) if (!headers.includes(k)) headers.push(k);
      }
    }
    const lines = [headers.join(',')];
    for (const row of arr) {
      const cells = headers.map((h) => toCell(isPlainObject(row) ? row[h] : ''));
      lines.push(cells.join(','));
    }
    return { csv: lines.join('\n'), error: '', rows: arr.length, cols: headers.length };
  }, [input]);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const download = () => {
    if (!result.csv) return;
    // BOM 头，保证 Excel 打开中文不乱码
    const blob = new Blob(['\uFEFF' + result.csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div class="space-y-4">
      <div>
        <div class="mb-2 flex items-center justify-between">
          <label class="text-sm font-medium" for="jtc-input">
            JSON 数据
          </label>
          <button type="button" class="btn btn-xs btn-ghost" onClick={() => setInput(SAMPLE)}>
            填入示例
          </button>
        </div>
        <textarea
          id="jtc-input"
          class="textarea textarea-bordered w-full font-mono text-sm"
          rows={9}
          placeholder='粘贴对象数组，例如 [{"name":"张三","age":28}]'
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      {result.error && <p class="text-sm text-error">{result.error}</p>}

      <div>
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">CSV 结果</span>
            {result.rows > 0 && (
              <span class="badge badge-sm badge-ghost">
                {result.rows} 行 · {result.cols} 列
              </span>
            )}
          </div>
          <div class="join">
            <button
              type="button"
              class={`btn btn-xs join-item ${copied === 'csv' ? 'btn-success' : 'btn-outline'}`}
              onClick={() => copy(result.csv, 'csv')}
              disabled={!result.csv}
            >
              {copied === 'csv' ? '已复制' : '复制'}
            </button>
            <button
              type="button"
              class="btn btn-xs join-item btn-outline"
              onClick={download}
              disabled={!result.csv}
            >
              下载 .csv
            </button>
          </div>
        </div>
        <pre class="max-h-80 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm whitespace-pre">
          {result.csv || <span class="opacity-40">转换结果会显示在这里</span>}
        </pre>
      </div>

      <p class="text-xs leading-relaxed opacity-55">
        表头取所有对象 key 的并集；含逗号、引号或换行的内容会自动用双引号包裹并转义。下载文件带 UTF-8
        BOM，Excel 打开中文不乱码。全部处理在本地完成，数据不上传。
      </p>
    </div>
  );
}
