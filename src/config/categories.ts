/**
 * 工具分类定义。
 * 新增分类只需在这里加一项，分类页 / 首页分组 / 导航会自动出现。
 * slug 会进 URL（/tools/c/<slug>/），定下后不要随便改，改了等于换 URL 会丢收录。
 */

export interface Category {
  id: string;
  /** URL 片段，小写英文 + 连字符 */
  slug: string;
  /** 显示名称 */
  name: string;
  /** 分类页副标题 */
  desc: string;
  /** 分类页 SEO 标题，留空则用 `${name}工具` */
  seoTitle?: string;
  /** Lucide 图标名，构建时内联 SVG */
  icon: string;
  /** 排序，小的在前 */
  order: number;
}

export const CATEGORIES = [
  {
    id: 'convert',
    slug: 'convert',
    name: '换算转换',
    desc: '单位、货币、进制、时间等各类换算工具',
    seoTitle: '在线换算工具',
    icon: 'repeat',
    order: 1,
  },
  {
    id: 'text',
    slug: 'text',
    name: '文本处理',
    desc: '简繁转换、大小写、去重、字数统计等文本工具',
    seoTitle: '在线文本处理工具',
    icon: 'type',
    order: 2,
  },
  {
    id: 'security',
    slug: 'security',
    name: '安全加密',
    desc: '密码生成、哈希计算、编码解码，全部本地运算',
    seoTitle: '在线密码与加密工具',
    icon: 'shield',
    order: 3,
  },
  {
    id: 'calc',
    slug: 'calc',
    name: '计算工具',
    desc: '日期计算、贷款利率、BMI 等实用计算器',
    seoTitle: '在线计算器工具',
    icon: 'calculator',
    order: 4,
  },
  {
    id: 'dev',
    slug: 'dev',
    name: '开发辅助',
    desc: 'JSON 格式化、正则测试、时间戳等开发者常用工具',
    seoTitle: '在线开发者工具',
    icon: 'code',
    order: 5,
  },
  {
    id: 'barcode',
    slug: 'barcode',
    name: '条码与标识',
    desc: 'UDI 医疗器械唯一标识、二维码、条形码等编码与解码工具',
    seoTitle: '在线条码与标识工具',
    icon: 'barcode',
    order: 6,
  },
  {
    id: 'ai',
    slug: 'ai',
    name: 'AI 与智能体',
    desc: 'WorkBuddy 技能生成、MCP 配置、提示词等 AI 提效工具',
    seoTitle: '在线 AI 与智能体工具',
    icon: 'bot',
    order: 7,
  },
  {
    id: 'life',
    slug: 'life',
    name: '生活实用',
    desc: '日常生活中用得上的各类小工具',
    seoTitle: '在线生活实用工具',
    icon: 'house',
    order: 8,
  },
  {
    id: 'fun',
    slug: 'fun',
    name: '趣味娱乐',
    desc: '轻松有趣的娱乐小工具，仅供消遣',
    seoTitle: '趣味在线小工具',
    icon: 'sparkles',
    order: 9,
  },
] as const satisfies readonly Category[];

export type CategoryId = (typeof CATEGORIES)[number]['id'];

export const CATEGORY_MAP = new Map<string, Category>(
  CATEGORIES.map((c) => [c.id, c]),
);

export function getCategory(id: string): Category {
  const c = CATEGORY_MAP.get(id);
  if (!c) throw new Error(`未知分类：${id}，请先在 src/config/categories.ts 中定义`);
  return c;
}
