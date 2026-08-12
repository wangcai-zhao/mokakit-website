import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState(2);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const parsed = useMemo(() => {
    const v = input.trim();
    if (v === '') return { empty: true as const };
    try {
      const value = JSON.parse(v);
      return { ok: true as const, value };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [input]);

  const formatted = useMemo(
    () => (parsed && 'ok' in parsed && parsed.ok ? JSON.stringify(parsed.value, null, indent) : ''),
    [parsed, indent],
  );
  const minified = useMemo(
    () => (parsed && 'ok' in parsed && parsed.ok ? JSON.stringify(parsed.value) : ''),
    [parsed],
  );

  const copy = async (text: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium" for="json-input">
          输入 JSON
        </label>
        <textarea
          id="json-input"
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows="8"
          placeholder='{"hello": "world", "n": 42}'
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
        />
      </div>

      {parsed && 'ok' in parsed && !parsed.ok && (
        <p class="text-sm text-error" role="alert">
          格式错误：{parsed.error}
        </p>
      )}
      {parsed && 'empty' in parsed && (
        <p class="text-sm opacity-60">在上方粘贴 JSON 后即可格式化。</p>
      )}
      {parsed && 'ok' in parsed && parsed.ok && (
        <>
          <div class="flex items-center gap-3 flex-wrap">
            <span class="text-sm font-medium">缩进</span>
            <div class="join">
              {[2, 4].map((n) => (
                <button
                  type="button"
                  class={`btn btn-sm join-item ${indent === n ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setIndent(n)}
                >
                  {n} 空格
                </button>
              ))}
            </div>
            <button
              type="button"
              class="btn btn-sm btn-primary"
              onClick={() => copy(formatted)}
              disabled={!formatted}
            >
              {copied ? '已复制' : '复制格式化'}
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline"
              onClick={() => copy(minified)}
              disabled={!minified}
            >
              复制压缩
            </button>
          </div>

          <div>
            <label class="text-sm font-medium">格式化结果</label>
            <pre class="mt-2 rounded-xl bg-base-200 p-3 overflow-x-auto text-sm font-mono whitespace-pre">
              {formatted}
            </pre>
          </div>
        </>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        JSON 在你本地解析与格式化，不会上传到任何服务器。可用于接口调试、配置文件整理、数据校验。
      </p>
    </div>
  );
}
