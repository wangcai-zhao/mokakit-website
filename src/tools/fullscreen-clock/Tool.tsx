import { useState, useEffect, useRef } from 'preact/hooks';
import { ZONES, zoneParts, enDateParts } from '@/tools/_shared/timezones';
import { useWakeLock } from '@/tools/_shared/wake-lock';
import {
  useClockSettings,
  ClockSettingsBar,
  ClockBackdrop,
  stageColor,
  useApplyBgHash,
} from '@/tools/_shared/ClockStage';
import { getTheme } from '@/tools/_shared/clock-themes';

/**
 * 毫秒开关只属于本页，不并进共享的时钟外观设置 ——
 * 共享设置会被数字/翻页/模拟/世界四个时钟同时读写，加字段等于给它们都加一项无关配置。
 */
const MS_KEY = 'mokakit-fullscreen-ms';

export default function FullscreenClock() {
  // 大屏场景默认常亮、默认最大字号，其他外观设置与站内时钟通用
  const [settings, setPartial] = useClockSettings('fullscreen', {
    wake: true,
    showSeconds: true,
    fontScale: 'lg',
  });
  useApplyBgHash(settings, setPartial);

  const [now, setNow] = useState(() => new Date());
  const [tz, setTz] = useState('Asia/Shanghai');
  const [full, setFull] = useState(false);
  const [showMs, setShowMs] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const theme = getTheme(settings.theme);

  useWakeLock(settings.wake);

  // 开毫秒时把刷新频率提到约 16fps，否则 250ms 一次足够
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), showMs ? 60 : 250);
    return () => window.clearInterval(id);
  }, [showMs]);

  // 毫秒偏好读自家 key，避免污染共享的 mokakit-clock
  useEffect(() => {
    try {
      setShowMs(localStorage.getItem(MS_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(MS_KEY, showMs ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [showMs]);

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

  const rawFg = stageColor(settings, theme);
  const fg = rawFg && rawFg.startsWith('#') ? rawFg : '#ffffff';
  const p = zoneParts(tz, settings.hour12, now);
  const { weekday, date } = enDateParts(tz, now);
  const dp = p.dayPeriod === '上午' ? 'am' : p.dayPeriod === '下午' ? 'pm' : p.dayPeriod || '';
  const ms = showMs ? String(now.getMilliseconds()).padStart(3, '0') : '';

  const pill: Record<string, string> = {
    borderRadius: '999px',
    padding: '0.45rem 1.1rem',
    fontSize: '0.9rem',
    color: fg,
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.20)',
    cursor: 'pointer',
    backdropFilter: 'blur(6px)',
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', zIndex: 10, color: fg }}>
      <ClockBackdrop settings={settings} theme={theme} />
      <style>{`@keyframes fs-blink{50%{opacity:0.15}}`}</style>

      {!full && (
        <ClockSettingsBar
          settings={settings}
          onChange={setPartial}
          onFullscreen={toggleFs}
          currentTypeId="fullscreen"
          title="全屏大屏时钟"
        />
      )}

      {/*
        铺满整屏：数字随视口宽度撑开，不加卡片、不加边框，
        这是与「数字时钟」那一页（居中玻璃卡片 + 控制面板）最直观的区别。
      */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '5rem 1rem 4.5rem',
          position: 'relative',
          zIndex: 10,
          color: fg,
        }}
      >
        {settings.showDate && (
          <div
            style={{
              opacity: 0.85,
              fontSize: 'clamp(1rem, 2.6vw, 2.2rem)',
              letterSpacing: '0.06em',
              fontWeight: 300,
              fontStyle: 'italic',
              marginBottom: '0.4em',
            }}
          >
            {weekday} {date}
          </div>
        )}

        <div
          style={{
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 300,
            fontSize: 'clamp(3.5rem, 16vw, 20rem)',
            lineHeight: 1,
            letterSpacing: '0.02em',
            textShadow: settings.glow
              ? `0 0 30px ${theme.glow}, 0 0 90px ${theme.glow}`
              : '0 2px 18px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.06em',
          }}
        >
          <span>{p.hour}</span>
          <span style={{ opacity: 0.8, animation: 'fs-blink 1.06s steps(1) infinite' }}>:</span>
          <span>{p.minute}</span>
          {settings.showSeconds && (
            <span style={{ fontSize: '0.5em', opacity: 0.85 }}>:{p.second}</span>
          )}
          {showMs && <span style={{ fontSize: '0.32em', opacity: 0.7 }}>.{ms}</span>}
          {settings.hour12 && dp && (
            <span
              style={{
                fontSize: '0.24em',
                marginLeft: '0.5rem',
                opacity: 0.75,
                fontWeight: 400,
                textTransform: 'lowercase',
              }}
            >
              {dp}
            </span>
          )}
        </div>
      </div>

      {/* 底部操作条：毫秒开关是本页独有的差异点，时区切换也放这里 */}
      {!full && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: '1.1rem',
            zIndex: 20,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.55rem',
            flexWrap: 'wrap',
            padding: '0 1rem',
          }}
        >
          <button type="button" onClick={() => setShowMs(!showMs)} style={pill}>
            {showMs ? '隐藏毫秒' : '显示毫秒'}
          </button>
          <select
            value={tz}
            onInput={(e) => setTz((e.currentTarget as HTMLSelectElement).value)}
            style={{ ...pill, padding: '0.45rem 0.8rem' }}
          >
            {ZONES.map((z) => (
              <option key={z.tz} value={z.tz} style={{ color: '#111' }}>
                {z.city} · {z.cn}
              </option>
            ))}
          </select>
          <button type="button" onClick={toggleFs} style={pill}>
            进入全屏
          </button>
        </div>
      )}
    </div>
  );
}
