import { defineTool } from '../types';

export default defineTool({
  id: 'http-status',
  name: 'HTTP 状态码速查',
  tagline: '常用 HTTP 状态码含义速查',
  description:
    '免费在线 HTTP 状态码速查表，收录全部标准 HTTP 状态码（1xx 信息、2xx 成功、3xx 重定向、4xx 客户端错误、5xx 服务端错误）的编码、官方含义与常见排查建议，支持关键字搜索与类别筛选。帮助开发调试接口时快速定位响应含义，纯静态数据离线可用。',
  keywords: ['HTTP状态码', '状态码', 'HTTP', 'API', '响应码'],
  category: 'dev',
  tags: ['http', '状态码', 'dev', '参考', '接口'],
  icon: 'server',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 4,
  faq: [
    {
      q: '状态码分类依据什么？',
      a: '按首数字划分：1xx 信息、2xx 成功、3xx 重定向、4xx 客户端错误、5xx 服务端错误。本表收录开发与调试中最常见的一批，并非全部状态码。',
    },
    {
      q: '这是离线可用的吗？',
      a: '是的。数据直接内置于页面，无需联网即可搜索查询，适合无网络环境下的开发参考。',
    },
  ],
});
