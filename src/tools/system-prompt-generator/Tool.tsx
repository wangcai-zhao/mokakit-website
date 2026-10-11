import { useState } from 'preact/hooks';

const TONES = ['专业严谨', '亲切口语', '简洁直接', '耐心引导', '创意活泼'];

export default function SystemPromptGenerator() {
  const [role, setRole] = useState('');
  const [goal, setGoal] = useState('');
  const [constraints, setConstraints] = useState('');
  const [tone, setTone] = useState(TONES[0]);
  const [fmt, setFmt] = useState('');
  const [copied, setCopied] = useState(false);

  const build = () => {
    const parts: string[] = [];
    if (role.trim()) parts.push(`# 角色\n你是${role.trim()}。`);
    if (goal.trim()) parts.push(`# 目标\n${goal.trim()}`);
    if (constraints.trim()) parts.push(`# 约束\n${constraints.trim()}`);
    parts.push(`# 语气\n回复保持${tone}的语气。`);
    if (fmt.trim()) parts.push(`# 输出格式\n${fmt.trim()}`);
    return parts.join('\n\n');
  };

  const text = build();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 忽略复制失败 */
    }
  };

  return (
    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="form-control">
          <span class="label-text text-xs mb-1">角色（它是谁）</span>
          <input
            class="input input-sm input-bordered"
            placeholder="如：资深前端工程师"
            value={role}
            onInput={(e) => setRole((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="form-control">
          <span class="label-text text-xs mb-1">语气风格</span>
          <select
            class="select select-sm select-bordered"
            value={tone}
            onChange={(e) => setTone((e.target as HTMLSelectElement).value)}
          >
            {TONES.map((t) => (
              <option value={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>

      <label class="form-control">
        <span class="label-text text-xs mb-1">任务目标</span>
        <textarea
          class="textarea textarea-bordered textarea-sm h-20"
          placeholder="它要解决的核心任务是什么"
          value={goal}
          onInput={(e) => setGoal((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <label class="form-control">
        <span class="label-text text-xs mb-1">约束条件（不许做 / 必须遵守）</span>
        <textarea
          class="textarea textarea-bordered textarea-sm h-20"
          placeholder="每行一条，如：只回答中文 / 不编造数据"
          value={constraints}
          onInput={(e) => setConstraints((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <label class="form-control">
        <span class="label-text text-xs mb-1">输出格式（可选）</span>
        <textarea
          class="textarea textarea-bordered textarea-sm h-16"
          placeholder="如：用 Markdown 分点回答"
          value={fmt}
          onInput={(e) => setFmt((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <div class="divider my-1">生成结果</div>

      <div class="relative">
        <pre class="mockup-code text-xs max-h-80 overflow-auto"><code>{text || '在上方填写后，这里会实时生成系统提示词…'}</code></pre>
        <button class="btn btn-xs btn-primary absolute right-2 top-2" onClick={copy} disabled={!text}>
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <p class="text-xs opacity-60">复制后粘贴进 ChatGPT / Claude / Kimi 的「系统提示词 / 自定义指令」框即可。</p>
    </div>
  );
}
