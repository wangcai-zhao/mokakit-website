import { SITE } from '@/config/site';

/** 本站域名集合（主域名 + 备用域名），用于判定链接是否出站 */
const SITE_HOSTS: string[] = [
  new URL(SITE.url).hostname,
  ...SITE.altDomains.map((d) => new URL(d).hostname),
];

/** 判断一个链接是否为出站（第三方）链接 */
export function isExternal(url: string): boolean {
  const t = (url ?? '').trim();
  if (!t) return false;
  // 站内相对路径 / 锚点 / 协议式链接（邮件、电话）均不算出站
  if (
    t.startsWith('/') ||
    t.startsWith('#') ||
    t.startsWith('mailto:') ||
    t.startsWith('tel:')
  ) {
    return false;
  }
  try {
    const u = new URL(t);
    return !SITE_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith('.' + h));
  } catch {
    return false;
  }
}

/**
 * 出站链接统一走 /go/ 中转页，给用户「即将离开本站」的提示与免责声明。
 * 站内链接原样返回，不做中转。
 */
export function goUrl(url: string): string {
  const t = (url ?? '').trim();
  if (!isExternal(t)) return t;
  return `/go/?url=${encodeURIComponent(t)}`;
}
