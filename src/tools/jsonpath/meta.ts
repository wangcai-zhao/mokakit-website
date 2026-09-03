import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'jsonpath',
  name: 'JSONPath 提取器',
  tagline: '用 JSONPath 从 JSON 提取任意字段',
  description:
    '免费在线 JSONPath 提取器，粘贴 JSON 和 JSONPath 表达式，快速取出嵌套字段、数组元素或批量匹配结果。支持点路径、下标、通配符 * 与数组遍历。调试接口、写采集脚本前先试表达式，全部本地计算。',
  keywords: ['jsonpath', 'json 提取', 'json 路径', 'jsonpath 在线'],
  category: 'dev',
  tags: ['JSON', '提取', '开发'],
  icon: 'braces',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['json-formatter', 'yaml-json'],
  faq: [
    {
      q: 'JSONPath 怎么写？',
      a: '以 $ 根开头：$.user.name 取对象字段；$.items[0] 取下标；$.items[*].id 遍历数组取每个元素的 id；$.list[-1] 取最后一个。本工具支持点路径、方括号下标、* 通配。',
    },
    {
      q: '支持过滤表达式吗（如 ?(@.price>10)）？',
      a: '当前版本聚焦常用路径提取（点/下标/通配/遍历），复杂过滤谓词 ?(...) 暂不支持。多数「取每个元素的某字段」用 $.arr[*].field 即可满足。',
    },
    {
      q: '结果是多个怎么显示？',
      a: '匹配到多个值时会以 JSON 数组返回，方便你直接复制到代码里使用。只匹配一个则原样返回该值。',
    },
    {
      q: '和 jq 什么关系？',
      a: 'JSONPath 是 JSON 的「查询路径」语法（类似 XPath 之于 XML），jq 是更强大的命令行处理器。本工具对应 JSONPath 的常用子集，适合快速取数。',
    },
  ],
});
