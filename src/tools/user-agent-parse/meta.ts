import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'user-agent-parse',
  name: 'User-Agent 解析器',
  tagline: '解析 UA 识别浏览器、系统、设备',
  description:
    '免费在线 User-Agent 解析器，粘贴一段 UA 字符串，识别出浏览器及版本、操作系统及版本、设备类型（桌面/手机/平板/爬虫）。用于日志分析、兼容性排查、反爬识别，全部本地正则解析。',
  keywords: ['user agent 解析', 'ua 解析', '浏览器识别', 'ua 分析'],
  category: 'dev',
  tags: ['UA', '解析', '开发'],
  icon: 'scan',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['http-status', 'extract-links'],
  faq: [
    {
      q: 'User-Agent 是什么？',
      a: 'UA 是浏览器/客户端发给服务器的标识字符串，包含浏览器、渲染引擎、操作系统、设备等信息，形如 Mozilla/5.0 (Windows NT 10.0) AppleWebKit/...',
    },
    {
      q: '解析准确吗？',
      a: '基于常见 UA 特征的正则 heuristic 解析，覆盖主流浏览器（Chrome/Edge/Firefox/Safari）、系统（Windows/macOS/Android/iOS）和常见爬虫。小众或伪造 UA 可能识别不全，结果仅供参考。',
    },
    {
      q: '为什么同一浏览器 UA 很长？',
      a: '历史兼容原因，几乎所有浏览器都带 Mozilla/5.0 前缀，再叠加 AppleWebKit、Chrome、Safari 等兼容标记，导致 UA 冗长。',
    },
    {
      q: '爬虫 UA 怎么辨认？',
      a: '常见爬虫（Googlebot、Bingbot、Baiduspider、爬虫框架）在 UA 中含特征词，本工具会标为「爬虫/机器人」类型，便于日志里区分人与机器流量。',
    },
  ],
});
