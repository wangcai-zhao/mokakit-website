import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const SAMPLE =
  "select u.id, u.name, o.amount from users u left join orders o on o.user_id = u.id where u.status = 'active' and o.amount > 100 group by u.id order by o.amount desc limit 20";

/** 独占一行、顶格的主关键字 */
const TOP_KEYWORDS = [
  'SELECT DISTINCT',
  'SELECT',
  'FROM',
  'WHERE',
  'GROUP BY',
  'ORDER BY',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'INSERT INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE FROM',
  'UNION ALL',
  'UNION',
  'LEFT OUTER JOIN',
  'RIGHT OUTER JOIN',
  'FULL OUTER JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'INNER JOIN',
  'CROSS JOIN',
  'JOIN',
  'CREATE TABLE',
  'ALTER TABLE',
  'DROP TABLE',
  'TRUNCATE TABLE',
];

/** 换行后缩进一级的从属关键字 */
const SUB_KEYWORDS = ['AND', 'OR', 'ON'];

const ALL_KEYWORDS = [...TOP_KEYWORDS, ...SUB_KEYWORDS].sort((a, b) => b.length - a.length);

const KEYWORD_RE = new RegExp(
  `\\b(${ALL_KEYWORDS.map((k) => k.split(' ').join('\\s+')).join('|')})\\b`,
  'gi',
);

function formatSql(sql: string): string {
  const flat = sql.replace(/\s+/g, ' ').trim();
  if (!flat) return '';
  const out = flat.replace(KEYWORD_RE, (m) => {
    const kw = m.replace(/\s+/g, ' ').toUpperCase();
    return SUB_KEYWORDS.includes(kw) ? `\n  ${kw}` : `\n${kw}`;
  });
  return out
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .filter((line) => line.trim() !== '')
    .join('\n');
}

export default function SqlFormatterTool() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const output = useMemo(() => formatSql(input), [input]);

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
          <label class="text-sm font-medium" for="sqlf-input">
            SQL 语句
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
          id="sqlf-input"
          class="textarea textarea-bordered w-full font-mono text-sm"
          rows={7}
          placeholder="粘贴挤成一行的 SQL，例如 select * from users where id = 1"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">格式化结果</span>
            {output && (
              <span class="badge badge-sm badge-ghost">{output.split('\n').length} 行</span>
            )}
          </div>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
            onClick={() => copy(output)}
            disabled={!output}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="max-h-96 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm whitespace-pre">
          {output || <span class="opacity-40">格式化后的 SQL 会显示在这里</span>}
        </pre>
      </div>

      <p class="text-xs leading-relaxed opacity-55">
        按 SELECT / FROM / WHERE / JOIN / GROUP BY 等主关键字换行，AND、OR、ON
        缩进一级并统一大写。仅调整排版不改动语义，全部在本地浏览器完成，语句不会上传。
      </p>
    </div>
  );
}
