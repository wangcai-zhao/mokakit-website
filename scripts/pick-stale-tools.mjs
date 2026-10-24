#!/usr/bin/env node
/**
 * MokaKit 每日工具升级 · 久未升级工具筛选器（早任务配套脚本）
 *
 * 扫描 src/tools 下各工具的 meta.ts，按 updatedAt 升序挑出「最久未升级」的工具，
 * 支持分类轮转避让（读 history.json 的 lastCategories/prevCategories）。
 *
 * 用法：
 *   node scripts/pick-stale-tools.mjs [--count 3] [--stale-days 14]
 *     [--history .workbuddy/upgrade-daily/history.json] [--today 2026-10-23]
 *
 * 输出：JSON 数组（选中工具，含 id/name/category/updatedAt/daysStale/文件路径）。
 * 本脚本只读，不写任何状态；history.json 的更新由调用方（早任务）负责。
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOOLS_DIR = join(ROOT, 'src', 'tools');
const DEFAULT_HISTORY = join(ROOT, '.workbuddy', 'upgrade-daily', 'history.json');

function parseArgs(argv) {
  const args = { count: 3, staleDays: 14, history: DEFAULT_HISTORY, today: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--count') args.count = Math.max(1, parseInt(argv[++i], 10) || 3);
    else if (a === '--stale-days') args.staleDays = parseInt(argv[++i], 10) || 14;
    else if (a === '--history') args.history = argv[++i];
    else if (a === '--today') args.today = argv[++i];
  }
  return args;
}

function pick(txt, key) {
  const m = txt.match(new RegExp(key + ":\\s*['\"]([^'\"]+)['\"]"));
  return m ? m[1] : null;
}

function daysBetween(dateStr, today) {
  const then = new Date(dateStr + 'T00:00:00+08:00');
  const now = today ? new Date(today + 'T00:00:00+08:00') : new Date();
  return Math.floor((now - then) / 86400000);
}

function loadAvoidCategories(historyPath) {
  if (!existsSync(historyPath)) return [];
  try {
    const h = JSON.parse(readFileSync(historyPath, 'utf-8'));
    return [...(h.lastCategories || []), ...(h.prevCategories || [])];
  } catch {
    return [];
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const today = args.today || new Date().toISOString().slice(0, 10);
  const avoid = new Set(loadAvoidCategories(args.history));

  const candidates = [];
  for (const d of readdirSync(TOOLS_DIR)) {
    const metaPath = join(TOOLS_DIR, d, 'meta.ts');
    if (!existsSync(metaPath)) continue;
    let txt;
    try { txt = readFileSync(metaPath, 'utf-8'); } catch { continue; }
    if (/noindex:\s*true/.test(txt)) continue;
    const status = pick(txt, 'status') || 'unknown';
    if (status !== 'stable') continue;
    const id = pick(txt, 'id');
    if (!id) continue;
    const updatedAt = pick(txt, 'updatedAt') || pick(txt, 'createdAt') || '1970-01-01';
    const days = daysBetween(updatedAt, today);
    if (days <= args.staleDays) continue; // 最近升级过，跳过
    candidates.push({
      id,
      name: pick(txt, 'name') || id,
      category: pick(txt, 'category') || 'unknown',
      updatedAt,
      daysStale: days,
      rotated: avoid.has(pick(txt, 'category')),
      paths: {
        meta: metaPath,
        content: join(TOOLS_DIR, d, 'content.mdx'),
        tool: join(TOOLS_DIR, d, 'Tool.tsx'),
      },
    });
  }

  // 排序：非避让分类优先 → updatedAt 越早越优先 → id 兜底确定性
  candidates.sort((a, b) =>
    (a.rotated - b.rotated) ||
    a.updatedAt.localeCompare(b.updatedAt) ||
    a.id.localeCompare(b.id)
  );

  const selected = candidates.slice(0, args.count);
  console.log(JSON.stringify({
    date: today,
    avoidCategories: [...avoid],
    candidatePool: candidates.length,
    selected,
  }, null, 2));
}

main();
