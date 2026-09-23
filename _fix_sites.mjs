import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync('src/data/sites.ts', 'utf8');
const lines = src.split('\n');
const trunc = [
  { name: '金鱼直播：在线观赏舒缓减压的虚拟宠物', desc: 'Goldfishies 在线观赏舒缓减压的虚拟宠物直播' },
  { name: 'Uchinoko Maker - 可爱卡通角色生成器', desc: 'Uchinoko Maker 日本开发的在线卡通角色生成器' },
  { name: '蒸汽波在线生成器 - 梦幻复古风格文字艺术工具', desc: 'Magiconch 复古蒸汽波风格文字艺术在线生成器' },
  { name: '黑客模拟器 - 在线模拟黑客编程界面', desc: 'HackerTyper 模拟电影极客编程界面的趣味工具' },
  { name: 'Fact Slides - 有趣事实分享平台', desc: 'Fact Slides 收集全球各类有趣冷知识的平台' },
  { name: 'Dialogue.moe', desc: 'Dialogue.moe 动漫台词检索与分享平台' },
  { name: '我爱工作 - 好玩的', desc: '我爱工作 用趣味方式模拟上班摸鱼的网站' },
  { name: 'FindStarlink - 实时追踪星链卫星过境时间与位置', desc: 'FindStarlink 星链卫星过境实时追踪工具' },
  { name: 'Standard Guitar', desc: 'Standard Guitar 专业吉他谱与和弦教学平台' },
  { name: 'Virtual Piano', desc: 'Virtual Piano 用键盘弹奏的在线虚拟钢琴' },
  { name: 'Altered Qualia - 创意编程与WebGL实验展示平台', desc: 'Altered Qualia 创意编程与 WebGL 实验作品集' },
  { name: 'Gallerix亚洲-世界名画在线博物馆与艺术收藏库', desc: 'Gallerix 世界名画在线浏览与艺术收藏馆' },
  { name: 'Generative.fm - 人工智能生成环境音乐平台', desc: 'Generative.fm 人工智能生成的环境背景音乐' },
  { name: 'Ice Alaska Photos', desc: 'Ice Alaska 极地冰雪与冰雕摄影图库' },
  { name: '贝塞尔曲线交互式学习与练习工具', desc: 'Bezier 贝塞尔曲线交互式学习与练习平台' },
  { name: 'RealBanknotes - 全球真实纸币收藏与交易平台', desc: 'RealBanknotes 全球纸币收藏图鉴与交易平台' },
  { name: '天空之城 - 全球航拍社区和摄影作品分享平台', desc: '天空之城 大疆旗下全球航拍社区与作品分享' },
  { name: '呼吸地球 - 全球实时人口与碳排放可视化', desc: 'Breathingearth 全球实时人口与碳排放可视化' },
  { name: 'A Soft Murmur - 环境白噪音生成器', desc: 'A Soft Murmur 可自定义环境白噪音的放松工具' },
  { name: 'FindArticles - 学术文章与期刊资源搜索引擎', desc: 'FindArticles 学术文章与期刊资源聚合搜索' },
  { name: 'Poetry Strands', desc: 'Poetry Strands 诗歌创作与文字游戏平台' },
  { name: '大型历史研究可视化', desc: 'Calculating Empires 技术权力演变历史可视化' },
];
const apply = process.argv.includes('--apply');
const changes = [];
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  let mod = false;
  for (const t of trunc) {
    if (line.includes(`name: '${t.name}'`)) {
      const m = line.match(/desc:\s*'([^']*)'/);
      if (m && m[1] !== t.desc) {
        line = line.replace(/desc:\s*'[^']*'/, `desc: '${t.desc}'`);
        changes.push({ line: i + 1, type: 'desc', old: m[1], new: t.desc });
        mod = true;
      }
      break;
    }
  }
  if (line.includes("url: 'http://")) {
    const m = line.match(/url:\s*'([^']*)'/);
    line = line.replace("url: 'http://", "url: 'https://");
    changes.push({ line: i + 1, type: 'http', old: m[1], new: line.match(/url:\s*'([^']*)'/)[1] });
    mod = true;
  }
  if (mod) lines[i] = line;
}
console.log(`将修改 ${changes.length} 处${apply ? '（已落盘）' : '（dry-run）'}：`);
for (const c of changes) console.log(`  L${c.line} [${c.type}] ${c.old}  =>  ${c.new}`);
if (apply) writeFileSync('src/data/sites.ts', lines.join('\n'));
