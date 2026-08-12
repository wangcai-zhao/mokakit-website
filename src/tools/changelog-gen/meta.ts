import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'changelog-gen',
  name: 'CHANGELOG 模板生成器',
  tagline: 'Keep a Changelog + Issue/PR 模板',
  description:
    '免费在线 CHANGELOG 与仓库模板生成器：按 Keep a Changelog 规范，填版本号、日期和 Added/Changed/Fixed 等分类即可生成标准更新日志；同时提供 Bug 报告、功能建议、PR 三类 GitHub 模板，一键复制或下载。纯本地运行，不收集任何数据。',
  keywords: ['CHANGELOG生成', '更新日志生成', 'Keep a Changelog', 'Issue模板', 'PR模板', 'GitHub模板'],
  category: 'dev',
  tags: ['git', 'changelog', '模板', '开源'],
  icon: 'file-text',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 7,
  faq: [
    {
      q: '为什么要写 CHANGELOG？',
      a: 'CHANGELOG 是给「人」看的项目变更记录，和给「机器」解析的提交信息互补。用户和协作者不必翻几百条 commit 就能知道「这个版本改了啥、有没有破坏性变更」。按 Keep a Changelog 规范写，结构统一、可读性强。',
    },
    {
      q: 'Keep a Changelog 的分类有哪些？',
      a: '标准六类：Added（新增）、Changed（变更）、Deprecated（即将废弃）、Removed（已移除）、Fixed（修复）、Security（安全）。本工具按这六类组织输入，生成时自动加 `-` 列表项。',
    },
    {
      q: 'GitHub 的 Issue / PR 模板怎么用？',
      a: '把生成的模板放进仓库的 `.github/ISSUE_TEMPLATE/`（Issue 模板，可多个）或 `.github/PULL_REQUEST_TEMPLATE.md`（PR 模板）。之后别人提 Issue / PR 时会自动套用，引导填写关键信息，减少来回沟通。',
    },
    {
      q: '生成的文件怎么落地？',
      a: 'CHANGELOG 下载后保存为仓库根目录的 `CHANGELOG.md`；模板下载后按提示放进 `.github/` 对应路径即可生效。',
    },
  ],
  related: ['github-stars', 'gitignore-gen', 'license-gen', 'commit-gen'],
});
