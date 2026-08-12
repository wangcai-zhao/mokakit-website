/**
 * GitHub 高星榜 · 计算型维度扩展（第②波：数据榜单延伸）
 *
 * 不修改 data.ts（它由采集脚本自动生成、可重生）。这里只做「换切片角度」：
 *   - 近期活跃榜：按最后推送时间排序，筛出仍在维护的项目
 *   - 语言精选榜：按主语言聚合，每种语言 Top N
 * 这些函数供 meta.ts（生成长尾子页）与 [...sub].astro（构建期渲染静态表格）共用。
 */
import { REPOS, repoUrl, kfmt, type Repo } from './data';

export interface GhRow {
  n: string;
  f: string;
  d: string;
  s: string;
  l: string;
  p: string;
  url: string;
}

function toRow(r: Repo): GhRow {
  return {
    n: r.n,
    f: r.f,
    d: r.d,
    s: kfmt(r.s),
    l: r.l || '—',
    p: r.p,
    url: repoUrl(r),
  };
}

/** 近期活跃榜：最近 ~11 个月有推送的项目，按推送时间倒序 */
export function reposTrending(limit = 30): GhRow[] {
  return REPOS.filter((r) => (r.p || '') >= '2025-09')
    .sort(
      (a, b) =>
        (b.p || '').localeCompare(a.p || '') || b.s - a.s,
    )
    .slice(0, limit)
    .map(toRow);
}

/** 按主语言筛选，star 降序 */
export function reposByLang(lang: string, limit = 30): GhRow[] {
  return REPOS.filter((r) => (r.l || '') === lang)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(toRow);
}

/** 语言维度：统计各语言仓库数，取 ≥3 个仓、数量前 12 的语言 */
export const LANG_DIMS: { lang: string; count: number; name: string }[] = (() => {
  const cnt = new Map<string, number>();
  for (const r of REPOS) if (r.l) cnt.set(r.l, (cnt.get(r.l) || 0) + 1);
  return [...cnt.entries()]
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([lang, count]) => ({ lang, count, name: lang }));
})();

/** 语言名 → 子页 slug */
export const langSlug = (lang: string) =>
  'lang-' + lang.toLowerCase().replace(/[^a-z0-9]+/g, '-');
