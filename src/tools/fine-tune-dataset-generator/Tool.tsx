import { useState } from 'preact/hooks';

export default function FineTuneDatasetGenerator() {
  const [raw, setRaw] = useState('Q: 什么是 MCP？\nA: MCP 是模型上下文协议，让 AI 客户端统一调用外部工具。\n\nQ: 什么是 RAG？\nA: RAG 是检索增强生成，先检索资料再让模型据此作答。');
  const [fmt, setFmt] = useState<'alpaca' | 'sharegpt'>('alpaca');
  const [out, setOut] = useState('');
  const [copied, setCopied] = useState(false);

  const parse = () => {
    const blocks = raw.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    const pairs: { q: string; a: string }[] = [];
    for (const b of blocks) {
      const q = (b.match(/Q[:：]\s*([\s\S]*?)(?=\n\s*A[:：]|$)/i)?.[1] ?? '').trim();
      const a = (b.match(/A[:：]\s*([\s\S]*)$/i)?.[1] ?? '').trim();
      if (q && a) pairs.push({ q, a });
      else if (b) pairs.push({ q: b, a: '' }); // 退化：整段当问题
    }
    const jsonl = pairs
      .map((p) =>
        fmt === 'alpaca'
          ? JSON.stringify({ instruction: p.q, input: '', output: p.a })
          : JSON.stringify({ conversations: [{ role: 'user', content: p.q }, { role: 'assistant', content: p.a }] }),
      )
      .join('\n');
    setOut(jsonl);
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
    <div class="space-y-3">
      <label class="form-control">
        <span class="label-text text-xs mb-1">问答对（每组用空行分隔，Q:/A: 标出）</span>
        <textarea class="textarea textarea-bordered textarea-sm h-40" value={raw} onInput={(e) => setRaw((e.target as HTMLTextAreaElement).value)} />
      </label>
      <div class="flex items-center gap-3">
        <label class="form-control w-48">
          <span class="label-text text-xs mb-1">格式</span>
          <select class="select select-sm select-bordered" value={fmt} onChange={(e) => setFmt((e.target as HTMLSelectElement).value as 'alpaca' | 'sharegpt')}>
            <option value="alpaca">Alpaca (instruction/output)</option>
            <option value="sharegpt">ShareGPT (conversations)</option>
          </select>
        </label>
        <button class="btn btn-primary btn-sm mt-5" onClick={parse} disabled={!raw.trim()}>生成 JSONL</button>
      </div>

      {out && (
        <div class="relative">
          <pre class="mockup-code text-xs max-h-72 overflow-auto"><code>{out}</code></pre>
          <button class="btn btn-xs btn-primary absolute right-2 top-2" onClick={copy}>{copied ? '已复制' : '复制'}</button>
        </div>
      )}
      <p class="text-xs opacity-60">每行一条样本，可直接喂给 LoRA / SFT 微调流程。</p>
    </div>
  );
}
