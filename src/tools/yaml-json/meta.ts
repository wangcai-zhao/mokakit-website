import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'yaml-json',
  name: 'YAML 与 JSON 互转',
  tagline: 'YAML 和 JSON 在线互相转换，支持嵌套与常用类型',
  description:
    '免费在线 YAML 与 JSON 互转工具，支持嵌套结构、数组、字符串/数字/布尔/空值等常用类型。粘贴 YAML 即时得到 JSON，或反向转换，适合配置文件、Kubernetes、CI/CD 等场景。全部在浏览器本地计算，不上传任何数据。',
  keywords: ['YAML转JSON', 'JSON转YAML', 'yaml json 互转', '在线yaml转换'],
  category: 'dev',
  tags: ['YAML', 'JSON', '开发', '转换'],
  icon: 'file-json',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['json-formatter', 'xml-json', 'env-parser'],
  faq: [
    {
      q: 'YAML 和 JSON 能互相无损转换吗？',
      a: '在常用子集内可以：映射（map）、序列（list）、字符串、数字、布尔、null 都能对应。但 YAML 的锚点（anchor/alias）、多文档（---）、复杂流式写法本工具未完全支持，遇到会给出提示，建议先用标准结构。',
    },
    {
      q: '哪些场景最常用？',
      a: 'Kubernetes 的 yaml 配置想快速看结构、CI 配置（GitLab CI / GitHub Actions）想转成 JSON 校验、或把接口返回的 JSON 存成易读的 yaml 配置文件。',
    },
    {
      q: '缩进必须用空格吗？',
      a: '是的，YAML 严格依赖缩进（通常 2 个空格）表达层级，Tab 不被允许。本工具按空格缩进解析，粘贴时请确认用空格。',
    },
    {
      q: '注释会保留吗？',
      a: 'YAML 里的 # 注释在转 JSON 时会丢失（JSON 无注释语法）。反向 JSON→YAML 也不会凭空产生注释。如需保留注释请用原文件。',
    },
  ],
});
