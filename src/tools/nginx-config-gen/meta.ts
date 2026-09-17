import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'nginx-config-gen',
  name: 'Nginx 配置生成',
  tagline: '五种场景一键出配置',
  description:
    '免费在线 Nginx 配置生成工具，覆盖静态站点、单页应用、反向代理、PHP 站点、域名跳转五种场景，填域名与路径即可生成可直接落地的 server 配置：含 HTTP 跳 HTTPS、证书路径、gzip、静态资源缓存与代理头。本地生成不上传。',
  keywords: ['Nginx 配置生成', 'nginx.conf', '反向代理配置', 'HTTPS 配置', 'nginx 静态站点'],
  category: 'dev',
  tags: ['Nginx', '运维', '配置'],
  icon: 'server',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 7,
  faq: [
    {
      q: '生成的配置怎么用？',
      a: '存成 /etc/nginx/conf.d/&lt;域名&gt;.conf，先执行 nginx -t 校验语法，通过后 systemctl reload nginx 生效。',
    },
    {
      q: '证书路径怎么填？',
      a: '用 Certbot 签发的话通常是 /etc/letsencrypt/live/&lt;域名&gt;/fullchain.pem 和 privkey.pem。私钥不要放在 web 根目录里。',
    },
    {
      q: '单页应用为什么要 try_files？',
      a: 'Vue、React 的前端路由在刷新子路径时，Nginx 会去找对应的文件，找不到就 404。用 try_files $uri $uri/ /index.html 把所有路径回退到 index.html 交给前端路由处理。',
    },
  ],
  related: ['security-headers', 'chmod-calculator'],
});
