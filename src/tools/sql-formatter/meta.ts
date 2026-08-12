import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'sql-formatter',
  name: 'SQL 格式化',
  tagline: '关键字换行缩进',
  description:
    '免费在线 SQL 格式化工具，把挤成一行的查询语句按 SELECT、FROM、WHERE、JOIN、GROUP BY 等主要关键字自动换行并缩进，关键字统一大写，让长 SQL 一眼看清结构，方便排查逻辑与代码评审。支持 MySQL、PostgreSQL 等常见方言，纯浏览器本地运算，语句不会外传。',
  keywords: ['SQL格式化', '在线SQL美化', 'SQL缩进', 'SQL在线整理', 'sql formatter'],
  category: 'dev',
  tags: ['sql', '格式化', '开发'],
  icon: 'database',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 7,
  faq: [
    {
      q: '格式化会改变 SQL 的执行结果吗？',
      a: '不会。工具只调整空白与换行，并把识别到的关键字转为大写，不增删任何语法成分，格式化前后语义完全一致，可以直接复制回代码或客户端执行。',
    },
    {
      q: '支持哪些数据库方言？',
      a: '基于通用 SQL 关键字做轻量排版，MySQL、PostgreSQL、SQLite、SQL Server、Hive 等常见方言的查询语句都能正常处理。特殊方言的自定义语法会原样保留。',
    },
    {
      q: '字符串里正好有 select 这类单词会被误处理吗？',
      a: '这是轻量正则排版器，极端情况下引号内与关键字同名的单词可能被大写或换行。若语句中含大量此类文本，建议格式化后快速核对一遍再使用。',
    },
  ],
  related: ['json-formatter', 'regex-tester'],
});
