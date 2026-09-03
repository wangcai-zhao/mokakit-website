import { useState, useMemo } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQ = false;
  const s = text.replace(/\r\n?/g, '\n');
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (inQ) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQ = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQ = true;
      i++;
      continue;
    }
    if (c === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    field += c;
    i++;
  }
  row.push(field);
  rows.push(row);
  if (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }
  return rows;
}

function toMd(rows: string[][]): string {
  if (rows.length === 0) return '';
  const esc = (x: string) => x.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const header = rows[0];
  const lines: string[] = [];
  lines.push(`| ${header.map(esc).join(' | ')} |`);
  lines.push(`| ${header.map(() => '---').join(' | ')} |`);
  for (let r = 1; r < rows.length; r++) {
    lines.push(`| ${rows[r].map(esc).join(' | ')} |`);
  }
  return lines.join('\n');
}

export default function CsvToMarkdownTool() {
  const [input, setInput] = useState('name,age,city\n张三,28,北京\n李四,34,上海');

  const result = useMemo(() => {
    const v = input.trim();
    if (v === '') return '';
    try {
      return toMd(parseCsv(input));
    } catch (e) {
      return `错误：${(e as Error).message}`;
    }
  }, [input]);

  return (
    <DevTool
      input={input}
      setInput={setInput}
      output={result}
      placeholder={'粘贴 CSV，例如：\nname,age,city\n张三,28,北京'}
      note="支持带引号的字段（含逗号/换行）。首行作为表头。仅本地转换，不上传。"
    />
  );
}
