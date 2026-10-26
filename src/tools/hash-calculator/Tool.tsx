import { useState, useEffect, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { hashText, Hasher, HASH_ALGOS, HEX_LEN, type HashAlgo } from '@/lib/hash';

const CHUNK = 4 * 1024 * 1024; // 文件分片 4MB

export default function HashCalculator(props: { initialAlgo?: string }) {
  const initialAlgo =
    props.initialAlgo && (HASH_ALGOS as string[]).includes(props.initialAlgo)
      ? (props.initialAlgo as HashAlgo)
      : 'SHA-256';
  const [text, setText] = useState('');
  const [sel, setSel] = useState<HashAlgo[]>([initialAlgo]);
  const [upper, setUpper] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [fileProgress, setFileProgress] = useState(0);
  const [fileBusy, setFileBusy] = useState(false);
  const [fileResults, setFileResults] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  // 文本摘要：本地同步计算（纯 JS，无 HTTPS 依赖）
  useEffect(() => {
    if (text === '') {
      setResults({});
      return;
    }
    const next: Record<string, string> = {};
    for (const a of sel) next[a] = hashText(a, text);
    setResults(next);
  }, [text, sel]);

  const toggle = (a: HashAlgo) =>
    setSel((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  /** 摘要统一按小写存储，展示/复制时再套大小写（切换即时生效） */
  const show = (hex: string | undefined) =>
    !hex ? '' : upper ? hex.toUpperCase() : hex;

  const copy = async (key: string, value: string) => {
    if (!value) return;
    await copyText(value);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  // 文件摘要：分片读入，增量喂给 Hasher（常量内存）
  const onFile = async (f: File) => {
    setFile({ name: f.name, size: f.size });
    setFileBusy(true);
    setFileProgress(0);
    setFileResults({});
    try {
      const hashers = sel.map((a) => [a, new Hasher(a)] as const);
      for (let off = 0; off < f.size; off += CHUNK) {
        const buf = new Uint8Array(await f.slice(off, off + CHUNK).arrayBuffer());
        for (const [, h] of hashers) h.update(buf);
        setFileProgress(Math.min(1, (off + buf.length) / Math.max(1, f.size)));
        await new Promise((r) => setTimeout(r, 0)); // 让进度条有机会渲染
      }
      const next: Record<string, string> = {};
      for (const [a, h] of hashers) next[a] = h.digest();
      setFileResults(next);
    } finally {
      setFileBusy(false);
    }
  };

  const resultCard = (key: string, label: string, hex: string | undefined) => (
    <div class="rounded-xl bg-base-200 p-3">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-medium opacity-70">{label}</span>
        <button
          type="button"
          class={`btn btn-xs ${copied === key ? 'btn-success' : 'btn-ghost'}`}
          onClick={() => copy(key, show(hex))}
          disabled={!hex}
        >
          {copied === key ? '已复制' : '复制'}
        </button>
      </div>
      <code class="block font-mono text-sm break-all">{show(hex) || '—'}</code>
    </div>
  );

  return (
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium" for="hash-input">
          输入文本
        </label>
        <textarea
          id="hash-input"
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows={5}
          placeholder="输入要计算哈希的内容…"
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
        />
      </div>

      <div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">算法（可多选）</span>
          <label class="flex items-center gap-1.5 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              class="toggle toggle-xs toggle-primary"
              checked={upper}
              onChange={(e) => setUpper((e.target as HTMLInputElement).checked)}
            />
            大写输出
          </label>
        </div>
        <div class="mt-2 flex flex-wrap gap-3">
          {HASH_ALGOS.map((a) => (
            <label class="cursor-pointer flex items-center gap-1.5 text-sm select-none">
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-primary"
                checked={sel.includes(a)}
                onChange={() => toggle(a)}
              />
              {a}
              {a === 'MD5' && <span class="opacity-50 text-xs">（仅兼容用途）</span>}
              <span class="opacity-40 text-xs">{HEX_LEN[a]} 位</span>
            </label>
          ))}
        </div>
      </div>

      {text !== '' && (
        <div class="space-y-2">
          {sel.length === 0 && <p class="text-sm opacity-60">请至少选择一种算法。</p>}
          {sel.map((a) => resultCard(a, `${a} · ${HEX_LEN[a]} 位`, results[a]))}
        </div>
      )}

      <div class="divider">或计算文件摘要</div>

      <div>
        <input
          type="file"
          class="file-input file-input-bordered file-input-sm w-full max-w-xs"
          onChange={(e) => {
            const f = (e.target as HTMLInputElement).files?.[0];
            if (f) void onFile(f);
          }}
        />
        {file && (
          <p class="text-xs opacity-70 mt-1.5">
            {file.name}（{(file.size / 1024).toFixed(1)} KB）
            {fileBusy && ` · 计算中 ${Math.round(fileProgress * 100)}%`}
            {!fileBusy && Object.keys(fileResults).length > 0 && ' · 完成'}
          </p>
        )}
        {fileBusy && (
          <progress class="progress progress-primary w-full mt-1 h-1" value={fileProgress} max="1" />
        )}
        {sel.length === 0 && <p class="text-xs opacity-60 mt-1">先在上面勾选算法，再选文件。</p>}
      </div>

      {!fileBusy && sel.some((a) => fileResults[a]) && (
        <div class="space-y-2">
          {sel.map((a) =>
            fileResults[a] ? resultCard(`file-${a}`, `${a} · ${file?.name ?? '文件'}`, fileResults[a]) : null,
          )}
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        使用纯本地算法计算（不依赖 Web Crypto，HTTP 环境同样可用），内容不会离开你的设备。文件按 4MB
        分片增量计算，大文件也不会占满内存。注意：MD5 已被证明不安全，仅建议用于兼容旧系统或校验完整性。
      </p>
    </div>
  );
}
