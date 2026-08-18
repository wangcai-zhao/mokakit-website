import { useState, useEffect, useRef } from 'preact/hooks';
import { ZONES, offsetLabel, zoneParts, enDateParts } from '@/tools/_shared/timezones';
import { useWakeLock } from '@/tools/_shared/wake-lock';
import { useClockSettings, ClockSettingsBar, ClockBackdrop, stageColor, useApplyBgHash, CLOCK_TYPES } from '@/tools/_shared/ClockStage';
import { getTheme } from '@/tools/_shared/clock-themes';

const SIZE: Record<string, string> = { sm: '4.5rem', md: '7rem', lg: '10rem' };

export default function DigitalClock() {
  const [settings, setPartial] = useClockSettings('digital');
  useApplyBgHash(settings, setPartial);
  const [now, setNow] = useState(() => new Date());
  const [tz, setTz] = useState('Asia/Shanghai');
  const [full, setFull] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const theme = getTheme(settings.theme);

  useWakeLock(settings.wake);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 250);
    return () => window.clearInterval(id);
  }, []);

  const toggleFs = () => {
    const el = rootRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };
  useEffect(() => {
    const onCh = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onCh);
    return () => document.removeEventListener('fullscreenchange', onCh);
  }, []);

  // 防御性：fg 永远是有效颜色值，即使 settings 异常
  const rawFg = stageColor(settings, theme);
  const fg = (rawFg && rawFg.startsWith('#')) ? rawFg : '#ffffff';
  const p = zoneParts(tz, settings.hour12, now);
  // 数字时钟：12h 模式用小写 am/pm 代替中文「上午/下午」，与截图一致
  const dp = p.dayPeriod === '上午' ? 'am' : p.dayPeriod === '下午' ? 'pm' : (p.dayPeriod || '');
  const { weekday, date } = enDateParts(tz, now);

  return (
    <div ref={rootRef} style={{ position: 'relative', zIndex: 10, color: fg }}>
      {/* 全屏背景层（fixed） */}
      <ClockBackdrop settings={settings} theme={theme} />

      <style>{`@keyframes ck-blink{50%{opacity:0.15}}`}</style>

      {/* 控制栏（fixed 顶部） */}
      {!full && (
        <ClockSettingsBar
          settings={settings}
          onChange={setPartial}
          onFullscreen={toggleFs}
          currentTypeId="digital"
          title="数字全屏时钟"
        />
      )}

      {/* 时钟内容：玻璃卡片，截图同款居中大面板、内部左对齐 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '4.5rem 1rem 2rem',
          position: 'relative',
          zIndex: 10,
          color: fg,
        }}
      >
        <div
          style={{
            alignSelf: 'center',
            width: 'auto',
            maxWidth: 'min(92vw, 820px)',
            borderRadius: '1.2rem',
            padding: '2.2rem 2.8rem',
            background: 'linear-gradient(160deg, rgba(18,20,28,0.62), rgba(10,11,18,0.5))',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 10px 36px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.7rem',
          }}
        >
          {/* 日期行：英文星期 + ISO 日期，斜体 */}
          {settings.showDate && (
            <div style={{ opacity: 0.85, fontSize: '1.3rem', letterSpacing: '0.04em', fontWeight: 300, fontStyle: 'italic' }}>
              {weekday} {date}
            </div>
          )}

          {/* 时间数字 */}
          <div
            style={{
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 300,
              fontSize: SIZE[settings.fontScale],
              lineHeight: 1,
              letterSpacing: '0.05em',
              textShadow: settings.glow ? `0 0 30px ${theme.glow}, 0 0 80px ${theme.glow}` : '0 2px 14px rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.08em',
            }}
          >
            <span>{p.hour}</span>
            <span style={{ opacity: 0.8, animation: 'ck-blink 1.06s steps(1) infinite' }}>:</span>
            <span>{p.minute}</span>
            {settings.showSeconds && (
              <span style={{ fontSize: '0.55em', opacity: 0.8 }}>:{p.second}</span>
            )}
            {settings.hour12 && dp && (
              <span style={{ fontSize: '0.28em', marginLeft: '0.5rem', opacity: 0.75, fontWeight: 400, textTransform: 'lowercase' }}>{dp}</span>
            )}
          </div>
        </div>

        {/* 时区选择：独立于卡片，单独水平居中 */}
        <select
          value={tz}
          onInput={(e) => setTz((e.currentTarget as HTMLSelectElement).value)}
          style={{
            marginTop: '1.4rem',
            borderRadius: '0.6rem',
            padding: '0.4rem 0.9rem',
            fontSize: '0.9rem',
            color: fg,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            cursor: 'pointer',
          }}
        >
          {ZONES.map((z) => (
            <option key={z.tz} value={z.tz} style={{ color: '#111' }}>
              {z.city} · {z.cn}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
