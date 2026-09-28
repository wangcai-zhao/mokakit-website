/**
 * 契税算法回归测试。
 *
 * 为什么需要它：契税的面积分界线与税率曾在「算法库」和「页面组件」里各写一份，
 * MCP 用库、前端用组件，改一处漏另一处 —— 2026-09-23 就因此长期按已废止的 90㎡
 * 口径计税（120㎡ 二套房 200 万，按 2% 算出 4 万，正确应为 1% 即 2 万）。
 * 现在前端已改为直接复用 calcDeedTax，全站只剩一个数字；
 * 这个测试守住它：一旦有人改了税率或分界线，算例会立刻报警。
 *
 * 用法：node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs scripts/test-deed-tax.mjs
 */
import { calcDeedTax, DEED_TAX_SMALL_AREA } from '../src/lib/china-calc-extra.ts';

let failures = 0;

function check(name, got, want, eps = 0.01) {
  const ok = Math.abs(got - want) <= eps;
  if (!ok) {
    failures++;
    console.log(`  ✗ ${name}：得到 ${got}，应为 ${want}`);
  } else {
    console.log(`  ✓ ${name}：${got}`);
  }
}

console.log('契税面积分界线：', DEED_TAX_SMALL_AREA, '㎡（2024-12-01 起，非老口径 90㎡）');
if (DEED_TAX_SMALL_AREA !== 140) {
  failures++;
  console.log('  ✗ 分界线不是 140㎡，请确认是否误改回老口径');
}

const tax = (priceWan, area, tier, vatInclusive = false) =>
  calcDeedTax({ priceWan, area, tier, vatInclusive });

console.log('\n税率分档：');
check('首套 89㎡', tax(300, 89, 'first').rate * 100, 1);
check('首套 140㎡（边界）', tax(300, 140, 'first').rate * 100, 1);
check('首套 140.01㎡', tax(300, 140.01, 'first').rate * 100, 1.5);
check('首套 150㎡', tax(300, 150, 'first').rate * 100, 1.5);
check('二套 120㎡（事故算例）', tax(200, 120, 'second').rate * 100, 1);
check('二套 150㎡', tax(400, 150, 'second').rate * 100, 2);
check('三套 100㎡', tax(500, 100, 'third').rate * 100, 3);

console.log('\n应纳税额：');
check('首套 89㎡ / 300万', tax(300, 89, 'first').tax, 30000);
check('二套 120㎡ / 400万', tax(400, 120, 'second').tax, 40000);
check('二套 120㎡ / 200万（曾算错为 40000）', tax(200, 120, 'second').tax, 20000);
check('三套 100㎡ / 500万', tax(500, 100, 'third').tax, 150000);
// 含增值税：计税依据 = 总价 / 1.05
check('首套 89㎡ / 300万 含税', tax(300, 89, 'first', true).tax, 28571.43);

console.log('\n输入校验：');
for (const [name, params] of [
  ['价格为 0', { priceWan: 0, area: 90, tier: 'first' }],
  ['价格为负', { priceWan: -5, area: 90, tier: 'first' }],
  ['面积为 0', { priceWan: 300, area: 0, tier: 'first' }],
]) {
  const r = calcDeedTax(params);
  if ('error' in r) console.log(`  ✓ ${name} → ${r.error}`);
  else {
    failures++;
    console.log(`  ✗ ${name} 未被拦截`);
  }
}

console.log(failures === 0 ? '\n✅ 契税算法全部通过' : `\n❌ ${failures} 项失败`);
process.exit(failures ? 1 : 0);
