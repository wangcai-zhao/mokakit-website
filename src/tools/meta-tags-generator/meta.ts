import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'meta-tags-generator',
  name: 'SEO Meta 标签生成器',
  tagline: '一键生成 OG 与 Twitter 标签',
  description:
    '免费在线 SEO Meta 标签生成器，填写标题、描述、关键词、规范链接与 OG 信息，一键生成可直接复制粘贴的 HTML 代码片段，含 title、canonical、og 与 twitter 系列标签及 JSON-LD 结构化数据，并实时体检标题长度、描述字数与是否缺少关键标签，立即生成，本地计算不上传。',
  keywords: ['Meta标签生成', 'OG标签', 'SEO优化', 'JSON-LD', 'canonical链接'],
  category: 'dev',
  tags: ['SEO', 'Meta', '结构化数据'],
  icon: 'file-code',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-23',
  updatedAt: '2026-09-23',
  priority: 6,
  faq: [
    {
      q: '标题和描述分别控制在多少字符比较合适？',
      a: '页面标题建议控制在 60 个字符以内，中文大约 20 到 30 个字，超出的部分在搜索结果里会被截断成省略号。描述建议落在 80 到 160 个字符之间，太短浪费了展示空间，太长同样会被截断。本工具会用徽标实时提示当前处于通过还是警告状态，照着提示微调即可。',
    },
    {
      q: 'canonical 标签到底要不要加，写错会有什么后果？',
      a: '要加。同一篇内容可能通过带参数、带斜杠、带分页等多个地址访问，canonical 用来告诉搜索引擎哪一个才是规范地址，避免重复内容分散权重。写错的话风险很大，比如把规范地址指向了别的页面，等于主动把收录机会让出去，所以填写时务必确认是完整的绝对地址。',
    },
    {
      q: '生成的 OG 图地址有什么要求？',
      a: 'OG 图片必须使用完整绝对地址，也就是带 https 开头的那种，相对路径在社交平台抓取时会失效。尺寸建议 1200 乘 630 像素，文件大小控制在 1MB 以内，格式用 JPG 或 PNG。还要注意图片地址要能公开访问，放在需要登录或防盗链校验的目录下会导致抓取失败。',
    },
  ],
  related: ['text-counter', 'json-formatter'],
});
