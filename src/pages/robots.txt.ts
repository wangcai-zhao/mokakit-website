import type { APIRoute } from 'astro';
import { SITE } from '@/config/site';

/**
 * robots.txt 用动态端点生成，而不是放静态文件——
 * 这样换域名时只改 site.ts 一处，sitemap 地址不会写错。
 */
export const GET: APIRoute = () => {
  const base = SITE.url.replace(/\/$/, '');

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    '# 搜索结果页无收录价值，避免浪费抓取配额',
    'Disallow: /search/',
    '# 出站中转页：功能页，已 noindex，禁止抓取',
    'Disallow: /go/',
    '# 进度工作台含运营隐私，不收录',
    'Disallow: /workbench.html',
    '# 计数接口是写操作的内部端点，不收录也不让爬虫打',
    'Disallow: /api/',
    '',
    `Sitemap: ${base}/sitemap-index.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
