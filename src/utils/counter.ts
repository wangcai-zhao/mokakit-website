/**
 * 匿名访问量计数器（前端模块）。
 *
 * 设计要点：
 * - 所有行为门禁于 SITE.counter.enabled。enabled=false 时彻底空操作，一个请求都不发。
 * - key 方案：view:${pathname}（单页 PV）、use:${toolId}（工具使用次数）、site:visits（全站总量）。
 * - 本模块只能在「打包型 <script>」里 import（Astro 用 Vite 打包，可走裸模块 import）；
 *   绝不能在 .astro 的 frontmatter / getStaticPaths 里 import，否则会拖进 SSR 预渲染。
 */

import { SITE } from '@/config/site';

// SITE 是 as const，enabled 被推断成字面量 false，这里显式放宽成 boolean，
// 这样 server 把 enabled 改成 true 重新构建后，运行时判断才正确。
const ENABLED: boolean = SITE.counter.enabled;
const API_BASE: string = SITE.counter.apiBase;

/** 计数 key 生成器 */
export const keys = {
  /** 单页 PV：view:/tools/xxx/ */
  view: (pathname: string) => `view:${pathname}`,
  /** 工具使用次数：use:<toolId> */
  use: (toolId: string) => `use:${toolId}`,
  /** 全站累计访问总量（常量 key） */
  site: 'site:visits',
};

const REQUEST_TIMEOUT = 5000;

async function post(ks: string[], delta: number): Promise<Record<string, number> | null> {
  if (!ENABLED || ks.length === 0) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT);
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ks, delta }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { counts?: Record<string, number> };
    return data.counts ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function get(ks: string[]): Promise<Record<string, number> | null> {
  if (!ENABLED || ks.length === 0) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT);
  try {
    const url = `${API_BASE}?keys=${encodeURIComponent(ks.join(','))}`;
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { counts?: Record<string, number> };
    return data.counts ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 累加给定 key（默认 +1），返回累加后的完整 counts 映射 */
export async function bump(ks: string[], delta = 1): Promise<Record<string, number> | null> {
  return post(ks, delta);
}

/** 累加单个 key（默认 +1），返回完整 counts 映射 */
export async function bumpCount(key: string, delta = 1): Promise<Record<string, number> | null> {
  return post([key], delta);
}

/** 批量读取当前计数 */
export async function getCounts(ks: string[]): Promise<Record<string, number> | null> {
  return get(ks);
}

/** 读取单个 key 的当前计数（无则返回 null） */
export async function getCount(key: string): Promise<number | null> {
  const c = await get([key]);
  return c ? (c[key] ?? null) : null;
}

/** 千分位 + 万/亿缩写。例：1234 -> 1,234；123456 -> 12.3万；123456789 -> 1.2亿 */
export function fmtCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) n = 0;
  if (n >= 1e8) return `${(n / 1e8).toFixed(1).replace(/\.0$/, '')}亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1).replace(/\.0$/, '')}万`;
  return n.toLocaleString('zh-CN');
}
