import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'dev-roadmap',
  name: '开发者路线图',
  tagline: '按角色规划该学什么',
  description:
    '免费在线开发者学习路线图，按前端、后端、DevOps、全栈、数据/AI、安全六大方向，拆解 30+ 个关键学习节点，每个节点附简介与官方文档外链。支持搜索与分类筛选，帮你告别「不知道下一步学什么」的迷茫，循序渐进补齐能力树。',
  keywords: ['开发者路线图', '学习路线', '前端路线', '后端路线', 'devops路线'],
  category: 'dev',
  tags: ['学习', '路线', '成长', '前端', '后端'],
  icon: 'mapPin',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 7,
  faq: [
    {
      q: '路线图是必须照单全收的顺序吗？',
      a: '不是。路线图是「能力地图」而非「打卡清单」。先按你当前角色补齐主干（比如后端先把语言+数据库+API 吃透），分支技能用到再学。不要为了学而学，带着项目驱动最高效。',
    },
    {
      q: '前端和后端先选哪个？',
      a: '看你目标。想做界面/交互选前端，想做逻辑/数据选后端；不确定就先学一门语言 + 基础 Web（HTML/HTTP/SQL），再决定。全栈是后面自然融合的事，不建议一开始就硬凑。',
    },
    {
      q: '链接都是官方文档吗？够学吗？',
      a: '节点链接尽量指向官方文档等权威源，作为入口足够。系统学习建议再配一本书或一门体系课。本页只做索引与导读，链接为外部资源（已加 nofollow）。',
    },
  ],
  related: ['build-your-own-x', 'system-design', 'public-apis', 'github-stars'],
});
