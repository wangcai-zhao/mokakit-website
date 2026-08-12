import { useState, useMemo, useEffect } from 'preact/hooks';
import { DIMS, REPOS, CAPTURED_AT, repoUrl, kfmt, type Repo } from './data';
import { goUrl } from '@/utils/outbound';

const FAV_KEY = 'mokakit-github-stars-fav';
const PAGE = 40;

/** 把 YYYY-MM 转成距今月数，用于活跃度筛选 */
function monthsSince(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return 999;
  const now = new Date();
  return (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
}

/** 出现频次最高的语言，用于语言下拉 */
const LANGS = (() => {
  const c = new Map<string, number>();
  REPOS.forEach((r) => r.l && c.set(r.l, (c.get(r.l) || 0) + 1));
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([l]) => l);
})();

interface Props {
  /** 长尾子页传入的初始维度，如 'ai-llm' */
  initialDim?: string;
}

export default function GithubStars({ initialDim }: Props) {
  const initIdx = initialDim ? DIMS.findIndex((d) => d.id === initialDim) : -1;
  const [dim, setDim] = useState<number>(initIdx >= 0 ? initIdx : -1);
  const [q, setQ] = useState('');
  const [minStar, setMinStar] = useState(0);
  const [fresh, setFresh] = useState(0);
  const [lang, setLang] = useState('');
  const [sort, setSort] = useState<'stars' | 'fresh' | 'fork'>('stars');
  const [favOnly, setFavOnly] = useState(false);
  const [fav, setFav] = useState<Set<string>>(new Set());
  const [shown, setShown] = useState(PAGE);
  const [copied, setCopied] = useState(false);

  // 收藏从 localStorage 恢复（仅客户端，避免 SSR 阶段访问 window）
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) setFav(new Set(JSON.parse(raw)));
    } catch {
      /* localStorage 被禁用时静默降级 */
    }
  }, []);

  function toggleFav(f: string) {
    setFav((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
      } catch {
        /* 忽略写入失败 */
      }
      return next;
    });
  }

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const out = REPOS.filter((r) => {
      if (dim >= 0 && !r.g.includes(dim)) return false;
      if (r.s < minStar) return false;
      if (lang && r.l !== lang) return false;
      if (fresh && monthsSince(r.p) > fresh) return false;
      if (favOnly && !fav.has(r.f)) return false;
      if (kw) {
        const hay = `${r.f} ${r.d} ${r.t.join(' ')} ${r.l}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
    if (sort === 'fresh') out.sort((a, b) => b.p.localeCompare(a.p) || b.s - a.s);
    else if (sort === 'fork') out.sort((a, b) => b.k - a.k);
    else out.sort((a, b) => b.s - a.s);
    return out;
  }, [dim, q, minStar, fresh, lang, sort, favOnly, fav]);

  // 任一筛选条件变化时回到第一页
  useEffect(() => setShown(PAGE), [dim, q, minStar, fresh, lang, sort, favOnly]);

  function exportFav() {
    const picked = REPOS.filter((r) => fav.has(r.f)).sort((a, b) => b.s - a.s);
    const md = ['| 项目 | Star | 语言 | 说明 |', '| --- | --- | --- | --- |']
      .concat(
        picked.map(
          (r) => `| [${r.f}](${repoUrl(r)}) | ${kfmt(r.s)} | ${r.l || '-'} | ${r.d.replace(/\|/g, '/')} |`,
        ),
      )
      .join('\n');
    navigator.clipboard?.writeText(md).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      },
      () => undefined,
    );
  }

  return (
    <div class="space-y-3">
      {/* 维度筛选 */}
      <div class="flex flex-wrap gap-1">
        <button
          type="button"
          class={`btn btn-xs ${dim < 0 ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setDim(-1)}
        >
          全部 {REPOS.length}
        </button>
        {DIMS.map((d, i) => (
          <button
            type="button"
            key={d.id}
            class={`btn btn-xs ${dim === i ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDim(i)}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* 搜索与筛选 */}
      <div class="flex flex-wrap items-center gap-2">
        <input
          class="input input-bordered input-sm flex-1 min-w-56 text-sm"
          aria-label="搜索项目名、描述或 topic"
          placeholder="搜索项目名、描述或 topic（如 agent、rag、vue）"
          value={q}
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        />
        <select
          class="select select-bordered select-sm text-sm"
          aria-label="按 star 数量筛选"
          value={String(minStar)}
          onChange={(e) => setMinStar(+(e.target as HTMLSelectElement).value)}
        >
          <option value="0">全部 star</option>
          <option value="5000">≥ 5k</option>
          <option value="10000">≥ 10k</option>
          <option value="30000">≥ 30k</option>
          <option value="60000">≥ 60k</option>
          <option value="100000">≥ 100k</option>
        </select>
        <select
          class="select select-bordered select-sm text-sm"
          aria-label="按最近更新时间筛选"
          value={String(fresh)}
          onChange={(e) => setFresh(+(e.target as HTMLSelectElement).value)}
        >
          <option value="0">不限活跃度</option>
          <option value="3">近 3 个月更新</option>
          <option value="6">近半年更新</option>
          <option value="12">近 1 年更新</option>
        </select>
        <select
          class="select select-bordered select-sm text-sm"
          aria-label="按语言筛选"
          value={lang}
          onChange={(e) => setLang((e.target as HTMLSelectElement).value)}
        >
          <option value="">全部语言</option>
          {LANGS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          class="select select-bordered select-sm text-sm"
          aria-label="排序方式"
          value={sort}
          onChange={(e) => setSort((e.target as HTMLSelectElement).value as typeof sort)}
        >
          <option value="stars">star 最多</option>
          <option value="fresh">最近更新</option>
          <option value="fork">fork 最多</option>
        </select>
      </div>

      {/* 结果统计与收藏操作 */}
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span class="opacity-70">
          匹配 <b class="text-primary">{list.length}</b> 个项目
        </span>
        <button
          type="button"
          class={`btn btn-xs ${favOnly ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setFavOnly((v) => !v)}
        >
          {favOnly ? '显示全部' : `只看收藏 ${fav.size}`}
        </button>
        {fav.size > 0 && (
          <button type="button" class="btn btn-xs btn-ghost" onClick={exportFav}>
            {copied ? '已复制 ✓' : '导出收藏为 Markdown'}
          </button>
        )}
        <span class="opacity-50 ml-auto">数据采集于 {CAPTURED_AT}</span>
      </div>

      {/* 列表 */}
      <div class="space-y-2">
        {list.slice(0, shown).map((r) => (
          <RepoRow key={r.f} r={r} faved={fav.has(r.f)} onFav={() => toggleFav(r.f)} />
        ))}
        {list.length === 0 && (
          <p class="text-center opacity-55 py-8 text-sm">
            没有匹配的项目，试试放宽筛选条件
          </p>
        )}
      </div>

      {shown < list.length && (
        <button
          type="button"
          class="btn btn-sm btn-outline w-full"
          onClick={() => setShown((n) => n + PAGE)}
        >
          加载更多（还有 {list.length - shown} 个）
        </button>
      )}
    </div>
  );
}

function RepoRow({ r, faved, onFav }: { r: Repo; faved: boolean; onFav: () => void }) {
  const months = monthsSince(r.p);
  const stale = months > 12;
  return (
    <div class="flex items-start gap-2 rounded-xl border border-base-300 bg-base-100 p-3 hover:border-primary/50 transition-colors">
      <button
        type="button"
        class={`btn btn-xs btn-square ${faved ? 'btn-primary' : 'btn-ghost opacity-40'}`}
        title={faved ? '取消收藏' : '收藏'}
        aria-label={faved ? `取消收藏 ${r.n}` : `收藏 ${r.n}`}
        onClick={onFav}
      >
        ★
      </button>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <a
            href={goUrl(repoUrl(r))}
            target="_blank"
            rel="nofollow noopener"
            class="link link-hover font-medium text-sm"
          >
            {r.n}
          </a>
          <span class="text-xs font-semibold text-warning">★ {kfmt(r.s)}</span>
          <span class="text-xs opacity-50">fork {kfmt(r.k)}</span>
          {r.l && <span class="badge badge-ghost badge-xs">{r.l}</span>}
          <span class="text-xs opacity-45">{r.f.split('/')[0]}</span>
          {stale && <span class="text-xs text-error opacity-70">{r.p} 后未更新</span>}
          {r.h && (
            <a
              href={goUrl(r.h)}
              target="_blank"
              rel="nofollow noopener"
              class="text-xs link link-hover opacity-60"
            >
              官网
            </a>
          )}
        </div>
        {r.d && <p class="text-xs opacity-70 mt-1 break-words">{r.d}</p>}
        {r.t.length > 0 && (
          <div class="flex flex-wrap gap-1 mt-1">
            {r.t.map((t) => (
              <span key={t} class="badge badge-outline badge-xs opacity-60">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
