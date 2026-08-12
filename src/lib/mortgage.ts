/**
 * mortgage.ts —— 房贷（商贷 / 公积金贷 / 提前还款）纯计算层
 * ----------------------------------------------------------------------------
 * 与 UI 解耦，未来 MokaKit MCP Server 直接 import 复用。
 *
 * 支持两种还款方式：
 *   - equal-payment   等额本息：每月月供固定
 *   - equal-principal 等额本金：每月本金固定、利息递减、月供递减
 *
 * 提前还款支持两种处理：
 *   - reduce  减少月供：期限不变（剩余期数），重算月供
 *   - shorten 缩短期限：月供（或每期本金）不变，重算多久能还清
 *
 * 所有金额单位：元。利率为百分数（3.85 即 3.85%）。
 */

import Decimal from 'decimal.js';

const ROUND = Decimal.ROUND_HALF_UP;
function r2(n: Decimal): number {
  return n.toDecimalPlaces(2, ROUND).toNumber();
}

export type RepayMethod = 'equal-payment' | 'equal-principal';

export interface ScheduleEntry {
  period: number;
  payment: number;
  principalPart: number;
  interestPart: number;
  /** 本期还款后剩余本金 */
  balance: number;
}

export interface ScheduleResult {
  method: RepayMethod;
  /** 等额本息月供（恒定） */
  monthly?: number;
  /** 等额本金首月月供 */
  firstMonthly?: number;
  /** 等额本金每月递减额 */
  monthlyDecrease?: number;
  totalInterest: number;
  totalPayment: number;
  schedule: ScheduleEntry[];
}

/** 等额本息月供公式 */
export function equalPaymentMonthly(
  principal: number,
  annualRatePct: number,
  periods: number
): number {
  const P = new Decimal(principal);
  const m = new Decimal(annualRatePct).div(100).div(12);
  if (m.eq(0)) return r2(P.div(periods));
  const f = m.plus(1).pow(periods);
  const M = P.times(m).times(f).div(f.minus(1));
  return r2(M);
}

/** 生成完整还款计划 */
export function buildSchedule(
  principal: number,
  annualRatePct: number,
  periods: number,
  method: RepayMethod
): ScheduleResult {
  const P = new Decimal(principal);
  const m = new Decimal(annualRatePct).div(100).div(12);
  const schedule: ScheduleEntry[] = [];
  let balance = P;
  let totalInterest = new Decimal(0);
  let totalPayment = new Decimal(0);

  if (method === 'equal-payment') {
    const M = new Decimal(equalPaymentMonthly(principal, annualRatePct, periods));
    for (let k = 1; k <= periods; k++) {
      const interest = balance.times(m);
      let principalPart = M.minus(interest);
      if (k === periods) principalPart = balance; // 末期调整尾差
      const payment = principalPart.plus(interest);
      balance = balance.minus(principalPart);
      if (balance.lt(0)) balance = new Decimal(0);
      totalInterest = totalInterest.plus(interest);
      totalPayment = totalPayment.plus(payment);
      schedule.push({
        period: k,
        payment: r2(payment),
        principalPart: r2(principalPart),
        interestPart: r2(interest),
        balance: r2(balance),
      });
    }
    return {
      method,
      monthly: r2(M),
      totalInterest: r2(totalInterest),
      totalPayment: r2(totalPayment),
      schedule,
    };
  }

  // equal-principal：每月本金固定
  const perPrincipal = P.div(periods);
  let firstMonthly: Decimal | null = null;
  let monthlyDecrease: Decimal | null = null;
  for (let k = 1; k <= periods; k++) {
    let principalPart = perPrincipal;
    if (k === periods) principalPart = balance;
    const interest = balance.times(m);
    const payment = principalPart.plus(interest);
    balance = balance.minus(principalPart);
    if (balance.lt(0)) balance = new Decimal(0);
    if (firstMonthly === null) firstMonthly = payment;
    else if (monthlyDecrease === null && k === 2) monthlyDecrease = firstMonthly.minus(payment);
    totalInterest = totalInterest.plus(interest);
    totalPayment = totalPayment.plus(payment);
    schedule.push({
      period: k,
      payment: r2(payment),
      principalPart: r2(principalPart),
      interestPart: r2(interest),
      balance: r2(balance),
    });
  }
  return {
    method,
    firstMonthly: firstMonthly ? r2(firstMonthly) : 0,
    monthlyDecrease: monthlyDecrease ? r2(monthlyDecrease) : 0,
    totalInterest: r2(totalInterest),
    totalPayment: r2(totalPayment),
    schedule,
  };
}

/** 缩短期限（等额本息）：保持月供不变，逐期还清，自然确定期数 */
function buildKeepPayment(
  principal: number,
  annualRatePct: number,
  monthlyPayment: number
): ScheduleResult {
  const m = new Decimal(annualRatePct).div(100).div(12);
  const M = new Decimal(monthlyPayment);
  let balance = new Decimal(principal);
  const schedule: ScheduleEntry[] = [];
  let totalInterest = new Decimal(0);
  let totalPayment = new Decimal(0);
  let k = 0;
  while (balance.gt(0) && k < 12000) {
    k++;
    const interest = balance.times(m);
    let principalPart = M.minus(interest);
    if (principalPart.gte(balance)) principalPart = balance;
    const payment = principalPart.plus(interest);
    balance = balance.minus(principalPart);
    if (balance.lt(0)) balance = new Decimal(0);
    totalInterest = totalInterest.plus(interest);
    totalPayment = totalPayment.plus(payment);
    schedule.push({
      period: k,
      payment: r2(payment),
      principalPart: r2(principalPart),
      interestPart: r2(interest),
      balance: r2(balance),
    });
  }
  return {
    method: 'equal-payment',
    monthly: r2(M),
    totalInterest: r2(totalInterest),
    totalPayment: r2(totalPayment),
    schedule,
  };
}

/** 缩短期限（等额本金）：保持每期本金不变，逐期还清 */
function buildKeepPrincipal(
  principal: number,
  annualRatePct: number,
  perPrincipal: number
): ScheduleResult {
  const m = new Decimal(annualRatePct).div(100).div(12);
  const pp = new Decimal(perPrincipal);
  let balance = new Decimal(principal);
  const schedule: ScheduleEntry[] = [];
  let totalInterest = new Decimal(0);
  let totalPayment = new Decimal(0);
  let firstMonthly: Decimal | null = null;
  let monthlyDecrease: Decimal | null = null;
  let k = 0;
  while (balance.gt(0) && k < 12000) {
    k++;
    let principalPart = pp;
    if (principalPart.gte(balance)) principalPart = balance;
    const interest = balance.times(m);
    const payment = principalPart.plus(interest);
    balance = balance.minus(principalPart);
    if (balance.lt(0)) balance = new Decimal(0);
    if (firstMonthly === null) firstMonthly = payment;
    else if (monthlyDecrease === null && k === 2) monthlyDecrease = firstMonthly.minus(payment);
    totalInterest = totalInterest.plus(interest);
    totalPayment = totalPayment.plus(payment);
    schedule.push({
      period: k,
      payment: r2(payment),
      principalPart: r2(principalPart),
      interestPart: r2(interest),
      balance: r2(balance),
    });
  }
  return {
    method: 'equal-principal',
    firstMonthly: firstMonthly ? r2(firstMonthly) : 0,
    monthlyDecrease: monthlyDecrease ? r2(monthlyDecrease) : 0,
    totalInterest: r2(totalInterest),
    totalPayment: r2(totalPayment),
    schedule,
  };
}

export type EarlyMode = 'reduce' | 'shorten';

export interface EarlyRepaymentInput {
  /** 原贷款本金 */
  principal: number;
  /** 原年利率（%） */
  annualRatePct: number;
  /** 原还款总期数 */
  periods: number;
  /** 原还款方式 */
  method: RepayMethod;
  /** 已还期数 */
  paidPeriods: number;
  /** 本次提前还款金额 */
  prepayAmount: number;
  /** reduce=减少月供(期限不变) / shorten=缩短期限(月供不变) */
  mode: EarlyMode;
}

export interface EarlyRepaymentResult {
  /** 原月供（等额本息） */
  originalMonthly?: number;
  /** 原首月月供（等额本金） */
  originalFirstMonthly?: number;
  /** 已还本金合计 */
  paidPrincipal: number;
  /** 已还利息合计 */
  paidInterest: number;
  /** 提前还款前剩余本金 */
  remainingBeforePrepay: number;
  /** 提前还款后新本金 */
  newPrincipal: number;
  /** 提前还款金额 */
  prepayAmount: number;
  /** 新月供（等额本息 / reduce 模式） */
  newMonthly?: number;
  /** 新首月月供（等额本金） */
  newFirstMonthly?: number;
  /** 新方案期数 */
  newPeriods: number;
  /** 新方案总利息 */
  newTotalInterest: number;
  /** 若不提前还款，剩余期原本利息 */
  originalRemainingInterest: number;
  /** 节省的利息 */
  savedInterest: number;
  /** 新方案还款总额 */
  newTotalPayment: number;
}

/** 提前还款测算 */
export function calcEarlyRepayment(i: EarlyRepaymentInput): EarlyRepaymentResult {
  const full = buildSchedule(i.principal, i.annualRatePct, i.periods, i.method);
  const k = Math.min(Math.max(0, Math.floor(i.paidPeriods)), i.periods);

  let paidPrincipal = new Decimal(0);
  let paidInterest = new Decimal(0);
  for (let p = 0; p < k; p++) {
    paidPrincipal = paidPrincipal.plus(full.schedule[p].principalPart);
    paidInterest = paidInterest.plus(full.schedule[p].interestPart);
  }
  const remainingBefore = k > 0 ? new Decimal(full.schedule[k - 1].balance) : new Decimal(i.principal);
  const newPrincipal = remainingBefore.minus(i.prepayAmount);
  if (newPrincipal.lt(0)) {
    throw new Error('提前还款金额超过剩余本金');
  }
  const remainingPeriods = Math.max(1, i.periods - k);

  // 原剩余计划利息
  let originalRemainingInterest = new Decimal(0);
  for (let p = k; p < full.schedule.length; p++) {
    originalRemainingInterest = originalRemainingInterest.plus(full.schedule[p].interestPart);
  }

  let newSchedule: ScheduleResult;
  let newPeriods: number;
  if (i.mode === 'reduce') {
    newSchedule = buildSchedule(newPrincipal.toNumber(), i.annualRatePct, remainingPeriods, i.method);
    newPeriods = remainingPeriods;
  } else {
    // shorten：保持支付额不变
    if (i.method === 'equal-payment') {
      const M = new Decimal(equalPaymentMonthly(i.principal, i.annualRatePct, i.periods));
      newSchedule = buildKeepPayment(newPrincipal.toNumber(), i.annualRatePct, M.toNumber());
    } else {
      const perPrincipal = new Decimal(i.principal).div(i.periods);
      newSchedule = buildKeepPrincipal(newPrincipal.toNumber(), i.annualRatePct, perPrincipal.toNumber());
    }
    newPeriods = newSchedule.schedule.length;
  }

  const savedInterest = originalRemainingInterest.minus(newSchedule.totalInterest);

  return {
    originalMonthly: full.monthly,
    originalFirstMonthly: full.firstMonthly,
    paidPrincipal: r2(paidPrincipal),
    paidInterest: r2(paidInterest),
    remainingBeforePrepay: r2(remainingBefore),
    newPrincipal: r2(newPrincipal),
    prepayAmount: i.prepayAmount,
    newMonthly: newSchedule.monthly,
    newFirstMonthly: newSchedule.firstMonthly,
    newPeriods,
    newTotalInterest: newSchedule.totalInterest,
    originalRemainingInterest: r2(originalRemainingInterest),
    savedInterest: r2(savedInterest),
    newTotalPayment: newSchedule.totalPayment,
  };
}
