import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'system-design',
  name: '系统设计案例库',
  tagline: '拆解经典系统的设计要点',
  description:
    '免费在线系统设计案例库，拆解 24 个经典系统与设计模式，覆盖 URL 短链、限流、聊天、推送、支付、秒杀等经典案例，以及负载均衡、缓存、消息队列、一致性哈希等基础组件，还有高并发与可靠性专项。每个主题附简介与外链，支持搜索与分类筛选，是备战面试与做架构决策的速查表。',
  keywords: ['系统设计', 'system design', '架构设计', '高并发', '面试'],
  category: 'dev',
  tags: ['架构', '设计', '面试', '高并发', '分布式'],
  icon: 'server',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 7,
  faq: [
    {
      q: '系统设计怎么练才有效？',
      a: '别背答案。拿一个需求（如「设计短链服务」），自己先画架构、列取舍，再对照资料找差距。重点训练「在约束下做权衡」的思维：一致性 vs 可用性、成本 vs 性能。多问「如果流量翻 100 倍怎么办」。',
    },
    {
      q: '案例链接都指向同一份资料吗？',
      a: '多数指向 system-design-primer 这类综合仓库作为入口，方便你顺藤摸瓜。具体主题建议再结合专项博客/视频深入。链接均为外部资源（已加 nofollow）。',
    },
    {
      q: '这些是生产级方案吗？',
      a: '是「思路框架」而非可直接上线的实现。真实系统还要考虑团队、成本、合规。把它们当检查清单和讨论起点更合适。',
    },
  ],
  related: ['dev-roadmap', 'build-your-own-x', 'public-apis', 'github-stars'],
});
