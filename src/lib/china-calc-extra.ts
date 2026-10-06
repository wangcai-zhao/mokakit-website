/**
 * china-calc-extra.ts —— 中国本土计算器的纯函数层（1–6 为既有，7–8 为 2026-10-07 新增）
 * ----------------------------------------------------------------------------
 * 供 MCP Server (mcp/server.mjs) 复用，零浏览器 API 依赖。
 * 计算逻辑与对应 Tool.tsx 完全同源，仅剥离 UI 层。
 *
 * 精度口径：1–6 节沿用早期的原生 Number 运算（改动会动到既有结果，暂不迁移）；
 * 7–8 节起统一用 decimal.js 四舍五入到「分」，与 china-tax / china-vat / mortgage 对齐。
 */

import Decimal from 'decimal.js';

/** 金额四舍五入到分（ROUND_HALF_UP），新增函数统一走它 */
function money2(n: Decimal.Value): number {
  return new Decimal(n).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

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

/**
 * 契税优惠的面积分界线（㎡）。
 * 2024-12-01 起为 140㎡（财政部/税务总局/住建部 2024 年第 16 号公告）；
 * 老口径 90㎡ 已废止，勿改回。
 */
export const DEED_TAX_SMALL_AREA = 140;

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
  /**
   * ⚠️ 面积分档线是 140㎡，不是老口径的 90㎡。
   * 依据：财政部/税务总局/住房城乡建设部 2024 年第 16 号公告，2024-12-01 起执行 ——
   * 个人购买家庭唯一住房或第二套改善性住房，面积 ≤140㎡ 的减按 1% 征收契税。
   * 此前 90㎡ 的分界线已废止，沿用会按 1.5%/2% 多算税（实测 200 万/120㎡ 首套会多算 1 万元）。
   */
  const small = area <= DEED_TAX_SMALL_AREA;
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

// ═══════════════════════════════════════════════════════════════════════════
// 7. 车辆购置税计算器（vehicle-purchase-tax）
// ═══════════════════════════════════════════════════════════════════════════

export type VehiclePowerType = 'fuel' | 'nev';

/** 车辆购置税税率（《车辆购置税法》2019-07-01 起施行，10%） */
export const VEHICLE_TAX_RATE = 0.1;

/** 机动车销售统一发票的增值税税率（%），用于价税合计还原为不含税计税价格 */
export const VEHICLE_VAT_RATE = 13;

/**
 * 新能源汽车购置税减免窗口。
 * 依据：财政部/税务总局/工信部公告 2023 年第 10 号《关于延续和优化新能源汽车车辆购置税减免政策的公告》。
 *   - 购置日期 2024-01-01 ~ 2025-12-31：免征，每辆新能源乘用车免税额不超过 3 万元
 *   - 购置日期 2026-01-01 ~ 2027-12-31：减半征收，每辆新能源乘用车减税额不超过 1.5 万元
 * 购置日期以机动车销售统一发票（或海关关税专用缴款书）开具日期为准。
 * ⚠️ 2028 年起政策尚未明确，落在窗口外时按全额估算并在 note 里说明，绝不静默套用旧减免。
 */
const NEV_RELIEF_WINDOWS = [
  { from: '2024-01-01', to: '2025-12-31', mode: 'full', cap: 30000 },
  { from: '2026-01-01', to: '2027-12-31', mode: 'half', cap: 15000 },
] as const;

/** 减免方式：none 无 / full 全额免征 / half 减半 / unknown 政策未覆盖按全额估算 */
export type VehicleReliefMode = 'none' | 'full' | 'half' | 'unknown';

export interface VehiclePurchaseTaxResult {
  powerType: VehiclePowerType;
  /** 购置日期（原始入参，未传时为 undefined） */
  purchaseDate?: string;
  /** 入参给的是价税合计（true）还是不含税价（false） */
  vatIncluded: boolean;
  /** 计税价格 = 不含增值税的购车款（元） */
  taxablePrice: number;
  taxRate: number;
  /** 减按前的应纳税额（元） */
  fullTax: number;
  reliefMode: VehicleReliefMode;
  /** 适用的减免上限（元），燃油车为 0 */
  reliefCap: number;
  /** 实际减免额（元） */
  relief: number;
  /** 实缴车辆购置税（元） */
  payable: number;
  /** 口径说明 / 异常降级说明 */
  note: string;
}

/**
 * 车辆购置税计算。
 *
 * 应纳税额 = 计税价格 × 10%，计税价格是**不含增值税**的购车款：
 * 手上是发票「价税合计」时先 ÷(1+13%) 还原，这也是为什么实缴通常低于车价的 10%。
 *
 * @param params.invoiceTotal      发票价税合计（元）。与 taxExclusivePrice 二选一
 * @param params.taxExclusivePrice 不含税价（元）。给了就直接用，不再做 ÷1.13 还原
 * @param params.powerType         动力类型，默认 'fuel'。'nev' 才可享受减免
 * @param params.purchaseDate      购置日期 YYYY-MM-DD（发票开具日期）。省略时按现行窗口处理
 * @returns 成功返回 VehiclePurchaseTaxResult；入参非法时返回 `{ error: 中文提示 }`（**不抛异常**，便于 MCP 直接回传）
 * @throws 不抛异常。所有失败路径统一走 `{ error }`，调用方用 `'error' in r` 判断
 *
 * 边界输入行为：
 *   - 两个价格都不传 / 都是 null|undefined|NaN → `{ error: '请填写购车发票价税合计或不含税价' }`
 *   - 价格 ≤ 0 或非有限数 → `{ error: '购车价格需为大于 0 的数字' }`
 *   - purchaseDate 格式非法 → 不报错，按现行窗口（2026–2027 减半）计算并在 note 中说明
 *   - purchaseDate 落在减免窗口外（如 2028 年）→ reliefMode='unknown'，按全额估算并提示以税务机关核定为准
 *   - powerType 传了未知值 → 按 'fuel' 处理，不享受减免
 *
 * @example
 * // 22.6 万燃油车：22.6万 ÷ 1.13 × 10% = 2 万
 * calcVehiclePurchaseTax({ invoiceTotal: 226000 })
 * // → { taxablePrice: 200000, fullTax: 20000, relief: 0, payable: 20000, reliefMode: 'none' }
 *
 * @example
 * // 2026 年买 40 万（不含税）新能源：应缴 4 万，减半可减 2 万但上限 1.5 万 → 实缴 2.5 万
 * calcVehiclePurchaseTax({ taxExclusivePrice: 400000, powerType: 'nev', purchaseDate: '2026-05-01' })
 * // → { fullTax: 40000, reliefMode: 'half', relief: 15000, payable: 25000 }
 */
export function calcVehiclePurchaseTax(params: {
  invoiceTotal?: number;
  taxExclusivePrice?: number;
  powerType?: VehiclePowerType;
  purchaseDate?: string;
}): VehiclePurchaseTaxResult | { error: string } {
  const powerType: VehiclePowerType = params.powerType === 'nev' ? 'nev' : 'fuel';
  const rawExclusive = params.taxExclusivePrice;
  const rawTotal = params.invoiceTotal;

  // 优先用不含税价；都没有或都是空值则报错
  const hasExclusive = typeof rawExclusive === 'number' && Number.isFinite(rawExclusive);
  const hasTotal = typeof rawTotal === 'number' && Number.isFinite(rawTotal);
  if (!hasExclusive && !hasTotal) return { error: '请填写购车发票价税合计或不含税价' };

  const vatIncluded = !hasExclusive;
  const taxablePrice = money2(
    hasExclusive
      ? new Decimal(rawExclusive as number)
      : new Decimal(rawTotal as number).div(new Decimal(VEHICLE_VAT_RATE).div(100).plus(1))
  );
  if (!(taxablePrice > 0)) return { error: '购车价格需为大于 0 的数字' };

  const fullTax = money2(new Decimal(taxablePrice).times(VEHICLE_TAX_RATE));
  let reliefMode: VehicleReliefMode = 'none';
  let reliefCap = 0;
  let relief = 0;
  let note = '车辆购置税 = 不含增值税的计税价格 × 10%，依据《车辆购置税法》。';

  if (powerType === 'nev') {
    const date = typeof params.purchaseDate === 'string' ? params.purchaseDate.trim() : '';
    const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(date);
    let window: (typeof NEV_RELIEF_WINDOWS)[number] | undefined;

    if (dateOk) {
      window = NEV_RELIEF_WINDOWS.find((w) => date >= w.from && date <= w.to);
      if (!window) {
        // 窗口外（2024 年前 / 2028 年后）：不猜政策，按全额并明确提示
        reliefMode = 'unknown';
        note =
          '购置日期不在现行新能源汽车减免窗口内（现行窗口为 2024-01-01 至 2027-12-31）。此处按**全额 10%** 估算，实际是否享受减免请以购车时主管税务机关核定为准。';
      }
    } else {
      // 没给日期或格式非法：按现行窗口（最后一个窗口）计算，并说明假设
      window = NEV_RELIEF_WINDOWS[NEV_RELIEF_WINDOWS.length - 1];
      note =
        '未提供有效购置日期（需 YYYY-MM-DD），已按**现行减免窗口**（2026-01-01 至 2027-12-31，减半、每辆乘用车减税上限 1.5 万元）计算；补上发票开具日期可得更准确结果。';
    }

    if (window) {
      reliefMode = window.mode;
      reliefCap = window.cap;
      const raw = window.mode === 'full' ? fullTax : new Decimal(fullTax).div(2).toNumber();
      relief = money2(Decimal.min(new Decimal(raw), new Decimal(window.cap)));
      note =
        window.mode === 'full'
          ? `新能源免征窗口（${window.from} 至 ${window.to}）：免征车辆购置税，每辆新能源乘用车免税额不超过 ${window.cap.toLocaleString('zh-CN')} 元。`
          : `新能源减半窗口（${window.from} 至 ${window.to}）：减半征收车辆购置税，每辆新能源乘用车减税额不超过 ${window.cap.toLocaleString('zh-CN')} 元。`;
    }
  } else {
    note =
      '燃油车无车辆购置税减免，按计税价格 × 10% 征收。计税价格已剔除 13% 增值税，故实缴低于车价的 10%。';
  }

  const payable = money2(new Decimal(fullTax).minus(relief));
  return {
    powerType,
    purchaseDate: params.purchaseDate,
    vatIncluded,
    taxablePrice,
    taxRate: VEHICLE_TAX_RATE,
    fullTax,
    reliefMode,
    reliefCap,
    relief,
    payable: Math.max(0, payable),
    note,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. 二手房交易税费计算器（second-hand-house-tax，卖方视角）
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 增值税征收率（%）。
 * ⚠️ 口径已变：自 2026-01-01 起（财政部 税务总局公告 2025 年第 17 号），
 * 个人销售购买不足 2 年的住房按 **3%** 征收率全额简易计税（此前为 5%）；
 * 购买 2 年以上（含）的住房对外销售**全额免征增值税**，
 * 不再区分普通住宅与非普通住宅、不再有北上广深的地域差异。
 * 网上仍在流传的「5% / 北上广深按差额 5%」是 2025 年及以前的旧口径。
 */
export const HOUSE_VAT_LEVY_RATE = 3;

/** 附加税费合计比例（%）= 城建税（市区 7 / 县城与镇 5 / 其他 1）+ 教育费附加 3 + 地方教育附加 2 */
export const HOUSE_SURCHARGE_EDU_RATE = 5;

/** 个人所得税核定征收率（%），不能提供房屋原值凭证时按转让收入全额核定 */
export const HOUSE_PERSONAL_TAX_ASSESS_RATE = 1;

/** 个人所得税查账征收率（%），能提供原值凭证时按转让差额计税 */
export const HOUSE_PERSONAL_TAX_DIFF_RATE = 20;

export interface SecondHandHouseTaxInput {
  /** 含税成交价（元），即买卖双方约定的卖出总价 */
  salePriceInclusive: number;
  /** 原购房发票金额（元）。仅 hasOriginalProof=true 时参与计算 */
  originalPrice?: number;
  /** 合理费用合计（元）：原契税、装修费、中介费等。仅 hasOriginalProof=true 时参与计算 */
  reasonableCosts?: number;
  /** 是否持有满 2 年（含）。购房年限按契税完税证明或房产证登记时间孰先认定 */
  heldOver2Years?: boolean;
  /** 是否「满五唯一」：卖方家庭唯一住房且持有满 5 年 → 免征个人所得税 */
  onlyHomeOver5Years?: boolean;
  /** 能否提供房屋原值凭证。true 按 20% 差额，false 按 1% 核定 */
  hasOriginalProof?: boolean;
  /** 城市维护建设税税率档：市区 7 / 县城与镇 5 / 其他 1，默认 7 */
  cityTaxRatePct?: number;
}

export interface SecondHandHouseTaxResult {
  salePriceInclusive: number;
  /** 不含增值税的转让收入（免征时等于成交价） */
  vatExclusivePrice: number;
  /** 适用的增值税征收率（%），免征时为 0 */
  vatRatePct: number;
  /** 增值税（元） */
  vat: number;
  /** 附加税费合计比例（%），已含小规模纳税人减半 */
  surchargeRatePct: number;
  /** 附加税费（元）：城建税 + 教育费附加 + 地方教育附加 */
  surcharge: number;
  /** 个人所得税计税依据（元） */
  personalTaxBase: number;
  /** 个人所得税适用比例（%），免征时为 0 */
  personalTaxRatePct: number;
  /** 个人所得税（元） */
  personalTax: number;
  /** 印花税（元），个人销售住房暂免 → 恒为 0 */
  stampDuty: number;
  /** 卖方税费合计（元） */
  totalTax: number;
  /** 卖方税后到手（元） */
  netProceeds: number;
  /** 口径与减免说明 */
  notes: string[];
}

/**
 * 二手房交易卖方税费计算（增值税及附加 + 个人所得税 + 印花税）。
 *
 * 计算顺序：
 *   1. 增值税：满 2 年（含）免征；未满 2 年 = 含税成交价 ÷(1+3%) × 3%
 *   2. 附加税费：以实缴增值税为计税依据 ×(城建税档 + 3 + 2)% × 50%（小规模纳税人减半）
 *   3. 个人所得税：满五唯一免征；能提供原值 →(不含税收入 − 原值 − 合理费用)×20%；
 *      不能提供 → 不含税收入 × 1%（各地核定率 1%–2% 不等，本工具取 1%）
 *   4. 印花税：个人销售住房暂免 → 0
 *
 * @param params 见 SecondHandHouseTaxInput
 * @returns 成功返回 SecondHandHouseTaxResult；入参非法时返回 `{ error: 中文提示 }`
 * @throws 不抛异常，与本站其余 calc* 一致，失败统一走 `{ error }`
 *
 * 边界输入行为：
 *   - salePriceInclusive 缺失 / null / NaN / ≤0 → `{ error: '成交价需为大于 0 的数字' }`
 *   - originalPrice / reasonableCosts 不传 → 按 0 处理；传负数 → `{ error: '原值与合理费用不能为负' }`
 *   - hasOriginalProof=true 但没给 originalPrice → 差额为负时个税取 0（不倒退补），并在 notes 提示
 *   - 所有布尔入参不传 → 按 false（最保守：不免征、按核定征收）
 *   - cityTaxRatePct 传了非 7/5/1 的值 → 原样采用，不做静默纠正
 *
 * @example
 * // 300 万成交、未满两年、无原值凭证
 * calcSecondHandHouseTax({ salePriceInclusive: 3_000_000 })
 * // → vat = 3,000,000/1.03*3% ≈ 87,378.64；附加 ≈ 5,242.72；个税 ≈ 29,126.21
 *
 * @example
 * // 300 万成交、满两年、满五唯一 → 增值税与个税全免，只剩 0 元（附加随增值税免而免）
 * calcSecondHandHouseTax({ salePriceInclusive: 3_000_000, heldOver2Years: true, onlyHomeOver5Years: true })
 * // → { vat: 0, surcharge: 0, personalTax: 0, totalTax: 0 }
 */
export function calcSecondHandHouseTax(
  params: SecondHandHouseTaxInput
): SecondHandHouseTaxResult | { error: string } {
  const price = params?.salePriceInclusive;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0)
    return { error: '成交价需为大于 0 的数字' };

  const original = params.originalPrice ?? 0;
  const costs = params.reasonableCosts ?? 0;
  if (original < 0 || costs < 0) return { error: '房屋原值与合理费用不能为负' };

  const held2 = params.heldOver2Years === true;
  const only5 = params.onlyHomeOver5Years === true;
  const hasProof = params.hasOriginalProof === true;
  const cityRate = params.cityTaxRatePct ?? 7;

  const notes: string[] = [];

  // 1. 增值税
  const vatRatePct = held2 ? 0 : HOUSE_VAT_LEVY_RATE;
  const vatExclusivePrice = held2
    ? money2(price)
    : money2(new Decimal(price).div(new Decimal(HOUSE_VAT_LEVY_RATE).div(100).plus(1)));
  const vat = held2 ? 0 : money2(new Decimal(vatExclusivePrice).times(HOUSE_VAT_LEVY_RATE).div(100));
  notes.push(
    held2
      ? '持有满 2 年（含）：免征增值税（财政部 税务总局公告 2025 年第 17 号，2026-01-01 起不分普通/非普通住宅、无地域差异）。'
      : `持有未满 2 年：按 ${HOUSE_VAT_LEVY_RATE}% 征收率全额简易计税（2026-01-01 起由 5% 降为 3%），无论房屋是否增值均需缴纳。`
  );

  // 2. 附加税费：小规模纳税人「六税两费」减半（财政部 税务总局公告 2023 年第 12 号，执行至 2027-12-31）
  const surchargeFullRate = new Decimal(cityRate).plus(HOUSE_SURCHARGE_EDU_RATE);
  const surchargeRatePct = surchargeFullRate.div(2).toNumber();
  const surcharge = vat > 0 ? money2(new Decimal(vat).times(surchargeRatePct).div(100)) : 0;
  notes.push(
    vat > 0
      ? `附加税费 = 增值税 × ${surchargeRatePct}%（城建税 ${cityRate}% + 教育费附加 3% + 地方教育附加 2%，小规模纳税人减半征收）。`
      : '增值税免征时，以其为计税依据的附加税费同时为 0。'
  );

  // 3. 个人所得税
  let personalTaxBase = 0;
  let personalTaxRatePct = 0;
  let personalTax = 0;
  if (only5) {
    notes.push('满五唯一（家庭唯一生活用房且持有满 5 年）：免征个人所得税。');
  } else if (hasProof) {
    personalTaxRatePct = HOUSE_PERSONAL_TAX_DIFF_RATE;
    personalTaxBase = Math.max(
      0,
      money2(new Decimal(vatExclusivePrice).minus(original).minus(costs))
    );
    personalTax = money2(new Decimal(personalTaxBase).times(HOUSE_PERSONAL_TAX_DIFF_RATE).div(100));
    if (personalTaxBase === 0) {
      notes.push(
        '按差额计税：不含税收入减去原值与合理费用后 ≤0，个人所得税为 0（亏损不产生退税）。'
      );
    } else {
      notes.push(
        `能提供房屋原值凭证：按转让差额（不含税收入 − 原值 − 合理费用）× ${HOUSE_PERSONAL_TAX_DIFF_RATE}% 计征。`
      );
    }
  } else {
    personalTaxRatePct = HOUSE_PERSONAL_TAX_ASSESS_RATE;
    personalTaxBase = vatExclusivePrice;
    personalTax = money2(new Decimal(personalTaxBase).times(HOUSE_PERSONAL_TAX_ASSESS_RATE).div(100));
    notes.push(
      `不能提供房屋原值凭证：按不含税转让收入全额 × ${HOUSE_PERSONAL_TAX_ASSESS_RATE}% 核定征收（各地核定率多在 1%–2%，本工具取 1%）。`
    );
  }

  // 4. 印花税：个人销售住房暂免
  const stampDuty = 0;
  notes.push('印花税：个人销售住房暂免征收，故为 0。买方契税请另行使用「契税计算器」估算。');

  const totalTax = money2(new Decimal(vat).plus(surcharge).plus(personalTax).plus(stampDuty));
  const netProceeds = money2(new Decimal(price).minus(totalTax));

  return {
    salePriceInclusive: money2(price),
    vatExclusivePrice,
    vatRatePct,
    vat,
    surchargeRatePct,
    surcharge,
    personalTaxBase,
    personalTaxRatePct,
    personalTax,
    stampDuty,
    totalTax,
    netProceeds,
    notes,
  };
}
