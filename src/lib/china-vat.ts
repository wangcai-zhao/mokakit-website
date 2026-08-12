/**
 * china-vat.ts —— 中国「增值税」纯计算层
 * ----------------------------------------------------------------------------
 * 与 UI 解耦，未来 MokaKit MCP Server 直接 import 复用。
 *
 * 两种计税方法：
 *   1. 一般计税（一般纳税人）：应纳税额 = 销项税额 − 进项税额
 *      - 销项税额 = 不含税销售额 × 税率（13% / 9% / 6% 等）
 *      - 进项税额 = 不含税采购额 × 税率
 *      - 销项 < 进项 时形成「留抵税额」，结转下期抵扣（不退税）
 *   2. 简易计税（小规模纳税人 / 特定业务）：应纳税额 = 不含税销售额 × 征收率
 *      - 征收率常见 3% / 5%（2023 年起小规模纳税人 3% 减按 1% 属阶段性优惠）
 *
 * 所有金额单位：元，均为「不含税」金额（含税需先 ÷(1+税率) 还原）。
 * 税率为百分数（13 即 13%）。
 */

import Decimal from 'decimal.js';

const ROUND = Decimal.ROUND_HALF_UP;
function r2(n: Decimal): number {
  return n.toDecimalPlaces(2, ROUND).toNumber();
}

export interface GeneralVatInput {
  /** 不含税销售额 */
  salesAmount: number;
  /** 销项税率（%） */
  salesRate: number;
  /** 不含税采购额 */
  purchaseAmount: number;
  /** 进项税率（%） */
  purchaseRate: number;
}

export interface GeneralVatResult {
  outputTax: number;
  inputTax: number;
  /** 销项 − 进项（可能为负） */
  net: number;
  /** 本期应纳（net > 0 时） */
  payable: number;
  /** 留抵税额（net < 0 时） */
  carryForward: number;
}

/** 一般计税 */
export function calcGeneralVat(i: GeneralVatInput): GeneralVatResult {
  const output = new Decimal(i.salesAmount || 0).times(i.salesRate || 0).div(100);
  const input = new Decimal(i.purchaseAmount || 0).times(i.purchaseRate || 0).div(100);
  const net = output.minus(input);
  const payable = net.gt(0) ? r2(net) : 0;
  const carryForward = net.lt(0) ? r2(net.negated()) : 0;
  return {
    outputTax: r2(output),
    inputTax: r2(input),
    net: r2(net),
    payable,
    carryForward,
  };
}

export interface SimpleVatInput {
  /** 不含税销售额 */
  salesAmount: number;
  /** 征收率（%） */
  levyRate: number;
}

export interface SimpleVatResult {
  tax: number;
}

/** 简易计税 */
export function calcSimpleVat(i: SimpleVatInput): SimpleVatResult {
  const tax = new Decimal(i.salesAmount || 0).times(i.levyRate || 0).div(100);
  return { tax: r2(tax) };
}

/** 含税价 → 不含税价（用于界面辅助换算） */
export function excludeTax(inclusive: number, ratePct: number): number {
  const r = new Decimal(ratePct || 0).div(100);
  const base = new Decimal(inclusive || 0).div(r.plus(1));
  return r2(base);
}
