import Decimal from 'decimal.js';

/**
 * 数值格式化。
 *
 * 为什么需要它：JS 的浮点运算会产生 0.1+0.2=0.30000000000000004 这类结果，
 * 直接展示给用户会显得很不专业。用 Decimal 做十进制精度处理，
 * 再按数量级选择合适的有效位数与展示形式。
 */
export function formatNumber(v: number, maxSig = 10): string {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';

  const abs = Math.abs(v);

  // 极大或极小的数用科学计数法，否则会出现一长串零
  if (abs >= 1e15 || abs < 1e-9) {
    return new Decimal(v).toSignificantDigits(6).toExponential();
  }

  const d = new Decimal(v).toSignificantDigits(maxSig);
  // toFixed 后去掉尾部多余的零，避免 "2.5400000000"
  let s = d.toFixed();
  if (s.includes('.')) {
    s = s.replace(/0+$/, '').replace(/\.$/, '');
  }
  return s;
}

/** 给千位加分隔符，长数字更易读 */
export function withThousands(s: string): string {
  const [intPart, decPart] = s.split('.');
  const withSep = (intPart ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart ? `${withSep}.${decPart}` : withSep;
}
