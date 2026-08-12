import { defineTool } from '../types';

export default defineTool({
  id: 'url-encoder',
  name: 'URL 编解码',
  tagline: 'URL 编码与解码',
  description:
    '免费在线 URL 编解码工具，支持 encodeURIComponent 与 encodeURI 两种编码方式及其反向解码，处理中文、空格、特殊字符在网址中的转义，常用于接口调试、前端开发与爬虫参数构造。',
  keywords: ['URL编码', 'URL解码', '在线URL编解码', 'encodeURIComponent', 'urlencode'],
  category: 'dev',
  tags: ['URL', '编码', '解码', '开发'],
  icon: 'link',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 6,
  faq: [
    {
      q: 'encodeURIComponent 和 encodeURI 有什么区别？',
      a: 'encodeURIComponent 会编码几乎所有非字母数字字符（包括 : / ? & = + @ 等），适合编码「参数值」；encodeURI 会保留这些 URL 结构字符，适合编码「整条 URL」。绝大多数接口参数场景用 encodeURIComponent。',
    },
    {
      q: '为什么中文在网址里会变成 %E4%B8%AD 这样的串？',
      a: '这是 URL 编码（百分号编码）的结果。URL 标准只允许 ASCII 字符，非 ASCII（如中文）会被按 UTF-8 逐字节转成 %XX 形式。解码后就能还原成原来的中文。',
    },
  ],
});
