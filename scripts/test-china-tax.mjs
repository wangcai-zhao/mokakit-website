import {
  calcIncomeTaxAnnual,
  calcBonusTaxSeparate,
  compareBonus,
  progressiveTax,
  ANNUAL_BRACKETS,
  MONTHLY_BONUS_BRACKETS,
} from '../src/lib/china-tax.ts';

let failures = 0;
function approx(name, got, want, eps = 0.01) {
  const ok = Math.abs(got - want) <= eps;
  if (!ok) {
    failures++;
    console.error(`❌ ${name}: got ${got}, want ${want}`);
  } else {
    console.log(`✅ ${name}: ${got}`);
  }
}
function assert(name, cond) {
  if (!cond) {
    failures++;
    console.error(`❌ ${name}`);
  } else {
    console.log(`✅ ${name}`);
  }
}

// 1) 个税：月薪2万×12 / 三险一金3千×12 / 专项附加2.4万
const inc = calcIncomeTaxAnnual({
  annualGross: 240000,
  annualSocialInsurance: 36000,
  annualSpecialAddition: 24000,
  annualOtherDeduction: 0,
});
approx('个税 应纳税所得额=120000', inc.taxableIncome, 120000);
approx('个税 全年税额=9480', inc.tax, 9480);
approx('个税 税后年=194520', inc.afterTaxAnnual, 194520);
approx('个税 月均税后=16210', inc.afterTaxMonthly, 16210);
approx('个税 税率=0.10', inc.rate, 0.1);

// 2) 年终奖 36000（精确临界，单独计税）
const b36 = calcBonusTaxSeparate(36000);
approx('年终奖36000 税额=1080', b36.tax, 1080);
approx('年终奖36000 到手=34920', b36.net, 34920);
assert('年终奖36000 非盲区', b36.blindSpot === false);

// 3) 年终奖 36001（盲区：多发1元到手反而更少）
const b3601 = calcBonusTaxSeparate(36001);
approx('年终奖36001 税额=3390.1', b3601.tax, 3390.1);
approx('年终奖36001 到手=32610.9', b3601.net, 32610.9);
assert('年终奖36001 命中盲区', b3601.blindSpot === true);
assert('盲区到手确实更少', b3601.net < b36.net);

// 4) 年终奖 50000（常规）
const b50 = calcBonusTaxSeparate(50000);
// 50000/12=4166.67 → 档2(12000>): 0.10, qd210 → 50000*0.1-210=4790
approx('年终奖50000 税额=4790', b50.tax, 4790);
approx('年终奖50000 到手=45210', b50.net, 45210);

// 5) 税率表边界
const t0 = progressiveTax(0, ANNUAL_BRACKETS);
assert('应纳税所得额0 税额0', t0.tax === 0);
const t144k = progressiveTax(144000, ANNUAL_BRACKETS);
approx('144000 税率0.10', t144k.rate, 0.1);
approx('144000 税额11880', t144k.tax, 11880);
const t144k1 = progressiveTax(144001, ANNUAL_BRACKETS);
approx('144001 税率0.20', t144k1.rate, 0.2);
approx('144001 税额11880.2', t144k1.tax, 11880.2);

// 6) 并入对比：综合所得应税 100000，年终奖 50000
const cmp = compareBonus(50000, 100000);
// 单独: 4790; 并入后应税 150000 跨入 20% 档: tax(150000)=150000*0.2-16920=13080;
// base tax(100000)=100000*0.1-2520=7480; 增量=5600
approx('并入增量税额=5600', cmp.mergedIncrementalTax, 5600);
assert('单独(4790)更省', cmp.better === 'separate');
approx('差额=810', cmp.diff, 810);

console.log(failures === 0 ? '\n🎉 全部通过' : `\n💥 ${failures} 个失败`);
process.exit(failures === 0 ? 0 : 1);
