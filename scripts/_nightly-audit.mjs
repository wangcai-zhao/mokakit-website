/**
 * 夜间自动更新 — 栏目完整性审计脚本
 * 逐栏核对：每个工具分类下的每个工具四件套（meta.ts / Tool.tsx / content.mdx / WidgetHost 接线），
 * 以及好站导航每个分组的链接数据。输出 JSON 报告供覆盖核对记录使用。
 * 运行：node scripts/_nightly-audit.mjs
 */
import { readFileSync, readdirSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOOLS_DIR = join(ROOT, 'src', 'tools');

/** 1. 解析 categories.ts */
const catSrc = readFileSync(join(ROOT, 'src', 'config', 'categories.ts'), 'utf8');
const categories = [];
{
  const re = /id:\s*'([^']+)',\s*\n\s*slug:\s*'([^']+)',\s*\n\s*name:\s*'([^']+)',\s*\n\s*desc:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(catSrc))) categories.push({ id: m[1], slug: m[2], name: m[3], desc: m[4] });
}

/** 2. 逐工具目录审计 */
const widgetSrc = readFileSync(join(ROOT, 'src', 'components', 'WidgetHost.astro'), 'utf8');
const toolDirs = readdirSync(TOOLS_DIR).filter((d) => {
  const p = join(TOOLS_DIR, d);
  return statSync(p).isDirectory() && d !== '_shared';
});

const tools = [];
const problems = [];
for (const dir of toolDirs) {
  const metaPath = join(TOOLS_DIR, dir, 'meta.ts');
  const toolPath = join(TOOLS_DIR, dir, 'Tool.tsx');
  const mdxPath = join(TOOLS_DIR, dir, 'content.mdx');
  const entry = { dir, meta: false, widget: false, content: false, wired: false };
  if (existsSync(metaPath)) {
    entry.meta = true;
    const src = readFileSync(metaPath, 'utf8');
    const id = /id:\s*'([^']+)'/.exec(src)?.[1];
    const name = /name:\s*'([^']+)'/.exec(src)?.[1];
    const cat = /category:\s*'([^']+)'/.exec(src)?.[1];
    const noindex = /noindex:\s*true/.test(src);
    entry.id = id;
    entry.name = name;
    entry.category = cat;
    entry.noindex = noindex;
    if (id !== dir) problems.push(`${dir}: meta.id(${id}) 与目录名不一致`);
    if (!categories.some((c) => c.id === cat)) problems.push(`${dir}: 未知分类 ${cat}`);
  } else {
    problems.push(`${dir}: 缺少 meta.ts`);
  }
  entry.widget = existsSync(toolPath);
  entry.content = existsSync(mdxPath);
  if (entry.id) {
    const imported = new RegExp(
      `import\\s+\\w+\\s+from\\s+'@/tools/${entry.id}/Tool\\.tsx'`,
    ).test(widgetSrc);
    const flagged = new RegExp(`tool\\.id\\s*===\\s*'${entry.id}'`).test(widgetSrc);
    const importedName = imported
      ? new RegExp(`import\\s+(\\w+)\\s+from\\s+'@/tools/${entry.id}/Tool\\.tsx'`).exec(
          widgetSrc,
        )?.[1]
      : null;
    const rendered = importedName
      ? new RegExp(`<${importedName}[\\s\\S]{0,80}client:load`).test(widgetSrc)
      : false;
    entry.wired = imported && flagged && rendered;
    if (!entry.wired) entry.wireDetail = { imported, flagged, rendered };
  }
  tools.push(entry);
}

/** 3. 好站导航 sites.ts */
const sitesSrc = readFileSync(join(ROOT, 'src', 'data', 'sites.ts'), 'utf8');
const siteGroups = [];
{
  const groupRe = /id:\s*'([^']+)',\s*\n\s*name:\s*'([^']+)',[\s\S]*?links:\s*\[([\s\S]*?)\]\s*,?\s*\n\s*\},/g;
  let m;
  while ((m = groupRe.exec(sitesSrc))) {
    const linkRe = /name:\s*'([^']+)',\s*url:\s*'([^']+)',\s*desc:\s*'([^']+)'/g;
    const links = [];
    let lm;
    while ((lm = linkRe.exec(m[3]))) links.push({ name: lm[1], url: lm[2], desc: lm[3] });
    siteGroups.push({ id: m[1], name: m[2], links });
  }
}

/** 4. 汇总：按栏目分组 */
const byCategory = categories.map((c) => {
  const catTools = tools.filter((t) => t.category === c.id);
  return {
    category: c.id,
    name: c.name,
    slug: c.slug,
    toolTotal: catTools.length,
    okTools: catTools.filter((t) => t.meta && t.widget && t.content && t.wired).length,
    tools: catTools.map((t) => t.dir),
    broken: catTools
      .filter((t) => !(t.meta && t.widget && t.content && t.wired))
      .map((t) => ({ dir: t.dir, ...t.wireDetail, meta: t.meta, widget: t.widget, content: t.content })),
  };
});

/** 未归入任何已知分类的工具 */
const orphan = tools.filter((t) => !categories.some((c) => c.id === t.category)).map((t) => t.dir);

const report = {
  generatedAt: new Date().toISOString(),
  toolDirCount: toolDirs.length,
  categories: byCategory,
  siteGroups: siteGroups.map((g) => ({ id: g.id, name: g.name, links: g.links.length })),
  siteLinkTotal: siteGroups.reduce((s, g) => s + g.links.length, 0),
  problems,
  orphan,
  sitesRaw: siteGroups,
};

writeFileSync(join(ROOT, '_nightly_audit_report.json'), JSON.stringify(report, null, 2));

/** 控制台摘要 */
console.log(`=== 栏目覆盖审计 @ ${report.generatedAt} ===`);
console.log(`工具目录总数: ${toolDirs.length}`);
for (const c of byCategory) {
  const flag = c.broken.length === 0 ? '✅' : '❌';
  console.log(`${flag} [${c.category}] ${c.name}: ${c.okTools}/${c.toolTotal} 工具完整`);
  for (const b of c.broken) console.log(`   ↳ 缺陷: ${JSON.stringify(b)}`);
}
console.log(`好站导航: ${siteGroups.length} 组 / ${report.siteLinkTotal} 条`);
for (const g of siteGroups) console.log(`   - ${g.name} (${g.id}): ${g.links.length} 条`);
if (problems.length) console.log('⚠️ 其他问题:\n' + problems.map((p) => '   - ' + p).join('\n'));
if (orphan.length) console.log('⚠️ 未归类工具: ' + orphan.join(', '));
console.log('完整报告: _nightly_audit_report.json');
