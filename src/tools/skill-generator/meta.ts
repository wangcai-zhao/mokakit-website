import { defineTool } from '../types';

export default defineTool({
  id: 'skill-generator',
  name: 'SKILL.md 生成器',
  tagline: '填表生成 WorkBuddy 技能文件',
  description:
    '免费在线 SKILL.md 生成工具，支持名称、简介、触发场景、参数、详细步骤、示例、注意事项、依赖等完整字段，并可粘贴已有 SKILL.md 自动反向解析回填；一键生成符合 WorkBuddy 规范的 SKILL.md，可直接放入用户级或项目级 skills 目录。',
  keywords: ['SKILL.md生成', 'WorkBuddy技能', '技能生成器', 'AI技能文件', '提示词工程', '反向解析'],
  category: 'ai',
  tags: ['workbuddy', 'skill', 'ai', '配置', '智能体'],
  icon: 'bot',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 5,
  faq: [
    {
      q: '生成的 SKILL.md 放在哪里才能被 WorkBuddy 识别？',
      a: '用户级技能放到 ~/.workbuddy/skills/，项目级技能放到 {项目}/.workbuddy/skills/。每个技能一个目录，把生成的 SKILL.md 放进去即可，WorkBuddy 会自动发现。',
    },
    {
      q: 'description 字段有什么讲究？',
      a: 'description 是技能被触发的关键，建议写清「这个技能做什么」以及「用户什么情况下该用它」，WorkBuddy 会据此判断要不要加载该技能。',
    },
  ],
});
