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
