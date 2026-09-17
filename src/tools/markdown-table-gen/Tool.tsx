import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Align = 'left' | 'center' | 'right';
type Source = 'csv' | 'json' | 'manual';

function parseRows(text: string, source: Source): string[][] {
  if (source === 'json') {
    try {
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : [data];
      if (!arr.length) return [];
      const keys = [...new Set(arr.flatMap((o) => (typeof o === 'object' && o ? Object.keys(o) : [])))];
      return [keys, ...arr.map((o) => keys.map((k) => String((o as Record<string, unknown>)?.[k] ?? '')))];
    } catch {
      return [];
    }
  }
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '')
    .map((line) => line.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
}

export default function MarkdownTableGenTool() {
  const [source, setSource] = useState<Source>('csv');
  const [input, setInput] = useState('工具,分类,是否免费\n密码生成器,安全加密,是\nJSON 格式化,开发辅助,是\n汇率换算,换算转换,是');
  const [header, setHeader] = useState(true);
  const [align, setAlign] = useState<Align>('left');
  const [pad, setPad] = useState(true);
  const [copied, setCopied] = useState(false);

  const rows = useMemo(() => {
    const parsed = parseRows(input, source);
    if (source === 'json') return parsed;
    return header ? parsed : parsed.map((r, i) => (i === 0 ? r : r));
  }, [input, source, header]);

  const colCount = Math.max(0, ...rows.map((r) => r.length));
  const widths = useMemo(
    () =>
      Array.from({ length: colCount }, (_, i) =>
        Math.max(3, ...rows.map((r) => (r[i] ?? '').length)),
      ),
    [rows, colCount],
  );

  const cellMark: Record<Align, string> = { left: ':---', center: ':---:', right: '---:' };

  const table = useMemo(() => {
    if (!rows.length) return '';
    const fmt = (cells: string[]) => {
      const parts = cells.map((c, i) => {
        const w = widths[i] ?? 3;
        const s = (c ?? '').replace(/\|/g, '\\|');
        const target = align === 'left' ? s.padEnd(w) : align === 'right' ? s.padStart(w) : s.padStart(Math.floor((w + s.length) / 2)).padEnd(w);
        return pad ? target : s;
      });
      return `| ${parts.join(' | ')} |`;
    };
    const dataRows = source === 'json' || header ? rows.slice(1) : rows;
    const headRow = source === 'json' ? rows[0] : header ? rows[0] : rows[0].map((_, i) => `列 ${i + 1}`);
    const sep = `| ${widths.map((w) => {
      const m = cellMark[align];
      return pad ? m.padEnd(w, '-').length > w ? m.padEnd(w, '-') : m + '-'.repeat(Math.max(0, w - m.length)) : m;
    }).join(' | ')} |`;
    return [fmt(headRow), sep, ...dataRows.map(fmt)].join('\n');
  }, [rows, widths, align, pad, header, source]);

  const html = useMemo(() => {
    if (!rows.length) return '';
    const dataRows = source === 'json' || header ? rows.slice(1) : rows;
    const headRow = source === 'json' ? rows[0] : header ? rows[0] : rows[0].map((_, i) => `列 ${i + 1}`);
    return `<table>\n  <thead>\n    <tr>${headRow.map((c) => `<th>${c}</th>`).join('')}</tr>\n  </thead>\n  <tbody>\n${dataRows
      .map((r) => `    <tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
      .join('\n')}\n  </tbody>\n</table>`;
  }, [rows, header, source]);

  return (
    <div class="space-y-4">
      <div class="tabs tabs-box w-full">
        {(
          [
            ['csv', 'CSV / 逗号分隔'],
            ['json', 'JSON 数组'],
            ['manual', '手动编辑'],
          ] as [Source, string][]
        ).map(([k, label]) => (
          <button
            type="button"
            key={k}
            class={`tab flex-1 ${source === k ? 'tab-active' : ''}`}
            onClick={() => {
              setSource(k);
              if (k === 'json')
                setInput('[\n  {"工具":"密码生成器","分类":"安全加密"},\n  {"工具":"JSON 格式化","分类":"开发辅助"}\n]');
              if (k === 'csv')
                setInput('工具,分类,是否免费\n密码生成器,安全加密,是\nJSON 格式化,开发辅助,是');
              if (k === 'manual') setInput('列1,列2\n行1内容,行2内容');
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <label class="block">
        <span class="text-sm font-medium">输入数据</span>
        <textarea
          class="textarea textarea-bordered mt-1.5 w-full font-mono text-sm"
          rows={8}
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <div class="grid gap-4 sm:grid-cols-3">
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={header}
            disabled={source === 'json'}
            onChange={(e) => setHeader((e.target as HTMLInputElement).checked)}
          />
          首行作表头
        </label>
        <label class="block">
          <span class="text-sm font-medium">对齐方式</span>
          <select
            class="select select-bordered mt-1.5 w-full"
            value={align}
            onChange={(e) => setAlign((e.target as HTMLSelectElement).value as Align)}
          >
            <option value="left">左对齐</option>
            <option value="center">居中</option>
            <option value="right">右对齐</option>
          </select>
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-sm self-end">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={pad}
            onChange={(e) => setPad((e.target as HTMLInputElement).checked)}
          />
          补齐空格（源码更易读）
        </label>
      </div>

      <div class="flex flex-wrap gap-2">
        <span class="badge badge-ghost">{rows.length} 行</span>
        <span class="badge badge-outline">{colCount} 列</span>
      </div>

      {table && (
        <>
          <div>
            <span class="text-sm font-medium">渲染效果</span>
            <div class="mt-2 overflow-x-auto rounded-xl border border-base-300 p-3">
              <table class="table table-sm table-zebra">
                {(source === 'json' || header) && (
                  <thead>
                    <tr>
                      {rows[0].map((c, i) => (
                        <th key={i}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {(source === 'json' || header ? rows.slice(1) : rows).map((r, i) => (
                    <tr key={i}>
                      {r.map((c, j) => (
                        <td key={j}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <label class="block">
            <div class="mb-1.5 flex items-center justify-between">
              <span class="text-sm font-medium">Markdown 源码</span>
              <button
                type="button"
                class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
                onClick={async () => {
                  await copyText(table);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1800);
                }}
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
            <pre class="max-h-64 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm whitespace-pre">
              {table}
            </pre>
          </label>

          <label class="block">
            <div class="mb-1.5 flex items-center justify-between">
              <span class="text-sm font-medium">HTML 版本</span>
              <button type="button" class="btn btn-xs btn-ghost" onClick={() => copyText(html)}>
                复制
              </button>
            </div>
            <pre class="max-h-48 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-xs whitespace-pre">
              {html}
            </pre>
          </label>
        </>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        Markdown 表格本身不支持合并单元格、换行与列宽控制，遇到复杂表格直接上 HTML。
        单元格里的竖线会自动转义成 \|，否则会撑破表格结构。全部在本地完成。
      </p>
    </div>
  );
}
