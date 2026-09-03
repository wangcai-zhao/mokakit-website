/**
 * 轻量 YAML 解析 / 序列化，覆盖常见子集：
 * 块映射、块序列、嵌套、标量（字符串/数字/布尔/null）、行内 [ ] { }。
 * 不支持：锚点别名、多文档、块标量 | >、流式复杂写法。遇到会尽力解析或报错。
 * 全部本地运行，无第三方依赖。
 */

function stripComment(s: string): string {
  let inQ: string | null = null;
  let hash = -1;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === inQ) inQ = null;
      continue;
    }
    if (c === '"' || c === "'") {
      inQ = c;
      continue;
    }
    if (c === '#' && (i === 0 || s[i - 1] === ' ')) {
      hash = i;
      break;
    }
  }
  return hash === -1 ? s : s.slice(0, hash);
}

function findColon(s: string): number {
  let inQ: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === inQ) inQ = null;
      continue;
    }
    if (c === '"' || c === "'") {
      inQ = c;
      continue;
    }
    if (c === ':') {
      if (i + 1 === s.length || s[i + 1] === ' ') return i;
    }
  }
  return -1;
}

function parseScalar(s: string): unknown {
  const t = s.trim();
  if (t === '') return null;
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1).replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  }
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null' || t === '~') return null;
  if (/^-?\d+$/.test(t)) return parseInt(t, 10);
  if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(t)) return parseFloat(t);
  return t;
}

function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let inQ: string | null = null;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      cur += c;
      if (c === inQ) inQ = null;
      continue;
    }
    if (c === '"' || c === "'") {
      inQ = c;
      cur += c;
      continue;
    }
    if (c === '[' || c === '{') depth++;
    if (c === ']' || c === '}') depth--;
    if (c === ',' && depth === 0) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter((x) => x !== '');
}

function parseInline(s: string): unknown {
  const t = s.trim();
  if (t.startsWith('[')) {
    const inner = t.slice(1, t.lastIndexOf(']'));
    return splitTop(inner).map(parseValue);
  }
  if (t.startsWith('{')) {
    const inner = t.slice(1, t.lastIndexOf('}'));
    const obj: Record<string, unknown> = {};
    for (const part of splitTop(inner)) {
      const ci = findColon(part);
      if (ci === -1) continue;
      obj[part.slice(0, ci).trim()] = parseValue(part.slice(ci + 1).trim());
    }
    return obj;
  }
  return parseScalar(t);
}

function parseValue(s: string): unknown {
  const t = s.trim();
  if (t.startsWith('[') || t.startsWith('{')) return parseInline(t);
  return parseScalar(t);
}

interface L {
  indent: number;
  text: string;
}

export function parseYaml(text: string): unknown {
  const rawLines = text.split(/\r?\n/);
  const lines: L[] = [];
  for (const rl of rawLines) {
    const t = rl.trim();
    if (t === '' || t === '---' || t === '...') continue;
    const indent = rl.length - rl.trimStart().length;
    const content = stripComment(rl.slice(indent));
    if (content.trim() === '') continue;
    lines.push({ indent, text: content });
  }
  let pos = 0;

  function parseNode(indent: number): unknown {
    if (pos >= lines.length) return null;
    const line = lines[pos];
    if (line.text.startsWith('- ')) return parseSequence(indent);
    return parseMapping(indent);
  }

  function parseSequence(indent: number): unknown[] {
    const arr: unknown[] = [];
    while (pos < lines.length) {
      const line = lines[pos];
      if (line.indent !== indent || !line.text.startsWith('- ')) break;
      const itemText = line.text.slice(2).trim();
      if (itemText === '') {
        pos++;
        if (pos < lines.length && lines[pos].indent > indent) {
          arr.push(parseNode(lines[pos].indent));
        } else {
          arr.push(null);
        }
      } else if (findColon(itemText) !== -1) {
        lines[pos] = { indent: indent + 2, text: itemText };
        arr.push(parseMapping(indent + 2));
      } else {
        arr.push(parseValue(itemText));
        pos++;
      }
    }
    return arr;
  }

  function parseMapping(indent: number): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    while (pos < lines.length) {
      const line = lines[pos];
      if (line.indent !== indent) break;
      if (line.text.startsWith('- ')) break;
      const ci = findColon(line.text);
      if (ci === -1) {
        pos++;
        continue;
      }
      const key = line.text.slice(0, ci).trim();
      const rest = line.text.slice(ci + 1).trim();
      if (rest === '') {
        pos++;
        if (pos < lines.length && lines[pos].indent > indent) {
          obj[key] = parseNode(lines[pos].indent);
        } else {
          obj[key] = null;
        }
      } else {
        obj[key] = parseValue(rest);
        pos++;
      }
    }
    return obj;
  }

  if (lines.length === 0) return null;
  return parseNode(lines[0].indent);
}

function needsQuote(s: string): boolean {
  if (s === '') return true;
  if (/^\s/.test(s) || /\s$/.test(s)) return true;
  if (/^["'#]/.test(s)) return true;
  if (/^[[\]{}&*!|>%@`,]/.test(s)) return true;
  if (/(?<=:)\s|:\s/.test(s)) return true;
  if (/^[-?]/.test(s) && s.length > 1) return true;
  if (/^(true|false|null|~|yes|no|on|off)$/i.test(s)) return true;
  if (/^-?\d/.test(s)) return true;
  return false;
}

function toYamlScalar(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'null';
  if (typeof v === 'boolean') return String(v);
  const s = String(v);
  return needsQuote(s) ? JSON.stringify(s) : s;
}

function inline(v: unknown, indent: number): string {
  const pad = '  '.repeat(indent);
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    return '\n' + v.map((item) => `${pad}- ${toYamlNode(item, indent + 1)}`).join('\n');
  }
  if (v && typeof v === 'object') {
    const keys = Object.keys(v as Record<string, unknown>);
    if (keys.length === 0) return '{}';
    return (
      '\n' +
      keys
        .map((k) => `${pad}${k}: ${toYamlNode((v as Record<string, unknown>)[k], indent + 1)}`)
        .join('\n')
    );
  }
  return toYamlScalar(v);
}

function toYamlNode(v: unknown, indent: number): string {
  if (Array.isArray(v) || (v && typeof v === 'object')) {
    return inline(v, indent);
  }
  return toYamlScalar(v);
}

export function toYaml(v: unknown): string {
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    return v.map((item) => `- ${toYamlNode(item, 1)}`).join('\n');
  }
  if (v && typeof v === 'object') {
    const keys = Object.keys(v as Record<string, unknown>);
    if (keys.length === 0) return '{}';
    return keys.map((k) => `${k}: ${toYamlNode((v as Record<string, unknown>)[k], 1)}`).join('\n');
  }
  return toYamlScalar(v);
}
