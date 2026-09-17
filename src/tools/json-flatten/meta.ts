import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'json-flatten',
  name: 'JSON 扁平化',
  tagline: '嵌套 JSON 展平成一层',
  description:
    '免费在线 JSON 扁平化与还原工具，把嵌套对象展平成 a.b.c 形式的一层键值，也能把扁平结构还原回嵌套对象，数字键自动拼回数组。分隔符可选点、下划线、斜杠、冒号。本地处理不上传。',
  keywords: ['JSON 扁平化', 'flatten JSON', 'JSON 展平', '嵌套转一层', 'unflatten'],
  category: 'dev',
  tags: ['JSON', '扁平化', '数据'],
  icon: 'layers',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 7,
  faq: [
    {
      q: '扁平化有什么实际用途？',
      a: '两个典型场景：把接口返回的嵌套数据塞进表格或 CSV（一层键就是一列）；做「只改某几个字段」的补丁请求时，扁平键更方便定位。',
    },
    {
      q: '还原时数组能认出来吗？',
      a: '能。还原逻辑会把「全是数字键的对象」自动拼回数组，tags.0、tags.1 会变回 ["a","b"]。',
    },
    {
      q: '键名里本身有分隔符怎么办？',
      a: '会有歧义，来回转换可能对不上。遇到这种情况请换成不冲突的分隔符，比如键名里有点号就改用下划线。',
    },
  ],
  related: ['json-to-csv', 'jsonpath'],
});
