import { useState, useMemo } from 'preact/hooks';

export default function RegexTester() {
  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState(
    '联系我们：support@mokakit.com 或 sales@mokakit.cn\n无效地址：foo@bar',
  );

  const { error, matches, groups } = useMemo(() => {
    if (!pattern) return { error: '', matches: [] as string[], groups: [] as string[][] };
    let re: RegExp;
    try {
      re = new RegExp(pattern, flags);
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : String(e),
        matches: [] as string[],
        groups: [] as string[][],
      };
    }
    const found: string[] = [];
    const captured: string[][] = [];
    let m: RegExpExecArray | null;
    if (flags.includes('g')) {
      while ((m = re.exec(text)) !== null) {
        found.push(m[0]);
        if (m.length > 1) captured.push(m.slice(1));
        if (m.index === re.lastIndex) re.lastIndex++; // 防止零宽匹配死循环
      }
    } else {
      m = re.exec(text);
      if (m) {
        found.push(m[0]);
        if (m.length > 1) captured.push(m.slice(1));
      }
    }
    return { error: '', matches: found, groups: captured };
  }, [pattern, flags, text]);

  return (
    <div class="space-y-4">
      <div class="flex flex-col gap-2 sm:flex-row">
        <div class="flex items-stretch rounded-lg border border-base-300 overflow-hidden flex-1">
          <span class="flex items-center px-3 bg-base-200 font-mono text-sm opacity-60">/</span>
          <input
            type="text"
            class="input input-ghost w-full font-mono text-sm"
            value={pattern}
            placeholder="正则表达式"
            onInput={(e) => setPattern((e.target as HTMLInputElement).value)}
          />
          <span class="flex items-center px-2 bg-base-200 font-mono text-sm opacity-60">/</span>
          <input
            type="text"
            class="input input-ghost w-16 font-mono text-sm"
            value={flags}
            placeholder="gi"
            onInput={(e) => setFlags((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      {error && (
        <div class="rounded-lg bg-error/10 text-error px-3 py-2 text-sm font-mono">
          表达式错误：{error}
        </div>
      )}

      <div>
        <label class="text-sm font-medium" for="re-text">
          测试文本
        </label>
        <textarea
          id="re-text"
          class="textarea textarea-bordered mt-2 w-full h-40 font-mono text-sm"
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl bg-base-200 p-3">
          <div class="text-xs opacity-60 mb-1">匹配数量：{matches.length}</div>
          <ul class="space-y-1 text-sm font-mono break-all max-h-40 overflow-auto">
            {matches.map((mm, i) => (
              <li key={i} class="rounded bg-primary/10 px-2 py-1">
                {mm || <span class="opacity-40">（空匹配）</span>}
              </li>
            ))}
            {matches.length === 0 && <li class="opacity-40">无匹配</li>}
          </ul>
        </div>
        <div class="rounded-xl bg-base-200 p-3">
          <div class="text-xs opacity-60 mb-1">捕获组</div>
          <ul class="space-y-1 text-sm font-mono break-all max-h-40 overflow-auto">
            {groups.map((g, i) => (
              <li key={i} class="rounded bg-base-300/40 px-2 py-1">
                组{i + 1}：{g.join(' / ') || '（空）'}
              </li>
            ))}
            {groups.length === 0 && <li class="opacity-40">无捕获组</li>}
          </ul>
        </div>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        支持 g/i/m/s 修饰符，所有计算在本地完成，文本不上传。
      </p>
    </div>
  );
}
