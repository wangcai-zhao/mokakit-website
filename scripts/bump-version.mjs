/**
 * 版本号升级工具
 * ----------------------------------------------------------------------------
 * 用法：
 *   node scripts/bump-version.mjs --patch        # 0.10.0 → 0.10.1
 *   node scripts/bump-version.mjs --minor        # 0.10.0 → 0.11.0
 *   node scripts/bump-version.mjs --major        # 0.10.0 → 1.0.0
 *   node scripts/bump-version.mjs --set 1.2.3    # 指定版本
 *   node scripts/bump-version.mjs --minor --dry-run
 *
 * 规则见 docs/VERSIONING.md。要点：
 *   - package.json 的 version 是唯一真源，页脚/工作台都从它派生；
 *   - 本脚本只改版本号，不 commit、不 build —— 按项目习惯由人决定何时提交；
 *   - 改完请同步 src/data/changelog.ts 顶部批次的 pkgVersion，check:version 会校验。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PKG = join(ROOT, 'package.json');

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const setIdx = argv.indexOf('--set');
const explicit = setIdx >= 0 ? argv[setIdx + 1] : null;

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?$/;

const pkgRaw = readFileSync(PKG, 'utf8');
const pkg = JSON.parse(pkgRaw);
const current = pkg.version;

const m = current.match(SEMVER);
if (!m) {
  console.error(`✗ 当前版本号不是合法 semver：${current}`);
  process.exit(1);
}

let next;
if (explicit) {
  if (!SEMVER.test(explicit)) {
    console.error(`✗ --set 的值不是合法 semver：${explicit}`);
    process.exit(1);
  }
  next = explicit;
} else if (argv.includes('--major')) {
  next = `${Number(m[1]) + 1}.0.0`;
} else if (argv.includes('--minor')) {
  next = `${m[1]}.${Number(m[2]) + 1}.0`;
} else if (argv.includes('--patch')) {
  next = `${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
} else {
  console.error('用法：node scripts/bump-version.mjs --patch|--minor|--major|--set x.y.z [--dry-run]');
  process.exit(1);
}

// 只在源码范围内检查干净度：记忆目录（.workbuddy/）常驻未提交内容，不应阻断发版
let dirty = '';
try {
  dirty = execSync('git status --porcelain -- src package.json', { cwd: ROOT, encoding: 'utf8' }).trim();
} catch {
  /* 不在 git 仓库里也不阻断 */
}
if (dirty && !dryRun) {
  console.log('⚠ src/ 或 package.json 有未提交改动：');
  console.log(dirty.split('\n').map((l) => `    ${l}`).join('\n'));
  console.log('  版本号仍会改动，但请确认这些改动属于本次发布。');
}

console.log(`版本：${current} → ${next}${dryRun ? '（dry-run，不写盘）' : ''}`);

if (!dryRun) {
  // 保留原文件的缩进与其余字段：只替换 version 那一行
  const updated = pkgRaw.replace(/("version"\s*:\s*")[^"]*(")/, `$1${next}$2`);
  writeFileSync(PKG, updated, 'utf8');
  console.log('✓ package.json 已更新（页脚 SITE.version 会自动派生为 v' + next + '）');
  console.log('\n下一步：');
  console.log('  1) 在 src/data/changelog.ts 顶部批次的 pkgVersion 填 ' + next);
  console.log('  2) npm run check:all   （含 check:version / check:campaigns / check:ads）');
  console.log('  3) npm run build && bash deploy/deploy.sh <target>');
}
