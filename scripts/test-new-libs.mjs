// 计算层断言测试：社保公积金 / 房贷提前还款 / 增值税
import { calcSocialSecurity, DEFAULT_SS_RATES } from '../src/lib/china-social-security.ts';
import { calcEarlyRepayment, equalPaymentMonthly } from '../src/lib/mortgage.ts';
import { calcGeneralVat, calcSimpleVat, excludeTax } from '../src/lib/china-vat.ts';

let pass = 0;
let fail = 0;
function approx(name, got, expected, tol = 0.01) {
  if (Math.abs(got - expected) <= tol) {
    pass++;
    console.log(`  ✓ ${name} = ${got}`);
  } else {
    fail++;
    console.error(`  ✗ ${name}: got ${got}, expected ~${expected}`);
  }
}
function assert(name, cond) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name}`);
  }
}

console.log('== 社保公积金 ==');
const ss = calcSocialSecurity({ base: 10000 });
approx('养老个人', ss.items.find((x) => x.key === 'pension').personal, 800);
approx('养老单位', ss.items.find((x) => x.key === 'pension').employer, 1600);
approx('医疗个人', ss.items.find((x) => x.key === 'medical').personal, 200);
approx('医疗单位', ss.items.find((x) => x.key === 'medical').employer, 800);
approx('失业个人', ss.items.find((x) => x.key === 'unemployment').personal, 50);
approx('工伤单位', ss.items.find((x) => x.key === 'injury').employer, 40);
approx('生育单位', ss.items.find((x) => x.key === 'maternity').employer, 80);
approx('公积金个人', ss.items.find((x) => x.key === 'housingFund').personal, 1200);
approx('公积金单位', ss.items.find((x) => x.key === 'housingFund').employer, 1200);
approx('个人合计', ss.personalTotal, 2250);
approx('单位合计', ss.employerTotal, 3770);
approx('合计', ss.combined, 6020);
approx('个人费率%', ss.personalRatePct, 22.5);

// 基数上限夹取
const ssClamp = calcSocialSecurity({ base: 500000, baseCeil: 30000 });
assert('基数上限夹取生效', ssClamp.clamped === true && ssClamp.baseApplied === 30000);
approx('夹取后个人合计', ssClamp.personalTotal, 30000 * 0.225);

// 关闭公积金
const ssNoFund = calcSocialSecurity({ base: 10000, housingFundEnabled: false });
assert('公积金被排除', !ssNoFund.items.some((x) => x.key === 'housingFund'));
approx('关公积金个人合计', ssNoFund.personalTotal, 2250 - 1200);

console.log('== 房贷（等额本息月供） ==');
const M = equalPaymentMonthly(1000000, 3.85, 360);
approx('100万/3.85%/30年月供', M, 4687.57, 1);
const M0 = equalPaymentMonthly(1000000, 0, 360);
approx('零利率月供=本金/期', M0, 1000000 / 360, 0.01);

console.log('== 房贷提前还款（缩短期限） ==');
const erShorten = calcEarlyRepayment({
  principal: 1000000,
  annualRatePct: 3.85,
  periods: 360,
  method: 'equal-payment',
  paidPeriods: 0,
  prepayAmount: 200000,
  mode: 'shorten',
});
approx('新本金', erShorten.newPrincipal, 800000);
assert('缩短期限后期限变短', erShorten.newPeriods < 360);
assert('缩短期限节省利息>0', erShorten.savedInterest > 0);
console.log(`    (缩短后约 ${erShorten.newPeriods} 期，节省利息 ${erShorten.savedInterest})`);

console.log('== 房贷提前还款（减少月供） ==');
const erReduce = calcEarlyRepayment({
  principal: 1000000,
  annualRatePct: 3.85,
  periods: 360,
  method: 'equal-payment',
  paidPeriods: 0,
  prepayAmount: 200000,
  mode: 'reduce',
});
approx('减少月供期限不变', erReduce.newPeriods, 360);
assert('减少月供后新月供更低', erReduce.newMonthly < M);
assert('减少月供也省利息', erReduce.savedInterest > 0);
console.log(`    (新月供 ${erReduce.newMonthly}, 原 ${M})`);

console.log('== 提前还款（已还 60 期后） ==');
const erMid = calcEarlyRepayment({
  principal: 1000000,
  annualRatePct: 3.85,
  periods: 360,
  method: 'equal-payment',
  paidPeriods: 60,
  prepayAmount: 100000,
  mode: 'shorten',
});
assert('已还本金>0', erMid.paidPrincipal > 0);
assert('已还利息>0', erMid.paidInterest > 0);
assert('剩余本金<100万', erMid.remainingBeforePrepay < 1000000 && erMid.remainingBeforePrepay > 0);
assert('中期提前还款仍省利息', erMid.savedInterest > 0);

console.log('== 增值税（一般计税） ==');
const gv = calcGeneralVat({ salesAmount: 1000000, salesRate: 13, purchaseAmount: 600000, purchaseRate: 13 });
approx('销项税', gv.outputTax, 130000);
approx('进项税', gv.inputTax, 78000);
approx('应纳', gv.payable, 52000);
approx('净额', gv.net, 52000);
assert('无留抵', gv.carryForward === 0);

// 留抵场景
const gvCarry = calcGeneralVat({ salesAmount: 100000, salesRate: 13, purchaseAmount: 1000000, purchaseRate: 13 });
approx('留抵场景应纳=0', gvCarry.payable, 0);
approx('留抵税额', gvCarry.carryForward, 117000);

console.log('== 增值税（简易计税） ==');
const sv = calcSimpleVat({ salesAmount: 1000000, levyRate: 3 });
approx('简易3%', sv.tax, 30000);
const sv5 = calcSimpleVat({ salesAmount: 1000000, levyRate: 5 });
approx('简易5%', sv5.tax, 50000);

console.log('== 含税→不含税 ==');
approx('113含税@13%→100', excludeTax(113, 13), 100);

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
if (fail > 0) process.exit(1);
