/**
 * china-calc-extra.ts —— 6 个中国本土计算器的纯函数层
 * ----------------------------------------------------------------------------
 * 供 MCP Server (mcp/server.mjs) 复用，零浏览器 API 依赖。
 * 计算逻辑与对应 Tool.tsx 完全同源，仅剥离 UI 层。
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. 退休年龄测算（retirement-age）
// ═══════════════════════════════════════════════════════════════════════════

export type RetirementCategory = 'male' | 'female-cadre' | 'female-worker';

interface RetirementRule {
  baseAge: number;
  targetAge: number;
  baselineY: number;
  baselineM: number;
  stepMonths: number;
}

const RETIREMENT_RULES: Record<RetirementCategory, RetirementRule> = {
  male: { baseAge: 60, targetAge: 63, baselineY: 1965, baselineM: 1, stepMonths: 4 },
  'female-cadre': { baseAge: 55, targetAge: 58, baselineY: 1970, baselineM: 1, stepMonths: 4 },
  'female-worker': { baseAge: 50, targetAge: 55, baselineY: 1975, baselineM: 1, stepMonths: 2 },
};

function monthNum(y: number, m: number): number {
  return y * 12 + (m - 1);
}

export function calcRetirementAge(
  birthYear: number,
  birthMonth: number,
  category: RetirementCategory = 'male'
) {
  if (birthYear < 1940 || birthYear > 2010)
    return { error: '出生年份需在 1940–2010 之间' };
  if (birthMonth < 1 || birthMonth > 12)
    return { error: '月份需在 1–12 之间' };

  const rule = RETIREMENT_RULES[category];
  const birth = monthNum(birthYear, birthMonth);
  const base = monthNum(rule.baselineY, rule.baselineM);
  const diff = birth - base;
  let delayMonths = 0;
  if (diff > 0) delayMonths = Math.floor(diff / rule.stepMonths);
  const maxDelay = (rule.targetAge - rule.baseAge) * 12;
  delayMonths = Math.min(delayMonths, maxDelay);
  const retireAgeMonths = rule.baseAge * 12 + delayMonths;
  const retireAgeYears = Math.floor(retireAgeMonths / 12);
  const retireAgeExtra = retireAgeMonths % 12;
  const retireTotal = birth + retireAgeMonths;
  const ry = Math.floor(retireTotal / 12);
  const rm = (retireTotal % 12) + 1;

  return {
    category,
    baseAge: rule.baseAge,
    targetAge: rule.targetAge,
    retireAgeYears,
    retireAgeExtra,
    delayMonths,
    retireYear: ry,
    retireMonth: rm,
    changed: delayMonths > 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. 税后工资计算器（after-tax-salary）
// ═══════════════════════════════════════════════════════════════════════════

const SALARY_BRACKETS = [
  { upper: 36000, rate: 0.03, quick: 0 },
  { upper: 144000, rate: 0.1, quick: 2520 },
  { upper: 300000, rate: 0.2, quick: 16920 },
  { upper: 420000, rate: 0.25, quick: 31920 },
  { upper: 660000, rate: 0.3, quick: 52920 },
  { upper: 960000, rate: 0.35, quick: 85920 },
  { upper: Infinity, rate: 0.45, quick: 181920 },
];

function taxOf(taxable: number) {
  if (taxable <= 0) return { tax: 0, rate: 0, quick: 0 };
  for (const b of SALARY_BRACKETS) {
    if (taxable <= b.upper) return { tax: taxable * b.rate - b.quick, rate: b.rate, quick: b.quick };
  }
  return { tax: 0, rate: 0, quick: 0 };
}

function fromGross(monthlyGross: number, monthlySocial: number, monthlySpecial: number) {
  const annualGross = monthlyGross * 12;
  const annualSocial = monthlySocial * 12;
  const annualSpecial = monthlySpecial * 12;
  const taxable = annualGross - 60000 - annualSocial - annualSpecial;
  const { tax, rate } = taxOf(taxable);
  const finalTax = Math.max(0, tax);
  const afterTaxAnnual = annualGross - annualSocial - finalTax;
  return {
    annualGross,
    annualSocial,
    taxable,
    rate,
    annualTax: finalTax,
    monthlyTax: finalTax / 12,
    afterTaxMonthly: afterTaxAnnual / 12,
    afterTaxAnnual,
  };
}

function reverseGross(targetNet: number, monthlySocial: number, monthlySpecial: number) {
  let lo = Math.max(0, targetNet - monthlySocial);
  let hi = targetNet * 4 + 100000;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const net = fromGross(mid, monthlySocial, monthlySpecial).afterTaxMonthly;
    if (net < targetNet) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function calcAfterTaxSalary(params: {
  mode: 'forward' | 'reverse';
  monthlyGross?: number;
  monthlyNet?: number;
  monthlySocial?: number;
  monthlySpecial?: number;
}) {
  const { mode } = params;
  const social = params.monthlySocial ?? 0;
  const special = params.monthlySpecial ?? 0;
  if (social < 0 || special < 0)
    return { error: '三险一金 / 专项附加不能为负' };

  if (mode === 'forward') {
    const g = params.monthlyGross ?? 0;
    if (g < 0) return { error: '税前工资不能为负' };
    return { ...fromGross(g, social, special), mode: 'forward' as const };
  }
  const n = params.monthlyNet ?? 0;
  if (n < 0) return { error: '税后工资不能为负' };
  const g = reverseGross(n, social, special);
  const fwd = fromGross(g, social, special);
  return { ...fwd, mode: 'reverse' as const, netTarget: n };
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. 存款利息计算器（deposit-interest）
// ═══════════════════════════════════════════════════════════════════════════

export type DepositMode = 'once' | 'compound' | 'monthly';

export function calcDepositInterest(params: {
  principal: number;
  annualRatePct: number;
  years: number;
  mode?: DepositMode;
}) {
  const { principal: p, annualRatePct: r, years: y } = params;
  const mode = params.mode ?? 'compound';
  if (p < 0) return { error: '本金不能为负' };
  if (r < 0) return { error: '利率不能为负' };
  if (y <= 0) return { error: '存期需大于 0' };

  const annualRate = r / 100;
  let interest: number;
  let monthly = 0;
  if (mode === 'once') {
    interest = p * annualRate * y;
  } else if (mode === 'compound') {
    interest = p * (Math.pow(1 + annualRate, y) - 1);
  } else {
    monthly = (p * annualRate) / 12;
    interest = monthly * y * 12;
  }
  const total = p + interest;
  return { principal: p, annualRatePct: r, years: y, mode, interest, total, monthlyInterest: monthly };
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. 契税计算器（deed-tax）
// ═══════════════════════════════════════════════════════════════════════════

export type DeedTaxTier = 'first' | 'second' | 'third';

export function calcDeedTax(params: {
  priceWan: number;
  area: number;
  tier: DeedTaxTier;
  vatInclusive?: boolean;
}) {
  const { priceWan, area, tier } = params;
  const inclusive = params.vatInclusive ?? false;
  if (priceWan <= 0) return { error: '成交价格需大于 0' };
  if (area <= 0) return { error: '面积需大于 0' };

  const totalPrice = priceWan * 10000;
  const base = inclusive ? totalPrice / 1.05 : totalPrice;
  const small = area <= 90;
  let rate: number;
  if (tier === 'first') rate = small ? 0.01 : 0.015;
  else if (tier === 'second') rate = small ? 0.01 : 0.02;
  else rate = 0.03;
  const tax = base * rate;
  return { totalPrice, taxableBase: base, rate, tax, area, tier, vatInclusive: inclusive };
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. 加班工资计算器（overtime-pay）
// ═══════════════════════════════════════════════════════════════════════════

export function calcOvertimePay(params: {
  monthlySalary: number;
  weekdayHours?: number;
  restDayHours?: number;
  holidayHours?: number;
}) {
  const { monthlySalary: s } = params;
  const wd = params.weekdayHours ?? 0;
  const rs = params.restDayHours ?? 0;
  const hd = params.holidayHours ?? 0;
  if (s <= 0) return { error: '月工资需大于 0' };
  if (wd < 0 || rs < 0 || hd < 0) return { error: '加班小时不能为负' };

  const dayWage = s / 21.75;
  const hourWage = dayWage / 8;
  const weekdayPay = hourWage * 1.5 * wd;
  const restPay = hourWage * 2 * rs;
  const holidayPay = hourWage * 3 * hd;
  const total = weekdayPay + restPay + holidayPay;
  return {
    monthlySalary: s,
    dayWage,
    hourWage,
    weekdayHours: wd,
    restDayHours: rs,
    holidayHours: hd,
    weekdayPay,
    restPay,
    holidayPay,
    overtimeTotal: total,
    totalWithSalary: s + total,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. 养老金测算（pension-estimate）
// ═══════════════════════════════════════════════════════════════════════════

export type PensionRetireAge = '50' | '55' | '60' | '65';

const PENSION_MONTHS: Record<PensionRetireAge, number> = {
  '50': 195, '55': 170, '60': 139, '65': 101,
};

export function calcPensionEstimate(params: {
  retireAge: PensionRetireAge;
  avgWage: number;
  index: number;
  years: number;
  personalBalance: number;
}) {
  const { retireAge, avgWage: w, index: idx, years: y, personalBalance: b } = params;
  if (w <= 0 || idx <= 0 || y <= 0)
    return { error: '社平工资、缴费指数、缴费年限需大于 0' };
  if (b < 0) return { error: '个人账户储存额不小于 0' };

  const months = PENSION_MONTHS[retireAge];
  const basePension = w * ((1 + idx) / 2) * y * 0.01;
  const personalPension = b / months;
  const monthly = basePension + personalPension;
  const annual = monthly * 12;
  const replacement = monthly / (w * idx || 1);
  return {
    retireAge,
    months,
    avgWage: w,
    index: idx,
    years: y,
    personalBalance: b,
    basePension,
    personalPension,
    monthlyPension: monthly,
    annualPension: annual,
    replacementRate: replacement,
  };
}
