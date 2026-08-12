import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'commit-gen',
  name: 'Commit 规范生成器',
  tagline: '约定式提交，秒出标准提交信息',
  description:
    '免费在线 Commit 规范（Conventional Commits）生成器：选类型、填范围与描述，实时拼出 feat/fix/docs 等标准提交信息，支持 BREAKING CHANGE 标记，一键复制。附带完整类型速查表，帮团队统一提交风格、自动生成 CHANGELOG。纯本地运行，不收集任何数据。',
  keywords: ['commit规范', '约定式提交', 'Conventional Commits', '提交信息生成', 'git提交格式'],
  category: 'dev',
  tags: ['git', '提交', '规范', '协作'],
  icon: 'git-compare',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 7,
  faq: [
    {
      q: '什么是 Conventional Commits（约定式提交）？',
      a: '一套给提交信息定格式的轻量约定：`<type>(<scope>): <subject>`，例如 `feat(auth): 支持微信登录`。它让提交历史一眼可读，并且能被工具解析——比如自动生成 CHANGELOG、语义化版本号（semver）。Angular、Vue、Nuxt 等大型项目都在用。',
    },
    {
      q: 'type 应该怎么选？',
      a: '一句话：新功能用 feat，修 bug 用 fix，改动文档用 docs，重构（不改行为）用 refactor，性能优化用 perf，加测试用 test，构建/依赖用 build，CI 用 ci，其他杂事用 chore。选型不确定时看速查表。',
    },
    {
      q: 'BREAKING CHANGE 什么时候加？',
      a: '当你这次改动会让依赖你代码的人「用不了旧调用方式」时——比如改了函数签名、删了公开 API、改了配置项名。在 footer 写 `BREAKING CHANGE: 说明`，或者直接在 type 后加 `!`（如 `feat!: 移除旧接口`）。',
    },
    {
      q: '生成的提交信息怎么用？',
      a: '在 `git commit` 时粘贴即可，例如 `git commit -m "$(pbpaste)"`（macOS）或直接 `git commit -m "feat(auth): 支持微信登录"`。配合本站的 CHANGELOG 生成器，还能把这些提交自动汇总成更新日志。',
    },
  ],
  related: ['github-stars', 'gitignore-gen', 'license-gen', 'changelog-gen'],
});
