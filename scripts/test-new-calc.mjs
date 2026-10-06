/**
 * test-new-calc.mjs —— 2026-10-07 新增 5 个纯函数的回归验证
 * ----------------------------------------------------------------------------
 * 为什么单独一个脚本：这 5 个函数中有 3 个涉及政策口径（车辆购置税减免窗口、
 * 二手房增值税新政、劳务报酬预扣率），算错会直接误导用户的钱袋子。
 * 改算法后必跑，数值与 scripts/ 下其它 test-*.mjs 同等对待。
 *
 * 跑法：
 *   node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs scripts/test-new-calc.mjs
 */

import { calcVehiclePurchaseTax } from '../src/lib/china-calc-extra.ts';
import { calcSecondHandHouseTax } from '../src/lib/china-calc-extra.ts';
import { calcLaborIncomeTax } from '../src/lib/china-tax.ts';
import { calcShippingFee, calcTransferTime, formatDuration } from '../src/lib/misc-calc.ts';

let pass = 0;
let fail = 0;

/** 近似相等（分位） */
function near(actual, expected, label) {
  const ok = Math.abs(actual - expected) < 0.02;
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? '✅' : '❌'} ${label}: 期望 ${expected}，实际 ${actual}`);
}

/** 严格相等（字符串 / 枚举） */
function eq(actual, expected, label) {
  const ok = actual === expected;
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? '✅' : '❌'} ${label}: 期望 ${expected}，实际 ${actual}`);
}

console.log('\n── 1. 车辆购置税 ─────────────────────────────');
{
  const r = calcVehiclePurchaseTax({ invoiceTotal: 226000 });
  near(r.taxablePrice, 200000, '22.6万燃油车 计税价格');
  near(r.fullTax, 20000, '22.6万燃油车 减按前应纳税额');
  near(r.payable, 20000, '22.6万燃油车 实缴');
  eq(r.reliefMode, 'none', '燃油车 减免方式');
}
{
  const r = calcVehiclePurchaseTax({
    taxExclusivePrice: 400000,
    powerType: 'nev',
    purchaseDate: '2026-05-01',
  });
  near(r.fullTax, 40000, '2026 新能源 40万 应缴');
  near(r.relief, 15000, '2026 新能源 减免（减半但受 1.5 万上限）');
  near(r.payable, 25000, '2026 新能源 实缴');
  eq(r.reliefMode, 'half', '2026 新能源 减免方式');
}
{
  const r = calcVehiclePurchaseTax({
    taxExclusivePrice: 300000,
    powerType: 'nev',
    purchaseDate: '2025-06-01',
  });
  near(r.relief, 30000, '2025 新能源 免征（3 万上限内）');
  near(r.payable, 0, '2025 新能源 实缴');
  eq(r.reliefMode, 'full', '2025 新能源 减免方式');
}
{
  const r = calcVehiclePurchaseTax({ taxExclusivePrice: 150000, powerType: 'nev' });
  near(r.relief, 7500, '不填日期 按现行窗口减半');
  near(r.payable, 7500, '不填日期 实缴');
}
{
  const r = calcVehiclePurchaseTax({ taxExclusivePrice: 200000, powerType: 'nev', purchaseDate: '2028-03-01' });
  eq(r.reliefMode, 'unknown', '2028 年 政策未覆盖');
  near(r.payable, 20000, '2028 年 按全额估算');
}
console.log('  边界：', JSON.stringify(calcVehiclePurchaseTax({})));
console.log('  边界：', JSON.stringify(calcVehiclePurchaseTax({ invoiceTotal: 0 })));
console.log('  边界：', JSON.stringify(calcVehiclePurchaseTax({ invoiceTotal: -1 })));

console.log('\n── 2. 二手房卖方税费 ─────────────────────────');
{
  const r = calcSecondHandHouseTax({ salePriceInclusive: 3000000 });
  near(r.vat, 87378.64, '300万未满两年 增值税（3%）');
  near(r.surcharge, 5242.72, '300万未满两年 附加税费（6%）');
  near(r.personalTax, 29126.21, '300万未满两年 个税（核定 1%）');
  near(r.totalTax, 121747.57, '300万未满两年 税费合计');
}
{
  const r = calcSecondHandHouseTax({ salePriceInclusive: 3000000, heldOver2Years: true });
  eq(r.vat, 0, '满两年 增值税');
  eq(r.surcharge, 0, '满两年 附加税费');
  near(r.personalTax, 30000, '满两年非唯一 个税（核定 1%）');
}
{
  const r = calcSecondHandHouseTax({
    salePriceInclusive: 3000000,
    heldOver2Years: true,
    onlyHomeOver5Years: true,
  });
  eq(r.totalTax, 0, '满两年满五唯一 税费合计');
  near(r.netProceeds, 3000000, '满两年满五唯一 税后到手');
}
{
  const r = calcSecondHandHouseTax({
    salePriceInclusive: 3000000,
    heldOver2Years: true,
    hasOriginalProof: true,
    originalPrice: 2000000,
    reasonableCosts: 100000,
  });
  near(r.personalTax, 180000, '满两年有原值 个税（差额 20%）');
}
console.log('  边界：', JSON.stringify(calcSecondHandHouseTax({ salePriceInclusive: 0 })));
console.log('  边界：', JSON.stringify(calcSecondHandHouseTax({ salePriceInclusive: 3000000, originalPrice: -1 })));

console.log('\n── 3. 劳务报酬 / 稿酬个税 ────────────────────');
{
  const r = calcLaborIncomeTax({ income: 10000 });
  near(r.expense, 2000, '1万劳务 减除费用');
  near(r.taxable, 8000, '1万劳务 应纳税所得额');
  near(r.tax, 1600, '1万劳务 预扣税额');
  near(r.net, 8400, '1万劳务 到手');
}
{
  const r = calcLaborIncomeTax({ income: 3000 });
  near(r.expense, 800, '3千劳务 定额减除 800');
  near(r.tax, 440, '3千劳务 预扣税额');
}
{
  const r = calcLaborIncomeTax({ income: 5000, kind: 'royalty' });
  near(r.incomeAmount, 2800, '5千稿酬 收入额（70%）');
  near(r.tax, 560, '5千稿酬 预扣税额');
  near(r.net, 4440, '5千稿酬 到手');
}
{
  const r = calcLaborIncomeTax({ income: 60000 });
  near(r.taxable, 48000, '6万劳务 应纳税所得额');
  near(r.tax, 12400, '6万劳务 预扣税额（30% 速算 2000）');
  eq(r.rate, 0.3, '6万劳务 预扣率');
}
{
  const r = calcLaborIncomeTax({ income: 100 });
  eq(r.tax, 0, '100 元 减除 800 后税额为 0');
  near(r.net, 100, '100 元 到手');
}
console.log('  边界：', JSON.stringify(calcLaborIncomeTax({ income: 0 })));
console.log('  边界：', JSON.stringify(calcLaborIncomeTax({ income: Number.NaN })));

console.log('\n── 4. 快递运费 ───────────────────────────────');
{
  const r = calcShippingFee({ weightKg: 2.3, firstPrice: 12, additionalPricePerKg: 5 });
  near(r.billableWeightKg, 2.5, '2.3kg 按 0.5 进位');
  near(r.extraWeightKg, 1.5, '2.3kg 续重重量');
  near(r.total, 19.5, '2.3kg 运费合计');
}
{
  const r = calcShippingFee({ weightKg: 0.8, firstPrice: 10, insuredValue: 1000, insuredRatePct: 0.5 });
  near(r.billableWeightKg, 1, '0.8kg 进位到 1kg');
  near(r.insuranceFee, 5, '保价费（1000 × 0.5%）');
  near(r.total, 15, '含保价运费合计');
}
{
  const r = calcShippingFee({ weightKg: 5.2, firstPrice: 12, additionalPricePerKg: 5, rounding: 'up-1' });
  near(r.billableWeightKg, 6, '5.2kg 按 1kg 进位');
  near(r.total, 37, '5.2kg 运费合计');
}
{
  const r = calcShippingFee({ weightKg: 1, firstPrice: 10, discount: 999 });
  eq(r.total, 0, '优惠大于合计 夹取为 0');
}
console.log('  边界：', JSON.stringify(calcShippingFee({ weightKg: 0 })));
console.log('  边界：', JSON.stringify(calcShippingFee({ weightKg: 1, firstPrice: -1 })));

console.log('\n── 5. 传输时间 ───────────────────────────────');
{
  const r = calcTransferTime({ size: 100, unit: 'MB', bandwidthMbps: 100 });
  near(r.seconds, 8, '100MB / 100Mbps 耗时');
  near(r.megabytesPerSecond, 12.5, '100Mbps 平均速度 MB/s');
  console.log('  可读耗时：', r.human);
}
{
  const r = calcTransferTime({
    size: 50,
    unit: 'GB',
    bandwidthMbps: 500,
    overheadPct: 8,
    utilizationPct: 60,
  });
  near(r.effectiveMbps, 276, '有效带宽');
  console.log('  50GB / 500Mbps（8% 开销 / 60% 利用率）耗时：', r.human, `(${r.seconds.toFixed(2)} 秒)`);
}
{
  const r = calcTransferTime({ size: 500, unit: 'MiB', bandwidthMbps: 50, overheadPct: 8, utilizationPct: 60 });
  console.log('  500MiB / 50Mbps（Wi-Fi 档）耗时：', r.human);
}
console.log('  formatDuration 边界：', formatDuration(0), '|', formatDuration(0.42), '|', formatDuration(-1));
console.log('  边界：', JSON.stringify(calcTransferTime({ size: 0, bandwidthMbps: 100 })));
console.log('  边界：', JSON.stringify(calcTransferTime({ size: 1, bandwidthMbps: 100, overheadPct: 100 })));

console.log(`\n── 汇总：通过 ${pass}，失败 ${fail} ──────────────`);
process.exit(fail > 0 ? 1 : 0);
