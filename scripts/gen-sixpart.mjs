/**
 * 六段式深度内容批量生成器。
 *
 * 策略：每个工具 meta.ts 已含高质量 name/description/keywords/faq，
 * 直接用 new Function 解析复用；再叠加 scripts/sixpart/kb-*.mjs 里
 * 按各工具真实逻辑撰写的「原理 / 怎么用 / 详解 / 实例」。
 * 产出标准六段式 content.mdx（无 frontmatter，直接 ## 起头），
 * 由 [tool]/index.astro 自动 glob 收录，无需改任何其他文件。
 *
 * 漏写 KB 的工具用 description 兜底，保证 57/57 全覆盖。
 *
 * 运行：node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs scripts/gen-sixpart.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { KB as KBCalc } from './sixpart/kb-calc.mjs';
import { KB as KBDev } from './sixpart/kb-dev.mjs';
import { KB as KBText } from './sixpart/kb-text.mjs';

const KB = { ...KBCalc, ...KBDev, ...KBText };
const TOOLS_DIR = path.resolve(fileURLToPath(import.meta.url), '../../src/tools');

/** 解析 meta.ts：剥离 import 与 defineTool 包装，用 new Function 求值对象字面量 */
function loadMeta(id) {
  const p = path.join(TOOLS_DIR, id, 'meta.ts');
  let src = readFileSync(p, 'utf8');
  src = src.replace(/^\s*import .*$/gm, ''); // 去掉 import 行（@/ 别名在 node 下不可解析）
  src = src.replace(/export default defineTool\(/, 'const _m = (');
  src = src.replace(/\);\s*$/, ');');
  src += '\nreturn _m;';
  // eslint-disable-next-line no-new-func
  return new Function(src)();
}

/** 兜底：当 new Function 因 TS 类型注解（如带 subpages 函数的 meta）失败时，
 *  用正则只抽 name/description/keywords/faq 这几个渲染所需的字段。 */
function extractMetaFallback(id) {
  const p = path.join(TOOLS_DIR, id, 'meta.ts');
  const src = readFileSync(p, 'utf8');
  const name = (src.match(/name:\s*['"]([^'"]*)['"]/) || [])[1] || id;
  const description = (src.match(/description:\s*['"]([^'"]*)['"]/) || [])[1] || '';
  const kwBlock = src.match(/keywords:\s*\[([\s\S]*?)\]/);
  const keywords = kwBlock ? [...kwBlock[1].matchAll(/['"]([^'"]*)['"]/g)].map((m) => m[1]) : [];
  const faqIdx = src.lastIndexOf('faq:');
  const faqSrc = faqIdx >= 0 ? src.slice(faqIdx) : '';
  const qs = [...faqSrc.matchAll(/q:\s*['"]([^'"]*)['"]/g)].map((m) => m[1]);
  const as = [...faqSrc.matchAll(/a:\s*['"]([^'"]*)['"]/g)].map((m) => m[1]);
  const faq = qs.map((q, i) => ({ q, a: as[i] || '' }));
  return { name, description, keywords, faq };
}

/** 先尝试严格解析，失败（含 TS 注解的函数体）再走正则兜底 */
function loadMetaSafe(id) {
  try {
    return loadMeta(id);
  } catch (e) {
    console.error(`[fallback] ${id} 用正则兜底解析: ${e.message}`);
    return extractMetaFallback(id);
  }
}

const join = (arr) => (Array.isArray(arr) ? arr.join('\n') : (arr || ''));

/** 渲染 FAQ：meta.faq 复用 + KB.extraFaq 追加 */
function renderFaq(meta, extra) {
  const items = [...(meta.faq || []), ...(extra || [])];
  if (!items.length) return '_暂无常见问题。_';
  return items.map((it) => `**Q：${it.q}**\n\nA：${it.a}`).join('\n\n');
}

function buildContent(id, meta) {
  const name = meta.name || id;
  const kb = KB[id] || {};
  const desc = meta.description || '';

  // 1. 计算公式 / 工作原理
  const principle = kb.principle
    ? join(kb.principle)
    : `## ${name}工作原理\n\n${desc}`;

  // 2. 这个工具能做什么
  const canDo = kb.canDo
    ? `## 这个工具能做什么\n\n${join(kb.canDo.map((x) => `- ${x}`))}`
    : `## 这个工具能做什么\n\n${desc}`;

  // 3. 怎么使用（输入说明）
  const howto = kb.howto
    ? `## 怎么使用（输入说明）\n\n${kb.howto.map((x, i) => `${i + 1}. ${x}`).join('\n')}`
    : `## 怎么使用（输入说明）\n\n打开本工具，按界面提示填入相应数值或文本，结果会在本地浏览器实时计算并显示，无需联网、不上传任何数据。`;

  // 4. 详解
  const detailTitle = kb.detailTitle || '补充说明';
  const detail = kb.detail
    ? `## ${detailTitle}\n\n${join(kb.detail)}`
    : `## ${detailTitle}\n\n${desc}`;

  // 5. 计算实例
  const example = kb.example
    ? `## 计算实例\n\n${join(kb.example)}`
    : `## 计算实例\n\n在工具中输入你的实际数据，即可立即看到结果；把结果与本文示例对照，能帮你快速验证输入是否正确。`;

  // 6. FAQ
  const faq = `## 常见问题 FAQ\n\n${renderFaq(meta, kb.extraFaq)}`;

  // 转义裸尖括号与花括号，避免 MDX 误解析（已有 &lt;/&gt; 实体不含字面尖括号，不受影响）
  return [principle, canDo, howto, detail, example, faq]
    .join('\n\n')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}') + '\n';
}

function main() {
  const dirs = readdirSync(TOOLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_shared')
    .map((d) => d.name);

  let made = 0;
  let skipped = 0;
  const missing = [];
  for (const id of dirs) {
    const target = path.join(TOOLS_DIR, id, 'content.mdx');
    const hasKB = !!KB[id];
    // 已有正文且无 KB 项：保留原内容（避免覆盖 37 个手工精修页）
    // 有 KB 项：强制重生成（便于修复后覆盖）
    if (existsSync(target) && !hasKB) {
      skipped++;
      continue;
    }
    let meta;
    try {
      meta = loadMetaSafe(id);
    } catch (e) {
      console.error(`[skip] ${id} meta 解析失败: ${e.message}`);
      missing.push(id);
      continue;
    }
    const content = buildContent(id, meta);
    writeFileSync(target, content, 'utf8');
    made++;
  }
  console.log(`生成完成：${made} 个新 content.mdx，跳过 ${skipped} 个已有，失败 ${missing.length} 个`);
  if (missing.length) console.log('失败列表：', missing.join(', '));
}

main();
