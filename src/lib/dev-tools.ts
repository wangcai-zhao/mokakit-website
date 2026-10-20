/**
 * 开发辅助工具纯函数层（csv-json / rate-limit）。
 * 全部纯函数、无浏览器 API，前端与未来 MCP 可共用同一份。
 */
import { type ToolResult, ok, err } from './tool-result';

/** 解析一行 CSV，支持双引号包裹与转义 "" */
function parseCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function csvToJson(
  csv: string,
  opts: { delimiter?: string; hasHeader?: boolean } = {},
): ToolResult<unknown> {
  const delim = opts.delimiter && opts.delimiter.length ? opts.delimiter : ',';
  const hasHeader = opts.hasHeader !== false;
  const lines = csv.replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim() !== '' || l === '');
  const nonEmpty = lines.filter((l) => l.length > 0);
  if (nonEmpty.length === 0) return err('CSV 内容为空');
  const rows = nonEmpty.map((l) => parseCsvLine(l, delim));
  if (hasHeader) {
    const header = rows[0];
    return ok(rows.slice(1).map((r) => {
      const obj: Record<string, string> = {};
      header.forEach((h, i) => { obj[h] = r[i] ?? ''; });
      return obj;
    }));
  }
  return ok(rows);
}

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function jsonToCsv(json: string): ToolResult<string> {
  if (!json.trim()) return err('请输入 JSON');
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (e) {
    return err(`JSON 解析失败：${(e as Error).message}`);
  }
  if (!Array.isArray(data) || data.length === 0) return err('JSON 须为非空数组');
  const first = data[0];
  if (Array.isArray(first)) {
    return ok((data as unknown[][]).map((r) => r.map(csvEscape).join(',')).join('\n'));
  }
  if (typeof first === 'object' && first !== null) {
    const keys = Array.from(
      data.reduce((set: Set<string>, row) => {
        Object.keys(row as object).forEach((k) => set.add(k));
        return set;
      }, new Set<string>()),
    );
    const body = (data as Record<string, unknown>[]).map((r) =>
      keys.map((k) => csvEscape(r[k])).join(','),
    );
    return ok([keys.map(csvEscape).join(','), ...body].join('\n'));
  }
  return err('仅支持对象数组或二维数组');
}

export function rateLimit(
  ratePerSec: number,
  burst: number,
  _algo: 'token-bucket' | 'leaky-bucket' = 'token-bucket',
): ToolResult<{
  bucketCapacity: number;
  refillIntervalMs: number;
  refillTokens: number;
  recommended: string;
}> {
  if (ratePerSec <= 0) return err('速率必须为正数');
  if (burst < 1) return err('突发容量须不小于 1');
  const refillIntervalMs = Math.max(1, Math.round(1000 / ratePerSec));
  return ok({
    bucketCapacity: Math.round(burst),
    refillIntervalMs,
    refillTokens: 1,
    recommended: `令牌桶：容量 ${Math.round(burst)}，每 ${refillIntervalMs}ms 补充 1 个令牌，长期速率约 ${ratePerSec}/s。`,
  });
}
