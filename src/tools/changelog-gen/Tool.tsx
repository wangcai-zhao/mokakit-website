import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const CATEGORIES = [
  { key: 'added', label: 'Added', hint: '新增的功能' },
  { key: 'changed', label: 'Changed', hint: '变更的功能' },
  { key: 'deprecated', label: 'Deprecated', hint: '即将移除的功能' },
  { key: 'removed', label: 'Removed', hint: '已移除的功能' },
  { key: 'fixed', label: 'Fixed', hint: '修复的缺陷' },
  { key: 'security', label: 'Security', hint: '安全相关' },
] as const;

type CatKey = (typeof CATEGORIES)[number]['key'];

const TPL = {
  bug: `### 描述\n\n\n### 复现步骤\n1.\n2.\n\n### 期望行为\n\n\n### 实际行为\n\n\n### 环境\n- 系统 / 版本：\n- 复现概率：`,
  feature: `### 功能描述\n\n\n### 使用场景 / 动机\n\n\n### 预期行为\n\n\n### 备选方案\n`,
  pr: `### 改动说明\n\n\n### 关联 Issue\n\n\n### 检查清单\n- [ ] 自测通过\n- [ ] 文档已更新\n- [ ] 无破坏性变更`,
};

export default function ChangelogGen() {
  const [tab, setTab] = useState<'changelog' | 'templates'>('changelog');
  const [version, setVersion] = useState('1.0.0');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState<Record<CatKey, string>>({
    added: '', changed: '', deprecated: '', removed: '', fixed: '', security: '',
  });
  const [tplType, setTplType] = useState<keyof typeof TPL>('bug');
  const [tplText, setTplText] = useState<string>(TPL.bug);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const changelog = useMemo(() => {
    const blocks = CATEGORIES.filter((c) => entries[c.key].trim()).map((c) => {
      const lines = entries[c.key].split('\n').map((l) => l.trim()).filter(Boolean);
      return `### ${c.label}\n${lines.map((l) => `- ${l}`).join('\n')}`;
    });
    const body = blocks.length ? `\n\n${blocks.join('\n\n')}` : '';
    return `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).
${body ? `\n\n## [${version.trim() || 'x.y.z'}] - ${date.trim() || 'YYYY-MM-DD'}${body}` : ''}
`;
  }, [entries, version, date]);

  const copy = async (text: string, allowEmpty = false) => {
    if (!text.trim() && !allowEmpty) return;
      await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const download = (text: string, name: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const setTpl = (k: keyof typeof TPL) => {
    setTplType(k);
    setTplText(TPL[k]);
  };

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap gap-1.5">
        <button type="button" class={`btn btn-xs ${tab === 'changelog' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('changelog')}>CHANGELOG.md</button>
        <button type="button" class={`btn btn-xs ${tab === 'templates' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('templates')}>Issue / PR 模板</button>
      </div>

      {tab === 'changelog' ? (
        <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
              <label class="flex flex-col gap-1 text-xs">
                <span class="opacity-70">版本号</span>
                <input type="text" class="input input-bordered input-sm" value={version} onInput={(e) => setVersion((e.target as HTMLInputElement).value)} placeholder="1.0.0" />
              </label>
              <label class="flex flex-col gap-1 text-xs">
                <span class="opacity-70">发布日期</span>
                <input type="text" class="input input-bordered input-sm" value={date} onInput={(e) => setDate((e.target as HTMLInputElement).value)} placeholder="YYYY-MM-DD" />
              </label>
            </div>
            {CATEGORIES.map((c) => (
              <label class="flex flex-col gap-1 text-xs" key={c.key}>
                <span class="opacity-70">{c.label} — {c.hint}（每行一条）</span>
                <textarea
                  class="textarea textarea-bordered textarea-sm w-full"
                  rows={2}
                  value={entries[c.key]}
                  onInput={(e) => setEntries((p) => ({ ...p, [c.key]: (e.target as HTMLTextAreaElement).value }))}
                  placeholder={'如：支持微信登录'}
                />
              </label>
            ))}
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">CHANGELOG.md 预览</span>
              <div class="flex gap-2">
                <button type="button" class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`} onClick={() => copy(changelog)} disabled={!changelog.trim()}>复制</button>
                <button type="button" class="btn btn-sm btn-primary" onClick={() => download(changelog, 'CHANGELOG.md')} disabled={!changelog.trim()}>下载</button>
              </div>
            </div>
            <pre class="max-h-[440px] overflow-auto rounded-xl bg-base-300 p-3 font-mono text-xs leading-relaxed">{changelog}</pre>
          </div>
        </div>
      ) : (
        <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div class="space-y-3">
            <div class="flex flex-wrap gap-1.5">
              <button type="button" class={`btn btn-xs ${tplType === 'bug' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTpl('bug')}>Bug 报告</button>
              <button type="button" class={`btn btn-xs ${tplType === 'feature' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTpl('feature')}>功能建议</button>
              <button type="button" class={`btn btn-xs ${tplType === 'pr' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTpl('pr')}>PR 模板</button>
            </div>
            <p class="text-xs opacity-60">把生成内容保存为 <code>.github/ISSUE_TEMPLATE/xxx.md</code> 或 <code>.github/PULL_REQUEST_TEMPLATE.md</code> 即可在仓库生效。</p>
            <label class="flex flex-col gap-1 text-xs">
              <span class="opacity-70">模板内容（可编辑）</span>
              <textarea
                class="textarea textarea-bordered textarea-sm w-full"
                rows={12}
                value={tplText}
                onInput={(e) => setTplText((e.target as HTMLTextAreaElement).value)}
              />
            </label>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">预览</span>
              <div class="flex gap-2">
                <button type="button" class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`} onClick={() => copy(tplText)}>复制</button>
                <button type="button" class="btn btn-sm btn-primary" onClick={() => download(tplText, tplType === 'pr' ? 'PULL_REQUEST_TEMPLATE.md' : `issue-${tplType}.md`)}>下载</button>
              </div>
            </div>
            <pre class="max-h-[440px] overflow-auto rounded-xl bg-base-300 p-3 font-mono text-xs leading-relaxed">{tplText}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
