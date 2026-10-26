import { defineTool } from '../types';

export default defineTool({
  id: 'case-converter',
  name: '大小写转换',
  seoTitle: '大小写转换 - camelCase/snake_case/kebab-case命名风格互转',
  tagline: '大小写与命名风格互转',
  description:
    '免费在线大小写转换工具，支持 camelCase、PascalCase、snake_case、kebab-case、CONSTANT_CASE、句子大小写等命名风格一键互转，多行批量处理，常用于变量命名、SQL 字段、文件名规范化。',
  keywords: ['大小写转换', '命名风格转换', 'camelCase转换', 'snake_case', '在线大小写'],
  category: 'text',
  tags: ['大小写', '命名', '文本', '转换'],
  icon: 'type',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-08-04',
  updatedAt: '2026-10-25',
  priority: 5,
  related: ['text-counter', 'url-encoder', 'json-formatter', 'text-diff'],
  faq: [
    {
      q: 'camelCase 和 PascalCase 有什么区别？',
      a: '两者都是除首字母外的单词首字母大写，区别在于第一个单词：camelCase（驼峰）首字母小写，如 userName；PascalCase（帕斯卡）首字母也大写，如 UserName。后者常用于类名、组件名。',
    },
    {
      q: 'snake_case 和 kebab-case 分别在哪用？',
      a: 'snake_case（下划线）常见于 Python 变量、数据库字段、环境变量；kebab-case（短横线）常见于 URL、CSS 类名、Linux 文件名。本工具可在这几种风格间自由切换。',
    },
    {
      q: '什么是 CONSTANT_CASE，什么时候用？',
      a: 'CONSTANT_CASE 是 snake_case 全大写形式（如 MAX_RETRY_COUNT），用于常量、环境变量、宏定义。输入 myAPIKey2 勾选数字切分后可得到 MY_API_KEY2。',
    },
    {
      q: '可以一次转换多个变量名吗？',
      a: '可以。输入框支持多行，每行独立转换，结果区每种风格一行一条，点复制按钮即复制整篇结果，适合一次整理一列变量名。',
    },
  ],
  subpages: () => [
    {
      slug: 'camelcase-converter',
      title: 'camelCase转换器',
      seoTitle: 'camelCase转换器 - 大小写互转在线工具',
      description:
        '在线 camelCase 转换器：把 user_name、user-name、USER ID 等任意风格变量名转为 camelCase，也可反向转出，支持多行批量与数字切分，本地实时转换。',
      data: { caseInput: 'user_name\nfirst-name\nUSER_ID\nmyAPIKey2' },
      faq: [
        {
          q: 'camelCase 的命名规则是什么？',
          a: '第一个单词全小写，其后每个单词首字母大写、去掉分隔符，如 userName、maxRetryCount。Java/JavaScript 变量与函数名普遍采用这一风格。',
        },
        {
          q: 'USER_ID 转 camelCase 是 userId 还是 userID？',
          a: '本工具按常见代码风格输出 userId：连续大写（如 ID）作为一个词整体处理，首词小写、次词首字母大写，与主流 Lint 规则一致。',
        },
        {
          q: '数字会被拆开吗？',
          a: '默认不会，Key2 保持为一个词；勾选「数字切分」后按 change-case 的 separateNumbers 行为拆成 Key 2，便于生成 MY_API_KEY_2 这类常量名。',
        },
      ],
    },
    {
      slug: 'snake-case-converter',
      title: 'snake_case转换器',
      seoTitle: 'snake_case转换器 - 下划线命名在线转换',
      description:
        '在线 snake_case 转换器：把 userName、FirstName、some-value 等变量名转为下划线命名，支持 Python 变量、数据库字段场景，多行批量本地转换。',
      data: { caseInput: 'userName\nFirstName\nsome-value\nHTTPStatus' },
      faq: [
        {
          q: 'snake_case 适合哪些场景？',
          a: 'Python 变量与函数、数据库表名字段、环境变量（配合大写即 CONSTANT_CASE）是 snake_case 的主场，可读性好且不依赖大小写。',
        },
        {
          q: 'userName 转 snake_case 是 user_name 还是 user name？',
          a: '输出 user_name。工具会先把驼峰按单词边界切开，再用下划线连接，整个过程在浏览器本地完成。',
        },
        {
          q: '数据库字段名能用它统一风格吗？',
          a: '可以。多行粘入字段清单，一次性得到统一的 snake_case 结果，复制整篇即可贴回建表语句或 ORM 模型。',
        },
      ],
    },
  ],
});
