/**
 * 版本一致性校验（闸门）
 * ----------------------------------------------------------------------------
 * 项目里有两套版本坐标，本脚本负责把它们对齐：
 *   ① package.json.version  —— 语义化工程版本（唯一真源，页脚从它派生）
 *   ② changelog 批次的 version（日期式，如 2026.11.03）+ pkgVersion（对应工程版本）
 *
 * 校验项：
 *   - package.json.version 是否合法 semver；
 *   - 最新批次若填了 pkgVersion，是否等于 package.json.version（不一致 → fail）；
 *   - 最新批次没填 pkgVersion → 警告（新批次必须填，见 docs/VERSIONING.md）。
 *
 * 用法：node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs scripts/check-version.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RELEASES } from '../src/data/changelog.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const version = pkg.version;

const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const errors = [];
const warnings = [];

if (!SEMVER.test(version)) {
  errors.push(`package.json version 不是合法 semver：${version}`);
}

const latest = RELEASES[0];
if (!latest) {
  errors.push('changelog.ts 里没有任何 Release 记录');
} else {
  console.log(`工程版本（package.json）：v${version}`);
  console.log(`最新批次：${latest.version}（${latest.date}）pkgVersion=${latest.pkgVersion ?? '(未填)'}`);
  console.log(`已登记批次：${RELEASES.length} 条`);

  if (latest.pkgVersion && latest.pkgVersion !== version) {
    errors.push(
      `版本不一致：最新批次 ${latest.version} 的 pkgVersion=${latest.pkgVersion}，` +
        `而 package.json=${version}。二选一：改 changelog，或用 bump-version 重新对版本。`,
    );
  }
  if (!latest.pkgVersion) {
    warnings.push(`最新批次 ${latest.version} 未填 pkgVersion，无法追溯它属于哪个工程版本。`);
  }
}

// 历史批次若填了 pkgVersion，不允许出现"比当前版本还新"的倒挂
const ahead = RELEASES.filter((r) => r.pkgVersion && compare(r.pkgVersion, version) > 0);
if (ahead.length) {
  warnings.push(`有 ${ahead.length} 个历史批次的 pkgVersion 高于当前版本：${ahead.map((r) => r.pkgVersion).join(', ')}`);
}

/** 简易 semver 比较（忽略 prerelease，够用） */
function compare(a, b) {
  const pa = a.split('-')[0].split('.').map(Number);
  const pb = b.split('-')[0].split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

if (warnings.length) {
  console.log(`\n⚠ 提醒（${warnings.length}）：`);
  warnings.forEach((w) => console.log(`  - ${w}`));
}

if (errors.length) {
  console.log(`\n✗ 版本校验失败（${errors.length}）：`);
  errors.forEach((e) => console.log(`  - ${e}`));
  process.exit(1);
}

console.log('\n✓ 版本校验通过');
