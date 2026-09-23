import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'markdown-toc',
  name: 'Markdown 目录生成',
  tagline: '一键生成文章锚点目录',
  description:
    '免费在线 Markdown 目录生成工具，粘贴文档即可提取各级标题生成带锚点链接的目录，可限制到第几级标题、跳过一级大标题、自定义锚点风格与列表符号。代码块里的井号不会被误判。本地处理不上传。',
  keywords: ['Markdown 目录', 'TOC 生成', 'md 目录', '锚点生成', '文章导航'],
  category: 'text',
  tags: ['Markdown', '目录', '文档'],
  icon: 'list',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 6,
  faq: [
    {
      q: '代码块里的 # 会被当成标题吗？',
      a: '不会。工具会识别三个反引号或波浪号组成的代码围栏，围栏内的内容一律跳过。',
    },
    {
      q: '生成的锚点点了跳不动怎么办？',
      a: '各家平台生成锚点的规则不一样。GitHub、掘金、知乎、微信公众号各有各的实现。遇到跳不动就把锚点风格切成「原样」再试一次。',
    },
    {
      q: '重复标题怎么处理？',
      a: '工具会自动检测重复锚点，第二个相同的标题后面加 -1，第三个加 -2，避免链接冲突。',
    },
  ],
  related: ['markdown-preview', 'html-to-markdown'],
});
