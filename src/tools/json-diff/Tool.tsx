import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type ChangeKind = 'added' | 'removed' | 'changed' | 'same';

interface Change {
  path: string;
  kind: ChangeKind;
  left?: string;
  right?: string;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** 递归比对，路径用 JSON Pointer 风格（a.b[0].c） */
function walk(a: unknown, b: unknown, path: string, out: Change[]): void {
  if (JSON.stringify(a) === JSON.stringify(b)) {
    out.push({ path, kind: 'same', left: JSON.stringify(a), right: JSON.stringify(b) });
    return;
  }
  if (isObj(a) && isObj(b)) {
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    for (const k of keys) {
      const child = path ? `${path}.${k}` : k;
      if (!(k in a)) {
        out.push({ path: child, kind: 'added', right: JSON.stringify(b[k]) });
      } else if (!(k in b)) {
        out.push({ path: child, kind: 'removed', left: JSON.stringify(a[k]) });
      } else {
        walk(a[k], b[k], child, out);
      }
    }
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i += 1) {
      const child = `${path}[${i}]`;
      if (i >= a.length) out.push({ path: child, kind: 'added', right: JSON.stringify(b[i]) });
      else if (i >= b.length) out.push({ path: child, kind: 'removed', left: JSON.stringify(a[i]) });
      else walk(a[i], b[i], child, out);
    }
    return;
  }
  out.push({ path, kind: 'changed', left: JSON.stringify(a), right: JSON.stringify(b) });
}

const LABEL: Record<ChangeKind, string> = {
  added: '新增',
  removed: '删除',
  changed: '修改',
  same: '未变',
};

const SAMPLE_A = '{\n  "name": "mokakit",\n  "version": "0.9.11",\n  "tags": ["tools", "astro"]\n}';
const SAMPLE_B = '{\n  "name": "mokakit",\n  "version": "0.9.12",\n  "tags": ["tools", "astro", "mcp"]\n}';

export default function JsonDiffTool() {
  const [left, setLeft] = useState(SAMPLE_A);
  const [right, setRight] = useState(SAMPLE_B);
  const [hideSame, setHideSame] = useState(true);
  const [copied, setCopied] = useState(false);

  const { changes, error } = useMemo(() => {
    try {
      const a = left.trim() ? JSON.parse(left) : null;
      const b = right.trim() ? JSON.parse(right) : null;
      const out: Change[] = [];
      walk(a, b, '', out);
      return { changes: out, error: '' };
    } catch (e) {
      return { changes: [] as Change[], error: `JSON 解析失败：${(e as Error).message}` };
    }
  }, [left, right]);

  const visible = hideSame ? changes.filter((c) => c.kind !== 'same') : changes;
  const counts = {
    added: changes.filter((c) => c.kind === 'added').length,
    removed: changes.filter((c) => c.kind === 'removed').length,
    changed: changes.filter((c) => c.kind === 'changed').length,
  };

  const report = visible
    .map((c) => {
      if (c.kind === 'added') return `+ ${c.path || '$'} = ${c.right}`;
      if (c.kind === 'removed') return `- ${c.path || '$'} = ${c.left}`;
      if (c.kind === 'changed') return `~ ${c.path || '$'}: ${c.left} → ${c.right}`;
      return `  ${c.path || '$'}: ${c.left}`;
    })
    .join('\n');

  return (
    <div class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">原始 JSON（左）</span>
          <textarea
            class="textarea textarea-bordered mt-1.5 w-full font-mono text-sm"
            rows={10}
            value={left}
            onInput={(e) => setLeft((e.target as HTMLTextAreaElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">对比 JSON（右）</span>
          <textarea
            class="textarea textarea-bordered mt-1.5 w-full font-mono text-sm"
            rows={10}
            value={right}
            onInput={(e) => setRight((e.target as HTMLTextAreaElement).value)}
          />
        </label>
      </div>

      {error && <p class="text-sm text-error">{error}</p>}

      <label class="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          class="checkbox checkbox-sm"
          checked={hideSame}
          onChange={(e) => setHideSame((e.target as HTMLInputElement).checked)}
        />
        只看有变化的部分
      </label>

      <div class="flex flex-wrap gap-2">
        <span class="badge badge-success badge-outline">新增 {counts.added}</span>
        <span class="badge badge-error badge-outline">删除 {counts.removed}</span>
        <span class="badge badge-warning badge-outline">修改 {counts.changed}</span>
      </div>

      {changes.length > 0 && (
        <>
          <div class="overflow-x-auto rounded-xl border border-base-300">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>类型</th>
                  <th>路径</th>
                  <th>左侧</th>
                  <th>右侧</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c, i) => (
                  <tr key={i}>
                    <td>
                      <span
                        class={`badge badge-xs ${
                          c.kind === 'added'
                            ? 'badge-success'
                            : c.kind === 'removed'
                              ? 'badge-error'
                              : c.kind === 'changed'
                                ? 'badge-warning'
                                : 'badge-ghost'
                        }`}
                      >
                        {LABEL[c.kind]}
                      </span>
                    </td>
                    <td class="font-mono text-xs">{c.path || '$'}</td>
                    <td class="max-w-[14rem] truncate font-mono text-xs opacity-70">
                      {c.kind === 'added' ? '—' : c.left}
                    </td>
                    <td class="max-w-[14rem] truncate font-mono text-xs opacity-70">
                      {c.kind === 'removed' ? '—' : c.right}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
              onClick={async () => {
                await copyText(report);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              }}
            >
              {copied ? '已复制' : '复制差异清单'}
            </button>
          </div>
        </>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        比对在浏览器本地完成，两份 JSON 都不会上传。数组按下标一一比对，
        所以在中间插入元素会表现为后面全部错位——这种场景建议先排序再比。
        路径用 a.b[0].c 的形式表示，方便直接定位到字段。
      </p>
    </div>
  );
}
