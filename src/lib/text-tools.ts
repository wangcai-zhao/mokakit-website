/**
 * 文本处理工具纯函数层（word-frequency / morse-code / remove-accents / nato-phonetic）。
 * 全部纯函数、无浏览器 API，前端与未来 MCP 可共用同一份。
 */
import { type ToolResult, ok, err } from './tool-result';

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'of', 'to', 'in', 'on', 'at',
  'for', 'with', 'as', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'it', 'this', 'that',
  'you', 'we', 'they', 'he', 'she', 'i', 'me', 'my', 'your', 'our', 'their',
]);

export interface WordFreqRow {
  word: string;
  count: number;
  pct: number;
}

export function wordFrequency(
  text: string,
  opts: { ignoreStopwords?: boolean; minLen?: number; topN?: number } = {},
): ToolResult<{ total: number; rows: WordFreqRow[] }> {
  const minLen = opts.minLen && opts.minLen > 0 ? opts.minLen : 1;
  const tokens = (text.match(/[A-Za-z0-9一-龥]+/g) ?? [])
    .map((w) => w.toLowerCase())
    .filter((w) => {
      if (w.length < minLen) return false;
      if (opts.ignoreStopwords && STOPWORDS.has(w)) return false;
      return true;
    });
  if (tokens.length === 0) return err('没有可统计的词，请检查输入');
  const map = new Map<string, number>();
  for (const t of tokens) map.set(t, (map.get(t) ?? 0) + 1);
  let rows = [...map.entries()]
    .map(([word, count]) => ({ word, count, pct: 0 }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
  if (opts.topN && opts.topN > 0) rows = rows.slice(0, opts.topN);
  const total = tokens.length;
  for (const r of rows) r.pct = +((r.count / total) * 100).toFixed(2);
  return ok({ total, rows });
}

const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..',
  J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
  '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.',
  '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
};

const MORSE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE).map(([k, v]) => [v, k]),
);

export function textToMorse(text: string): ToolResult<string> {
  if (!text.trim()) return err('请输入要转换的文本');
  const out = text
    .toUpperCase()
    .split('')
    .map((ch) => {
      if (ch === ' ') return '/';
      const code = MORSE[ch];
      return code ?? ch;
    })
    .join(' ');
  return ok(out);
}

export function morseToText(morse: string): ToolResult<string> {
  if (!morse.trim()) return err('请输入摩斯电码');
  try {
    const out = morse
      .trim()
      .split(/\s+/)
      .map((token) => {
        if (token === '/') return ' ';
        const ch = MORSE_REVERSE[token];
        return ch ?? '?';
      })
      .join('');
    return ok(out);
  } catch {
    return err('摩斯电码格式无法解析');
  }
}

export function removeAccents(text: string): ToolResult<string> {
  if (!text) return err('请输入文本');
  const out = text.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return ok(out);
}

const NATO: Record<string, string> = {
  A: 'Alfa', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot', G: 'Golf',
  H: 'Hotel', I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November',
  O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango', U: 'Uniform',
  V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee', Z: 'Zulu',
  '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five', '6': 'Six',
  '7': 'Seven', '8': 'Eight', '9': 'Nine',
};

export interface NatoRow {
  char: string;
  code: string;
}

export function textToNato(text: string): ToolResult<{ rows: NatoRow[]; joined: string }> {
  if (!text.trim()) return err('请输入要拼读的文本');
  const rows: NatoRow[] = [];
  for (const raw of text) {
    const ch = raw.toUpperCase();
    const code = NATO[ch] ?? (raw === ' ' ? '(空格)' : raw);
    rows.push({ char: raw, code });
  }
  const joined = rows.map((r) => r.code).join(' ');
  return ok({ rows, joined });
}
