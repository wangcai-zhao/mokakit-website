import { useState } from 'preact/hooks';

interface Rule {
  re: RegExp;
  level: '高' | '中' | '低';
  desc: string;
}

const RULES: Rule[] = [
  { re: /忽略(之前|以上|前面|所有|先前).{0,6}?(指令|提示|规则|要求|内容)/i, level: '高', desc: '指令覆盖：试图让模型丢弃既定指令' },
  { re: /(你是|扮演|作为).{0,10}?(dan|无限制|越狱|jailbreak|无任何限制)/i, level: '高', desc: '角色劫持：要求切换成不受约束的角色' },
  { re: /(system\s*prompt|系统提示|开发者指令|developer\s*mode)/i, level: '高', desc: '泄露试探：试图套取系统提示词' },
  { re: /(输出|打印|复述|repeat).{0,6}?(完整|original|原始).{0,6}?(提示|prompt|instruction)/i, level: '中', desc: '提示词回显：要求复述内部提示' },
  { re: /(忘记|无视|抛弃|override|disregard|ignore).{0,8}?(上述|上文|规则|约束)/i, level: '中', desc: '约束绕过：要求忽视既有限制' },
  { re: /(不论|即使|哪怕|无需).{0,10}?(遵守|考虑|管)/i, level: '低', desc: '条件突破：用条件句弱化规则' },
  { re: /(模拟|假装|pretend|imagine).{0,10}?(你(是|在)|处于)/i, level: '低', desc: '情景伪装：用假设情景诱导越权' },
];

const LEVEL_CLASS: Record<string, string> = {
  高: 'badge-error',
  中: 'badge-warning',
  低: 'badge-ghost',
};

export default function PromptInjectionDetector() {
  const [text, setText] = useState('');
  const [hits, setHits] = useState<{ rule: Rule; at: number }[]>([]);

  const scan = () => {
    const found: { rule: Rule; at: number }[] = [];
    for (const rule of RULES) {
      const m = rule.re.exec(text);
      if (m) found.push({ rule, at: m.index });
    }
    found.sort((a, b) => (a.rule.level === b.rule.level ? a.at - b.at : a.rule.level === '高' ? -1 : b.rule.level === '高' ? 1 : a.rule.level === '中' ? -1 : 1));
    setHits(found);
  };

  return (
    <div class="space-y-4">
      <label class="form-control">
        <span class="label-text text-xs mb-1">待检测文本（用户可能喂给 AI 的内容）</span>
        <textarea
          class="textarea textarea-bordered textarea-sm h-32"
          placeholder="粘贴待检测文本…"
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
        />
      </label>
      <button class="btn btn-primary btn-sm" onClick={scan} disabled={!text.trim()}>
        检测
      </button>

      {hits.length === 0 && text.trim() && (
        <div class="alert alert-success text-xs">未命中已知注入特征，但仍建议人工复核。</div>
      )}

      <div class="space-y-2">
        {hits.map((h) => (
          <div class="card bg-base-200 p-3 text-xs space-y-1">
            <div class="flex items-center gap-2">
              <span class={`badge badge-xs ${LEVEL_CLASS[h.rule.level]}`}>{h.rule.level}风险</span>
              <span class="font-medium">位置 {h.at}</span>
            </div>
            <div class="opacity-70">{h.rule.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
