import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const LATIN_WORDS =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(
    ' ',
  );

const CN_SENTENCES = [
  '这是一段用于排版预览的占位文本，本身没有任何实际含义。',
  '在页面还没有真实内容的时候，用它来检验字号、行距与段落间距是否合适。',
  '设计稿阶段先把结构搭出来，再逐步替换成真正的文案。',
  '中文的排版节奏和英文不同，标点占一个字宽，行尾对齐也要单独考虑。',
  '占位文字的长度最好接近最终内容，否则版面会在替换后发生明显跳动。',
  '如果需要测试极端情况，可以把段落数量调大，看看滚动区域的表现。',
];

/** 线性同余伪随机，保证同一 seed 每次生成结果一致 */
function makeRandom(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

export default function LoremIpsumTool() {
  const [kind, setKind] = useState<'latin' | 'cn'>('cn');
  const [paragraphs, setParagraphs] = useState(3);
  const [length, setLength] = useState('medium');
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [wrapTag, setWrapTag] = useState<'none' | 'p' | 'li'>('none');
  const [seed, setSeed] = useState(2026);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    const rnd = makeRandom(seed);
    const perPara =
      length === 'short' ? [2, 3] : length === 'medium' ? [4, 6] : [7, 10];
    const out: string[] = [];

    for (let p = 0; p < paragraphs; p += 1) {
      if (kind === 'cn') {
        const n = perPara[0] + Math.floor(rnd() * (perPara[1] - perPara[0] + 1));
        const parts: string[] = [];
        for (let i = 0; i < n; i += 1) {
          parts.push(CN_SENTENCES[Math.floor(rnd() * CN_SENTENCES.length)]);
        }
        out.push(parts.join(''));
      } else {
        const words =
          perPara[0] * 12 + Math.floor(rnd() * (perPara[1] - perPara[0] + 1) * 12);
        const arr: string[] = [];
        for (let i = 0; i < words; i += 1) {
          arr.push(LATIN_WORDS[Math.floor(rnd() * LATIN_WORDS.length)]);
        }
        let text = arr.join(' ');
        text = text.charAt(0).toUpperCase() + text.slice(1);
        if (p === 0 && startWithLorem) text = `Lorem ipsum dolor sit amet, ${text.slice(0, 1).toLowerCase()}${text.slice(1)}`;
        out.push(`${text}.`);
      }
    }

    if (wrapTag === 'p') return out.map((t) => `<p>${t}</p>`).join('\n');
    if (wrapTag === 'li') return out.map((t) => `<li>${t}</li>`).join('\n');
    return out.join('\n\n');
  }, [kind, paragraphs, length, startWithLorem, wrapTag, seed]);

  const charCount = output.replace(/<[^>]+>/g, '').length;

  return (
    <div class="space-y-4">
      <div class="tabs tabs-box w-full">
        <button
          type="button"
          class={`tab flex-1 ${kind === 'cn' ? 'tab-active' : ''}`}
          onClick={() => setKind('cn')}
        >
          中文占位
        </button>
        <button
          type="button"
          class={`tab flex-1 ${kind === 'latin' ? 'tab-active' : ''}`}
          onClick={() => setKind('latin')}
        >
          经典 Lorem
        </button>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <label class="block">
          <span class="flex items-center justify-between text-sm font-medium">
            <span>段落数</span>
            <span class="opacity-60">{paragraphs}</span>
          </span>
          <input
            type="range"
            min="1"
            max="20"
            class="range range-primary mt-2 w-full"
            value={paragraphs}
            onInput={(e) => setParagraphs(Number((e.target as HTMLInputElement).value))}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">段落长度</span>
          <select
            class="select select-bordered mt-1.5 w-full"
            value={length}
            onChange={(e) => setLength((e.target as HTMLSelectElement).value)}
          >
            <option value="short">短（2-3 句）</option>
            <option value="medium">中（4-6 句）</option>
            <option value="long">长（7-10 句）</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-medium">包裹标签</span>
          <select
            class="select select-bordered mt-1.5 w-full"
            value={wrapTag}
            onChange={(e) => setWrapTag((e.target as HTMLSelectElement).value as 'none' | 'p' | 'li')}
          >
            <option value="none">纯文本</option>
            <option value="p">&lt;p&gt; 段落</option>
            <option value="li">&lt;li&gt; 列表项</option>
          </select>
        </label>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        {kind === 'latin' && (
          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              checked={startWithLorem}
              onChange={(e) => setStartWithLorem((e.target as HTMLInputElement).checked)}
            />
            首段以 Lorem ipsum 开头
          </label>
        )}
        <label class="block">
          <span class="text-sm font-medium">随机种子</span>
          <div class="mt-1.5 flex gap-2">
            <input
              type="number"
              class="input input-bordered w-full"
              value={seed}
              onInput={(e) => setSeed(Number((e.target as HTMLInputElement).value) || 1)}
            />
            <button
              type="button"
              class="btn btn-outline btn-sm"
              onClick={() => setSeed(Math.floor(Math.random() * 99999) + 1)}
            >
              换一批
            </button>
          </div>
        </label>
      </div>

      <div class="flex flex-wrap gap-2">
        <span class="badge badge-ghost">{paragraphs} 段</span>
        <span class="badge badge-outline">约 {charCount} 字</span>
      </div>

      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">生成结果</span>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
            onClick={async () => {
              await copyText(output);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            }}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="max-h-72 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm whitespace-pre-wrap">
          {output}
        </pre>
      </label>

      <p class="text-xs leading-relaxed opacity-55">
        同一个种子每次生成的内容完全一致，方便在设计稿里固定住占位文案，换一批就改种子。
        中文占位用的是通顺的中文句子而不是乱字，预览时更接近真实排版效果。
      </p>
    </div>
  );
}
