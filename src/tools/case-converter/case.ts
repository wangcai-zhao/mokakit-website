/**
 * 大小写/命名风格转换纯函数层（与 radix.ts / b64.ts 同规范：无 UI 依赖，可单测）。
 * 切词规则对标 change-case（MIT，blakeembrey/change-case）：
 * ① 小写/数字后接大写处断开（camelCase 边界）；
 * ② 连续大写后接「大写+小写」时，在最后一个大写前断开（APIKey → API Key）；
 * ③ 分隔符（空格/下划线/连字符/点）处断开；
 * ④ separateNumbers 开启时额外在字母与数字边界断开（Key2 → Key 2），默认关。
 */

/** 把任意命名风格拆成单词数组 */
export function splitWords(s: string, separateNumbers = false): string[] {
  let t = s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
  if (separateNumbers) {
    t = t.replace(/([a-zA-Z])([0-9])/g, '$1 $2').replace(/([0-9])([a-zA-Z])/g, '$1 $2');
  }
  return t
    .replace(/[_.\-]+/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

const lo = (w: string) => w.toLowerCase();
const cap = (w: string) => {
  const l = w.toLowerCase();
  return l.charAt(0).toUpperCase() + l.slice(1);
};

export interface CaseMode {
  id: string;
  label: string;
  fn: (words: string[]) => string;
}

export const MODES: CaseMode[] = [
  { id: 'camel', label: 'camelCase', fn: (w) => w.map((x, i) => (i === 0 ? lo(x) : cap(x))).join('') },
  { id: 'pascal', label: 'PascalCase', fn: (w) => w.map(cap).join('') },
  { id: 'snake', label: 'snake_case', fn: (w) => w.map(lo).join('_') },
  { id: 'kebab', label: 'kebab-case', fn: (w) => w.map(lo).join('-') },
  { id: 'constant', label: 'CONSTANT_CASE', fn: (w) => w.map(lo).join('_').toUpperCase() },
  {
    id: 'sentence',
    label: 'Sentence case',
    fn: (w) => w.map((x, i) => (i === 0 ? cap(x) : lo(x))).join(' '),
  },
  { id: 'upper', label: '大写', fn: (w) => w.map(lo).join(' ').toUpperCase() },
  { id: 'lower', label: '小写', fn: (w) => w.map(lo).join(' ') },
  { id: 'title', label: '标题大小写', fn: (w) => w.map(cap).join(' ') },
];

/** 单行转换：任意风格字符串 → 指定模式结果 */
export function convertLine(line: string, mode: CaseMode, separateNumbers = false): string {
  return mode.fn(splitWords(line, separateNumbers));
}

/** 多行批量转换：每行独立，返回与输入等行数的结果数组 */
export function convertLines(text: string, mode: CaseMode, separateNumbers = false): string[] {
  return text.split('\n').map((line) => convertLine(line, mode, separateNumbers));
}
