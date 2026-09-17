import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'json-diff',
  name: 'JSON 对比',
  tagline: '找出两份 JSON 差异',
  description:
    '免费在线 JSON 对比工具，粘贴两份 JSON 即可逐字段比对，用表格列出新增、删除、修改的字段与路径（a.b[0].c 形式），可只显示有变化的部分并导出差异清单。全部在浏览器本地比对，数据不上传。',
  keywords: ['JSON 对比', 'JSON diff', '接口差异比对', '在线 diff', 'JSON 比较'],
  category: 'dev',
  tags: ['JSON', '对比', '开发'],
  icon: 'diff',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 8,
  faq: [
    {
      q: '数组是怎么比对的？',
      a: '按下标一一比对。所以如果在数组中间插入一个元素，后面的元素会全部表现为「修改」。这种场景建议先排序再比。',
    },
    {
      q: '路径里的 [0] 是什么意思？',
      a: '是数组下标。比如 tags[1] 表示 tags 数组的第二个元素，方便你直接定位到数据里的具体位置。',
    },
    {
      q: '数据会上传吗？',
      a: '不会。比对逻辑完全跑在你的浏览器里，接口返回的真实数据、配置文件都可以放心贴进来比对。',
    },
  ],
  related: ['json-formatter', 'text-diff'],
});
