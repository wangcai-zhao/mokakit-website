import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'slug-generator',
  name: 'URL Slug 生成器',
  tagline: '标题转 URL 友好 slug，支持中英文',
  description:
    '免费在线 URL Slug 生成器，把文章标题、产品名一键转成 URL 友好的 slug：小写、空格变连字符、去除标点。支持英文与中文（中文默认保留或转拼音可选）。适合博客、电商、文档站，全部本地计算。',
  keywords: ['slug生成', 'url slug', 'slugify', '链接友好'],
  category: 'dev',
  tags: ['URL', 'slug', '开发'],
  icon: 'link',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['url-parser', 'query-params'],
  faq: [
    {
      q: 'slug 是什么？',
      a: 'slug 是 URL 里那段可读的路径，如 /blog/how-to-learn-rust。它利于 SEO 和分享，通常由标题转小写、用连字符连接单词得到。',
    },
    {
      q: '中文标题怎么处理？',
      a: '默认保留中文字符（多数现代系统支持 UTF-8 路径），生成如 /博客/入门指南。若需纯 ASCII，可开启「中文转拼音」（依赖简单映射，多音字可能不准），或去掉中文只留英文数字。',
    },
    {
      q: '连字符重复或首尾连字符会处理吗？',
      a: '会。连续空格/标点折叠成单个连字符，并去掉首尾连字符，保证 slug 干净可用。',
    },
    {
      q: '停止词（the/a/of）要去掉吗？',
      a: '本工具默认保留，仅做字符规范化。若你有 SEO 需要去掉常见停用词，可手动编辑结果，或后续我们加开关。',
    },
  ],
});
