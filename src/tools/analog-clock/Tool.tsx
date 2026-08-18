import { useState, useEffect, useRef } from 'preact/hooks';
import { useWakeLock } from '@/tools/_shared/wake-lock';
import { useClockSettings, ClockSettingsBar, ClockBackdrop, stageColor, useApplyBgHash } from '@/tools/_shared/ClockStage';
import { getTheme } from '@/tools/_shared/clock-themes';

const SIZE: Record<string, number> = { sm: 210, md: 280, lg: 350 };

export default function AnalogClock() {
  // 模拟时钟默认走黑白极简主题（minimal）
  const [settings, setPartial] = useClockSettings('analog', { theme: 'minimal' });
  useApplyBgHash(settings, setPartial);
  const [now, setNow] = useState(() => new Date());
  const [full, setFull] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const theme = getTheme(settings.theme);
  // 表盘尺寸：在固定档位基础上，随视口短边自适应收缩，确保「表盘 + 日期」不超出 100vh 被裁切
  const baseSize = SIZE[settings.fontScale];
  const [size, setSize] = useState(baseSize);
  useEffect(() => {
    const calc = () => {
      const cap = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.6);
      setSize(Math.min(baseSize, Math.max(180, cap)));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [baseSize]);

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

  const fg = stageColor(settings, theme);
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ms = now.getMilliseconds();

  // 连续角度：避免 59→0 时倒转「跳一圈」（经典翻圈 bug）
  const angRef = useRef({ h: 0, m: 0, s: 0 });
  const wrap = (cur: number, prev: number, mod: number): number => {
    let d = cur - (prev % mod);
    if (d < -mod / 2) d += mod;
    if (d > mod / 2) d -= mod;
    return prev + d;
  };
  const hourRaw = (h % 12) * 30 + m * 0.5;
  const minRaw = m * 6 + s * 0.1;
  const secRaw = settings.showSeconds ? s * 6 + (settings.hour12 ? 0 : ms * 0.006) : s * 6;
  if (angRef.current.h === 0 && angRef.current.m === 0 && angRef.current.s === 0) {
    angRef.current = { h: hourRaw, m: minRaw, s: secRaw };
  } else {
    angRef.current.h = wrap(hourRaw, angRef.current.h, 360);
    angRef.current.m = wrap(minRaw, angRef.current.m, 360);
    angRef.current.s = wrap(secRaw, angRef.current.s, 360);
  }
  const hourDeg = angRef.current.h;
  const minDeg = angRef.current.m;
  const secDeg = angRef.current.s;

  return (
    <div ref={rootRef} style={{ position: 'relative', zIndex: 10, color: fg }}>
      <ClockBackdrop settings={settings} theme={theme} />

      <style>{`
        .ck-hand{position:absolute;bottom:50%;left:50%;transform-origin:bottom center;border-radius:10px;}
        .ck-sec-smooth{transition:transform .14s linear;}
        .ck-sec-tick{transition:transform .14s cubic-bezier(.4,2.08,.55,.44);}
      `}</style>

      {!full && (
        <ClockSettingsBar
          settings={settings}
          onChange={setPartial}
          onFullscreen={toggleFs}
          currentTypeId="analog"
        />
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '0.9rem',
          padding: '3.4rem 1rem 1.6rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          class="ck-ana"
          style={{
            position: 'relative',
            width: size + 'px',
            height: size + 'px',
            borderRadius: '50%',
            background: theme.face,
            border: '4px solid ' + theme.border,
            boxShadow: settings.glow
              ? `0 0 60px ${theme.glow},inset 0 0 40px rgba(0,0,0,.3),0 20px 40px rgba(0,0,0,.4)`
              : 'inset 0 0 40px rgba(0,0,0,.3),0 20px 40px rgba(0,0,0,.4)',
            transition: 'all .5s ease',
          }}
        >
          {/* 刻度 */}
          {Array.from({ length: 60 }).map((_, i) => {
            const major = i % 5 === 0;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: major ? '4px' : '2px',
                  height: major ? '11%' : '5.5%',
                  background: major ? theme.tick : theme.tickMinor,
                  transform: `translate(-50%,-100%) rotate(${i * 6}deg)`,
                  transformOrigin: '50% 100%',
                  borderRadius: '2px',
                  boxShadow: major ? `0 0 6px ${theme.glow}` : 'none',
                }}
              />
            );
          })}
          {/* 数字 */}
          {Array.from({ length: 12 }).map((_, i) => {
            const ang = i * 30;
            // 数字到圆心的距离（表盘半径的 ~78%，留出刻度空间）
            const numRadius = size * 0.38;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%,-50%) rotate(${ang}deg) translateY(${-numRadius}px) rotate(${-ang}deg)`,
                  fontWeight: 700,
                  fontSize: size * 0.08 + 'px',
                  color: theme.num,
                  textShadow: `0 0 10px ${theme.glow}`,
                }}
              >
                {i === 0 ? '12' : i}
              </div>
            );
          })}
          {/* 时针 */}
          <div
            class="ck-hand"
            style={{
              width: size * 0.022 + 'px',
              height: '26%',
              background: theme.handH,
              marginLeft: -size * 0.011 + 'px',
              transform: `rotate(${hourDeg}deg)`,
              boxShadow: `0 0 15px ${theme.glow}`,
              zIndex: 30,
            }}
          />
          {/* 分针 */}
          <div
            class="ck-hand"
            style={{
              width: size * 0.014 + 'px',
              height: '36%',
              background: theme.handM,
              marginLeft: -size * 0.007 + 'px',
              transform: `rotate(${minDeg}deg)`,
              boxShadow: '0 0 10px rgba(255,255,255,.3)',
              zIndex: 40,
            }}
          />
          {/* 秒针 */}
          <div
            class={'ck-hand ' + (settings.showSeconds && settings.hour12 ? 'ck-sec-tick' : 'ck-sec-smooth')}
            style={{
              width: '2px',
              height: '42%',
              background: theme.handS,
              marginLeft: '-1px',
              transform: `rotate(${secDeg}deg)`,
              boxShadow: `0 0 10px ${theme.handS}`,
              zIndex: 50,
            }}
          />
        </div>
        {settings.showDate && (
          <div style={{ opacity: 0.8, fontSize: '1.05rem', letterSpacing: '0.04em' }}>
            {now.toLocaleDateString('zh-CN', {
              year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
            })}
          </div>
        )}
      </div>
    </div>
  );
}
