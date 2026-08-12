import { useState, useMemo, useRef } from 'preact/hooks';
import { TYPES } from './data';
import { copyText } from '@/tools/_shared/copy';

export default function CommitGen() {
  const [type, setType] = useState('feat');
  const [scope, setScope] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [breaking, setBreaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const output = useMemo(() => {
    const head = `${type}${scope.trim() ? `(${scope.trim()})` : ''}: ${subject.trim()}`;
    let out = head;
    if (body.trim()) out += `\n\n${body.trim()}`;
    if (breaking) out += `\n\nBREAKING CHANGE: ${body.trim() || subject.trim()}`;
    return out;
  }, [type, scope, subject, body, breaking]);

  const copy = async () => {
    if (!subject.trim()) return;
      await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* 左：表单 */}
      <div class="space-y-3">
        <label class="flex flex-col gap-1 text-xs">
          <span class="opacity-70">提交类型（type）</span>
          <select
            class="select select-bordered select-sm w-full"
            value={type}
            onChange={(e) => setType((e.target as HTMLSelectElement).value)}
          >
            {TYPES.map((t) => (
              <option value={t.v}>{t.v} — {t.desc}</option>
            ))}
          </select>
        </label>

        <label class="flex flex-col gap-1 text-xs">
          <span class="opacity-70">影响范围（scope，可选）</span>
          <input
            type="text"
            class="input input-bordered input-sm w-full"
            placeholder="如 auth / parser / core"
            value={scope}
            onInput={(e) => setScope((e.target as HTMLInputElement).value)}
          />
        </label>

        <label class="flex flex-col gap-1 text-xs">
          <span class="opacity-70">简短描述（subject，必填）</span>
          <input
            type="text"
            class="input input-bordered input-sm w-full"
            placeholder="如 支持微信登录"
            value={subject}
            onInput={(e) => setSubject((e.target as HTMLInputElement).value)}
          />
        </label>

        <label class="flex flex-col gap-1 text-xs">
          <span class="opacity-70">详细说明（body，可选，支持多行）</span>
          <textarea
            class="textarea textarea-bordered textarea-sm w-full"
            rows={3}
            placeholder="补充背景、动机、实现要点……"
            value={body}
            onInput={(e) => setBody((e.target as HTMLTextAreaElement).value)}
          />
        </label>

        <label class="flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={breaking}
            onInput={() => setBreaking((p) => !p)}
          />
          <span>包含 BREAKING CHANGE（破坏性变更）</span>
        </label>
      </div>

      {/* 右：预览 */}
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">提交信息预览</span>
          <button
            type="button"
            class={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
            onClick={copy}
            disabled={!subject.trim()}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="max-h-[360px] overflow-auto rounded-xl bg-base-300 p-3 font-mono text-xs leading-relaxed">
          {subject.trim() ? output : <span class="opacity-40">填写上方表单，这里会实时生成 Conventional Commits 格式</span>}
        </pre>

        <div class="rounded-xl bg-base-200 p-3">
          <p class="mb-2 text-xs font-semibold opacity-70">类型速查表</p>
          <div class="overflow-x-auto">
            <table class="table table-xs">
              <thead>
                <tr><th>type</th><th>含义</th><th>示例</th></tr>
              </thead>
              <tbody>
                {TYPES.map((t) => (
                  <tr>
                    <td class="font-mono">{t.v}</td>
                    <td>{t.desc}</td>
                    <td class="font-mono opacity-60">{t.ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
