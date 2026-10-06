/**
 * china-tax.ts —— 中国本土计税「纯计算层」
 * ----------------------------------------------------------------------------
 * 为什么单独抽一层：
 *   1. 与 UI（Preact Tool.tsx）解耦，计算逻辑可独立单元测试；
 *   2. 未来 MokaKit MCP Server 直接 import 本文件，人能用、AI 也能调（战略核心）；
 *   3. 个税与年终奖共用同一套税率表与递进算法，避免两份实现漂移。
 *
 * 口径说明（截至 2026 年，现行有效）：
 *   - 综合所得基本减除费用：60000 元/年（5000 元/月）。
 *   - 综合所得年度税率表（工资薪金等并入综合所得汇算）。
 *   - 全年一次性奖金单独计税：2024-01-01 至 2027-12-31 期间可单独计税
 *     （财税〔2023〕30 号延续），按「奖金 ÷ 12」确定月度税率表。
 *   - 专项附加扣除标准采用 2023 年调整后的口径（子女教育 2000/月、婴幼儿照护
 *     2000/月、赡养老人独生子女 3000/月等）。
 *
 * 所有金额单位：元。税率为小数（0.03 即 3%）。
 */

import Decimal from 'decimal.js';

/** 税率级距（threshold 为「超过」的下限，不含本数时落入上一档由递进算法处理） */
export interface TaxBracket {
  /** 级距下限（元，年或月，依使用场景） */
  threshold: number;
  /** 税率（小数） */
  rate: number;
  /** 速算扣除数（元） */
  quickDeduction: number;
}

/** 综合所得（工资薪金等）年度税率表 */
export const ANNUAL_BRACKETS: TaxBracket[] = [
  { threshold: 0, rate: 0.03, quickDeduction: 0 },
  { threshold: 36000, rate: 0.1, quickDeduction: 2520 },
  { threshold: 144000, rate: 0.2, quickDeduction: 16920 },
  { threshold: 300000, rate: 0.25, quickDeduction: 31920 },
  { threshold: 420000, rate: 0.3, quickDeduction: 52920 },
  { threshold: 660000, rate: 0.35, quickDeduction: 85920 },
  { threshold: 960000, rate: 0.45, quickDeduction: 181920 },
];

/** 全年一次性奖金单独计税：按月度税率表（奖金 ÷ 12 定档） */
export const MONTHLY_BONUS_BRACKETS: TaxBracket[] = [
  { threshold: 0, rate: 0.03, quickDeduction: 0 },
  { threshold: 3000, rate: 0.1, quickDeduction: 210 },
  { threshold: 12000, rate: 0.2, quickDeduction: 1410 },
  { threshold: 25000, rate: 0.25, quickDeduction: 2660 },
  { threshold: 35000, rate: 0.3, quickDeduction: 4410 },
  { threshold: 55000, rate: 0.35, quickDeduction: 7160 },
  { threshold: 80000, rate: 0.45, quickDeduction: 15160 },
];

/** 基本减除费用（年） */
export const BASIC_DEDUCTION_ANNUAL = 60000;

/** 专项附加扣除参考标准（2023 调整后口径，单位：元/月，除标注年外），供 UI 提示与 content 使用 */
export const SPECIAL_ADDITION_REF = {
  childEducation: { perChildMonth: 2000, label: '子女教育（每孩/月）' },
  infantCare: { perChildMonth: 2000, label: '3岁以下婴幼儿照护（每孩/月）' },
  continuingEducation: { academicMonth: 400, qualificationYear: 3600, label: '继续教育' },
  housingLoanInterest: { month: 1000, label: '住房贷款利息（首套/月）' },
  housingRent: { tier1: 1500, tier2: 1100, tier3: 800, label: '住房租金（三档/月）' },
  supportingElder: { onlyChildMonth: 3000, sharedMaxMonth: 1500, label: '赡养老人（独生子女 3000/月）' },
  seriousIllness: { threshold: 15000, cap: 80000, label: '大病医疗（自付超1.5万部分，限8万）' },
} as const;

/** 年终奖单独计税的临界点（多发 1 元反而到手更少的盲区下限） */
export const BONUS_BLIND_THRESHOLDS = [36000, 144000, 300000, 420000, 660000, 960000];

export interface BracketHit {
  rate: number;
  quickDeduction: number;
  /** 命中的级距下限 */
  threshold: number;
}

/** 在升序税率表中，找到「应纳税所得额」命中的级距（最后一个 threshold < taxable 的档） */
export function bracketFor(taxable: number, brackets: TaxBracket[]): TaxBracket {
  let b = brackets[0];
  for (const x of brackets) {
    if (taxable > x.threshold) b = x;
  }
  return b;
}

/** 递进计税：给定应纳税所得额与税率表，返回税额、税率、速算扣除数 */
export function progressiveTax(
  taxable: number,
  brackets: TaxBracket[]
): { tax: number; rate: number; quickDeduction: number } {
  if (!(taxable > 0)) {
    return { tax: 0, rate: 0, quickDeduction: 0 };
  }
  const b = bracketFor(taxable, brackets);
  const raw = new Decimal(taxable)
    .times(b.rate)
    .minus(b.quickDeduction)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber();
  return {
    tax: Math.max(0, raw),
    rate: b.rate,
    quickDeduction: b.quickDeduction,
  };
}

export interface IncomeTaxInput {
  /** 年税前收入（元） */
  annualGross: number;
  /** 全年三险一金个人缴纳合计（元） */
  annualSocialInsurance: number;
  /** 全年专项附加扣除合计（元） */
  annualSpecialAddition: number;
  /** 全年其他依法扣除（年金/商业健康险等，元） */
  annualOtherDeduction: number;
}

export interface IncomeTaxResult {
  taxableIncome: number;
  tax: number;
  rate: number;
  quickDeduction: number;
  afterTaxAnnual: number;
  afterTaxMonthly: number;
  effectiveRate: number;
}

/** 综合所得（工资薪金）年度个税计算 */
export function calcIncomeTaxAnnual(input: IncomeTaxInput): IncomeTaxResult {
  const taxable = new Decimal(input.annualGross)
    .minus(BASIC_DEDUCTION_ANNUAL)
    .minus(input.annualSocialInsurance || 0)
    .minus(input.annualSpecialAddition || 0)
    .minus(input.annualOtherDeduction || 0)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber();

  const { tax, rate, quickDeduction } = progressiveTax(taxable, ANNUAL_BRACKETS);
  const afterTaxAnnual = new Decimal(input.annualGross)
    .minus(input.annualSocialInsurance || 0)
    .minus(tax)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber();
  const afterTaxMonthly = new Decimal(afterTaxAnnual).div(12).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  const effectiveRate = input.annualGross > 0 ? new Decimal(tax).div(input.annualGross).toNumber() : 0;

  return {
    taxableIncome: Math.max(0, taxable),
    tax,
    rate,
    quickDeduction,
    afterTaxAnnual,
    afterTaxMonthly,
    effectiveRate,
  };
}

export interface BonusTaxResult {
  tax: number;
  rate: number;
  quickDeduction: number;
  net: number;
  monthlyNet: number;
  /** 是否落在税率盲区（多发 1 元到手反而更少） */
  blindSpot: boolean;
  /** 盲区临界提示文案 */
  blindNote?: string;
}

/** 全年一次性奖金单独计税 */
export function calcBonusTaxSeparate(bonus: number): BonusTaxResult {
  // 税率/速算扣除数按「奖金 ÷ 12」对应的月度税率表确定，但税额用全额奖金计算
  const monthly = new Decimal(bonus).div(12).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  const b = bracketFor(monthly, MONTHLY_BONUS_BRACKETS);
  const tax = Math.max(
    0,
    new Decimal(bonus)
      .times(b.rate)
      .minus(b.quickDeduction)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      .toNumber()
  );
  const rate = b.rate;
  const quickDeduction = b.quickDeduction;
  const net = new Decimal(bonus).minus(tax).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  const monthlyNet = new Decimal(net).div(12).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

  // 盲区检测：奖金略高于某临界点时，税率跳档使税额骤增
  let blindSpot = false;
  let blindNote: string | undefined;
  for (const t of BONUS_BLIND_THRESHOLDS) {
    // 临界值 +1 元仍落在同一「到手更少」区间的判断：临界值本身到手 > 临界值+小额
    if (bonus > t && bonus <= t + 1) {
      blindSpot = true;
      blindNote = `奖金 ${t.toLocaleString('zh-CN')} 元是税率跳档临界点：多发 1 元（${(
        t + 1
      ).toLocaleString('zh-CN')} 元）因税率跳档，到手反而更少。建议卡在临界值或发足下一档。`;
      break;
    }
  }

  return { tax, rate, quickDeduction, net, monthlyNet, blindSpot, blindNote };
}

export interface BonusCompareResult {
  /** 单独计税税额 */
  separateTax: number;
  /** 并入综合所得方案的增量税额（仅奖金部分） */
  mergedIncrementalTax: number;
  /** 更省的方案：'separate' | 'merged' | 'equal' */
  better: 'separate' | 'merged' | 'equal';
  /** 差额（绝对值，元） */
  diff: number;
}

/**
 * 年终奖「单独计税 vs 并入综合所得」对比。
 * @param bonus 年终奖金额
 * @param comprehensiveTaxable 当年综合所得（工资等）应纳税所得额（已扣减基本减除/三险一金/专项附加后的金额）
 */
export function compareBonus(bonus: number, comprehensiveTaxable: number): BonusCompareResult {
  const separateTax = calcBonusTaxSeparate(bonus).tax;
  const baseTax = progressiveTax(comprehensiveTaxable, ANNUAL_BRACKETS).tax;
  const mergedTotalTax = progressiveTax(comprehensiveTaxable + bonus, ANNUAL_BRACKETS).tax;
  const mergedIncrementalTax = Math.max(0, mergedTotalTax - baseTax);

  let better: BonusCompareResult['better'] = 'equal';
  if (Math.abs(separateTax - mergedIncrementalTax) < 0.005) better = 'equal';
  else if (separateTax < mergedIncrementalTax) better = 'separate';
  else better = 'merged';

  return {
    separateTax,
    mergedIncrementalTax,
    better,
    diff: Math.abs(separateTax - mergedIncrementalTax),
  };
}

export const CHINA_TAX_META = {
  basicDeductionMonthly: BASIC_DEDUCTION_ANNUAL / 12,
  basicDeductionAnnual: BASIC_DEDUCTION_ANNUAL,
  note: '口径截至 2026 年：综合所得基本减除 6 万/年；全年一次性奖金单独计税政策延续至 2027-12-31。本工具为估算参考，实际以税务机关汇算为准。',
};

// ═══════════════════════════════════════════════════════════════════════════
// 劳务报酬 / 稿酬 / 特许权使用费：支付方「预扣预缴」个税
// ═══════════════════════════════════════════════════════════════════════════

/** 非工资薪金所得的三种类型（与综合所得年度汇算的四项一一对应除工资薪金外） */
export type NonWageIncomeKind =
  /** 劳务报酬：兼职、咨询、设计、讲学等 */
  | 'labor'
  /** 稿酬：图书/报刊出版、发表作品取得的所得 */
  | 'royalty'
  /** 特许权使用费：提供专利权、商标权、著作权等使用权取得的所得 */
  | 'franchise';

/** 劳务报酬预扣率表（按「应纳税所得额」定档） */
export const LABOR_WITHHOLD_BRACKETS: TaxBracket[] = [
  { threshold: 0, rate: 0.2, quickDeduction: 0 },
  { threshold: 20000, rate: 0.3, quickDeduction: 2000 },
  { threshold: 50000, rate: 0.4, quickDeduction: 7000 },
];

/** 收入 ≤ 此数时按定额 800 元减除费用，超过则按 20% 比例减除（个人所得税法实施条例） */
export const NON_WAGE_EXPENSE_THRESHOLD = 4000;

/** 收入 ≤ 4000 元时的定额减除费用（元） */
export const NON_WAGE_FLAT_EXPENSE = 800;

/** 收入 > 4000 元时的比例减除费用（小数） */
export const NON_WAGE_RATIO_EXPENSE = 0.2;

/** 稿酬所得减征比例：收入额按 70% 计算（即减征 30%） */
export const ROYALTY_INCOME_RATIO = 0.7;

export interface NonWageIncomeTaxResult {
  kind: NonWageIncomeKind;
  /** 原始收入（元） */
  income: number;
  /** 减除费用（元） */
  expense: number;
  /** 收入额：劳务/特许权 = 收入 − 费用；稿酬 =(收入 − 费用)×70% */
  incomeAmount: number;
  /** 应纳税所得额（元） */
  taxable: number;
  /** 预扣率（小数） */
  rate: number;
  /** 速算扣除数（元） */
  quickDeduction: number;
  /** 预扣预缴税额（元） */
  tax: number;
  /** 扣税后到手（元） */
  net: number;
  /** 实际税负（小数） */
  effectiveRate: number;
  /** 口径说明 */
  note: string;
}

/**
 * 劳务报酬 / 稿酬 / 特许权使用费的**预扣预缴**个人所得税。
 *
 * 算法（国家税务总局公告 2018 年第 61 号《个人所得税扣缴申报管理办法》）：
 *   1. 减除费用：收入 ≤ 4000 元减除 800 元；> 4000 元减除 20%
 *   2. 稿酬特殊优惠：收入额 =(收入 − 费用)× 70%（减征 30%）
 *   3. 劳务报酬按三级预扣率（20% / 30% / 40%，速算扣除 0 / 2000 / 7000）计税；
 *      稿酬与特许权使用费一律按 20% 计税
 *
 * ⚠️ 这是**支付方代扣代缴**环节的税额，不是最终税负：次年 3–6 月年度汇算时，
 * 这三项会与工资薪金合并为综合所得重新计税，多退少补。
 *
 * @param params.income 单笔收入（元）。劳务报酬以「一次」为单位，属同一项目连续性收入的以一个月内取得的收入为一次
 * @param params.kind   所得类型，默认 'labor'
 * @returns 成功返回 NonWageIncomeTaxResult；入参非法时返回 `{ error: 中文提示 }`
 * @throws 不抛异常，与本站 calc* 系列一致，失败统一走 `{ error }`
 *
 * 边界输入行为：
 *   - income 缺失 / null / undefined / NaN / 非有限数 → `{ error: '收入需为有效数字' }`
 *   - income ≤ 0 → `{ error: '收入需大于 0' }`
 *   - income 为字符串数字（MCP 常见）→ 内部用 Number() 转型，转不出来则按上面报错
 *   - kind 不传 → 按 'labor'；传了未知值 → 同样按 'labor' 处理，不静默套用稿酬优惠
 *   - 收入极低（如 100 元）→ 减除 800 后应纳税所得额为负，税额取 0、到手等于收入
 *
 * @example
 * // 接私活收到 1 万元劳务费：减除 20%（2000）→ 8000 × 20% = 1600
 * calcLaborIncomeTax({ income: 10000 })
 * // → { expense: 2000, taxable: 8000, rate: 0.2, tax: 1600, net: 8400 }
 *
 * @example
 * // 稿费 5000 元：(5000 − 1000) × 70% = 2800 → 2800 × 20% = 560
 * calcLaborIncomeTax({ income: 5000, kind: 'royalty' })
 * // → { expense: 1000, incomeAmount: 2800, tax: 560, net: 4440 }
 *
 * @example
 * // 大额劳务 60000 元：减除 20% → 48000，适用 30% 速算 2000 → 12400
 * calcLaborIncomeTax({ income: 60000 })
 * // → { taxable: 48000, rate: 0.3, quickDeduction: 2000, tax: 12400, net: 47600 }
 */
export function calcLaborIncomeTax(params: {
  income: number;
  kind?: NonWageIncomeKind;
}): NonWageIncomeTaxResult | { error: string } {
  const raw = params?.income as unknown;
  const income = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(income)) return { error: '收入需为有效数字' };
  if (income <= 0) return { error: '收入需大于 0' };

  const kind: NonWageIncomeKind =
    params.kind === 'royalty' || params.kind === 'franchise' ? params.kind : 'labor';

  // 1. 减除费用：≤4000 定额 800，>4000 按 20%
  const expense = money2(
    income <= NON_WAGE_EXPENSE_THRESHOLD
      ? new Decimal(Math.min(NON_WAGE_FLAT_EXPENSE, income))
      : new Decimal(income).times(NON_WAGE_RATIO_EXPENSE)
  );

  // 2. 收入额：稿酬再减按 70% 计算
  const incomeAmount = money2(
    kind === 'royalty'
      ? new Decimal(income).minus(expense).times(ROYALTY_INCOME_RATIO)
      : new Decimal(income).minus(expense)
  );

  // 3. 预扣：劳务报酬走三级预扣率表，稿酬与特许权使用费一律 20%
  const taxable = Math.max(0, incomeAmount);
  const rate = kind === 'labor' ? bracketFor(taxable, LABOR_WITHHOLD_BRACKETS).rate : 0.2;
  const quickDeduction = kind === 'labor' ? bracketFor(taxable, LABOR_WITHHOLD_BRACKETS).quickDeduction : 0;
  const tax = Math.max(
    0,
    money2(new Decimal(taxable).times(rate).minus(quickDeduction))
  );
  const net = money2(new Decimal(income).minus(tax));
  const effectiveRate = income > 0 ? new Decimal(tax).div(income).toNumber() : 0;

  const kindLabel =
    kind === 'labor' ? '劳务报酬' : kind === 'royalty' ? '稿酬' : '特许权使用费';
  const note =
    `${kindLabel}预扣预缴：${income <= NON_WAGE_EXPENSE_THRESHOLD ? '收入 ≤ 4000 元，定额减除 800 元' : '收入 > 4000 元，按 20% 减除费用'}` +
    (kind === 'royalty' ? '；稿酬收入额再减按 70% 计算（减征 30%）' : '') +
    `；适用预扣率 ${(rate * 100).toFixed(0)}%` +
    (quickDeduction ? `（速算扣除 ${quickDeduction} 元）` : '') +
    '。年度汇算时并入综合所得重新计税，多退少补。';

  return {
    kind,
    income: money2(income),
    expense,
    incomeAmount,
    taxable,
    rate,
    quickDeduction,
    tax,
    net,
    effectiveRate,
    note,
  };
}

/** 金额四舍五入到分，供本节函数内部使用 */
function money2(n: Decimal.Value): number {
  return new Decimal(n).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}
