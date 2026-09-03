import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'xml-json',
  name: 'XML 与 JSON 互转',
  tagline: 'XML 和 JSON 在线互相转换，保留属性与结构',
  description:
    '免费在线 XML 与 JSON 互转工具，支持元素、属性、文本与嵌套。XML 转 JSON 时属性以 @ 前缀、文本以 #text 表示；JSON 转 XML 自动生成标签。适合接口报文、配置、数据迁移，全部本地计算。',
  keywords: ['XML转JSON', 'JSON转XML', 'xml json 互转', '在线xml转换'],
  category: 'dev',
  tags: ['XML', 'JSON', '开发', '转换'],
  icon: 'file-code',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['json-formatter', 'yaml-json', 'html-to-markdown'],
  faq: [
    {
      q: 'XML 的属性怎么表示？',
      a: 'XML→JSON 时，元素属性统一加 @ 前缀（如 <a id="1"/> → {"a":{"@id":"1"}}），元素文本用 #text 键。这样属性和子元素不会冲突。',
    },
    {
      q: '同名多子节点怎么处理？',
      a: '同一父元素下多个同名子节点会自动变成数组，方便 JSON 端遍历。这是 XML 与 JSON 互转的常见约定。',
    },
    {
      q: 'JSON 转 XML 有哪些限制？',
      a: 'JSON 的数组/对象都能映射成 XML 元素；但键名会被当作标签名，建议用合法 XML 标签名（字母、数字、下划线、连字符）。不以对象/数组包裹的纯值也可直接输出。',
    },
    {
      q: 'CDATA 和命名空间支持吗？',
      a: 'CDATA 会被当作文本读取；XML 命名空间（xmlns）作为普通属性保留（@xmlns）。复杂的命名空间语义本工具不专门处理。',
    },
  ],
});
