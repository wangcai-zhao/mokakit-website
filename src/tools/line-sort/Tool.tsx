import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const SAMPLE = `10 苹果\n2 香蕉\n33 橙子\n2 香蕉\n7 西瓜`;

type SortMode = 'alpha' | 'number' | 'length';

const MODES: { id: SortMode; label: string }[] = [
  { id: 'alpha', label: '字典序' },
  { id: 'number', label: '数值' },
  { id: 'length', label: '行长度' },
];

const collator = new Intl.Collator('zh-Hans-CN', { numeric: false, sensitivity: 'variant' });

function firstNumber(s: string): number {
  const m = s.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : Number.NaN;
}

export default function LineSortTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<SortMode>('alpha');
  const [desc, setDesc] = useState(false);
  const [dedup, setDedup] = useState(false);
  const [dropEmpty, setDropEmpty] = useState(true);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const result = useMemo(() => {
    if (!input) return { text: '', total: 0, kept: 0 };

    let lines = input.split(/\r?\n/);
    const total = lines.length;

    if (dropEmpty) lines = lines.filter((l) => l.trim() !== '');
    if (dedup) {
      const seen = new Set<string>();
      lines = lines.filter((l) => (seen.has(l) ? false : (seen.add(l), true)));
    }

    const sorted = lines.slice().sort((a, b) => {
      if (mode === 'length') return a.length - b.length || collator.compare(a, b);
      if (mode === 'number') {
        const na = firstNumber(a);
        const nb = firstNumber(b);
        const aNaN = Number.isNaN(na);
        const bNaN = Number.isNaN(nb);
        if (aNaN && bNaN) return collator.compare(a, b);
        if (aNaN) return 1; // 非数字行始终垫底
        if (bNaN) return -1;
        return na - nb;
      }
      return collator.compare(a, b);
    });

    if (desc) {
      // 非数字行保持垫底，其余整体反转
      if (mode === 'number') {
        const nums = sorted.filter((l) => !Number.isNaN(firstNumber(l)));
        const rest = sorted.filter((l) => Number.isNaN(firstNumber(l)));
        sorted.splice(0, sorted.length, ...nums.reverse(), ...rest);
      } else {
        sorted.reverse();
      }
    }

    return { text: sorted.join('\n'), total, kept: sorted.length };
  }, [input, mode, desc, dedup, dropEmpty]);

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
        <div class="mb-2 flex items-center justify-between">
          <label class="text-sm font-medium" for="ls-input">
            原始文本（每行一条）
          </label>
          <div class="join">
            <button
              type="button"
              class="btn btn-xs join-item btn-ghost"
              onClick={() => setInput(SAMPLE)}
            >
              填入示例
            </button>
            <button
              type="button"
              class="btn btn-xs join-item btn-ghost"
              onClick={() => setInput('')}
              disabled={!input}
            >
              清空
            </button>
          </div>
        </div>
        <textarea
          id="ls-input"
          class="textarea textarea-bordered w-full font-mono text-sm"
          rows={8}
          placeholder="每行一条内容，粘贴后自动排序"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      <div class="flex flex-wrap items-center gap-3 rounded-xl bg-base-200 px-4 py-3">
        <div class="join">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              class={`btn btn-sm join-item ${mode === m.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div class="join">
          <button
            type="button"
            class={`btn btn-sm join-item ${!desc ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDesc(false)}
          >
            升序
          </button>
          <button
            type="button"
            class={`btn btn-sm join-item ${desc ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDesc(true)}
          >
            降序
          </button>
        </div>
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={dedup}
            onChange={(e) => setDedup((e.target as HTMLInputElement).checked)}
          />
          排序后去重
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={dropEmpty}
            onChange={(e) => setDropEmpty((e.target as HTMLInputElement).checked)}
          />
          删除空行
        </label>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">排序结果</span>
            {result.total > 0 && (
              <span class="badge badge-sm badge-ghost">
                {result.total} 行 → {result.kept} 行
              </span>
            )}
          </div>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
            onClick={() => copy(result.text)}
            disabled={!result.text}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="max-h-80 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm whitespace-pre-wrap">
          {result.text || <span class="opacity-40">排序后的内容会显示在这里</span>}
        </pre>
      </div>

      <p class="text-xs leading-relaxed opacity-55">
        字典序按中文拼音规则比较；数值模式提取每行首个数字排序，无数字的行排在末尾。全部计算在本地浏览器完成，文本不会上传。
      </p>
    </div>
  );
}
