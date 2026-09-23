import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const tools = readdirSync('src/tools', { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== '_shared')
  .map((d) => d.name);

const wh = readFileSync('src/components/WidgetHost.astro', 'utf8');
const unreg = tools.filter((t) => !wh.includes(`'${t}'`) && !wh.includes(`"${t}"`));

console.log('工具总数:', tools.length);
console.log('WidgetHost 未注册:', unreg.length, unreg.slice(0, 20).join(', '));

// dist 新鲜度
const distIdx = 'dist/index.html';
if (existsSync(distIdx)) {
  const d = statSync(distIdx).mtime;
  let newest = 0,
    newestFile = '';
  const walk = (p) => {
    for (const e of readdirSync(p, { withFileTypes: true })) {
      const f = join(p, e.name);
      if (e.isDirectory()) walk(f);
      else {
        const m = statSync(f).mtimeMs;
        if (m > newest) {
          newest = m;
          newestFile = f;
        }
      }
    }
  };
  walk('src');
  console.log('dist/index.html mtime:', d.toISOString().slice(0, 16));
  console.log('src 最新文件:', newestFile, new Date(newest).toISOString().slice(0, 16));
  console.log('dist 是否落后于 src:', d.getTime() < newest ? '⚠️ 是，需重新 build' : '否');
}

// 分类工具数
const cats = readFileSync('src/config/categories.ts', 'utf8');
const catIds = [...cats.matchAll(/id:\s*'([a-z0-9-]+)'/g)].map((m) => m[1]);
console.log('分类:', catIds.length, catIds.join(', '));

const metas = tools.map((t) => {
  try {
    return readFileSync(`src/tools/${t}/meta.ts`, 'utf8');
  } catch {
    return '';
  }
});
const catCount = {};
for (const m of metas) {
  const c = m.match(/category:\s*'([a-z0-9-]+)'/);
  if (c) catCount[c[1]] = (catCount[c[1]] || 0) + 1;
}
console.log('各分类工具数:', JSON.stringify(catCount));
const unused = catIds.filter((c) => !catCount[c]);
console.log('空分类:', unused.length ? unused.join(', ') : '无');
