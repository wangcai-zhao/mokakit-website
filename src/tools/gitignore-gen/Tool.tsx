import { useState, useMemo, useRef } from 'preact/hooks';
import { GROUPS, TEMPLATES, PRESET_COMMON, type GitignoreGroup } from './data';
import { copyText } from '@/tools/_shared/copy';

const HEADER = `# 本文件由 摩卡工具箱 · .gitignore 生成器 生成
# https://mokakit.com/tools/gitignore-gen/
`;

export default function GitignoreGen() {
  const [selected, setSelected] = useState<Set<string>>(new Set(PRESET_COMMON));
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<GitignoreGroup | 'all'>('all');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const q = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      TEMPLATES.filter(
        (t) =>
          (group === 'all' || t.group === group) &&
          (!q || t.label.toLowerCase().includes(q) || t.id.includes(q)),
      ),
    [group, q],
  );

  const output = useMemo(() => {
    if (selected.size === 0) return '';
    const picked = TEMPLATES.filter((t) => selected.has(t.id));
    const blocks = GROUPS.flatMap((g) => {
      const inGroup = picked.filter((t) => t.group === g.id);
      return inGroup.map((t) => `# ===== ${t.label} =====\n${t.content}`);
    });
    return HEADER + `\n${blocks.join('\n\n')}\n`;
  }, [selected]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectGroup = (g: GitignoreGroup) => {
    const ids = TEMPLATES.filter((t) => t.group === g).map((t) => t.id);
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = ids.every((id) => next.has(id));
      ids.forEach((id) => (allOn ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const copy = async () => {
    if (!output) return;
      await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.gitignore';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const chips: { id: GitignoreGroup | 'all'; name: string }[] = [
    { id: 'all', name: '全部' },
    ...GROUPS.map((g) => ({ id: g.id, name: g.name })),
  ];

  return (
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* 左：选择区 */}
      <div class="space-y-3">
        <div class="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              type="button"
              class={`btn btn-xs ${group === c.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setGroup(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <input
          type="text"
          class="input input-bordered input-sm w-full"
          placeholder="搜索模板，如 node / python / vscode"
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
        />

        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn btn-xs btn-ghost" onClick={() => setSelected(new Set(PRESET_COMMON))}>
            常用预设
          </button>
          <button type="button" class="btn btn-xs btn-ghost" onClick={() => setSelected(new Set())}>
            清空
          </button>
        </div>

        <div class="max-h-[420px] space-y-4 overflow-y-auto pr-1">
          {GROUPS.filter((g) => group === 'all' || group === g.id)
            .map((g) => {
              const items = visible.filter((t) => t.group === g.id);
              if (items.length === 0) return null;
              const allOn = items.every((t) => selected.has(t.id));
              return (
                <div key={g.id}>
                  <div class="mb-1.5 flex items-center justify-between">
                    <span class="text-xs font-semibold opacity-70">{g.name}</span>
                    <button
                      type="button"
                      class="link link-primary link-hover text-[11px]"
                      onClick={() => selectGroup(g.id)}
                    >
                      {allOn ? '取消本组' : '全选本组'}
                    </button>
                  </div>
                  <div class="flex flex-col gap-1">
                    {items.map((t) => (
                      <label class="flex cursor-pointer items-center gap-2 rounded-lg bg-base-200 px-2.5 py-1.5 text-sm hover:bg-base-300">
                        <input
                          type="checkbox"
                          class="checkbox checkbox-sm"
                          checked={selected.has(t.id)}
                          onInput={() => toggle(t.id)}
                        />
                        <span>{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 右：预览区 */}
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">
            已选 {selected.size} 项
          </span>
          <div class="flex gap-2">
            <button
              type="button"
              class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
              onClick={copy}
              disabled={!output}
            >
              {copied ? '已复制' : '复制'}
            </button>
            <button type="button" class="btn btn-sm btn-primary" onClick={download} disabled={!output}>
              下载 .gitignore
            </button>
          </div>
        </div>

        <pre class="max-h-[460px] overflow-auto rounded-xl bg-base-300 p-3 font-mono text-xs leading-relaxed">
          {output || <span class="opacity-40">勾选左侧模板，这里会实时生成 .gitignore 内容</span>}
        </pre>

        <p class="text-xs opacity-55 leading-relaxed">
          生成完全在浏览器本地完成，不上传任何数据。规则来自社区通用 gitignore 片段，按项目技术栈勾选组合即可；下载后放到仓库根目录生效。
        </p>
      </div>
    </div>
  );
}
