import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'public-apis',
  name: '免费 API 大全',
  tagline: '按分类检索可用的免费开放接口',
  description:
    '免费在线免费 API 导航，精选 30+ 个无需付费或免费额度友好的开放接口，覆盖开发测试、数据知识、AI 趣味、金融加密、天气地理、影视图像、太空科学、开放政府等方向。每个接口附带简介与外链，支持关键词搜索与分类筛选，帮你快速给项目接上真实数据。',
  keywords: ['免费API', '开放接口', 'API导航', '开源API', '公开数据接口'],
  category: 'dev',
  tags: ['api', '开发', '数据', '导航', '开源'],
  icon: 'database',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 8,
  faq: [
    {
      q: '这些 API 都完全免费吗？',
      a: '列表里大部分是免费或提供可用免费额度的接口，但「免费」通常有限制：速率上限、需要注册拿 key、或仅限非商用。具体限制以各官网文档为准，商用前请务必核对许可与配额。',
    },
    {
      q: '接口失效或需要 key 怎么办？',
      a: '开放接口偶尔会调整或下线，需要 key 的（如 NASA、TMDB、Unsplash）要自己去官网申请。本页只做导航与简介，不代理任何接口的请求，调用时请遵守对方的使用条款。',
    },
    {
      q: '前端能直接调这些 API 吗？',
      a: '多数支持 CORS 的接口可以直接在前端调用；部分需要在后端转发或配置域名白名单。涉及密钥的接口绝不要写在前端代码里，应通过自己的后端代理。',
    },
  ],
  related: ['build-your-own-x', 'dev-roadmap', 'system-design', 'github-stars'],
});
