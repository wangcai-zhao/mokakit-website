import { useState } from 'preact/hooks';

export default function AgentRoleDesigner() {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [persona, setPersona] = useState('');
  const [goal, setGoal] = useState('');
  const [boundary, setBoundary] = useState('');
  const [tools, setTools] = useState('');
  const [copied, setCopied] = useState(false);

  const build = () => {
    const lines: string[] = [];
    lines.push(`## 智能体：${name.trim() || '未命名'}`);
    if (domain.trim()) lines.push(`**领域**：${domain.trim()}`);
    if (persona.trim()) lines.push(`**性格**：${persona.trim()}`);
    if (goal.trim()) lines.push(`**目标**：\n${goal.trim()}`);
    if (boundary.trim()) lines.push(`**边界（绝不）**：\n${boundary.trim()}`);
    if (tools.trim()) lines.push(`**被授予的工具**：\n${tools.trim().split(/[\n,，]/).map((t) => t.trim()).filter(Boolean).map((t) => `- ${t}`).join('\n')}`);
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
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="form-control">
          <span class="label-text text-xs mb-1">名称</span>
          <input class="input input-sm input-bordered" placeholder="如：财报分析员" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
        </label>
        <label class="form-control">
          <span class="label-text text-xs mb-1">领域</span>
          <input class="input input-sm input-bordered" placeholder="如：金融 / 客服" value={domain} onInput={(e) => setDomain((e.target as HTMLInputElement).value)} />
        </label>
      </div>
      <label class="form-control">
        <span class="label-text text-xs mb-1">性格基调</span>
        <input class="input input-sm input-bordered" placeholder="如：严谨、话少、爱给数据" value={persona} onInput={(e) => setPersona((e.target as HTMLInputElement).value)} />
      </label>
      <label class="form-control">
        <span class="label-text text-xs mb-1">目标</span>
        <textarea class="textarea textarea-bordered textarea-sm h-16" value={goal} onInput={(e) => setGoal((e.target as HTMLTextAreaElement).value)} />
      </label>
      <label class="form-control">
        <span class="label-text text-xs mb-1">边界（绝不做什么）</span>
        <textarea class="textarea textarea-bordered textarea-sm h-16" placeholder="每行 / 逗号分隔" value={boundary} onInput={(e) => setBoundary((e.target as HTMLTextAreaElement).value)} />
      </label>
      <label class="form-control">
        <span class="label-text text-xs mb-1">被授予的工具</span>
        <textarea class="textarea textarea-bordered textarea-sm h-16" placeholder="如：搜索、读文件、发邮件（逗号或换行分隔）" value={tools} onInput={(e) => setTools((e.target as HTMLTextAreaElement).value)} />
      </label>

      <div class="divider my-1">角色卡</div>
      <div class="relative">
        <pre class="mockup-code text-xs max-h-80 overflow-auto"><code>{text || '填写后生成智能体角色卡…'}</code></pre>
        <button class="btn btn-xs btn-primary absolute right-2 top-2" onClick={copy} disabled={!text}>{copied ? '已复制' : '复制'}</button>
      </div>
    </div>
  );
}
