/** 临时核对：主导航是否单行（看链接数量与宽占用）、页面各入口是否可达 */
import fs from 'node:fs';

const html = fs.readFileSync('dist/index.html', 'utf8');
const grab = (re, label) => {
  const m = html.match(re);
  if (!m) {
    console.log(`❌ 未找到 ${label}`);
    return '';
  }
  console.log(`✅ ${label}`);
  return m[0];
};

// 1) 主导航
const nav = grab(/<nav[^>]*aria-label="主导航"[\s\S]*?<\/nav>/, '桌面主导航');
const links = [...nav.matchAll(/href="([^"]+)"[^>]*>([^<>]{0,10})/g)].map((m) => m[1]);
const labels = [...nav.matchAll(/>([一-龥A-Za-z ]+)</g)].map((m) => m[1].trim()).filter(Boolean);
console.log('   链接:', links.join(' | '));
console.log('   文案:', labels.join(' / '));

// 2) 更多下拉
const more = grab(/<details id="more-menu"[\s\S]*?<\/details>/, '「更多」下拉');
console.log('   含入口:', [...more.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).join(' | '));

// 3) 移动端菜单
const mob = grab(/<nav[^>]*id="mobile-menu"[\s\S]*?<\/nav>/, '移动端菜单');
console.log(
  '   不含跳转的核心链接数:',
  [...mob.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]).length
);
console.log('   含 social:', /github\.com/.test(mob) && /mailto:/.test(mob));

// 4) 页脚
const foot = grab(/<footer[\s\S]*?<\/footer>/, '页脚');
console.log('   版权:', (html.match(/©[^<]*/) || [''])[0].trim(), (html.match(/v\d+\.\d+\.\d+/) || [''])[0]);
console.log(
  '   底部链接:',
  [...foot.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).slice(-12).join(' | ')
);

// 5) 全站抽样：每个页面的 footer 都有 GitHub + mailto + v0.9.11
for (const p of ['index.html', 'tools/index.html', 'blog/index.html', 'changelog/index.html']) {
  const f = `dist/${p}`;
  if (!fs.existsSync(f)) {
    console.log(`❌ 缺页 ${p}`);
    continue;
  }
  const s = fs.readFileSync(f, 'utf8');
  const ok =
    /github\.com\/wangcai-zhao\/mokakit-website/.test(s) &&
    /mailto:bo\.zhao2026/.test(s) &&
    /v0\.9\.11/.test(s);
  console.log(`${ok ? '✅' : '❌'} ${p} — 图标链接 + 版本号`);
}
