import { useState, useEffect, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const DEMO = `你是一个 helpful 的助手。
请用简洁的中文回答用户的问题，并在必要时给出示例。

用户问题：如何估算一段文本的 token 数量？`;

const ENCODERS: Record<string, () => Promise<any>> = {
  cl100k_base: () => import('gpt-tokenizer/encoding/cl100k_base'),
  o200k_base: () => import('gpt-tokenizer/encoding/o200k_base'),
  p50k_base: () => import('gpt-tokenizer/encoding/p50k_base'),
  r50k_base: () => import('gpt-tokenizer/encoding/r50k_base'),
};

const ENCODER_LABELS: Record<string, string> = {
  cl100k_base: 'GPT-4 / 4o / 3.5-Turbo(2023+)',
  o200k_base: 'GPT-4o-mini / o1-mini',
  p50k_base: 'GPT-3.5-Turbo-Instruct',
  r50k_base: 'GPT-3 / Davinci 旧模型',
};

const PRICES: Record<string, { label: string; in: number; out: number }> = {
  custom: { label: '自定义', in: 0, out: 0 },
  '4o': { label: 'GPT-4o（参考价）', in: 18, out: 72 },
  '4o-mini': { label: 'GPT-4o-mini（参考价）', in: 1.08, out: 4.32 },
  '4-turbo': { label: 'GPT-4-Turbo（参考价）', in: 21.6, out: 64.8 },
  'claude-35': { label: 'Claude 3.5 Sonnet（参考价）', in: 21.6, out: 108 },
  'claude-haiku': { label: 'Claude 3 Haiku（参考价）', in: 2.16, out: 10.8 },
  'deepseek': { label: 'DeepSeek-V3（参考价）', in: 1, out: 2 },
};

export default function TokenCounter() {
  const [text, setText] = useState(DEMO);
  const [encoding, setEncoding] = useState('cl100k_base');
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const [priceKey, setPriceKey] = useState('4o');
  const [inPrice, setInPrice] = useState(18);
  const [outPrice, setOutPrice] = useState(72);
  const [outTokens, setOutTokens] = useState(500);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const loader = ENCODERS[encoding] || ENCODERS.cl100k_base;
    loader()
      .then((mod: any) => {
        if (!alive) return;
        const n = mod.countTokens
          ? mod.countTokens(text)
          : mod.encode(text).length;
        setTokens(n);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [encoding, text]);

  const charCount = [...text].length;
  const ratio = charCount ? Math.round((tokens / charCount) * 1000) / 1000 : 0;
  const cn = (text.match(/[一-鿿]/g) || []).length;
  const words = (text.match(/[A-Za-z0-9]+/g) || []).length;
  const punct = (text.match(/[^\w\s一-鿿]/g) || []).length;
  const lines = text ? text.split(/\n/).length : 0;

  const cost = (tokens * inPrice + outTokens * outPrice) / 1e6;

  const onPrice = (e: any) => {
    const k = (e.target as HTMLSelectElement).value;
    setPriceKey(k);
    const p = PRICES[k];
    if (p && k !== 'custom') {
      setInPrice(p.in);
      setOutPrice(p.out);
    }
  };

  const copy = async () => {
      await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <label class="text-sm font-medium" for="tok-enc">
            分词模型
          </label>
          <select
            id="tok-enc"
            class="select select-bordered select-sm"
            value={encoding}
            onChange={(e) => setEncoding((e.target as HTMLSelectElement).value)}
          >
            {(Object.keys(ENCODER_LABELS) as string[]).map((k) => (
              <option value={k}>
                {k} · {ENCODER_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <textarea
          class="textarea textarea-bordered w-full h-40 font-mono text-sm"
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          placeholder="粘贴或输入要估算的文本……"
        />
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div class="rounded-xl bg-base-200 p-4 text-center">
          <div class="text-3xl font-bold text-primary tabular-nums">
            {loading ? '…' : tokens}
          </div>
          <div class="mt-1 text-xs opacity-60">Token 数</div>
        </div>
        <div class="rounded-xl bg-base-200 p-4 text-center">
          <div class="text-3xl font-bold tabular-nums">{charCount}</div>
          <div class="mt-1 text-xs opacity-60">字符数</div>
        </div>
        <div class="rounded-xl bg-base-200 p-4 text-center">
          <div class="text-3xl font-bold tabular-nums">{ratio}</div>
          <div class="mt-1 text-xs opacity-60">每字符 Token</div>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-2">
        <div class="rounded-lg bg-base-100 border border-base-300 p-2 text-center">
          <div class="text-lg font-semibold tabular-nums">{cn}</div>
          <div class="text-[11px] opacity-55">中文字符</div>
        </div>
        <div class="rounded-lg bg-base-100 border border-base-300 p-2 text-center">
          <div class="text-lg font-semibold tabular-nums">{words}</div>
          <div class="text-[11px] opacity-55">英文词</div>
        </div>
        <div class="rounded-lg bg-base-100 border border-base-300 p-2 text-center">
          <div class="text-lg font-semibold tabular-nums">{punct}</div>
          <div class="text-[11px] opacity-55">标点</div>
        </div>
        <div class="rounded-lg bg-base-100 border border-base-300 p-2 text-center">
          <div class="text-lg font-semibold tabular-nums">{lines}</div>
          <div class="text-[11px] opacity-55">行数</div>
        </div>
      </div>

      <div class="rounded-xl border border-base-300 p-4 space-y-3">
        <div class="text-sm font-medium">价格估算（¥/1M tokens，仅供参考）</div>
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="text-xs opacity-60">模型预设</label>
            <select
              class="select select-bordered select-sm block"
              value={priceKey}
              onChange={onPrice}
            >
              {(Object.keys(PRICES) as string[]).map((k) => (
                <option value={k}>{PRICES[k].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label class="text-xs opacity-60">输入单价 ¥/1M</label>
            <input
              type="number"
              min="0"
              step="0.01"
              class="input input-bordered input-sm w-28"
              value={inPrice}
              onInput={(e) => {
                setPriceKey('custom');
                setInPrice(parseFloat((e.target as HTMLInputElement).value) || 0);
              }}
            />
          </div>
          <div>
            <label class="text-xs opacity-60">输出单价 ¥/1M</label>
            <input
              type="number"
              min="0"
              step="0.01"
              class="input input-bordered input-sm w-28"
              value={outPrice}
              onInput={(e) => {
                setPriceKey('custom');
                setOutPrice(parseFloat((e.target as HTMLInputElement).value) || 0);
              }}
            />
          </div>
          <div>
            <label class="text-xs opacity-60">预估输出 token</label>
            <input
              type="number"
              min="0"
              step="1"
              class="input input-bordered input-sm w-28"
              value={outTokens}
              onInput={(e) =>
                setOutTokens(parseInt((e.target as HTMLInputElement).value) || 0)
              }
            />
          </div>
        </div>
        <div class="text-sm">
          预计花费：
          <span class="text-lg font-bold text-primary tabular-nums">
            ¥{cost.toFixed(4)}
          </span>
          <span class="opacity-55 text-xs">
            （输入 {tokens} × {inPrice} + 输出 {outTokens} × {outPrice}）÷ 1,000,000
          </span>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
          onClick={copy}
        >
          {copied ? '已复制' : '复制文本'}
        </button>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        基于 gpt-tokenizer（OpenAI BPE 分词器，浏览器本地运行，不上传服务器）。
        不同模型使用不同编码，结果仅供参考；Claude / Gemini 等无本地精确分词器，可切换相近编码做近似估算。
        价格为公开参考价（美元按约 7.2 折算人民币），实际以各厂商官方计费为准。
      </p>
    </div>
  );
}
