import { defineTool } from '../types';

export default defineTool({
  id: 'case-converter',
  name: '大小写转换',
  tagline: '大小写与命名风格互转',
  description:
    '免费在线大小写转换工具，支持 camelCase、PascalCase、snake_case、kebab-case、全大写、全小写、标题大小写等命名风格一键互转，常用于变量命名、SQL 字段、文件名规范化。',
  keywords: ['大小写转换', '命名风格转换', 'camelCase转换', 'snake_case', '在线大小写'],
  category: 'text',
  tags: ['大小写', '命名', '文本', '转换'],
  icon: 'type',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 5,
  faq: [
    {
      q: 'camelCase 和 PascalCase 有什么区别？',
      a: '两者都是除首字母外的单词首字母大写，区别在于第一个单词：camelCase（驼峰）首字母小写，如 userName；PascalCase（帕斯卡）首字母也大写，如 UserName。后者常用于类名、组件名。',
    },
    {
      q: 'snake_case 和 kebab-case 分别在哪用？',
      a: 'snake_case（下划线）常见于 Python 变量、数据库字段、环境变量；kebab-case（短横线）常见于 URL、CSS 类名、Linux 文件名。本工具可在这几种风格间自由切换。',
    },
  ],
});
