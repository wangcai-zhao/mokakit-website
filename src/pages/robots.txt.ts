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
    /**
     * ⚠️ 这里特意「不做 Disallow」，因为这些页面靠页面内的 noindex meta 去索引。
     *
     * 常见反模式：某页既在 robots.txt 里 Disallow、又加了 noindex meta ——
     * 爬虫被 robots 挡住进不去，就读不到 noindex，于是页面既没被抓取说明、
     * 也可能因外链存在而被索引出一个「无法显示的网址」。
     * 想让页面不进索引，正确做法是允许抓取 + 页面声明 noindex。
     */
    '# 搜索结果页 / 出站中转页：不写 Disallow，交给页面内 noindex meta 处理',
    '# 进度工作台含运营隐私，不收录也不让爬虫访问',
    'Disallow: /workbench.html',
    '# 计数接口是写操作的内部端点，不收录也不让爬虫打',
    'Disallow: /api/',
    '# MCP Server 公网 API 端点：非网页，不收录',
    'Disallow: /mcp/',
    '',
    `Sitemap: ${base}/sitemap-index.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
