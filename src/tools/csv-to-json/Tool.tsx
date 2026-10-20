import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { csvToJson, jsonToCsv } from '@/lib/dev-tools';

type Mode = 'csv2json' | 'json2csv';

export default function CsvToJson() {
  const [mode, setMode] = useState<Mode>('csv2json');
  const [input, setInput] = useState('name,age,city\nAlice,30,Beijing\nBob,25,Shanghai');
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return null;
    if (mode === 'csv2json') {
      return csvToJson(input, { delimiter: delimiter || ',', hasHeader });
    }
    return jsonToCsv(input);
  }, [input, mode, delimiter, hasHeader]);

  const output = result && result.ok
    ? mode === 'csv2json'
      ? JSON.stringify(result.data, null, 2)
      : (result.data as string)
    : '';

  const copy = async () => {
    if (!output) return;
    await copyText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class={`btn btn-xs ${mode === 'csv2json' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('csv2json')}
          >
            CSV → JSON
          </button>
          <button
            type="button"
            class={`btn btn-xs ${mode === 'json2csv' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('json2csv')}
          >
            JSON → CSV
          </button>
        </div>

        {mode === 'csv2json' && (
          <div class="mt-3 flex flex-wrap items-center gap-4">
            <label class="flex items-center gap-2 text-sm">
              分隔符
              <input
                type="text"
                maxLength={1}
                class="input input-bordered input-sm w-16 font-mono"
                value={delimiter}
                onInput={(e) => setDelimiter((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                checked={hasHeader}
                onInput={(e) => setHasHeader((e.target as HTMLInputElement).checked)}
              />
              首行为表头
            </label>
          </div>
        )}

        <label class="mt-3 block text-sm font-medium">
          {mode === 'csv2json' ? '输入 CSV' : '输入 JSON（对象数组或二维数组）'}
        </label>
        <textarea
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows={7}
          placeholder={mode === 'csv2json' ? '粘贴 CSV 文本' : '粘贴 JSON 数组'}
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
        />
      </div>

      {result && !result.ok && (
        <p class="text-sm text-error" role="alert">
          {result.error}
        </p>
      )}

      {result && result.ok && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">转换结果</span>
            <button
              type="button"
              class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
              onClick={copy}
            >
              {copied ? '已复制' : '复制结果'}
            </button>
          </div>
          <pre class="mt-3 max-h-80 overflow-auto whitespace-pre rounded bg-base-100 p-3 font-mono text-xs">{output}</pre>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        转换在浏览器本地完成。CSV→JSON 支持双引号包裹与转义；JSON→CSV 自动合并所有键作为表头。换行、引号、逗号都会被正确转义。
      </p>
    </div>
  );
}
