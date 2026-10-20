/**
 * 计算类工具纯函数层（cagr / rule-of-72 / depreciation / annuity）。
 * 全部纯函数、无浏览器 API，前端与未来 MCP 可共用同一份。
 */
import { type ToolResult, ok, err } from './tool-result';

export function calcCagr(start: number, end: number, years: number): ToolResult<{
  cagr: number; multiple: number;
}> {
  if (start <= 0 || end <= 0) return err('期初值与期末值必须为正数');
  if (years <= 0) return err('年数必须为正数');
  const multiple = end / start;
  const cagr = Math.pow(multiple, 1 / years) - 1;
  return ok({ cagr: +(cagr * 100).toFixed(4), multiple: +multiple.toFixed(4) });
}

export function ruleOf72(ratePct: number): ToolResult<{ approx: number; exact: number }> {
  if (ratePct <= 0) return err('年化利率必须为正数');
  const approx = 72 / ratePct;
  const exact = Math.LN2 / Math.log(1 + ratePct / 100);
  return ok({ approx: +approx.toFixed(2), exact: +exact.toFixed(2) });
}

export type DeprecMethod = 'straight' | 'sumyd' | 'declining';

export interface DeprecRow {
  year: number;
  dep: number;
  accum: number;
  book: number;
}

export function depreciation(
  cost: number,
  salvage: number,
  life: number,
  method: DeprecMethod,
): ToolResult<DeprecRow[]> {
  if (cost <= 0) return err('原值必须为正数');
  if (salvage < 0 || salvage >= cost) return err('残值须介于 0 与原值之间');
  if (!Number.isInteger(life) || life < 1) return err('使用年限须为不小于 1 的整数');

  const rows: DeprecRow[] = [];
  let accum = 0;
  let book = cost;

  if (method === 'straight') {
    const dep = (cost - salvage) / life;
    for (let i = 1; i <= life; i++) {
      accum += dep;
      book = cost - accum;
      rows.push({ year: i, dep: r2(dep), accum: r2(accum), book: r2(book) });
    }
  } else if (method === 'sumyd') {
    const sum = (life * (life + 1)) / 2;
    for (let i = 1; i <= life; i++) {
      const dep = ((cost - salvage) * (life - i + 1)) / sum;
      accum += dep;
      book = cost - accum;
      rows.push({ year: i, dep: r2(dep), accum: r2(accum), book: r2(book) });
    }
  } else {
    const rate = 2 / life;
    for (let i = 1; i <= life; i++) {
      let dep = book * rate;
      if (book - dep < salvage) dep = book - salvage; // 末年不击穿残值
      accum += dep;
      book = cost - accum;
      rows.push({ year: i, dep: r2(dep), accum: r2(accum), book: r2(book) });
    }
  }
  return ok(rows);
}

export function annuity(
  perPeriod: number,
  periods: number,
  ratePct: number,
): ToolResult<{ fv: number; pv: number; totalPrincipal: number; totalInterest: number }> {
  if (perPeriod <= 0) return err('每期金额必须为正数');
  if (!Number.isInteger(periods) || periods < 1) return err('期数须为不小于 1 的整数');
  if (ratePct < 0) return err('利率不能为负');
  const r = ratePct / 100;
  const n = periods;
  let fv: number;
  let pv: number;
  if (r === 0) {
    fv = perPeriod * n;
    pv = perPeriod * n;
  } else {
    fv = perPeriod * ((Math.pow(1 + r, n) - 1) / r);
    pv = perPeriod * ((1 - Math.pow(1 + r, -n)) / r);
  }
  const totalPrincipal = perPeriod * n;
  const totalInterest = fv - totalPrincipal;
  return ok({
    fv: r2(fv),
    pv: r2(pv),
    totalPrincipal: r2(totalPrincipal),
    totalInterest: r2(totalInterest),
  });
}

function r2(n: number): number {
  return +n.toFixed(2);
}
