import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { convert, REGIONS, type Direction, type Region } from '@/lib/jian-fan';

export default function JianFanConvert(props: {
  initialDirection?: Direction;
  initialRegion?: Region;
  initialInput?: string;
}) {
  const [direction, setDirection] = useState<Direction>(props.initialDirection ?? 'j2f');
  const [region, setRegion] = useState<Region>(props.initialRegion ?? 'generic');
  const [input, setInput] = useState(props.initialInput ?? '');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const output = useMemo(() => convert(input, { direction, region }), [input, direction, region]);

  const copy = async (text: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class={`btn btn-sm ${direction === 'j2f' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setDirection('j2f')}
        >
          简 → 繁
        </button>
        <button
          type="button"
          class={`btn btn-sm ${direction === 'f2j' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setDirection('f2j')}
        >
          繁 → 简
        </button>
        <div class="join ml-0 sm:ml-2">
          {REGIONS.map((r) => (
            <button
              type="button"
              key={r.id}
              class={`join-item btn btn-sm ${region === r.id ? 'btn-active btn-secondary' : 'btn-ghost'}`}
              onClick={() => setRegion(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <div>
          <label class="text-sm font-medium" for="jf-input">
            输入
          </label>
          <textarea
            id="jf-input"
            class="textarea textarea-bordered mt-2 w-full h-44 font-mono text-sm"
            placeholder="在此粘贴需要转换的中文文本…"
            value={input}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          />
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium">输出</label>
            <button
              type="button"
              class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => copy(output)}
              disabled={!output}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <textarea
            class="textarea textarea-bordered w-full h-44 font-mono text-sm bg-base-200"
            readOnly
            value={output}
          />
        </div>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        转换完全在本地浏览器进行，文本不会上传。采用「词组最长匹配优先、单字兜底」策略，并支持
        通用/台湾/香港三档地区用词（如 软件：通用与香港作「軟件」，台湾作「軟體」）；生僻字或特殊语境建议人工复核。
      </p>
    </div>
  );
}
