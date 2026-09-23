/**
 * 图标引用校验。
 *
 * 为什么要这个脚本：曾经有 46 个工具的 meta.ts 引用了 icons.ts 里并不存在的图标名，
 * Icon 组件静默兜底成 grid —— 构建不报错、构建产物正常，但线上几十个页面的图标
 * 全都变成同一个九宫格方块。这类「不影响构建、只影响观感」的问题只能靠校验脚本拦。
 *
 * 校验三项：
 *   1. 每个工具 meta.ts 的 icon 能否解析（先查 ICONS，再查 ICON_ALIASES）
 *   2. 分类 categories.ts 的 icon 是否存在
 *   3. 别名表自身是否健康（目标图标必须真实存在、不允许自映射）
 *
 * 用法：npm run check:icons
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdirSync, readFileSync, existsSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function pathToUrl(p) {
  return new URL('file:///' + p.replace(/\\/g, '/')).href;
}

const iconsMod = await import(pathToUrl(join(root, 'src', 'components', 'icons.ts')));
const catsMod = await import(pathToUrl(join(root, 'src', 'config', 'categories.ts')));

const { ICONS, ICON_ALIASES = {}, resolveIcon } = iconsMod;
const { CATEGORIES } = catsMod;

let err = 0;
const fail = (s) => {
  console.log('  x ' + s);
  err++;
};

console.log(`图标字典：${Object.keys(ICONS).length} 个真实图标，${Object.keys(ICON_ALIASES).length} 个别名`);

// ── 1. 别名表自身健康度 ──
const selfAlias = Object.entries(ICON_ALIASES).filter(([k, v]) => k === v);
if (selfAlias.length) fail(`别名表存在自映射（应删除）：${selfAlias.map(([k]) => k).join(', ')}`);
for (const [k, v] of Object.entries(ICON_ALIASES)) {
  if (!(v in ICONS)) fail(`别名 ${k} 指向不存在的图标 ${v}`);
}

// ── 2. 分类图标 ──
const catMissing = CATEGORIES.filter((c) => !(c.icon in ICONS));
if (catMissing.length) fail(`分类图标缺失：${catMissing.map((c) => `${c.id}→${c.icon}`).join(', ')}`);

// ── 3. 工具图标（读源文本，避免解析 @/ 别名产生循环依赖）──
const toolsDir = join(root, 'src', 'tools');
const dirs = readdirSync(toolsDir).filter(
  (d) => d !== '_shared' && !d.includes('.') && existsSync(join(toolsDir, d, 'meta.ts')),
);

const missing = [];
const aliased = [];
for (const d of dirs) {
  const src = readFileSync(join(toolsDir, d, 'meta.ts'), 'utf8');
  const m = src.match(/icon:\s*'([^']+)'/);
  if (!m) {
    fail(`工具 ${d} 的 meta.ts 缺少 icon 字段`);
    continue;
  }
  const name = m[1];
  if (!(name in ICONS)) {
    if (resolveIcon(name) === 'grid') missing.push(`${d}→${name}`);
    else aliased.push(`${d}→${name}⇒${resolveIcon(name)}`);
  }
}

if (missing.length) {
  fail(`${missing.length} 个工具引用了无法解析的图标：\n      ${missing.join('\n      ')}`);
}
if (aliased.length) {
  console.log(`  ! ${aliased.length} 个工具经别名解析（建议后续补真实图标）：${aliased.slice(0, 8).join(', ')}${aliased.length > 8 ? ' …' : ''}`);
}

if (err === 0) {
  console.log(`✓ 图标校验通过：${dirs.length} 个工具 / ${CATEGORIES.length} 个分类的图标全部可解析`);
} else {
  console.log(`\n共 ${err} 类问题，请修复后重试`);
  process.exit(1);
}
