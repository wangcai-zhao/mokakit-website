/**
 * 检索索引的构建期生成器 —— 与 src/lib/search.ts 配对使用。
 *
 * ⚠️ 本文件只在构建期运行（Astro 服务端 / MCP 打包 / 校验脚本），
 * **绝不能**被客户端组件 import —— 它会拖进 pinyin-pro（约 950KB 字典）。
 * 客户端只允许 import 类型与 search.ts 里的纯函数。
 *
 * 拼音为什么在这里算：
 *   运行期算拼音要背一整本字典，而拼音串本身只有 8KB；
 *   构建期多花 200ms，换客户端少背 300KB+，这笔账很划算。
 */
import { pinyin } from 'pinyin-pro';
import type { SearchIndexData } from './search';
import type { SubPage } from '../tools/types';

/** 构建输入：只取检索要用到的字段，避免和 ToolMeta 强耦合 */
export interface SearchSource {
  id: string;
  name: string;
  tagline: string;
  keywords: string[];
  tags: string[];
  category: string;
  priority: number;
  icon: string;
  url: string;
}

/** 能展开出长尾子页的工具（结构化形状，避免和 ToolMeta 强绑定） */
export interface SubpageOwner {
  id: string;
  name: string;
  priority: number;
  icon: string;
  subpages?: () => SubPage[];
}

/**
 * 把工具的长尾子页展开成可检索条目。
 *
 * 为什么放在这里而不是 registry 里：`scripts/test-search.mjs` 自己构造索引源，
 * 若两边各写一份展开逻辑，迟早出现「线上能搜到、测试测不到」的漂移。
 *
 * 两个刻意的取舍：
 *   1. keywords 只放母页名，不放场景词/分类词。子页 name 本身已是完整问句
 *      （「客服机器人用哪个 AI 模型」），再塞无关单字会放大单字查询噪音，
 *      也会破掉 test-search 的「单字只命中名字含该字的工具」断言。
 *   2. priority 降 2 级：同样命中时母页优先，子页是补充而非抢位。
 *
 * 只收浅层子页（slug 不含斜杠）。深路径子页（如 unit-convert 的
 * `length/cm-to-inch`）是「参数组合」而非独立意图，母页搜「单位换算」已经覆盖；
 * 全站 230 个子页里这类占 213 个，全收进来会把索引从 40KB 撑到 98KB，
 * 还会让搜「厘米」返回一串 cm-to-xxx，把真正有用的工具挤出首屏。
 */
export function subpageSources(owner: SubpageOwner, categoryName: string): SearchSource[] {
  if (!owner.subpages) return [];
  const out: SearchSource[] = [];
  for (const p of owner.subpages()) {
    if (p.noindex || p.slug.includes('/')) continue;
    out.push({
      id: `${owner.id}/${p.slug}`,
      name: p.title,
      tagline: p.description,
      keywords: [owner.name],
      tags: [],
      category: categoryName,
      priority: Math.max(1, owner.priority - 2),
      icon: owner.icon,
      url: `/tools/${owner.id}/${p.slug}/`,
    });
  }
  return out;
}

/** 名称 → 拼音全拼连写（mimachengchengqi）与首字母连写（mmccq） */
export function pinyinOf(text: string): { full: string; initial: string } {
  if (!text) return { full: '', initial: '' };
  try {
    const full = pinyin(text, { toneType: 'none', type: 'array', nonZh: 'consecutive' })
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const initial = pinyin(text, { pattern: 'first', toneType: 'none', type: 'array', nonZh: 'consecutive' })
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return { full, initial };
  } catch {
    // 拼音库异常不能阻断构建：退化为空串，检索自动跳过拼音档位
    return { full: '', initial: '' };
  }
}

/**
 * 生成列式索引。
 *
 * @param tools 已按展示顺序排好的工具（顺序即默认优先级）
 * @param cats  分类中文名列表，索引里只存下标，省掉 280 次重复字符串
 */
export function buildSearchIndexData(tools: SearchSource[], cats: string[]): SearchIndexData {
  const catIdx = new Map(cats.map((c, i) => [c, i]));
  const out: SearchIndexData = {
    v: 2,
    n: [],
    g: [],
    k: [],
    y: [],
    s: [],
    c: [],
    p: [],
    u: [],
    i: [],
    cats,
  };

  for (const t of tools) {
    const py = pinyinOf(t.name);
    out.n.push(t.name);
    out.g.push(t.tagline);
    out.k.push([...t.keywords, ...t.tags].join(' '));
    out.y.push(py.full);
    out.s.push(py.initial);
    out.c.push(catIdx.get(t.category) ?? -1);
    out.p.push(t.priority);
    out.u.push(t.url);
    out.i.push(t.icon);
  }

  return out;
}
