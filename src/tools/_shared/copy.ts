/**
 * 统一的剪贴板复制工具。
 * 优先用 navigator.clipboard（需要安全上下文）；
 * 在 http / file:// 等非安全上下文或权限被拒时，回退到 textarea + execCommand。
 * 全站所有工具的「复制」按钮都走这里，避免 52 处重复实现、行为不一致。
 */
export async function copyText(text: string): Promise<void> {
  const value = (text ?? '').toString();
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }
  } catch {
    // 落到下面的回退方案
  }
  const ta = document.createElement('textarea');
  ta.value = value;
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.left = '0';
  ta.style.opacity = '0';
  ta.style.pointerEvents = 'none';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
}
