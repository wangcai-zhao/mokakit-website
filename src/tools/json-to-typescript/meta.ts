import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'json-to-typescript',
  name: 'JSON 转 TypeScript',
  tagline: '自动生成接口类型',
  description:
    '免费在线 JSON 转 TypeScript 类型工具，粘贴接口返回的 JSON 即可生成 interface 定义，嵌套对象自动拆成子接口并排好顺序，可设根类型名、全部字段可选、加 export。本地转换不上传。',
  keywords: ['JSON 转 TypeScript', 'JSON 生成 interface', '类型生成', 'ts 类型', '接口类型定义'],
  category: 'dev',
  tags: ['JSON', 'TypeScript', '类型'],
  icon: 'file-code',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 8,
  faq: [
    {
      q: '生成完就能直接用吗？',
      a: '基本能用，但要人工补两处：同一个字段在不同情况下返回 null 还是对象要补成联合类型；空数组推断为 unknown[]，需要改成具体类型。',
    },
    {
      q: '嵌套对象怎么处理的？',
      a: '自动拆成独立的子接口，并按「子接口在前、根类型在后」的顺序排列，读代码时不用来回跳。',
    },
    {
      q: '数组元素类型不一致怎么办？',
      a: '工具会推断成联合类型，比如 Array<string | number>。如果样例数据里只出现了一种，就只能推断出那一种。',
    },
  ],
  related: ['json-formatter', 'json-diff'],
});
