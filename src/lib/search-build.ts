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
