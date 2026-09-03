import { useState, useMemo } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';

function parseEnv(text: string): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    let l = line.trim();
    if (l === '' || l.startsWith('#')) continue;
    l = l.replace(/^export\s+/, '');
    const eq = l.indexOf('=');
    if (eq === -1) continue;
    const key = l.slice(0, eq).trim();
    let value = l.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    obj[key] = value;
  }
  return obj;
}

export default function EnvParserTool() {
  const [mode, setMode] = useState<'toJson' | 'toEnv'>('toJson');
  const [input, setInput] = useState(
    'DB_HOST=localhost\nDB_PORT=5432\n# 注释行\nexport API_KEY="secret-123"\nDEBUG=true',
  );

  const result = useMemo(() => {
    if (input.trim() === '') return '';
    try {
      if (mode === 'toJson') {
        return JSON.stringify(parseEnv(input), null, 2);
      }
      const obj = JSON.parse(input) as Record<string, unknown>;
      return Object.entries(obj)
        .map(([k, v]) => `${k}=${String(v)}`)
        .join('\n');
    } catch (e) {
      return `错误：${(e as Error).message}`;
    }
  }, [mode, input]);

  return (
    <DevTool
      input={input}
      setInput={setInput}
      output={result}
      placeholder={mode === 'toJson' ? '粘贴 .env 内容…' : '粘贴 JSON 对象…'}
      note="KEY=VALUE 形式的 .env 与 JSON 互转。仅本地解析，不上传。"
    >
      <div class="form-control">
        <select
          class="select select-bordered select-sm w-full"
          value={mode}
          onChange={(e) => setMode((e.target as HTMLSelectElement).value as typeof mode)}
        >
          <option value="toJson">.env → JSON</option>
          <option value="toEnv">JSON → .env</option>
        </select>
      </div>
    </DevTool>
  );
}
