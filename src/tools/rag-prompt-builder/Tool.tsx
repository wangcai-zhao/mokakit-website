import { useState } from 'preact/hooks';

const CITATIONS = [
  { id: 'bracket', label: '方括号 [1]', text: '在引用处用 [1][2] 标注资料序号' },
  { id: 'footnote', label: '脚注', text: '在段落末尾以脚注形式标注出处' },
  { id: 'inline', label: '行内说明', text: '在句末用「（据资料 N）」行内标注' },
];

export default function RagPromptBuilder() {
  const [role, setRole] = useState('你是一个严谨的知识库问答助手');
  const [instr, setInstr] = useState('只依据下面提供的资料回答用户问题，资料里没有的就如实说不知道');
  const [ctxVar, setCtxVar] = useState('{context}');
  const [qVar, setQVar] = useState('{question}');
  const [cite, setCite] = useState('bracket');
  const [grounded, setGrounded] = useState(true);
  const [copied, setCopied] = useState(false);

  const citeText = CITATIONS.find((c) => c.id === cite)?.text ?? '';

  const build = () => {
    const lines = [
      `# 角色\n${role.trim() || '你是一个知识库问答助手'}`,
      `# 任务\n${instr.trim() || '基于资料回答用户问题'}`,
    ];
    if (grounded) lines.push('# 约束\n只依据下方「资料」作答，资料未涵盖的内容明确说明不知道，不得编造。');
    lines.push(`# 引用要求\n${citeText}`);
    lines.push(`# 资料\n${ctxVar}\n\n# 用户问题\n${qVar}`);
    return lines.join('\n\n');
  };

  const text = build();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div class="space-y-3">
      <label class="form-control">
        <span class="label-text text-xs mb-1">角色</span>
        <input class="input input-sm input-bordered" value={role} onInput={(e) => setRole((e.target as HTMLInputElement).value)} />
      </label>
      <label class="form-control">
        <span class="label-text text-xs mb-1">任务指令</span>
        <textarea class="textarea textarea-bordered textarea-sm h-16" value={instr} onInput={(e) => setInstr((e.target as HTMLTextAreaElement).value)} />
      </label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="form-control">
          <span class="label-text text-xs mb-1">上下文占位符</span>
          <input class="input input-sm input-bordered" value={ctxVar} onInput={(e) => setCtxVar((e.target as HTMLInputElement).value)} />
        </label>
        <label class="form-control">
          <span class="label-text text-xs mb-1">问题占位符</span>
          <input class="input input-sm input-bordered" value={qVar} onInput={(e) => setQVar((e.target as HTMLInputElement).value)} />
        </label>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <label class="form-control w-48">
          <span class="label-text text-xs mb-1">引用格式</span>
          <select class="select select-sm select-bordered" value={cite} onChange={(e) => setCite((e.target as HTMLSelectElement).value)}>
            {CITATIONS.map((c) => (
              <option value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label class="label cursor-pointer gap-2 mt-5">
          <span class="label-text text-xs">只依据资料、未知就说不知道</span>
          <input type="checkbox" class="checkbox checkbox-sm" checked={grounded} onChange={(e) => setGrounded((e.target as HTMLInputElement).checked)} />
        </label>
      </div>

      <div class="divider my-1">生成结果</div>
      <div class="relative">
        <pre class="mockup-code text-xs max-h-80 overflow-auto"><code>{text}</code></pre>
        <button class="btn btn-xs btn-primary absolute right-2 top-2" onClick={copy}>{copied ? '已复制' : '复制'}</button>
      </div>
      <p class="text-xs opacity-60">运行时把 {ctxVar} 替换为检索文本、{qVar} 替换为用户问题再发送。</p>
    </div>
  );
}
