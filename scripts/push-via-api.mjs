#!/usr/bin/env node
/**
 * push-via-api.mjs —— github.com:443 不通时，走 api.github.com 推送 HEAD 提交的兜底通道
 *
 * 背景（2026-11-03 实测）：本机到 github.com 的 443 会被整段阻断（TCP 都连不上），
 * 但 api.github.com 正常（200/0.3s）。此时 `git push` 必然失败，可改用 GitHub
 * Git Data API 逐对象上传：blob → tree → commit → 更新分支引用。
 *
 * 用法：
 *   node scripts/push-via-api.mjs            # 推送当前 HEAD
 *   node scripts/push-via-api.mjs --dry-run  # 只打印计划，不写远端
 *
 * 前提与限制：
 *   1. 只推送 **HEAD 一个提交**，且其父提交必须正是远端分支当前 HEAD（快进）。
 *      多个提交请分次执行，或等 git 通道恢复。
 *   2. 远端 commit 的 SHA 与本地**不会相同**：GitHub 服务端会重写 author/committer
 *      元数据（实测给的是 UTC +0000 时间戳）。内容（tree/blob）逐字节一致，
 *      但提交哈希会分叉 —— 之后 git 通道恢复时需执行一次：
 *         git fetch origin && git reset --hard origin/master
 *      让本地历史与远端重合。
 *   3. token 取本机 Git Credential Manager 里 github.com 的密码（也接受 GH_TOKEN 环境变量）。
 */
import { execFileSync } from 'node:child_process';

const OWNER = 'wangcai-zhao';
const REPO = 'mokakit-website';
const BRANCH = 'master';
const DRY = process.argv.includes('--dry-run');

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const token =
  process.env.GH_TOKEN ||
  (() => {
    const out = execFileSync(
      'git-credential-manager',
      ['get'],
      { input: 'protocol=https\nhost=github.com\n', encoding: 'utf8' },
    );
    const m = out.match(/^password=(.+)$/m);
    return m ? m[1].trim() : '';
  })();

if (!token) {
  console.error('✗ 拿不到 github.com token（GH_TOKEN 未设，GCM 也无记录）');
  process.exit(1);
}

const api = async (path, init = {}) => {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'mokakit-push-via-api',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    console.error(`✗ ${init.method || 'GET'} ${path} → ${res.status}`);
    console.error(JSON.stringify(body).slice(0, 500));
    process.exit(1);
  }
  return body;
};

const head = git('rev-parse', 'HEAD');
const headTree = git('rev-parse', 'HEAD^{tree}');
const parents = git('rev-list', '--parents', '-n', '1', 'HEAD').split(' ').slice(1);
if (parents.length !== 1) {
  console.error(`✗ HEAD 有 ${parents.length} 个父提交，本脚本只支持单父（普通提交）`);
  process.exit(1);
}
const parent = parents[0];

const remoteRef = await api(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
const remoteSha = remoteRef.object.sha;

console.log('本地 HEAD :', head);
console.log('父提交    :', parent);
console.log('远端 HEAD :', remoteSha);

if (remoteSha === head) {
  console.log('✓ 远端已与本地一致，无需推送');
  process.exit(0);
}

// 远端已包含同样内容（例如上次经 API 推送过，只是 SHA 不同）→ 不再重复造提交
const remoteCommit = await api(`/repos/${OWNER}/${REPO}/git/commits/${remoteSha}`);
if (remoteCommit.tree.sha === headTree) {
  console.log('✓ 远端 HEAD 的 tree 与本地 HEAD 完全相同（内容已同步，仅 SHA 分叉）');
  console.log('  待 git 通道恢复后执行：git fetch origin && git reset --hard origin/master');
  process.exit(0);
}

if (remoteSha !== parent) {
  console.error('✗ 远端 HEAD 不是本地父提交，非快进。请先恢复 git 通道并执行 git pull --rebase');
  process.exit(1);
}

// 1) 本地相对父提交改动的文件 → 逐个上传 blob
const changed = git('diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD')
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);
console.log('改动文件  :', changed.join(', ') || '(无)');

const entries = [];
for (const path of changed) {
  const blobSha = git('rev-parse', `HEAD:${path}`);
  const bytes = execFileSync('git', ['cat-file', 'blob', blobSha]);
  if (DRY) {
    console.log(`  [dry] blob ${path} ${blobSha}`);
  } else {
    const blob = await api(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: bytes.toString('base64'), encoding: 'base64' }),
    });
    if (blob.sha !== blobSha) {
      console.error(`✗ blob 哈希不一致（本地 ${blobSha} / 远端 ${blob.sha}），中止`);
      process.exit(1);
    }
    console.log(`  blob ${path} ${blob.sha} ✓`);
  }
  entries.push({ path, mode: '100644', type: 'blob', sha: blobSha });
}

// 2) 基于父提交的 tree 建新 tree
const baseTree = git('rev-parse', `${parent}^{tree}`);
const message = execFileSync('git', ['cat-file', 'commit', 'HEAD'], { encoding: 'utf8' }).split('\n\n').slice(1).join('\n\n');

if (DRY) {
  console.log('[dry] 将基于', baseTree.slice(0, 8), '建 tree，再建 commit 并快进', BRANCH);
  process.exit(0);
}

const newTree = await api(`/repos/${OWNER}/${REPO}/git/trees`, {
  method: 'POST',
  body: JSON.stringify({ base_tree: baseTree, tree: entries }),
});
if (newTree.sha !== headTree) {
  console.error(`✗ tree 不一致（本地 ${headTree} / 远端 ${newTree.sha}），中止`);
  process.exit(1);
}
console.log('tree      :', newTree.sha, '✓');

// 3) 建 commit（GitHub 会重写 author/committer，SHA 必然与本地不同）
const authorRaw = execFileSync('git', ['cat-file', 'commit', 'HEAD'], { encoding: 'utf8' })
  .split('\n')
  .find((l) => l.startsWith('author '))
  .slice(7);
const m = authorRaw.match(/^(.*) <([^>]*)> (\d+) ([+-]\d{4})$/);
const newCommit = await api(`/repos/${OWNER}/${REPO}/git/commits`, {
  method: 'POST',
  body: JSON.stringify({
    message,
    tree: newTree.sha,
    parents: [parent],
    author: { name: m[1], email: m[2], date: new Date(Number(m[3]) * 1000).toISOString() },
  }),
});
console.log('远端 commit:', newCommit.sha, newCommit.sha === head ? '(与本地一致)' : '(SHA 与本地不同，内容一致)');

// 4) 快进分支引用
const ref = await api(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
  method: 'PATCH',
  body: JSON.stringify({ sha: newCommit.sha, force: false }),
});
console.log('✓ 分支已更新:', ref.object.sha);
console.log('  待 git 通道恢复后执行：git fetch origin && git reset --hard origin/master');
