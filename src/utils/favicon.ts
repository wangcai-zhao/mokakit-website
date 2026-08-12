/**
 * 从站点 URL 派生 favicon 地址。
 * 直接取根域的 /favicon.ico，零第三方依赖，符合纯静态原则；
 * 加载失败时由调用方用字母头像兜底。
 */
export function faviconOf(url: string): string {
  try {
    return `https://${new URL(url).hostname}/favicon.ico`;
  } catch {
    return '';
  }
}
