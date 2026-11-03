/**
 * 广告位校验（闸门）
 * ----------------------------------------------------------------------------
 * 校验三件事：
 *   1. 页面/布局里用到的 <AdSlot slot="..."> 必须在 SITE.ads.slots 登记过
 *      （未登记 = 不投放，等于白写，容易误以为"已经上了广告"）；
 *   2. 单个文件内的 AdSlot 实例数不得超过 SITE.ads.maxPerPage（防密度失控）；
 *   3. slot 名必须是 kebab-case。
 *
 * 为什么需要：广告位是"加了就生效、没生效也不报错"的典型场景。
 * 之前踩过的坑是 data-ad-client/data-ad-slot 漏写在 <ins> 上，广告位全空但构建全绿；
 * 本脚本从"配置侧"补一道网。
 *
 * 用法：node scripts/check-ads.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_TS = join(ROOT, 'src/config/site.ts');

const siteSrc = readFileSync(SITE_TS, 'utf8');

// 从 site.ts 的 slots 表里抠出已登记的版位 key
const registered = new Set(
  [...siteSrc.matchAll(/'([a-z0-9-]+)'\s*:\s*\{\s*enabled:/g)].map((m) => m[1]),
);
const maxMatch = siteSrc.match(/maxPerPage:\s*(\d+)/);
const maxPerPage = maxMatch ? Number(maxMatch[1]) : 2;

/** 递归收集 .astro 文件 */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.astro')) out.push(p);
  }
  return out;
}

const targets = [
  ...walk(join(ROOT, 'src/layouts')),
  ...walk(join(ROOT, 'src/pages')),
  join(ROOT, 'src/components/AdSlot.astro'),
].filter(existsSync);

const errors = [];
const usages = [];

for (const file of targets) {
  // AdSlot 自身是定义处，不算使用点
  if (file.endsWith('AdSlot.astro')) continue;
  const src = readFileSync(file, 'utf8');
  const instances = [...src.matchAll(/<AdSlot\b[^>]*>/g)].map((m) => m[0]);
  if (!instances.length) continue;

  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const slots = [];
  for (const tag of instances) {
    const m = tag.match(/slot="([^"]+)"/);
    if (!m) {
      errors.push(`${rel}：<AdSlot> 缺少 slot 属性`);
      continue;
    }
    const slot = m[1];
    slots.push(slot);
    if (!/^[a-z0-9-]+$/.test(slot)) errors.push(`${rel}：slot 命名不是 kebab-case → ${slot}`);
    if (!registered.has(slot)) {
      errors.push(`${rel}：slot "${slot}" 未在 SITE.ads.slots 登记 → 不会投放（等于白写）`);
    }
  }
  if (instances.length > maxPerPage) {
    errors.push(`${rel}：广告位 ${instances.length} 个，超过 maxPerPage=${maxPerPage}`);
  }
  usages.push({ rel, count: instances.length, slots });
}

console.log(`已登记版位：${[...registered].join(', ') || '(无)'}`);
console.log(`密度上限：${maxPerPage} 个/文件`);
console.log(`使用点：${usages.length} 个文件`);
for (const u of usages) {
  console.log(`  ${u.rel}  ×${u.count}  ${[...new Set(u.slots)].join(', ')}`);
}

if (errors.length) {
  console.log(`\n✗ 广告位配置问题（${errors.length}）：`);
  errors.forEach((e) => console.log(`  - ${e}`));
  process.exit(1);
}

console.log('\n✓ 广告位校验通过：版位均已登记、密度未超限');
