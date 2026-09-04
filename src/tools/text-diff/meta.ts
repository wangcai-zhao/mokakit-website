import { defineTool } from '../types';

export default defineTool({
  id: 'text-diff',
  name: '文本比较 (Diff)',
  tagline: '逐行对比两段文本差异',
  description:
    '免费在线文本比较（Diff）工具，纯前端逐行对比「原文本」与「新文本」，高亮新增、删除与相同行，并显示总改动行数。适合代码 review、文案校对、配置文件改动比对、版本对比与合同修订追踪，数据全部在本地处理，不上传服务器。',
  keywords: ['文本比较', 'Diff', '文本差异', '代码比对', '改动对比'],
  category: 'text',
  tags: ['diff', '对比', '文本', 'text', '改动'],
  icon: 'align-left',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 5,
  faq: [
    {
      q: '比较是基于行还是字符？',
      a: '默认按行做差异比对（LCS 算法），适合代码与文档；若文本无明显换行，可把整段当作一行比较。结果会用颜色区分新增（左有右无）、删除（左无右有）与保留行。',
    },
    {
      q: '我的文本会被上传吗？',
      a: '不会。差异计算完全在浏览器本地进行，不发送任何内容到服务器，关闭页面即失效。',
    },
  ],
});
