import { defineTool } from '../types';

export default defineTool({
  id: 'json-formatter',
  name: 'JSON 格式化',
  tagline: '格式化、压缩、校验 JSON',
  description:
    '免费在线 JSON 格式化工具，支持 JSON 美化（缩进排版）、压缩去空白、语法校验与错误提示。接口调试、配置文件整理、数据校验都能用，纯本地运行不上传任何数据。',
  keywords: ['json格式化', 'json在线格式化', 'json校验', 'json美化', 'json压缩'],
  category: 'dev',
  tags: ['json', '格式化', '校验', '开发'],
  icon: 'braces',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 7,
  faq: [
    {
      q: '这个 JSON 格式化工具安全吗？',
      a: '完全安全。所有解析和格式化都在你的浏览器本地完成，输入的文本不会发送到任何服务器，也不会被保存。你可以断网使用本页面来验证这一点。',
    },
    {
      q: '为什么我的 JSON 提示格式错误？',
      a: '常见原因：键名或字符串没用双引号（标准 JSON 不支持单引号）、数组或对象末尾多了逗号、出现了注释或换行符（标准 JSON 不允许注释）。本工具会在报错信息中提示错误原因，按提示修改即可。',
    },
    {
      q: '格式化和压缩分别有什么用？',
      a: '格式化（带缩进换行）方便人阅读和维护，用于调试和整理；压缩（去除所有空白）减小体积，用于传输和存储。两者内容完全一致，只是排版不同。',
    },
  ],
});
