import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'build-your-own-x',
  name: '从零造 X 项目清单',
  tagline: '按主题索引「自己实现一个 X」的教程',
  description:
    '免费在线「从零造 X」教程索引，精选 25 个手写实现经典系统的练手项目，覆盖编程语言与编译器、存储与数据库、网络与系统、编辑器与 CLI、Web 框架、算法与图形六大方向。每个主题附带简介与外链教程，支持搜索与分类筛选，是提升工程能力的进阶路线图。',
  keywords: ['从零造X', 'build your own x', '手写实现', '练手项目', '编程进阶'],
  category: 'dev',
  tags: ['编程', '练手', '教程', '系统', '进阶'],
  icon: 'code',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 7,
  faq: [
    {
      q: '「从零造 X」适合什么阶段的人？',
      a: '适合已经写过一些代码、想从「会用」进阶到「懂原理」的开发者。比如自己实现一个数据库，比单纯调用 MongoDB 更能理解索引与事务。新手建议从解释器、键值存储这类边界清晰的项目入手。',
    },
    {
      q: '这些项目要写到生产级吗？',
      a: '不需要。目标不是替代成熟系统，而是通过一个能跑的玩具实现，搞懂核心数据结构与算法。能跑通基本功能、覆盖主路径，收获就已经很大了。',
    },
    {
      q: '教程链接打不开或失效怎么办？',
      a: '这类教程多为社区维护，偶尔会迁移或下线；链接也多为 GitHub 与英文博客等境外站点，访问速度因网络环境而异，必要时可尝试 GitHub 镜像站。本页只做索引与导读，链接均为外部资源（已加 nofollow），具体以源站为准。',
    },
  ],
  related: ['public-apis', 'dev-roadmap', 'system-design', 'github-stars'],
});
