/**
 * 纯 JS 实现的 Punycode（RFC 3492）编解码，用于国际化域名（IDN）转换。
 * 无第三方依赖，全部本地运行。
 */

const base = 36;
const tMin = 1;
const tMax = 26;
const skew = 38;
const damp = 700;
const initialBias = 72;
const initialN = 128;
const delimiter = '-';
const maxInt = 2147483647;
const baseMinusTMin = base - tMin;
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

function adapt(delta: number, numPoints: number, firstTime: boolean): number {
  let k = 0;
  delta = firstTime ? Math.floor(delta / damp) : delta >> 1;
  delta += Math.floor(delta / numPoints);
  for (; delta > (baseMinusTMin * tMax) >> 1; k += base) {
    delta = Math.floor(delta / baseMinusTMin);
  }
  return Math.floor(k + ((baseMinusTMin + 1) * delta) / (delta + skew));
}

function ucs2decode(str: string): number[] {
  const output: number[] = [];
  let counter = 0;
  const length = str.length;
  while (counter < length) {
    const value = str.charCodeAt(counter++);
    if (value >= 0xd800 && value <= 0xdbff && counter < length) {
      const extra = str.charCodeAt(counter++);
      if ((extra & 0xfc00) === 0xdc00) {
        output.push(((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000);
      } else {
        output.push(value);
        counter--;
      }
    } else {
      output.push(value);
    }
  }
  return output;
}

function ucs2encode(codePoints: number[]): string {
  let out = '';
  for (const cp of codePoints) {
    if (cp > 0xffff) {
      out += String.fromCharCode(((cp - 0x10000) >> 10) + 0xd800);
      out += String.fromCharCode(((cp - 0x10000) % 0x400) + 0xdc00);
    } else {
      out += String.fromCharCode(cp);
    }
  }
  return out;
}

export function punyEncode(input: string): string {
  const output: string[] = [];
  const codePoints = ucs2decode(input);
  const inputLength = codePoints.length;

  let n = initialN;
  let delta = 0;
  let bias = initialBias;

  for (const cp of codePoints) {
    if (cp < 0x80) output.push(String.fromCharCode(cp));
  }
  const basicLength = output.length;
  let handled = basicLength;

  if (basicLength) output.push(delimiter);

  while (handled < inputLength) {
    let m = maxInt;
    for (const cp of codePoints) {
      if (cp >= n && cp < m) m = cp;
    }
    const handledPlusOne = handled + 1;
    if (m - n > Math.floor((maxInt - delta) / handledPlusOne)) {
      throw new RangeError('Overflow: input needs wider integers to process');
    }
    delta += (m - n) * handledPlusOne;
    n = m;

    for (const cp of codePoints) {
      if (cp < n) {
        if (++delta > maxInt) throw new RangeError('Overflow: input needs wider integers to process');
      }
      if (cp === n) {
        let q = delta;
        for (let k = base; ; k += base) {
          const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
          if (q < t) break;
          const qMinusT = q - t;
          const baseMinusT = base - t;
          output.push(alphabet[t + (qMinusT % baseMinusT)]);
          q = Math.floor(qMinusT / baseMinusT);
        }
        output.push(alphabet[q]);
        bias = adapt(delta, handledPlusOne, handled === basicLength);
        delta = 0;
        handled++;
      }
    }
    delta++;
    n++;
  }
  return output.join('');
}

export function punyDecode(input: string): string {
  const output: number[] = [];
  const inputLength = input.length;
  let n = initialN;
  let bias = initialBias;

  // 复制 basic code points（last delimiter 之前的部分）
  const basicEnd = input.lastIndexOf(delimiter);
  let ic = 0;
  if (basicEnd >= 0) {
    for (let j = 0; j < basicEnd; ++j) {
      output.push(input.charCodeAt(j));
    }
    ic = basicEnd + 1;
  }

  let pos = 0; // decoded position accumulator（对应 RFC 3492 的 i）
  while (ic < inputLength) {
    const oldi = pos;
    let w = 1;
    for (let k = base; ; k += base) {
      const digit = alphabet.indexOf(input.charAt(ic++));
      if (digit < 0) throw new RangeError('Invalid input');
      pos += digit * w;
      const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
      if (digit < t) break;
      w *= base - t;
    }
    const out = output.length + 1;
    bias = adapt(pos - oldi, out, oldi === 0);
    n = n + Math.floor(pos / out);
    pos = pos % out;
    output.splice(pos++, 0, n);
  }
  return ucs2encode(output);
}
