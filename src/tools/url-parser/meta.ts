import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'url-parser',
  name: 'URL 解析拆解',
  tagline: '拆解协议域名参数',
  description:
    '免费在线 URL 解析工具，粘贴任意网址即可拆解出协议、域名、端口、路径、查询字符串与哈希片段，并把 query 参数逐条列成表格，参数值自动解码、支持单条复制。排查接口请求、分析推广链接 UTM 参数时特别好用，纯浏览器本地解析，链接不上传。',
  keywords: ['URL解析', '网址拆解', '查询参数解析', 'URL参数提取', 'url parser'],
  category: 'dev',
  tags: ['url', '解析', '开发'],
  icon: 'link',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 7,
  faq: [
    {
      q: '为什么提示 URL 无效？',
      a: '解析基于浏览器原生 URL 标准，网址必须带协议头。若只填了 example.com/path，工具会自动按 https:// 补全再试；仍失败通常是含非法字符或结构不完整。',
    },
    {
      q: '参数值里的中文和 %XX 会自动还原吗？',
      a: '会。表格中展示的是解码后的可读值，中文、空格等百分号编码都会还原。若想拿到编码前的原始串，可用站内的 URL 编解码工具反向处理。',
    },
    {
      q: '同名参数出现多次怎么显示？',
      a: '会按出现顺序逐条列出，不会互相覆盖，方便检查 tags=a&tags=b 这类数组式传参是否符合预期。',
    },
  ],
  related: ['url-encoder', 'json-formatter'],
});
