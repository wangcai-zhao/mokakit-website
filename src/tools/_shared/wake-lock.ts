import { useEffect } from 'preact/hooks';

/**
 * 保持唤醒（Screen Wake Lock）
 *
 * 开启后请求屏幕常亮，避免时钟常驻大屏时显示器休眠。
 * - 切到后台再回到前台时自动重新申请（浏览器会在页面隐藏时释放锁）。
 * - 不支持的浏览器（如桌面 Firefox / Safari）静默忽略，不影响其它功能。
 * - 另设 20s 兜底补申请，应对部分浏览器长时间无交互后悄悄释放的情况。
 */
export function useWakeLock(enabled: boolean): { supported: boolean } {
  useEffect(() => {
    if (!enabled) return;
    const nav = navigator as any;
    const supported = typeof nav !== 'undefined' && 'wakeLock' in nav;
    if (!supported) return;

    let lock: any = null;
    let timer: number | undefined;

    const acquire = async () => {
      try {
        lock?.release?.();
      } catch {
        /* ignore */
      }
      try {
        lock = await nav.wakeLock.request('screen');
      } catch {
        lock = null;
      }
    };
    const release = () => {
      try {
        lock?.release?.();
      } catch {
        /* ignore */
      }
      lock = null;
    };

    acquire();

    const onVis = () => {
      if (document.visibilityState === 'visible') acquire();
    };
    document.addEventListener('visibilitychange', onVis);

    timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') acquire();
    }, 20000);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (timer) window.clearInterval(timer);
      release();
    };
  }, [enabled]);

  const nav = navigator as any;
  return { supported: typeof nav !== 'undefined' && 'wakeLock' in nav };
}
