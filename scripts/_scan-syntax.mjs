// 一次性预检：用 @babel/parser 严格解析 src 下所有 ts/tsx，禁开 errorRecovery，
// 揪出所有会卡 astro build 的语法错误（一次扫全，避免反复构建失败）。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import parser from '@babel/parser';

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '.workbuddy' || e === 'dist') continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(e)) acc.push(p);
  }
  return acc;
}

const files = walk('src');
let bad = 0;
for (const f of files) {
  const code = readFileSync(f, 'utf8');
  const isTsx = f.endsWith('.tsx');
  try {
    parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', ...(isTsx ? ['jsx'] : [])],
    });
  } catch (err) {
    bad++;
    console.error(`[语法错误] ${f}:${err.loc?.line}:${err.loc?.column} ${err.message}`);
  }
}
console.error(bad === 0 ? '✅ 全部文件语法 OK' : `❌ 共 ${bad} 个文件有语法错误`);
process.exit(bad === 0 ? 0 : 1);
