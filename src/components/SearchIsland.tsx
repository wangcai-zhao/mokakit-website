import { useState, useEffect } from 'preact/hooks';
import type { SearchEntry } from '@/tools/registry';

/**
 * 搜索岛屿：纯前端本地检索，不依赖后端。
 * 索引由 src/tools/registry.ts 的 buildSearchIndex() 在构建期生成并随页面下发。
 */
export default function SearchIsland({ index }: { index: SearchEntry[] }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState('');

  // 仅在客户端读取 URL 中的 q 参数，避免 SSR 访问 window
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const init = params.get('q') ?? '';
    setQ(init);
    setActive(init);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setActive(q), 120);
    const params = new URLSearchParams(window.location.search);
    if (q) params.set('q', q);
    else params.delete('q');
    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', next);
    return () => clearTimeout(t);
  }, [q]);

  const query = active.trim().toLowerCase();
  const results = query
    ? index.filter((t) => `${t.name} ${t.tagline} ${t.keywords}`.toLowerCase().includes(query))
    : [];

  return (
    <div>
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        </span>
        <input
          type="search"
          value={q}
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
          placeholder="搜索工具，如：密码、换算、JSON…"
          class="input input-bordered w-full pl-10 bg-base-100"
          autofocus
        />
      </div>

      {active.trim() === '' ? (
        <p class="mt-6 text-center opacity-60">输入关键词，从 {index.length} 个工具里找。</p>
      ) : results.length === 0 ? (
        <p class="mt-6 text-center opacity-60">没找到「{active}」相关的工具，换个词试试。</p>
      ) : (
        <>
          <p class="mt-4 text-sm opacity-60">找到 {results.length} 个结果</p>
          <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((t) => (
              <a
                key={t.id}
                href={t.url}
                class="card bg-base-100 border border-base-300 hover:border-primary transition-colors p-4"
              >
                <div class="flex items-center gap-2 font-semibold">
                  <span class="w-2 h-2 rounded-full bg-primary shrink-0" />
                  {t.name}
                </div>
                <p class="mt-1 text-sm opacity-70">{t.tagline}</p>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
