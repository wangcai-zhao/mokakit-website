import { useState, useEffect, useRef } from 'preact/hooks';
import { ZONES, offsetLabel, zoneParts, enDateParts, type Zone } from '@/tools/_shared/timezones';
import { useWakeLock } from '@/tools/_shared/wake-lock';
import { useClockSettings, ClockSettingsBar, ClockBackdrop, stageColor, useApplyBgHash } from '@/tools/_shared/ClockStage';
import { getTheme } from '@/tools/_shared/clock-themes';
import WorldTimeMap from '@/tools/_shared/WorldTimeMap';

const DEFAULT_TZ = [
  'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Taipei', 'Asia/Tokyo',
  'Asia/Seoul', 'Asia/Singapore', 'Asia/Bangkok', 'Asia/Dubai',
  'Europe/Moscow', 'Europe/Paris', 'Europe/Berlin', 'Europe/London',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Sao_Paulo',
  'Australia/Sydney', 'Pacific/Auckland',
];

export default function WorldClock() {
  const [settings, setPartial] = useClockSettings('world');
  useApplyBgHash(settings, setPartial);
  const [now, setNow] = useState(() => new Date());
  // 首帧用默认城市，挂载后从 localStorage 读取用户自定义列表，避免 hydration mismatch
  const [list, setList] = useState<string[]>(DEFAULT_TZ);
  const [q, setQ] = useState('');
  const [full, setFull] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const theme = getTheme(settings.theme);

  useWakeLock(settings.wake);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mokakit-world-list', JSON.stringify(list));
    } catch { /* ignore */ }
  }, [list]);

  // 挂载后再读用户自定义城市列表，首帧与 SSR（默认列表）保持一致，消除 hydration mismatch
  useEffect(() => { setList(load()); }, []);

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

  function load(): string[] {
    if (typeof localStorage === 'undefined') return DEFAULT_TZ;
    try {
      const raw = localStorage.getItem('mokakit-world-list');
      return raw ? (JSON.parse(raw) as string[]) : DEFAULT_TZ;
    } catch {
      return DEFAULT_TZ;
    }
  }

  const zoneOf = (tz: string): Zone | undefined => ZONES.find((z) => z.tz === tz);
  const add = (tz: string) => setList((l) => (l.includes(tz) ? l : [...l, tz]));
  const remove = (tz: string) => setList((l) => l.filter((t) => t !== tz));

  const fg = stageColor(settings, theme);
  const results = q
    ? ZONES.filter(
        (z) =>
          z.city.includes(q) ||
          z.cn.includes(q) ||
          z.tz.toLowerCase().includes(q.toLowerCase()),
      )
    : [];

  return (
    <div ref={rootRef} style={{ position: 'relative', zIndex: 10, minHeight: '100vh', color: fg }}>
      <ClockBackdrop settings={settings} theme={theme} />

      {!full && (
        <ClockSettingsBar
          settings={settings}
          onChange={setPartial}
          onFullscreen={toggleFs}
          currentTypeId="world"
        />
      )}

      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '4.5rem 1rem 2rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* 搜索添加 */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.8rem' }}>
          <input
            type="text"
            placeholder="搜索城市或时区，如 纽约 / London / Asia"
            value={q}
            onInput={(e) => setQ((e.currentTarget as HTMLInputElement).value)}
            style={{
              flex: '1 1 260px',
              borderRadius: '0.6rem',
              padding: '0.5rem 0.7rem',
              fontSize: '0.9rem',
              color: fg,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          />
        </div>
        {results.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
            {results.slice(0, 8).map((z) => (
              <button
                key={z.tz}
                onClick={() => add(z.tz)}
                style={{
                  borderRadius: '0.6rem',
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.82rem',
                  color: fg,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  cursor: 'pointer',
                }}
              >
                + {z.city}
              </button>
            ))}
          </div>
        )}

        {/* 世界时区地图（昼夜 + 城市标记，可全屏） */}
        <WorldTimeMap list={list} hour12={settings.hour12} accent={theme.accent} fg={fg} />

        {/* 城市卡片：参考截图风格，玻璃质感 + 大字号时间 + 小写 am/pm */}
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {list.map((tz) => {
            const z = zoneOf(tz);
            if (!z) return null;
            const p = zoneParts(tz, settings.hour12, now);
            const off = offsetLabel(tz, now);
            const { weekday, date } = enDateParts(tz, now);
            const hour = parseInt(p.hour || '0', 10);
            const isDay = hour >= 6 && hour < 18;
            const dp = p.dayPeriod === '上午' ? 'am' : p.dayPeriod === '下午' ? 'pm' : (p.dayPeriod || '');
            return (
              <div
                key={tz}
                style={{
                  position: 'relative',
                  borderRadius: '1.1rem',
                  padding: '1.1rem 1.2rem',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  color: fg,
                  boxShadow: 'inset 0 0 24px rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.25)',
                }}
              >
                <button
                  onClick={() => remove(tz)}
                  aria-label="移除"
                  style={{
                    position: 'absolute',
                    top: '0.55rem',
                    right: '0.6rem',
                    background: 'transparent',
                    border: 'none',
                    color: fg,
                    opacity: 0.55,
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ×
                </button>

                {settings.showDate && (
                  <div style={{ fontStyle: 'italic', opacity: 0.75, fontSize: '0.92rem', marginBottom: '0.25rem', letterSpacing: '0.02em' }}>
                    {weekday} {date}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.35rem',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 300,
                    fontSize: '3rem',
                    lineHeight: 1,
                    letterSpacing: '0.02em',
                    textShadow: settings.glow ? `0 0 22px ${theme.glow}` : 'none',
                  }}
                >
                  <span>{p.hour}:{p.minute}</span>
                  {settings.showSeconds && (
                    <span style={{ fontSize: '0.55em', opacity: 0.75 }}>:{p.second}</span>
                  )}
                  {settings.hour12 && dp && (
                    <span style={{ fontSize: '0.32em', marginLeft: '0.25rem', opacity: 0.75, fontWeight: 500 }}>{dp}</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.55rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{z.city}</span>
                  <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>{off}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.78rem', opacity: 0.75 }}>
                    {isDay ? '☀ 白天' : '🌙 夜间'}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', opacity: 0.5, marginTop: '0.1rem' }}>{z.cn}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
