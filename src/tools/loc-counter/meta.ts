import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'loc-counter',
  name: '代码行数统计',
  tagline: '统计代码总行数/注释/空行/有效代码',
  description:
    '免费在线代码行数统计工具，粘贴源码即统计总行数、空行、注释行与有效代码行，支持 JavaScript/TypeScript、Python、Java、C/C++、Go、HTML、CSS、SQL、Shell 等常见语言。看项目规模、做汇报、算工作量都用得上，全部本地计算。',
  keywords: ['代码行数', 'loc 统计', '注释行数', '代码统计'],
  category: 'dev',
  tags: ['代码', '统计', '开发'],
  icon: 'list-ordered',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['line-sort', 'text-counter'],
  faq: [
    {
      q: '注释行怎么判定？',
      a: '按所选语言的注释语法：如 //（JS/Go/Java/C）、#（Python/Shell/SQL）、/* */（块注释，按起止行计）。一行里代码后跟 // 注释记为「代码行」而非纯注释，判定偏宽松。',
    },
    {
      q: '支持哪些语言？',
      a: '内置 JS/TS、Python、Java、C/C++、Go、HTML、CSS、SQL、Shell(bash) 的注释规则，可在下拉切换；未列出语言按「通用」处理（仅分空行/非空行）。',
    },
    {
      q: '块注释跨多行怎么算？',
      a: '从 /* 到 */ 之间的每一行计为注释行，即使中间夹着空行也归到注释区间，避免把块注释里的空行错算成代码。',
    },
    {
      q: '这和 cloc 工具结果一致吗？',
      a: '思路一致（分代码/注释/空行），但本工具是轻量启发式，对极少数边界写法（如字符串内的 //）可能与 cloc 略有出入，日常统计足够。',
    },
  ],
});
