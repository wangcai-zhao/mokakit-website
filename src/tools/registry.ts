import type { ToolMeta } from './types';
import { CATEGORIES, CATEGORY_MAP, type Category } from '@/config/categories';
import type { SearchIndexData } from '@/lib/search';
import { buildSearchIndexData, type SearchSource } from '@/lib/search-build';

/**
 * ★ 自动注册表 ★
 *
 * 这是"新增工具 = 新建一个目录"的关键。
 * Vite 在构建时静态分析 import.meta.glob，把匹配到的所有 meta.ts 打包进来，
 * 所以新加一个 src/tools/<id>/meta.ts 会被自动发现，不需要在任何地方登记。
 */
const modules = import.meta.glob<{ default: ToolMeta }>('./*/meta.ts', {
  eager: true,
});

/** 全部工具，按 priority 降序，同级按更新时间新的在前 */
export const TOOLS: ToolMeta[] = Object.values(modules)
  .map((m) => m.default)
  .filter(Boolean)
  .sort((a, b) => b.priority - a.priority || b.updatedAt.localeCompare(a.updatedAt));

/** id → meta 的快速查表 */
export const TOOL_MAP = new Map<string, ToolMeta>(TOOLS.map((t) => [t.id, t]));

/** 会被搜索引擎收录的工具（排除 noindex） */
export const INDEXABLE_TOOLS = TOOLS.filter((t) => !t.noindex);

export function getTool(id: string): ToolMeta {
  const t = TOOL_MAP.get(id);
  if (!t) throw new Error(`找不到工具：${id}`);
  return t;
}

/** 按分类分组，只返回有工具的分类，顺序按 categories.ts 里的 order */
export function getToolsByCategory(): { category: Category; tools: ToolMeta[] }[] {
  return CATEGORIES.map((category) => ({
    category: category as Category,
    tools: TOOLS.filter((t) => t.category === category.id),
  })).filter((g) => g.tools.length > 0);
}

export function getToolsOf(categoryId: string): ToolMeta[] {
  return TOOLS.filter((t) => t.category === categoryId);
}

/**
 * 相关工具推荐。
 * 手动指定了 related 就用手动的；否则按"标签重合度 + 同分类加权"自动算。
 * 内链对 SEO 很重要，让爬虫能从任一页面爬遍全站。
 */
export function getRelatedTools(tool: ToolMeta, limit = 4): ToolMeta[] {
  if (tool.related?.length) {
    const picked = tool.related
      .map((id) => TOOL_MAP.get(id))
      .filter((t): t is ToolMeta => Boolean(t) && t!.id !== tool.id);
    if (picked.length >= limit) return picked.slice(0, limit);
    // 手动指定的不够数，用自动推荐补齐
    const rest = autoRelated(tool, limit * 2).filter(
      (t) => !picked.some((p) => p.id === t.id),
    );
    return [...picked, ...rest].slice(0, limit);
  }
  return autoRelated(tool, limit);
}

function autoRelated(tool: ToolMeta, limit: number): ToolMeta[] {
  const tagSet = new Set(tool.tags);
  return TOOLS.filter((t) => t.id !== tool.id && !t.noindex)
    .map((t) => {
      const overlap = t.tags.filter((tag) => tagSet.has(tag)).length;
      const sameCat = t.category === tool.category ? 1.5 : 0;
      return { tool: t, score: overlap * 2 + sameCat + t.priority / 100 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.tool);
}

/** 站内搜索索引（扁平版，保留给外部调用方与旧测试用） */
export interface SearchEntry {
  id: string;
  name: string;
  tagline: string;
  keywords: string;
  category: string;
  url: string;
  icon: string;
}

/**
 * 站内搜索索引 —— 列式 + 构建期拼音，供 src/lib/search.ts 消费。
 *
 * 与旧版 buildSearchIndex() 的区别：
 *   1. 列式（单字母 key）省掉 280 条重复字段名，约省 11KB；
 *   2. 带拼音全拼 / 首字母，解决「打不出汉字就只能放弃」的问题；
 *   3. 带 priority，让排序有据可依（旧版是 filter 后原序，等于没排序）。
 *
 * ⚠️ 本函数依赖 pinyin-pro，只能在构建期调用。客户端组件请只 import 类型。
 */
export function buildSearchData(): SearchIndexData {
  const sources: SearchSource[] = INDEXABLE_TOOLS.map((t) => ({
    id: t.id,
    name: t.name,
    tagline: t.tagline,
    keywords: t.keywords,
    tags: t.tags,
    category: CATEGORY_MAP.get(t.category)?.name ?? t.category,
    priority: t.priority,
    icon: t.icon,
    url: `/tools/${t.id}/`,
  }));
  return buildSearchIndexData(
    sources,
    CATEGORIES.map((c) => c.name),
  );
}

/** 扁平版索引（兼容层，内部复用 buildSearchData，保证两版永不漂移） */
export function buildSearchIndex(): SearchEntry[] {
  const data = buildSearchData();
  return data.n.map((name, k) => ({
    id: data.u[k].replace(/^\/tools\//, '').replace(/\/$/, ''),
    name,
    tagline: data.g[k],
    keywords: data.k[k],
    category: data.cats[data.c[k]] ?? '',
    url: data.u[k],
    icon: data.i[k],
  }));
}
