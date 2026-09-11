/**
 * 夜间更新修正脚本：补齐 sites.ts 中因编辑竞争丢失的网址推荐条目。
 * 顺序执行、单次写盘，并自带完整校验。运行：node scripts/_nightly-sites-fix.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'src', 'data', 'sites.ts');

/** 每组：锚点行（含该 url 的行）后追加的条目 */
const INSERTIONS = [
  {
    anchor: 'musa.ai',
    entries: [
      { name: 'Bing 图像创作', url: 'https://www.bing.com/images/create', desc: '微软 AI 绘画' },
      { name: 'Krea 实时画布', url: 'https://www.krea.ai/', desc: '实时 AI 出图' },
    ],
  },
  { anchor: 'scite.ai', entries: [{ name: 'Lepton Search', url: 'https://lepton.search/', desc: '开源 AI 搜索' }] },
  {
    anchor: 'https://mistral.ai/',
    entries: [{ name: 'Fal.ai', url: 'https://fal.ai/', desc: '推理与微调平台' }],
  },
  {
    anchor: 'eslint.org',
    entries: [
      { name: 'Bundlephobia', url: 'https://bundlephobia.com/', desc: 'npm 包体积查询' },
      { name: 'Learn Git Branching', url: 'https://learngitbranching.js.org/', desc: '可视化学 Git' },
      { name: 'HTTPie', url: 'https://httpie.io/', desc: '现代化 API 调试' },
    ],
  },
  {
    anchor: 'awwwards.com',
    entries: [
      { name: 'Photopea', url: 'https://www.photopea.com/', desc: '浏览器里的 PS' },
      { name: '中国色', url: 'https://zhongguose.com/', desc: '中国传统色卡' },
      { name: 'Ezgif', url: 'https://ezgif.com/', desc: '在线 GIF 编辑' },
    ],
  },
  {
    anchor: 'canva.com/',
    entries: [
      { name: 'uTools', url: 'https://u.tools/', desc: '桌面效率工具箱' },
      { name: 'TinyWow', url: 'https://tinywow.com/', desc: '免费文档小工具' },
      { name: 'PDF24 Tools', url: 'https://tools.pdf24.org/', desc: 'PDF 全家桶' },
      { name: 'Docsmall', url: 'https://docsmall.com/', desc: '图片 PDF 压缩' },
    ],
  },
  {
    anchor: 'khanacademy.org',
    entries: [
      { name: 'Hello 算法', url: 'https://www.hello-algo.com/', desc: '动画图解数据结构' },
      { name: '慕课网', url: 'https://www.imooc.com/', desc: '编程实战视频' },
    ],
  },
  {
    anchor: 'tower.im',
    entries: [
      { name: '幕布', url: 'https://mubu.com/', desc: '大纲笔记' },
      { name: '滴答清单', url: 'https://dida365.com/', desc: '待办与习惯' },
    ],
  },
  {
    anchor: 'acfun.cn',
    entries: [
      { name: '西瓜视频', url: 'https://www.ixigua.com/', desc: '中长视频平台' },
      { name: '虎牙直播', url: 'https://www.huya.com/', desc: '游戏直播' },
      { name: '斗鱼直播', url: 'https://www.douyu.com/', desc: '游戏直播' },
    ],
  },
  {
    anchor: 'futunn.com',
    entries: [
      { name: '理杏仁', url: 'https://www.lixinger.com/', desc: '股票估值数据' },
      { name: '且慢', url: 'https://qieman.com/', desc: '基金投顾' },
      { name: '有知有行', url: 'https://youzhiyouxing.cn/', desc: '投资第一课' },
      { name: '中证指数', url: 'https://www.csindex.com.cn/', desc: '指数官网' },
    ],
  },
  { anchor: 'you.163.com', entries: [{ name: '得物', url: 'https://www.dewu.com/', desc: '潮流正品交易' }] },
  { anchor: 'tripadvisor.cn', entries: [{ name: '航旅纵横', url: 'https://www.umetrip.com/', desc: '航班动态查询' }] },
  { anchor: 'alihealth.cn', entries: [{ name: '春雨医生', url: 'https://www.chunyuyisheng.com/', desc: '在线问诊' }] },
  {
    anchor: 'beian.miit.gov.cn',
    entries: [
      { name: '中国政府网', url: 'https://www.gov.cn/', desc: '国务院门户' },
      { name: '国家医保局', url: 'https://www.nhsa.gov.cn/', desc: '医保政策查询' },
    ],
  },
  { anchor: 'chinazikao.com', entries: [{ name: '扇贝单词', url: 'https://www.shanbay.com/', desc: '英语背单词' }] },
  { anchor: 'passportindex.org', entries: [{ name: 'Neal.fun', url: 'https://neal.fun/', desc: '趣味互动小实验' }] },
  {
    anchor: 'tr.heheda.top',
    entries: [
      { name: '2048', url: 'https://play2048.co/', desc: '经典数字合并游戏' },
      { name: 'TETR.IO', url: 'https://tetr.io/', desc: '多人在线俄罗斯方块' },
    ],
  },
  {
    anchor: 'timelineofearth.com',
    entries: [
      { name: 'Flightradar24', url: 'https://www.flightradar24.com/', desc: '实时航班追踪' },
      { name: 'Zoom Earth', url: 'https://zoom.earth/', desc: '实时卫星云图' },
    ],
  },
];

/** 单独替换：Grok 开源版（重复）→ Open WebUI */
const REPLACE = [
  {
    find: /name: 'Grok 开源版', url: 'https:\/\/grok\.com\/', desc: 'xAI 免费对话'/,
    replace: "name: 'Open WebUI', url: 'https://openwebui.com/', desc: '本地模型界面'",
  },
];

let src = readFileSync(FILE, 'utf8');

// 1) 逐条插入（顺序处理，避免竞争）
let inserted = 0;
for (const ins of INSERTIONS) {
  const lines = src.split('\n');
  const idx = lines.findIndex((l) => l.includes('url:') && l.includes(ins.anchor));
  if (idx === -1) {
    console.error(`✗ 找不到锚点: ${ins.anchor}`);
    process.exit(1);
  }
  if (lines[idx].includes(`url: '${ins.anchor}'`) && !lines[idx].trimEnd().endsWith(',')) {
    lines[idx] = lines[idx].replace(/\}\s*$/, '},');
  }
  const newLines = ins.entries.map(
    (e) => `      { name: '${e.name}', url: '${e.url}', desc: '${e.desc}' },`,
  );
  lines.splice(idx + 1, 0, ...newLines);
  src = lines.join('\n');
  inserted += ins.entries.length;
}
console.log(`✓ 已插入 ${inserted} 条`);

// 2) 替换重复条目
for (const rep of REPLACE) {
  if (!rep.find.test(src)) {
    console.error(`✗ 找不到待替换行: ${rep.find}`);
    process.exit(1);
  }
  src = src.replace(rep.find, rep.replace);
  console.log('✓ Grok 开源版(重复) → Open WebUI');
}

// 3) 校验：全部目标条目存在 + 无重复 URL
const EXPECTED = [
  'Qwen Chat', 'Open WebUI', 'Bing 图像创作', 'Krea 实时画布', '网易天音', 'Trae', 'JetBrains AI',
  'Lepton Search', 'Fal.ai', 'Bundlephobia', 'Learn Git Branching', 'HTTPie', 'Photopea', '中国色',
  'Ezgif', 'uTools', 'TinyWow', 'PDF24 Tools', 'Docsmall', 'Hello 算法', '慕课网', '幕布', '滴答清单',
  'Zeabur', 'Deno Deploy', 'Ecosia', '西瓜视频', '虎牙直播', '斗鱼直播', '理杏仁', '且慢', '有知有行',
  '中证指数', '腾讯哈勃', '微步云沙箱', 'LINUX DO', 'NodeSeek', '得物', '航旅纵横', '春雨医生',
  '中国政府网', '国家医保局', '天地图', '扇贝单词', 'Neal.fun', '2048', 'TETR.IO', 'Flightradar24',
  'Zoom Earth', '全历史', '书格',
];
const missing = EXPECTED.filter((n) => !src.includes(`name: '${n}'`));
if (missing.length) {
  console.error('✗ 仍缺失: ' + missing.join(', '));
  process.exit(1);
}
const urlRe = /url: '([^']+)'/g;
const seen = new Map();
const dups = [];
let m;
while ((m = urlRe.exec(src))) {
  const key = m[1].replace(/\/$/, '').toLowerCase();
  if (seen.has(key)) dups.push(`${key} ×2`);
  else seen.set(key, true);
}
if (dups.length) {
  console.error('✗ 重复 URL: ' + dups.join(', '));
  process.exit(1);
}

writeFileSync(FILE, src);
console.log(`✓ 校验通过：${EXPECTED.length} 个新条目全部就位，无重复 URL，总条目 ${seen.size}`);
