import type { ToolMeta, FaqItem } from '@/tools/types';
import { absUrl, SITE } from '@/config/site';

/**
 * 结构化数据生成器。
 *
 * 说明：百度基本不解析 schema.org，这部分主要是吃 Google 的富摘要红利
 * （FAQ 折叠面板、面包屑路径展示等），能显著提升搜索结果点击率。
 */

export interface Crumb {
  name: string;
  url: string;
}

export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absUrl(c.url),
    })),
  };
}

export function faqLd(faq: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/**
 * 工具页主体结构化数据。
 * 注意用 WebApplication 而不是 Product/Offer —— 免费工具标 Offer 价格
 * 容易被判定为虚假结构化数据。
 */
export function toolLd(tool: ToolMeta, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    url: absUrl(url),
    description: tool.description,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any',
    browserRequirements: '需要支持 JavaScript 的现代浏览器',
    inLanguage: 'zh-CN',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: absUrl('/'),
    },
    datePublished: tool.createdAt,
    dateModified: tool.updatedAt,
  };
}

/** 列表页（首页、分类页）的 ItemList，帮助爬虫理解页面是工具集合 */
export function itemListLd(
  items: { name: string; url: string; description?: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: absUrl(it.url),
      ...(it.description ? { description: it.description } : {}),
    })),
  };
}
