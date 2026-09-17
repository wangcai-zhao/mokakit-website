import { useState, useMemo } from 'preact/hooks';

/** 编辑距离（Levenshtein），两个字符串互相转换所需的最少单字符操作次数 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const cur = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[b.length];
}

/** 中文按字切分，英文按词切分，得到一个粗粒度词袋 */
function tokenize(text: string): string[] {
  const cn = text.match(/[\u4e00-\u9fa5]/g) ?? [];
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return [...cn, ...words];
}

function cosine(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (!ta.length || !tb.length) return 0;
  const all = new Set([...ta, ...tb]);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const t of all) {
    const ca = ta.filter((x) => x === t).length;
    const cb = tb.filter((x) => x === t).length;
    dot += ca * cb;
    na += ca * ca;
    nb += cb * cb;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

function jaccard(a: string, b: string): number {
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  if (!sa.size || !sb.size) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter += 1;
  return inter / (sa.size + sb.size - inter);
}

export default function TextSimilarityTool() {
  const [a, setA] = useState('摩卡工具箱是一个在线工具箱');
  const [b, setB] = useState('摩卡工具箱是 AI 时代的在线工具箱');
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [ignoreSpace, setIgnoreSpace] = useState(true);

  const result = useMemo(() => {
    let x = a;
    let y = b;
    if (ignoreCase) {
      x = x.toLowerCase();
      y = y.toLowerCase();
    }
    if (ignoreSpace) {
      x = x.replace(/\s+/g, '');
      y = y.replace(/\s+/g, '');
    }
    const dist = levenshtein(x, y);
    const maxLen = Math.max(x.length, y.length) || 1;
    return {
      dist,
      ratio: 1 - dist / maxLen,
      cosine: cosine(x, y),
      jaccard: jaccard(x, y),
    };
  }, [a, b, ignoreCase, ignoreSpace]);

  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

  const metrics = [
    {
      key: '编辑距离相似度',
      value: result.ratio,
      desc: '按单字符增删改算，对语序敏感，适合查错别字',
    },
    { key: '余弦相似度', value: result.cosine, desc: '比较用词分布，适合判断两段话是否同主题' },
    { key: 'Jaccard 重合度', value: result.jaccard, desc: '只看词集合重叠比例，不看出现次数' },
  ];

  return (
    <div class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">文本 A</span>
          <textarea
            class="textarea textarea-bordered mt-1.5 w-full text-sm"
            rows={6}
            value={a}
            onInput={(e) => setA((e.target as HTMLTextAreaElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">文本 B</span>
          <textarea
            class="textarea textarea-bordered mt-1.5 w-full text-sm"
            rows={6}
            value={b}
            onInput={(e) => setB((e.target as HTMLTextAreaElement).value)}
          />
        </label>
      </div>

      <div class="flex flex-wrap gap-4 rounded-xl bg-base-200 px-4 py-3">
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={ignoreCase}
            onChange={(e) => setIgnoreCase((e.target as HTMLInputElement).checked)}
          />
          忽略大小写
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={ignoreSpace}
            onChange={(e) => setIgnoreSpace((e.target as HTMLInputElement).checked)}
          />
          忽略空白
        </label>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        {metrics.map((m) => (
          <div class="rounded-xl border border-base-300 bg-base-100 p-4" key={m.key}>
            <span class="block text-xs opacity-60">{m.key}</span>
            <span class="mt-1 block text-2xl font-bold text-primary">{pct(m.value)}</span>
            <span class="mt-1 block text-xs opacity-55 leading-snug">{m.desc}</span>
          </div>
        ))}
      </div>

      <p class="text-sm">
        编辑距离：<strong class="text-primary">{result.dist}</strong>
        <span class="opacity-60">（把 A 改成 B 最少需要 {result.dist} 次单字符操作）</span>
      </p>

      <p class="text-xs leading-relaxed opacity-55">
        三个指标看问题的角度不同：查重复投稿、洗稿用余弦相似度最合适；
        查错别字和细微改动看编辑距离；只关心「出现过的词重不重合」就看 Jaccard。
        全部在本地计算，文本不上传。
      </p>
    </div>
  );
}
