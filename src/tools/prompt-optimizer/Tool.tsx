import { useState } from 'preact/hooks';

interface Fix {
  label: string;
  hint: string;
  test: (s: string) => boolean;
}

const CHECKS: Fix[] = [
  { label: '明确角色', hint: '指定模型以什么身份回答', test: (s) => /你(是|扮演|作为)|你是|assume the role|act as/i.test(s) },
  { label: '写清目标', hint: '说明要解决什么', test: (s) => s.trim().length > 12 },
  { label: '给上下文', hint: '补充背景信息', test: (s) => /背景|上下文|context|例如|比如|已知/i.test(s) },
  { label: '指定格式', hint: '约定输出结构', test: (s) => /格式|列表|markdown|分点|json|表格|bullet/i.test(s) },
  { label: '给示例', hint: '提供 few-shot 样例', test: (s) => /示例|例子|例如|e\.g\.|样例|input:|输出/i.test(s) },
  { label: '设边界', hint: '说明不许做什么', test: (s) => /不要|禁止|不许|避免|只|仅|不编造|don'?t|never/i.test(s) },
];

const APPEND = (s: string, label: string, content: string) =>
  s.trim() ? `${s.trim()}\n\n${label}：${content}` : `${label}：${content}`;

export default function PromptOptimizer() {
  const [raw, setRaw] = useState('');
  const [out, setOut] = useState('');
  const [missing, setMissing] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const optimize = () => {
    const s = raw.trim();
    if (!s) {
      setOut('');
      setMissing([]);
      return;
    }
    const miss = CHECKS.filter((c) => !c.test(s)).map((c) => c.label);
    setMissing(miss);

    let result = s;
    const add: Record<string, string> = {
      '明确角色': '请以相关领域专家的视角回答。',
      '给上下文': '请结合我提供的背景信息作答。',
      '指定格式': '请用清晰的结构化格式（如分点 / 表格）输出。',
      '给示例': '如有必要，先给一个简短示例再展开。',
      '设边界': '只依据已知信息回答，不确定就明确说明，不要编造。',
    };
    if (miss.includes('明确角色')) result = APPEND(result, '角色', add['明确角色']);
    if (miss.includes('给上下文')) result = APPEND(result, '上下文', add['给上下文']);
    if (miss.includes('指定格式')) result = APPEND(result, '输出格式', add['指定格式']);
    if (miss.includes('给示例')) result = APPEND(result, '示例', add['给示例']);
    if (miss.includes('设边界')) result = APPEND(result, '边界', add['设边界']);
    if (miss.includes('写清目标') && s.length <= 12) result = `${s}（请尽量把目标说具体，便于稳定产出）`;
    setOut(result);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div class="space-y-4">
      <label class="form-control">
        <span class="label-text text-xs mb-1">原始提示词</span>
        <textarea
          class="textarea textarea-bordered textarea-sm h-28"
          placeholder="把随手写的提示词贴进来"
          value={raw}
          onInput={(e) => setRaw((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <button class="btn btn-primary btn-sm" onClick={optimize} disabled={!raw.trim()}>
        优化
      </button>

      {missing.length > 0 && (
        <div class="alert alert-warning text-xs">
          本工具已自动补全以下缺失项：{missing.join('、')}。
        </div>
      )}

      {out && (
        <div class="relative">
          <pre class="mockup-code text-xs max-h-80 overflow-auto"><code>{out}</code></pre>
          <button class="btn btn-xs btn-primary absolute right-2 top-2" onClick={copy}>
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      )}
    </div>
  );
}
