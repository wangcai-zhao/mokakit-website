import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const UNITS = ['', '十', '百', '千'];
const SECTIONS = ['', '万', '亿', '万亿'];
const UPPER_DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const UPPER_UNITS = ['', '拾', '佰', '仟'];

/** 四位一组转中文读法 */
function sectionToCn(n: number): string {
  let s = '';
  let zero = false;
  for (let i = 3; i >= 0; i -= 1) {
    const d = Math.floor(n / 10 ** i) % 10;
    if (d === 0) {
      zero = s !== '';
      continue;
    }
    if (zero) s += '零';
    zero = false;
    s += DIGITS[d] + UNITS[i];
  }
  return s;
}

function toChineseNumber(num: number): string {
  if (!Number.isFinite(num)) return '请输入有效数字';
  if (num === 0) return '零';
  const neg = num < 0;
  let n = Math.floor(Math.abs(num));
  if (n === 0) return '零';
  const parts: string[] = [];
  let level = 0;
  while (n > 0) {
    const sec = n % 10000;
    if (sec !== 0) {
      const text = sectionToCn(sec);
      parts.unshift(text + SECTIONS[level]);
    } else if (parts.length > 0 && !parts[0].startsWith('零')) {
      parts.unshift('零');
    }
    n = Math.floor(n / 10000);
    level += 1;
  }
  let out = parts.join('').replace(/零+$/, '').replace(/零{2,}/g, '零');
  // 口语习惯：一十三 → 十三
  if (out.startsWith('一十')) out = out.slice(1);
  return (neg ? '负' : '') + out;
}

function toUpperAmount(num: number): string {
  if (!Number.isFinite(num)) return '请输入有效数字';
  if (Math.abs(num) >= 1e12) return '金额过大，超出常见票据范围';
  const neg = num < 0;
  const cents = Math.round(Math.abs(num) * 100);
  const yuan = Math.floor(cents / 100);
  const jiao = Math.floor((cents % 100) / 10);
  const fen = cents % 10;

  const intPart: string[] = [];
  let level = 0;
  let n = yuan;
  const sectionUpper = (v: number): string => {
    let s = '';
    let zero = false;
    for (let i = 3; i >= 0; i -= 1) {
      const d = Math.floor(v / 10 ** i) % 10;
      if (d === 0) {
        zero = s !== '';
        continue;
      }
      if (zero) s += '零';
      zero = false;
      s += UPPER_DIGITS[d] + UPPER_UNITS[i];
    }
    return s;
  };
  if (n === 0) intPart.push('零');
  while (n > 0) {
    const sec = n % 10000;
    if (sec !== 0) intPart.unshift(sectionUpper(sec) + SECTIONS[level]);
    else if (intPart.length && !intPart[0].startsWith('零')) intPart.unshift('零');
    n = Math.floor(n / 10000);
    level += 1;
  }
  let head = intPart.join('').replace(/零{2,}/g, '零').replace(/零$/, '');
  if (!head) head = '零';

  let tail = '';
  if (jiao === 0 && fen === 0) {
    tail = '元整';
  } else {
    tail = '元';
    if (jiao > 0) tail += `${UPPER_DIGITS[jiao]}角`;
    else if (fen > 0) tail += '零';
    if (fen > 0) tail += `${UPPER_DIGITS[fen]}分`;
  }
  return (neg ? '负' : '') + head + tail;
}

/** 中文数字转阿拉伯数字，支持 一 / 十 / 二十三 / 一万二千 / 两 */
function cnToNumber(text: string): number | null {
  const map: Record<string, number> = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const unitMap: Record<string, number> = { 十: 10, 百: 100, 千: 1000 };
  const secMap: Record<string, number> = { 万: 1e4, 亿: 1e8 };
  const s = text.trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return Number(s);
  if (!/^[零〇一二两三四五六七八九十百千万亿]+$/.test(s)) return null;

  let total = 0;
  let section = 0;
  let current = 0;
  for (const ch of s) {
    if (ch in map) {
      current = map[ch];
    } else if (ch in unitMap) {
      if (current === 0) current = 1;
      section += current * unitMap[ch];
      current = 0;
    } else if (ch in secMap) {
      if (current > 0) section += current;
      total += (section === 0 ? 1 : section) * secMap[ch];
      section = 0;
      current = 0;
    } else {
      return null;
    }
  }
  return total + section + current;
}

export default function ChineseNumberTool() {
  const [numInput, setNumInput] = useState('12345.67');
  const [cnInput, setCnInput] = useState('一万二千三百四十五');
  const [copied, setCopied] = useState(false);

  const num = Number(numInput);
  const validNum = numInput.trim() !== '' && Number.isFinite(num);
  const cnResult = validNum ? toChineseNumber(num) : '';
  const upperResult = validNum ? toUpperAmount(num) : '';
  const parsed = cnToNumber(cnInput);

  const copy = async (t: string) => {
    await copyText(t);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-5">
      <div class="space-y-3">
        <h3 class="text-sm font-semibold">数字 → 中文</h3>
        <label class="block">
          <span class="text-sm font-medium">阿拉伯数字</span>
          <input
            type="text"
            inputmode="decimal"
            class="input input-bordered mt-1.5 w-full font-mono"
            value={numInput}
            onInput={(e) => setNumInput((e.target as HTMLInputElement).value)}
          />
        </label>

        {validNum && (
          <div class="grid gap-3 sm:grid-cols-2">
            {[
              { label: '中文读法', value: cnResult },
              { label: '人民币大写', value: upperResult },
            ].map((c) => (
              <div class="rounded-xl border border-base-300 bg-base-100 p-4" key={c.label}>
                <div class="mb-1.5 flex items-center justify-between">
                  <span class="text-xs opacity-60">{c.label}</span>
                  <button type="button" class="btn btn-xs btn-ghost" onClick={() => copy(c.value)}>
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
                <p class="break-all font-mono text-lg font-semibold text-primary">{c.value}</p>
              </div>
            ))}
          </div>
        )}
        {!validNum && <p class="text-sm text-error">请输入有效的数字</p>}
      </div>

      <div class="divider" />

      <div class="space-y-3">
        <h3 class="text-sm font-semibold">中文 → 数字</h3>
        <label class="block">
          <span class="text-sm font-medium">中文数字</span>
          <input
            type="text"
            class="input input-bordered mt-1.5 w-full font-mono"
            placeholder="例如：三千五百、两万、一亿二千万"
            value={cnInput}
            onInput={(e) => setCnInput((e.target as HTMLInputElement).value)}
          />
        </label>
        <div class="rounded-xl border border-base-300 bg-base-100 p-4">
          <div class="mb-1.5 flex items-center justify-between">
            <span class="text-xs opacity-60">转换结果</span>
            {parsed !== null && (
              <button type="button" class="btn btn-xs btn-ghost" onClick={() => copy(String(parsed))}>
                复制
              </button>
            )}
          </div>
          <p class="font-mono text-lg font-semibold text-primary">
            {parsed === null ? '无法识别，请检查写法' : parsed.toLocaleString('zh-CN')}
          </p>
        </div>
      </div>

      <p class="text-xs leading-relaxed opacity-55">
        人民币大写按票据规范生成：到角或到分就不写「整」，只有整元才写「元整」，
        角位为零而分位不为零时补「零」。中文转数字支持「十、百、千、万、亿」与「两」，
        不支持「廿、卅」等罕见写法。全部在本地完成。
      </p>
    </div>
  );
}
