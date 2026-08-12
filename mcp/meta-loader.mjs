/**
 * meta-loader.mjs —— 扫描全站工具元数据（与前端 registry 同源）
 *
 * 战略原则 #1（同源发现）与 #3（描述从 meta 生成）的落地：
 * MCP Server 复用前端同一套 meta.ts，绝不手写第二份工具清单/描述。
 *
 * 解析策略（复用 gen-sixpart 已验证的手法）：
 *   1. 优先 new Function 直接求值 meta 对象；
 *   2. 若含 TS 类型注解（如 `: ToolMeta`、`as X`）导致求值失败，
 *      退化为正则抽取关键字段（name/description/keywords/tags/...）。
 *
 * 本模块是纯 JS，不依赖 TS 运行时；MCP server 启动时被 import。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'tools');

/** 用 new Function 直接求值 meta 对象字面量 */
function evalMeta(src) {
  const stripped = src
    .replace(/^\s*import\s.*$/gm, '') // 去掉 import 行
    .replace(/export\s+default\s+defineTool\s*\(/, 'const __m = (') // 去导出壳
    .replace(/\);\s*$/, ');'); // 收尾（基本 identity）
  // eslint-disable-next-line no-new-func
  const fn = new Function(stripped + '\nreturn __m;');
  return fn();
}

/** 兜底：从源码抽取单引号字符串字段 */
function extractString(src, key) {
  const m = src.match(new RegExp(`\\b${key}\\s*:\\s*'([^']*)'`, 's'));
  return m ? m[1] : undefined;
}

/** 兜底：抽取数组字段里的所有引号字符串 */
function extractArray(src, key) {
  const m = src.match(new RegExp(`\\b${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`, 's'));
  if (!m) return [];
  const items = m[1].match(/'([^']*)'|"([^"]*)"/g) || [];
  return items.map((x) => x.replace(/^['"]|['"]$/g, ''));
}

/**
 * 加载全部工具 meta。
 * @returns {{ tools: Array, errors: Array }}
 */
export function loadAllMeta() {
  const dirs = readdirSync(TOOLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_shared')
    .map((d) => d.name);

  const tools = [];
  const errors = [];

  for (const id of dirs) {
    const file = join(TOOLS_DIR, id, 'meta.ts');
    let raw;
    try {
      raw = readFileSync(file, 'utf8');
    } catch (e) {
      errors.push({ id, error: `read failed: ${String(e)}` });
      continue;
    }

    let meta;
    try {
      meta = evalMeta(raw);
    } catch {
      // TS 注解导致求值失败 → 正则兜底
      meta = {
        id,
        name: extractString(raw, 'name'),
        description: extractString(raw, 'description'),
        keywords: extractArray(raw, 'keywords'),
        tags: extractArray(raw, 'tags'),
        category: extractString(raw, 'category'),
        icon: extractString(raw, 'icon'),
        tagline: extractString(raw, 'tagline'),
      };
    }

    meta = meta || {};
    tools.push({
      id,
      name: meta.name || id,
      description: meta.description || '',
      keywords: meta.keywords || [],
      tags: meta.tags || [],
      category: meta.category || '',
      icon: meta.icon || '',
      tagline: meta.tagline || '',
      url: `/tools/${id}/`,
    });
  }

  return { tools, errors };
}
