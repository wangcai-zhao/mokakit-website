/**
 * 校验「每个工具都真正挂上了水合岛屿」。
 *
 * ⚠️ 这个脚本是为一次真实事故写的护栏：
 * 2026-09-23 批量新增了 11 个工具（meta.ts / Tool.tsx / content.mdx 三件套齐全、
 * 页面也构建出来了、看着"上线成功"），但唯独漏了第 4 步——在 WidgetHost.astro 里
 * 注册 import + 布尔变量 + known 表达式 + 渲染分支。结果是 11 个页面全是死壳：
 * HTML 生成了、astro-island 一个都没有，用户点下去毫无反应，而 build 不报任何错。
 *
 * 静态 import 是 Astro 的硬约束（动态 import / 变量承载组件会导致
 * "NoMatchingImport" 报错），所以注册这一步没法自动化，只能靠这张网兜住。
 *
 * 用法：npm run check:widgets
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOOLS_DIR = join(ROOT, 'src/tools');
const HOST = join(ROOT, 'src/components/WidgetHost.astro');

const hostSrc = readFileSync(HOST, 'utf8');
// 已注册的标志：形如 const isXxx = tool.id === 'tool-id';
const registeredIds = new Set(
  [...hostSrc.matchAll(/const\s+is\w+\s*=\s*tool\.id\s*===\s*'([^']+)'/g)].map((m) => m[1]),
);

const dirs = readdirSync(TOOLS_DIR).filter(
  (d) => !d.includes('.') && d !== '_shared' && d !== 'registry.ts' && d !== 'types.ts',
);

const unregistered = [];
const missingExport = [];
let total = 0;

for (const d of dirs) {
  const metaPath = join(TOOLS_DIR, d, 'meta.ts');
  const toolPath = join(TOOLS_DIR, d, 'Tool.tsx');
  if (!existsSync(metaPath)) continue;
  total++;

  const meta = readFileSync(metaPath, 'utf8');
  const idMatch = meta.match(/^\s*id:\s*'([^']+)'/m);
  const id = idMatch ? idMatch[1] : d;

  if (!registeredIds.has(id)) {
    unregistered.push({ dir: d, id });
    continue;
  }

  // 注册了还不够：组件必须默认导出，且 WidgetHost 里得有对应的 import 与渲染分支
  if (existsSync(toolPath)) {
    const tsx = readFileSync(toolPath, 'utf8');
    if (!/export\s+default\s+(function|const|class)\s+\w+/.test(tsx)) {
      missingExport.push(d);
      continue;
    }
  }
  const imported = new RegExp(`from '@/tools/${d}/Tool\\.tsx'`).test(hostSrc);
  if (!imported) unregistered.push({ dir: d, id: `${id}（缺 import）` });
}

// 反向检查：WidgetHost 里注册了、但工具目录已经不存在 —— 幽灵注册会让 build 失败，也要报出来
const ghost = [...registeredIds].filter((id) => !dirs.includes(id));

console.log(`工具总数：${total}　已注册：${total - unregistered.length}`);
console.log(`WidgetHost 已注册 id：${registeredIds.size}`);

if (ghost.length) {
  console.log(`\n✗ 幽灵注册（WidgetHost 里有、工具目录却没了）：${ghost.length}`);
  ghost.forEach((g) => console.log(`  - ${g}`));
}
if (missingExport.length) {
  console.log(`\n✗ Tool.tsx 缺少默认导出：${missingExport.length}`);
  missingExport.forEach((g) => console.log(`  - ${g}`));
}
if (unregistered.length) {
  console.log(`\n✗ 未注册水合（页面会是死壳）：${unregistered.length}`);
  unregistered.forEach((u) => console.log(`  - ${u.dir} (id: ${u.id})`));
  console.log(
    '\n修复：在 src/components/WidgetHost.astro 补四处 —— import 语句、' +
      "`const isXxx = tool.id === 'xxx';`、known 表达式、以及 load/idle/visible 三行渲染分支。",
  );
  process.exit(1);
}

if (!ghost.length && !missingExport.length) {
  console.log('\n✓ 水合注册校验通过：全部工具都已接入 WidgetHost');
}
