import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'security-headers',
  name: '安全响应头生成',
  tagline: 'HSTS 与 CSP 一键配置',
  description:
    '免费在线 HTTP 安全响应头生成工具，按站点情况生成 HSTS、CSP、X-Frame-Options、Referrer-Policy 等八条响应头，可切换 Nginx、Apache、Express、Vercel、Netlify、HTML meta 六种输出格式。本地生成不上传。',
  keywords: ['安全响应头', 'CSP 生成', 'HSTS 配置', 'X-Frame-Options', 'Web 安全'],
  category: 'dev',
  tags: ['安全', 'HTTP', '运维'],
  icon: 'shield-check',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 7,
  faq: [
    {
      q: '加了 CSP 会不会把站点搞挂？',
      a: '很有可能。CSP 会拦掉所有不在白名单里的脚本、样式和接口，第三方统计、广告、内联脚本都会被挡。建议先用 Content-Security-Policy-Report-Only 观察一周，再切正式。',
    },
    {
      q: 'HSTS 的 max-age 填多少合适？',
      a: '先用短一点的值（比如 300 秒）确认站点在 HTTPS 下一切正常，再逐步加长到一年（31536000）。一旦加上 preload，短期内是撤不回来的。',
    },
    {
      q: 'X-Frame-Options 和 CSP 的 frame-ancestors 冲突吗？',
      a: '不冲突，但现代浏览器优先听 CSP 的 frame-ancestors。两者都配上是为了兼容老浏览器。',
    },
  ],
  related: ['nginx-config-gen', 'chmod-calculator'],
});
