/**
 * 站内搜索交互层（Preact 岛）
 * ============================================================================
 * 分工：本文件只负责「交互 + 渲染」，匹配与排序全部在 src/lib/search.ts。
 * 索引由页面以 <script type="application/json" id="mk-search-index"> 内联下发，
 * 组件从 DOM 读一次再解析 —— 这样 60KB 索引在 HTML 里只出现一份，
 * 不会像 astro-island 的 props 序列化那样被 devalue 膨胀成一倍多。
 *
 * 与优化前的差别：
 *   - 防抖 90ms，且中文输入法合成期间不触发（旧版每敲一个字母都全量 filter）
 *   - 键盘 ↑↓ Enter Esc 可用，结果可高亮、可播报（aria-live）
 *   - 空结果给纠错建议 + 热门兜底，不再是一句「换个词试试」
 *   - 索引解析失败有降级路径，不白屏
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  hotTools,
  prepareIndex,
  searchTools,
  splitHighlight,
  type PreparedIndex,
  type SearchHit,
  type SearchIndexData,
} from '@/lib/search';

const INDEX_ID = 'mk-search-index';
const PAGE = 40;

interface Props {
  /** SSR 渲染用的默认推荐，避免首屏空白与无 JS 时整页没内容 */
  hot: SearchHit[];
  initialQuery?: string;
  total: number;
}

/** 高亮片段渲染。只切文本、不拼 HTML，天然免疫注入。 */
function Hi({ text, ranges }: { text: string; ranges: Array<[number, number]> }) {
  if (!ranges.length) return <>{text}</>;
  return (
    <>
      {splitHighlight(text, ranges).map((p, i) =>
        p.hit ? (
          <mark key={i} class="bg-primary/25 text-base-content rounded-sm px-0.5">
            {p.t}
          </mark>
        ) : (
          <span key={i}>{p.t}</span>
        ),
      )}
    </>
  );
}

function ResultRow({ item, selected, index }: { item: SearchHit; selected: boolean; index: number }) {
  return (
    <a
      href={item.url}
      data-idx={index}
      class={`flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
        selected
          ? 'border-primary/60 bg-primary/5'
          : 'border-base-300 hover:border-primary/40 hover:bg-base-200/60'
      }`}
    >
      <span class="mt-0.5 shrink-0 rounded-md bg-base-200 px-1.5 py-0.5 text-[11px] font-medium opacity-80">
        {item.category}
      </span>
      <span class="min-w-0 flex-1">
        <span class="block font-medium leading-snug">
          <Hi text={item.name} ranges={item.nameRanges} />
        </span>
        <span class="mt-0.5 block truncate text-sm opacity-65">
          <Hi text={item.tagline} ranges={item.tagRanges} />
        </span>
      </span>
    </a>
  );
}

export default function SearchIsland({ hot, initialQuery = '', total }: Props) {
  const [pi, setPi] = useState<PreparedIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState(initialQuery);
  const [active, setActive] = useState(initialQuery);
  const [sel, setSel] = useState(0);
  const [limit, setLimit] = useState(PAGE);

  const composing = useRef(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // 索引解析：一次，约 3ms。失败也绝不让页面白屏。
  // 顺带读取 ?q= —— 站点是纯静态，构建期拿不到查询参数，必须在客户端读，
  // 否则「复制链接分享搜索结果」会失效（白屏只剩热门）。
  useEffect(() => {
    try {
      const el = document.getElementById(INDEX_ID);
      const raw = el?.textContent;
      if (!raw) throw new Error('index missing');
      const data = JSON.parse(raw) as SearchIndexData;
      if (data?.v !== 2 || !Array.isArray(data.n)) throw new Error('index version mismatch');
      setPi(prepareIndex(data));
    } catch {
      setFailed(true);
    }
    const fromUrl = new URLSearchParams(window.location.search).get('q') ?? '';
    if (fromUrl && fromUrl !== initialQuery) {
      setQ(fromUrl);
      setActive(fromUrl);
    }
  }, []);

  // 防抖：输入法合成期间不搜，避免拼音上屏阶段的抖动式重排
  useEffect(() => {
    if (composing.current) return;
    const t = setTimeout(() => setActive(q), 90);
    return () => clearTimeout(t);
  }, [q]);

  // 同步到地址栏，保证「复制链接即可复现搜索」，但不产生历史记录
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (active) params.set('q', active);
    else params.delete('q');
    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', next);
  }, [active]);

  useEffect(() => {
    setSel(0);
    setLimit(PAGE);
  }, [active]);

  const result = useMemo(
    () => (pi ? searchTools(pi, active, { limit }) : null),
    [pi, active, limit],
  );

  // 没索引时（SSR / 解析中 / 解析失败）退回服务端给的热门
  const fallback = useMemo(() => (pi ? hotTools(pi, 12) : hot), [pi, hot]);

  const list: SearchHit[] = active && result ? result.hits : active ? [] : fallback;
  const hasQuery = active.trim().length > 0;

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      setQ('');
      setActive('');
      return;
    }
    if (!list.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => (s + 1) % list.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => (s - 1 + list.length) % list.length);
    } else if (e.key === 'Enter') {
      const target = list[sel];
      if (target) window.location.href = target.url;
    }
  }

  // 键盘选中项跟随滚动，长列表也不会「选到看不见的地方」
  useEffect(() => {
    const box = listRef.current;
    if (!box) return;
    const node = box.querySelector<HTMLElement>(`[data-idx="${sel}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  return (
    <div>
      <div class="relative">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-50">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          id="q"
          type="search"
          value={q}
          autofocus
          autocomplete="off"
          spellcheck={false}
          role="combobox"
          aria-expanded={list.length > 0}
          aria-controls="mk-results"
          aria-autocomplete="list"
          placeholder="搜工具名、关键词或拼音，如：密码 / mima / JSON"
          class="input input-bordered w-full bg-base-100 pl-10 [&::-webkit-search-cancel-button]:hidden"
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={(e) => {
            composing.current = false;
            const v = (e.target as HTMLInputElement).value;
            setQ(v);
            setActive(v);
          }}
          onKeyDown={onKeyDown}
        />
        {q && (
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-square absolute right-1.5 top-1/2 -translate-y-1/2 opacity-60"
            aria-label="清空搜索"
            onClick={() => {
              setQ('');
              setActive('');
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 无障碍：结果数变化时播报，屏幕阅读器用户也能感知搜索反馈 */}
      <p class="mt-3 text-sm opacity-60" aria-live="polite">
        {failed
          ? '索引加载失败，可直接浏览全部工具。'
          : !hasQuery
            ? `输入关键词，从 ${total} 个工具里找（也可用拼音，如 mima）。`
            : !result
              ? '正在载入索引…'
              : result.hits.length === 0
                ? `没有匹配「${active}」的工具。`
                : `找到 ${result.total} 个结果${result.relaxed ? '（已放宽匹配范围）' : ''}${result.total > result.hits.length ? `，显示前 ${result.hits.length} 个` : ''}`}
      </p>

      {!hasQuery && !failed && (
        <p class="mt-1 text-xs opacity-45">热门工具 · 试试上面的搜索框，支持拼音首字母（mmcq）</p>
      )}

      {/* 纠错建议：结果为空时给方向，放宽匹配时也提示一次，避免用户以为搜错了 */}
      {hasQuery && result && result.suggestions.length > 0 && (
        <p class="mt-3 text-sm opacity-70">
          你是不是想找：
          {result.suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              class="ml-1.5 rounded-md bg-base-200 px-2 py-0.5 text-primary hover:bg-base-300"
              onClick={() => {
                setQ(s);
                setActive(s);
              }}
            >
              {s}
              {i === result.suggestions.length - 1 ? '' : '、'}
            </button>
          ))}
        </p>
      )}

      {/* 空结果：不给一句冷冰冰的「换个词」，直接给热门兜底 */}
      {hasQuery && result && result.hits.length === 0 && (
        <div class="mt-4">
          <p class="text-xs opacity-45">先看看大家都在用的：</p>
          <div class="mt-2 grid gap-2 sm:grid-cols-2" id="mk-results">
            {fallback.slice(0, 6).map((t, i) => (
              <ResultRow key={t.id} item={t} selected={false} index={i} />
            ))}
          </div>
          <a href="/tools/" class="mt-4 inline-block text-sm text-primary hover:underline">
            浏览全部 {total} 个工具 →
          </a>
        </div>
      )}

      {(list.length > 0 || (!hasQuery && fallback.length > 0)) && (
        <div ref={listRef} id="mk-results" class="mt-3 max-h-[65vh] overflow-y-auto pr-1">
          <div class="grid gap-2">
            {(hasQuery ? list : fallback).map((t, i) => (
              <ResultRow key={t.id} item={t} selected={hasQuery && i === sel} index={i} />
            ))}
          </div>
        </div>
      )}

      {hasQuery && result && result.total > result.hits.length && (
        <button
          type="button"
          class="btn btn-sm btn-ghost mt-3 w-full"
          onClick={() => setLimit((n) => n + PAGE)}
        >
          显示更多结果（共 {result.total} 个）
        </button>
      )}

      {failed && (
        <a href="/tools/" class="mt-4 inline-block text-sm text-primary hover:underline">
          浏览全部 {total} 个工具 →
        </a>
      )}
    </div>
  );
}
