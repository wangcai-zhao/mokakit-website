import { useState, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

function uuidv4(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h
    .slice(8, 10)
    .join('')}-${h.slice(10, 16).join('')}`;
}

export default function UuidGenerator() {
  const [count, setCount] = useState(3);
  const [list, setList] = useState<string[]>(() => Array.from({ length: 3 }, () => uuidv4()));
  const [copied, setCopied] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const regenerate = (n: number) => setList(Array.from({ length: n }, () => uuidv4()));

  const copy = async (text: string, key: string) => {
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const copyAll = () => copy(list.join('\n'), 'all') && setCopiedAll(true);

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="join">
          <button type="button" class="btn btn-sm join-item" onClick={() => regenerate(count)}>
            重新生成
          </button>
          <button
            type="button"
            class={`btn btn-sm join-item ${copiedAll ? 'btn-success' : 'btn-outline'}`}
            onClick={copyAll}
          >
            {copiedAll ? '已复制全部' : '复制全部'}
          </button>
        </div>
        <label class="text-sm font-medium flex items-center gap-2">
          数量
          <input
            type="number"
            min={1}
            max={50}
            class="input input-bordered input-sm w-20"
            value={count}
            onInput={(e) => {
              const n = Math.max(1, Math.min(50, Number((e.target as HTMLInputElement).value) || 1));
              setCount(n);
              regenerate(n);
            }}
          />
        </label>
      </div>

      <ul class="space-y-2">
        {list.map((id, i) => (
          <li class="flex items-center gap-2 rounded-xl bg-base-200 px-3 py-2">
            <code class="flex-1 font-mono text-sm break-all">{id}</code>
            <button
              type="button"
              class={`btn btn-xs ${copied === String(i) ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => copy(id, String(i))}
            >
              {copied === String(i) ? '已复制' : '复制'}
            </button>
          </li>
        ))}
      </ul>

      <p class="text-xs opacity-55 leading-relaxed">
        基于 crypto.getRandomValues 生成，符合 RFC 4122 v4 标准，全部本地完成。
      </p>
    </div>
  );
}
