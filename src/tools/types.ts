import type { CategoryId } from '@/config/categories';

/**
 * 长尾子页定义。
 *
 * 这是整个站 SEO 的命脉：单个工具页很难排上去，但
 * "厘米换算英寸""美元兑人民币"这类具体长尾词竞争极低。
 * 一个工具配 30-80 个子页，6 个工具就能铺出 300+ 个可索引页面。
 *
 * 注意：只生成真实有人搜的常用组合，不要做 N×N 全排列，
 * 上千个雷同页面会被判定为 thin content（低质内容）反而掉权重。
 */
export interface SubPage {
  /** URL 片段，可含斜杠，如 'length/cm-to-inch' → /tools/unit-convert/length/cm-to-inch/ */
  slug: string;
  /** 页面 h1 与 title */
  title: string;
  /** meta description，80-120 汉字 */
  description: string;
  /** 传给渲染组件的任意数据 */
  data?: Record<string, unknown>;
  /** 该子页独有的 FAQ，会并入 FAQPage 结构化数据 */
  faq?: FaqItem[];
}

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * 工具元数据。每个工具目录下的 meta.ts 默认导出这个对象。
 *
 * 填好它，以下东西全部自动生成，无需改动任何其他文件：
 * 路由 / 首页与列表页卡片 / 分类归入 / 站内搜索索引 /
 * sitemap 条目与 lastmod / 面包屑 / JSON-LD / 相关工具推荐
 */
export interface ToolMeta {
  /** 唯一标识，同时是 URL：/tools/<id>/
   *  ⚠️ 优先用高搜索量的英文词（password-generator 而不是 pwd-gen），
   *  一旦上线被收录就不要再改，改了等于删页面重建。 */
  id: string;

  /** 工具名称，用于 h1、卡片标题、面包屑 */
  name: string;

  /** 卡片副标题，≤20 字，说清"这玩意儿干嘛的" */
  tagline: string;

  /** meta description，80-120 汉字，要含核心关键词并有行动号召 */
  description: string;

  /** SEO 关键词 3-5 个。Google 早已忽略，但百度仍略作参考 */
  keywords: string[];

  /** 所属分类 */
  category: CategoryId;

  /** 标签，用于站内搜索与"相关工具"自动推荐 */
  tags: string[];

  /** Lucide 图标名，如 'key'、'ruler' */
  icon: string;

  /** stable 正常展示；beta 会打上标记 */
  status: 'stable' | 'beta';

  /**
   * 岛屿水合策略：
   * - load    立即水合，用于首屏就要交互的工具
   * - idle    浏览器空闲时水合，默认推荐
   * - visible 滚动到可视区才水合，用于首屏下方或体积大的工具
   */
  hydrate: 'load' | 'idle' | 'visible';

  /** 创建日期 YYYY-MM-DD */
  createdAt: string;

  /** 最后更新日期 YYYY-MM-DD，会写进 sitemap 的 lastmod */
  updatedAt: string;

  /** 0-10，用于排序与 sitemap priority，数值大的排前面 */
  priority: number;

  /** 常见问题，会生成 FAQPage 结构化数据（Google 富摘要的主要来源） */
  faq?: FaqItem[];

  /** 手动指定相关工具 id；留空则按 tags 重合度自动计算 */
  related?: string[];

  /** 长尾子页生成器。返回的每一项都会生成一个独立静态页面 */
  subpages?: () => SubPage[] | Promise<SubPage[]>;

  /** 设为 true 则不进 sitemap 且加 noindex（如测试结果页） */
  noindex?: boolean;
}

/** 定义工具元数据。仅做类型约束，运行时零开销 */
export function defineTool(meta: ToolMeta): ToolMeta {
  return meta;
}
