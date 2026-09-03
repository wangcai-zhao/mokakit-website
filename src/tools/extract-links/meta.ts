import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'extract-links',
  name: '链接提取器',
  tagline: '从文本或 HTML 提取所有 URL 链接',
  description:
    '免费在线链接提取器，从纯文本或 HTML 片段里批量提取所有 http/https 链接，也可只提 a 标签 href 或 img 的 src。去重、按行/按域名汇总，方便采集、巡检死链、整理参考资料，全部本地解析。',
  keywords: ['提取链接', '提取url', '链接提取', 'url 提取'],
  category: 'dev',
  tags: ['URL', '提取', '开发'],
  icon: 'link',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['url-parser', 'html-to-markdown'],
  faq: [
    {
      q: '纯文本和 HTML 都能提吗？',
      a: '能。纯文本模式按 http(s):// 正则提取所有链接；HTML 模式用解析器分别收集 a[href]、img[src]、link[href] 等，结果更结构化。',
    },
    {
      q: '能去重和分组吗？',
      a: '默认去重；可切换按「出现顺序」或「按域名分组」展示，便于看某个站点被引用了多少次。',
    },
    {
      q: '提取的链接能直接下载/访问吗？',
      a: '本工具只负责提取与整理，不访问也不下载。拿到列表后你可在自己的脚本/下载器里使用。',
    },
    {
      q: '相对路径链接会补全吗？',
      a: '不会。提取以原样为主；若你提供了基准 URL，可开启「补全相对路径」把 /a/b 拼成完整链接。',
    },
  ],
});
