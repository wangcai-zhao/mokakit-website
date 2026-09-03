import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'query-params',
  name: 'URL 查询参数处理',
  tagline: '解析、排序、去重、拼接 URL 查询参数',
  description:
    '免费在线 URL 查询参数工具，解析整条 URL 或原始 query string，列出键值对，支持排序、去重、改值、重新拼接，并可切换编码/解码。调试接口、构造分享链接、排查参数错乱时好用，全部本地计算。',
  keywords: ['url 参数', 'query string', '查询参数', 'url 参数解析'],
  category: 'dev',
  tags: ['URL', '参数', '开发'],
  icon: 'link-2',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['url-parser', 'slug-generator'],
  faq: [
    {
      q: '能直接粘整个 URL 吗？',
      a: '可以。粘贴含 ? 的整条 URL 会自动提取问号后的查询部分；也可以只粘 key=val&... 片段。',
    },
    {
      q: '排序和去重有什么用？',
      a: '排序让参数顺序一致，便于比对两条 URL 是否等价；去重可清掉重复 key（保留末次出现），避免后端取到意外值。重新拼接时可选是否 URL 编码。',
    },
    {
      q: '中文/特殊字符怎么处理？',
      a: '提供「解码视图」看原始可读值、「编码视图」看传输形态（如 %E4%BD%A0）。拼接时可选择是否对值做 encodeURIComponent。',
    },
    {
      q: '和 URL 解析拆解有什么区别？',
      a: 'URL 解析拆解关注整条 URL 的各段（协议/域名/路径/锚点）；本工具聚焦查询参数这一段的增删改查与规范化。',
    },
  ],
});
