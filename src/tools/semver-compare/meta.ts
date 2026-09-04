import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'semver-compare',
  name: '版本号比较',
  tagline: '语义化版本号比较与校验',
  description:
    '免费在线语义化版本比较工具，输入两个 SemVer 版本号（如 1.2.3、2.0.0-rc.1+build.4），判断大小、是否合法、预发版与构建元数据如何处理。写依赖约束（package.json / requirements.txt）、升级评估、发版前核对全部本地解析，结果支持批量粘贴。',
  keywords: ['版本号比较', 'semver', '语义化版本', '版本对比'],
  category: 'dev',
  tags: ['版本', 'semver', '开发'],
  icon: 'git-compare',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['changelog-gen', 'commit-gen'],
  faq: [
    {
      q: '语义化版本长什么样？',
      a: '主版本.次版本.修订号，如 2.3.1；可带预发 -alpha.1 和构建元数据 +20230901。主版本不兼容、次版本新增向后兼容、修订号修复向后兼容。',
    },
    {
      q: '预发版本怎么比大小？',
      a: '正式版大于预发版（2.0.0 > 2.0.0-rc.1）；同为预发时按标识符逐段比（alpha < beta < rc）。构建元数据（+xxx）不参与比较。',
    },
    {
      q: '^1.2.3 和 ~1.2.3 是什么意思？',
      a: '^ 允许修订和次版本升级（锁主版本），~ 只允许修订升级（锁主.次）。这是 npm 等包管理器的范围语法；本工具比较的是具体版本号本身。',
    },
    {
      q: '非法版本号会提示吗？',
      a: '会。缺段、出现非数字主版本、格式错乱等都会被标为「非法 semver」，并说明原因。',
    },
  ],
});
