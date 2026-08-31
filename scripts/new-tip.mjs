#!/usr/bin/env node
/**
 * 技巧文草稿脚手架。
 *
 * 为什么需要它：content.config.ts 的 tips schema 由 zod 校验，
 * frontmatter 少一个字段或工具 id 拼错会**直接让 astro build 崩掉**。
 * 每周 2 篇的产出节奏下，手写 frontmatter 迟早出事，所以统一走脚手架。
 *
 * 用法：
 *   node scripts/new-tip.mjs "文章标题" <slug> [--tools=a,b] [--difficulty=入门] [--series=系列名]
 *
 * 例：
 *   node scripts/new-tip.mjs "mcp.json 从零配好" mcp-json-setup --tools=mcp-config-generator,json-formatter
 *
 * 说明：
 *   - slug 必须显式给（中文标题转拼音不可靠），只允许小写字母、数字、连字符
 *   - draft 默认 true，人工审核后手动改 false 才上线
 *   - order 自动取现有最大值 +1
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TIPS_DIR = path.join(ROOT, 'src', 'content', 'tips');
const TOOLS_DIR = path.join(ROOT, 'src', 'tools');

// ---------- 参数解析 ----------
const args = process.argv.slice(2);
const positional = [];
const flags = {};
for (const a of args) {
  if (a.startsWith('--')) {
    const [k, ...rest] = a.slice(2).split('=');
    flags[k] = rest.join('=') || 'true';
  } else {
    positional.push(a);
  }
}

const [title, slug] = positional;

if (!title || !slug) {
  console.error('✗ 用法：node scripts/new-tip.mjs "文章标题" <slug> [--tools=a,b] [--difficulty=入门]');
  console.error('  例：node scripts/new-tip.mjs "mcp.json 从零配好" mcp-json-setup --tools=mcp-config-generator');
  process.exit(1);
}

if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error(`✗ slug 只能用小写字母、数字和连字符，当前是：${slug}`);
  console.error('  例：mcp-json-setup / skill-md-pitfalls');
  process.exit(1);
}

// ---------- 工具 id 校验 ----------
const toolIds = new Set(
  fs
    .readdirSync(TOOLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_shared')
    .map((d) => d.name),
);

const relatedTools = (flags.tools || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const badIds = relatedTools.filter((id) => !toolIds.has(id));
if (badIds.length) {
  console.error(`✗ 以下工具 id 不存在，内链会 404：${badIds.join(', ')}`);
  console.error(`  可用 id 见 src/tools/ 下的目录名（共 ${toolIds.size} 个）`);
  process.exit(1);
}

// ---------- 计算 order ----------
let maxOrder = 0;
if (fs.existsSync(TIPS_DIR)) {
  for (const f of fs.readdirSync(TIPS_DIR)) {
    if (!f.endsWith('.md')) continue;
    const raw = fs.readFileSync(path.join(TIPS_DIR, f), 'utf8');
    const m = raw.match(/^order:\s*(\d+)\s*$/m);
    if (m) maxOrder = Math.max(maxOrder, Number(m[1]));
  }
}
const order = maxOrder + 1;

// ---------- 生成 ----------
const d = new Date();
const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const difficulty = flags.difficulty || '入门';
const series = flags.series || 'WorkBuddy 使用技巧';

/** YAML 值转义：统一用双引号包裹，内部双引号转义 */
const q = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const relatedBlock = relatedTools.length
  ? `\nrelatedTools:\n${relatedTools.map((id) => `  - ${id}`).join('\n')}`
  : '\nrelatedTools: []';

const body = `---
title: ${q(title)}
description: ${q('TODO：80-120 字，写清这篇解决什么问题、给谁看')}
publishDate: ${today}
tags: []
draft: true
series: ${q(series)}
order: ${order}
difficulty: ${difficulty}${relatedBlock}
author: 旺财先生
featured: false
showInvite: true
---

## 我遇到的具体问题

TODO：写一个具体场景，外加一次真实的失败。300 字以内，要有细节——什么文件、什么数字、卡了多久。这一段决定读者要不要往下看。

## 为什么这事值得自动化

TODO：算笔账——频率 × 单次耗时 = 每月浪费多少时间。用具体数字，不要喊口号。

## 我是怎么用 WorkBuddy 做的

TODO：贴真实操作流。对话原文、配置文件片段、关键步骤。这一步是全文重点，读者是冲这个来的。

## 中间卡在哪 & 怎么绕过去

TODO：必须有。写具体的报错信息和排查过程——这是全文最容易被搜到的部分，也是去掉 AI 味的关键。

## 顺带的几个发现

TODO：2-3 个非预期收益。在这里自然引出 MokaKit 的相关工具（正文内链埋这一段）。

## 你也可以这样用

TODO：给一个变体场景，让读者能直接照抄。

## 常见问题

TODO：3-4 个真问题，不凑数。
`;

if (!fs.existsSync(TIPS_DIR)) fs.mkdirSync(TIPS_DIR, { recursive: true });

const outFile = path.join(TIPS_DIR, `${slug}.md`);
if (fs.existsSync(outFile)) {
  console.error(`✗ 文件已存在，拒绝覆盖：src/content/tips/${slug}.md`);
  process.exit(1);
}

fs.writeFileSync(outFile, body, 'utf8');

console.log(`✓ 已生成 src/content/tips/${slug}.md`);
console.log(`  标题：${title}`);
console.log(`  序号：${order}　难度：${difficulty}　日期：${today}`);
console.log(`  关联工具：${relatedTools.length ? relatedTools.join(', ') : '（无，建议至少 2 个）'}`);
console.log('');
console.log('下一步：');
console.log('  1. 按骨架写正文（去 AI 味：第一人称、具体失败经历、禁用「码住/划重点/亲测有效」）');
console.log('  2. 补 description（≤120 字）与 tags');
console.log('  3. 正文里自然提到关联工具，不要只在 frontmatter 里列');
console.log('  4. 审核通过后把 draft 改成 false；要上首页卡位再加 featured: true');
console.log('  5. ⚠️ 正文不要写具体积分数字，统一交给 InviteCta 组件渲染');
