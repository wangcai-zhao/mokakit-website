import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'git-command-gen',
  name: 'Git 命令生成',
  tagline: '常见场景命令速查',
  description:
    '免费在线 Git 命令生成工具，覆盖撤回提交、暂存改动、同步上游、整理提交、挑拣提交、打标签、安全强推等十四个常见场景，填参数即生成完整命令序列，并按安全 / 需确认 / 有风险三档标注风险。本地生成不上传。',
  keywords: ['Git 命令', 'git 撤回提交', 'git 强推', 'cherry-pick', 'git 常用命令'],
  category: 'dev',
  tags: ['Git', '版本控制', '命令'],
  icon: 'git-branch',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 7,
  faq: [
    {
      q: 'reset --soft 和 --hard 有什么区别？',
      a: '--soft 只把 HEAD 指针退回去，改动还留在工作区，可以重新提交；--hard 连改动一起丢弃，找不回来。刚提交完发现写错了用 --soft。',
    },
    {
      q: '为什么推荐 --force-with-lease 而不是 --force？',
      a: '--force 会无条件覆盖远程分支，可能把同事刚推的提交抹掉。--force-with-lease 会先检查远程有没有你不知道的新提交，有就拒绝推送，安全得多。',
    },
    {
      q: 'rebase 什么时候不该用？',
      a: '已经推送到公共分支、且别人可能基于它继续开发的提交不要 rebase。rebase 会改写历史，其他人的本地仓库会和远程对不上。',
    },
  ],
  related: ['gitignore-gen', 'commit-gen'],
});
