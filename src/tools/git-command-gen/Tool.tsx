import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

interface Recipe {
  id: string;
  label: string;
  desc: string;
  risk: 'safe' | 'careful' | 'danger';
  cmds: (v: Record<string, string>) => string[];
  fields?: { key: string; label: string; placeholder: string }[];
}

const RECIPES: Recipe[] = [
  {
    id: 'undo-commit',
    label: '撤回上一次提交',
    desc: '保留改动回到工作区，适合刚提交完发现写错了',
    risk: 'safe',
    cmds: () => ['git reset --soft HEAD~1'],
  },
  {
    id: 'undo-commit-hard',
    label: '彻底丢弃上一次提交',
    desc: '改动一起删掉，不可恢复',
    risk: 'danger',
    cmds: () => ['git reset --hard HEAD~1'],
  },
  {
    id: 'amend',
    label: '修改上一次提交信息',
    desc: '还没推送时使用，改完等于替换原提交',
    risk: 'safe',
    cmds: (v) => [`git commit --amend -m "${v.msg || '新的提交信息'}"`],
    fields: [{ key: 'msg', label: '新的提交信息', placeholder: 'fix: 修复登录跳转' }],
  },
  {
    id: 'stash',
    label: '临时存起手头改动',
    desc: '要切分支但代码还没写完时用',
    risk: 'safe',
    cmds: (v) => [`git stash push -m "${v.msg || '临时保存'}"`, 'git stash list', '# 回来时执行：git stash pop'],
    fields: [{ key: 'msg', label: '备注', placeholder: '半途的登录页改动' }],
  },
  {
    id: 'branch',
    label: '新建并切换分支',
    desc: '从当前分支拉一条新分支',
    risk: 'safe',
    cmds: (v) => [`git switch -c ${v.name || 'feature/new'}`],
    fields: [{ key: 'name', label: '分支名', placeholder: 'feature/login' }],
  },
  {
    id: 'sync-fork',
    label: '同步上游仓库',
    desc: 'fork 出来的仓库跟上原仓库进度',
    risk: 'safe',
    cmds: (v) => [
      `git remote add upstream ${v.url || 'https://github.com/owner/repo.git'}`,
      'git fetch upstream',
      `git switch ${v.branch || 'main'}`,
      `git merge upstream/${v.branch || 'main'}`,
    ],
    fields: [
      { key: 'url', label: '上游仓库地址', placeholder: 'https://github.com/owner/repo.git' },
      { key: 'branch', label: '主分支名', placeholder: 'main' },
    ],
  },
  {
    id: 'clean-branch',
    label: '清理已合并的本地分支',
    desc: '删掉已经合进主分支的本地分支',
    risk: 'careful',
    cmds: (v) => [
      `git switch ${v.branch || 'main'}`,
      'git pull',
      'git branch --merged | grep -v "\\*" | grep -v "main" | grep -v "master"',
      '# 确认上面的列表无误后，把 grep 换成 xargs 删除：',
      'git branch --merged | grep -v "\\*" | grep -v "main" | grep -v "master" | xargs -n 1 git branch -d',
    ],
    fields: [{ key: 'branch', label: '主分支名', placeholder: 'main' }],
  },
  {
    id: 'rebase-i',
    label: '整理最近几次提交',
    desc: '合并、改序、改信息，未推送的提交才建议做',
    risk: 'careful',
    cmds: (v) => [`git rebase -i HEAD~${v.count || '3'}`],
    fields: [{ key: 'count', label: '要整理的提交数', placeholder: '3' }],
  },
  {
    id: 'cherry-pick',
    label: '把某个提交搬到当前分支',
    desc: '只想拿另一条分支上的一次改动',
    risk: 'careful',
    cmds: (v) => [`git cherry-pick ${v.sha || '<commit-sha>'}`],
    fields: [{ key: 'sha', label: '提交 SHA', placeholder: 'a1b2c3d' }],
  },
  {
    id: 'tag-release',
    label: '打版本标签并推送',
    desc: '发版时标记一个版本点',
    risk: 'safe',
    cmds: (v) => [
      `git tag -a ${v.tag || 'v1.0.0'} -m "${v.msg || 'release'}"`,
      `git push origin ${v.tag || 'v1.0.0'}`,
    ],
    fields: [
      { key: 'tag', label: '标签名', placeholder: 'v1.0.0' },
      { key: 'msg', label: '标签说明', placeholder: '第一次正式发布' },
    ],
  },
  {
    id: 'rollback-file',
    label: '把某个文件恢复到上个版本',
    desc: '只回退单个文件，不影响其他改动',
    risk: 'careful',
    cmds: (v) => [`git checkout HEAD -- ${v.file || 'src/index.js'}`, '# 或用 git restore --source=HEAD -- <file>'],
    fields: [{ key: 'file', label: '文件路径', placeholder: 'src/index.js' }],
  },
  {
    id: 'force-safe',
    label: '安全地强制推送',
    desc: 'rebase 后需要强推，但避免覆盖同事的提交',
    risk: 'danger',
    cmds: (v) => [`git push --force-with-lease origin ${v.branch || 'main'}`],
    fields: [{ key: 'branch', label: '分支名', placeholder: 'feature/login' }],
  },
  {
    id: 'alias',
    label: '配置常用别名',
    desc: '把长命令缩写成两三个字母',
    risk: 'safe',
    cmds: () => [
      'git config --global alias.st status',
      'git config --global alias.co checkout',
      'git config --global alias.br branch',
      'git config --global alias.lg "log --oneline --graph --all --decorate"',
    ],
  },
  {
    id: 'bigfile',
    label: '找出仓库里的大文件',
    desc: '仓库莫名其妙很大时先定位元凶',
    risk: 'safe',
    cmds: () => [
      'git rev-list --objects --all | git cat-file --batch-check=%(objecttype) %(objectname) %(objectsize) %(rest) | awk \'$1=="blob"\' | sort -k3 -nr | head -20',
    ],
  },
];

const RISK: Record<string, { label: string; cls: string }> = {
  safe: { label: '安全', cls: 'badge-success' },
  careful: { label: '需确认', cls: 'badge-warning' },
  danger: { label: '有风险', cls: 'badge-error' },
};

export default function GitCommandGenTool() {
  const [id, setId] = useState('undo-commit');
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const recipe = RECIPES.find((r) => r.id === id) ?? RECIPES[0];
  const cmds = useMemo(() => recipe.cmds(values), [recipe, values]);
  const script = cmds.join('\n');

  return (
    <div class="space-y-4">
      <div>
        <span class="text-sm font-medium">想做什么</span>
        <div class="mt-2 grid gap-2 sm:grid-cols-2">
          {RECIPES.map((r) => (
            <button
              type="button"
              key={r.id}
              class={`rounded-xl border p-3 text-left transition ${
                id === r.id ? 'border-primary bg-primary/5' : 'border-base-300'
              }`}
              onClick={() => {
                setId(r.id);
                setValues({});
              }}
            >
              <span class="flex items-center gap-2">
                <span class="text-sm font-medium">{r.label}</span>
                <span class={`badge badge-xs ${RISK[r.risk].cls}`}>{RISK[r.risk].label}</span>
              </span>
              <span class="mt-0.5 block text-xs opacity-55 leading-snug">{r.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {recipe.fields && recipe.fields.length > 0 && (
        <div class="grid gap-4 sm:grid-cols-2">
          {recipe.fields.map((f) => (
            <label class="block" key={f.key}>
              <span class="text-sm font-medium">{f.label}</span>
              <input
                type="text"
                class="input input-bordered mt-1.5 w-full font-mono text-sm"
                placeholder={f.placeholder}
                value={values[f.key] ?? ''}
                onInput={(e) =>
                  setValues((prev) => ({ ...prev, [f.key]: (e.target as HTMLInputElement).value }))
                }
              />
            </label>
          ))}
        </div>
      )}

      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="flex items-center gap-2 text-sm font-medium">
            <span>命令</span>
            <span class={`badge badge-xs ${RISK[recipe.risk].cls}`}>{RISK[recipe.risk].label}</span>
          </span>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
            onClick={async () => {
              await copyText(script);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            }}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm whitespace-pre-wrap break-all">
          {script}
        </pre>
      </label>

      {recipe.risk === 'danger' && (
        <div class="rounded-xl border border-error/40 bg-error/5 p-4 text-sm">
          <strong class="text-error">这条命令会改写历史或丢弃改动。</strong>
          执行前先确认分支只有你一个人在用，必要时先
          <code class="mx-1">git branch backup/临时备份</code> 留一条退路。
        </div>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        命令在本地拼装，不会对你的仓库做任何操作。风险标注只是经验提示，
        真正执行前请先看懂每一行在做什么——尤其是带 --hard、--force 的那几条。
      </p>
    </div>
  );
}
