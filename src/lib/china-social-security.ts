/**
 * china-social-security.ts —— 中国「五险一金」纯计算层
 * ----------------------------------------------------------------------------
 * 与 UI 解耦，未来 MokaKit MCP Server 直接 import 复用（战略核心：人能用、AI 也能调）。
 *
 * 费率口径（全国通用参考值，截至 2026 年）：
 *   - 养老：个人 8% / 单位 16%（企业职工；机关事业单位单位 20% 属特例，本工具取通用值）
 *   - 医疗：个人 2% / 单位 8%（含统筹+个人账户，各地略有差异）
 *   - 失业：个人 0.5% / 单位 0.5%
 *   - 工伤：个人 0% / 单位 0.4%（按行业风险浮动 0.2%–1.9%，取中低值）
 *   - 生育：个人 0% / 单位 0.8%（多地已并入医保，但单独列示仍常见）
 *   - 公积金：个人 5%–12% / 单位 5%–12%（本工具默认 12%）
 *
 * 缴费基数：通常为本人上年度月平均工资，需在当地社平工资的 60%–300% 之间
 * （即基数上下限）。本工具允许传入上下限做自动夹取，不传则不限制。
 *
 * 所有金额单位：元/月。费率为百分数（8 即 8%）。
 */

import Decimal from 'decimal.js';

export type SSKey =
  | 'pension'
  | 'medical'
  | 'unemployment'
  | 'injury'
  | 'maternity'
  | 'housingFund';

export interface SSFeeRate {
  /** 个人费率（%） */
  personal: number;
  /** 单位费率（%） */
  employer: number;
}

export type SSRates = Record<SSKey, SSFeeRate>;

/** 全国通用参考费率 */
export const DEFAULT_SS_RATES: SSRates = {
  pension: { personal: 8, employer: 16 },
  medical: { personal: 2, employer: 8 },
  unemployment: { personal: 0.5, employer: 0.5 },
  injury: { personal: 0, employer: 0.4 },
  maternity: { personal: 0, employer: 0.8 },
  housingFund: { personal: 12, employer: 12 },
};

export const SS_LABELS: Record<SSKey, string> = {
  pension: '养老保险',
  medical: '医疗保险',
  unemployment: '失业保险',
  injury: '工伤保险',
  maternity: '生育保险',
  housingFund: '住房公积金',
};

export interface SSItem {
  key: SSKey;
  label: string;
  personal: number;
  employer: number;
}

export interface SSInput {
  /** 缴费基数（元/月） */
  base: number;
  /** 基数下限（元/月），不传表示不限制 */
  baseFloor?: number;
  /** 基数上限（元/月），不传表示不限制 */
  baseCeil?: number;
  /** 自定义费率，不传用 DEFAULT_SS_RATES */
  rates?: SSRates;
  /** 是否计算住房公积金，默认 true */
  housingFundEnabled?: boolean;
}

export interface SSResult {
  /** 实际采用的缴费基数（夹取后） */
  baseApplied: number;
  /** 是否发生了上下限夹取 */
  clamped: boolean;
  items: SSItem[];
  /** 个人每月合计 */
  personalTotal: number;
  /** 单位每月合计 */
  employerTotal: number;
  /** 个人 + 单位合计（企业用工成本增量） */
  combined: number;
  /** 个人缴纳占缴费基数比例（%） */
  personalRatePct: number;
}

const ROUND = Decimal.ROUND_HALF_UP;
function round2(n: Decimal): number {
  return n.toDecimalPlaces(2, ROUND).toNumber();
}

/** 计算五险一金分项与个人/单位总额 */
export function calcSocialSecurity(input: SSInput): SSResult {
  const rates = input.rates ?? DEFAULT_SS_RATES;
  const housingEnabled = input.housingFundEnabled ?? true;

  let applied = new Decimal(input.base || 0);
  const floor = input.baseFloor ?? 0;
  const ceil = input.baseCeil ?? Infinity;
  let clamped = false;
  if (applied.lt(floor)) {
    applied = new Decimal(floor);
    clamped = true;
  }
  if (ceil !== Infinity && applied.gt(ceil)) {
    applied = new Decimal(ceil);
    clamped = true;
  }
  const baseApplied = round2(applied);

  const keys: SSKey[] = [
    'pension',
    'medical',
    'unemployment',
    'injury',
    'maternity',
    'housingFund',
  ];
  const items: SSItem[] = [];
  let personalTotal = new Decimal(0);
  let employerTotal = new Decimal(0);

  for (const k of keys) {
    if (k === 'housingFund' && !housingEnabled) continue;
    const r = rates[k];
    const p = applied.times(r.personal).div(100);
    const e = applied.times(r.employer).div(100);
    personalTotal = personalTotal.plus(p);
    employerTotal = employerTotal.plus(e);
    items.push({
      key: k,
      label: SS_LABELS[k],
      personal: round2(p),
      employer: round2(e),
    });
  }

  const personalTotalN = round2(personalTotal);
  const employerTotalN = round2(employerTotal);
  const combined = round2(personalTotal.plus(employerTotal));
  const personalRatePct =
    baseApplied > 0 ? round2(personalTotal.div(baseApplied).times(100)) : 0;

  return {
    baseApplied,
    clamped,
    items,
    personalTotal: personalTotalN,
    employerTotal: employerTotalN,
    combined,
    personalRatePct,
  };
}
