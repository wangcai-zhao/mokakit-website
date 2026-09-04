import { defineTool } from '../types';

export default defineTool({
  id: 'regex-tester',
  name: '正则测试',
  tagline: '在线测试正则表达式与匹配',
  description:
    '免费在线正则表达式测试工具，输入正则与测试文本，实时高亮所有匹配片段并列出捕获组，支持 g/i/m/s/u/y 等常用修饰符。帮助前端、后端、数据分析快速调试和验证正则表达式，结果附带匹配数统计，全部本地运行。',
  keywords: ['正则测试', '正则表达式', 'regex在线测试', '正则匹配', '表达式调试'],
  category: 'dev',
  tags: ['正则', 'regex', '开发', '调试'],
  icon: 'regex',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 5,
  faq: [
    {
      q: '支持哪些修饰符？',
      a: '支持 JavaScript 正则常用修饰符：g（全局）、i（忽略大小写）、m（多行）、s（dotAll，让 . 匹配换行）。工具会实时提示表达式是否合法。',
    },
    {
      q: '匹配结果会保存或上传吗？',
      a: '不会。正则与文本只在你的浏览器本地计算，不上传任何内容，可放心测试敏感文本。',
    },
  ],
});
