import { useState, useEffect, useRef } from 'preact/hooks';
import { ZONES, offsetLabel, zoneParts } from '@/tools/_shared/timezones';
import { useWakeLock } from '@/tools/_shared/wake-lock';
import { useClockSettings, ClockSettingsBar, ClockBackdrop, stageColor, useApplyBgHash } from '@/tools/_shared/ClockStage';
import { getTheme } from '@/tools/_shared/clock-themes';

const SIZE: Record<string, number> = { sm: 92, md: 132, lg: 178 };

function FlipDigit({ char, theme, glow, size }: { char: string; theme: ReturnType<typeof getTheme>; glow: boolean; size: number }) {
  const [cur, setCur] = useState(char);
  const [prev, setPrev] = useState(char);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (char !== cur) {
      setPrev(cur);
      setFlipping(true);
      const t = window.setTimeout(() => {
        setCur(char);
        setFlipping(false);
      }, 600);
      return () => window.clearTimeout(t);
    }
  }, [char]);

  return (
    <div
      class={'ck-flip' + (glow ? ' glow' : '')}
      style={{
        ['--ck-size' as any]: size + 'px',
        ['--ck-glow' as any]: theme.glow,
      }}
    >
      {/* 静态背层：上片显示新值顶、下片显示旧值底（翻动中） */}
      <div class="ck-leaf ck-leaf-t ck-back-t"><div class="ck-num">{flipping ? char : cur}</div></div>
      <div class="ck-leaf ck-leaf-b ck-back-b"><div class="ck-num">{flipping ? prev : cur}</div></div>
      {/* 翻动叶：上叶(旧顶)下折露新顶，下叶(新底)上折盖旧底 */}
      {flipping && <div class="ck-leaf ck-leaf-t ck-flip-t flip"><div class="ck-num">{prev}</div></div>}
      {flipping && <div class="ck-leaf ck-leaf-b ck-flip-b flip"><div class="ck-num">{char}</div></div>}
    </div>
  );
}

export default function FlipClock() {
  const [settings, setPartial] = useClockSettings('flip');
  useApplyBgHash(settings, setPartial);
  const [now, setNow] = useState(() => new Date());
  const [tz, setTz] = useState('Asia/Shanghai');
  const [full, setFull] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const theme = getTheme(settings.theme);
  const size = SIZE[settings.fontScale];

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
  const p = zoneParts(tz, settings.hour12, now);
  const h = (p.hour || '00').padStart(2, '0');
  const m = (p.minute || '00').padStart(2, '0');
  const s = (p.second || '00').padStart(2, '0');

  return (
    <div ref={rootRef} style={{ position: 'relative', zIndex: 10, color: fg }}>
      <ClockBackdrop settings={settings} theme={theme} />

      <style>{`
        /* 金属机架外壳 */
        .ck-flip-rack{display:inline-flex;align-items:center;flex-wrap:wrap;justify-content:center;gap:.4rem;padding:.7rem 1rem;border-radius:1.1rem;background:linear-gradient(160deg,#434343 0%,#1d1d1d 50%,#2c2c2c 100%);border:1px solid #5a5a5a;box-shadow:inset 0 2px 0 rgba(255,255,255,.10),inset 0 -3px 10px rgba(0,0,0,.55),0 16px 36px rgba(0,0,0,.5),0 4px 0 #111;}
        /* 单张牌 */
        .ck-flip{position:relative;display:inline-block;width:calc(var(--ck-size,132px) * 0.66);height:var(--ck-size,132px);margin:0 .12rem;vertical-align:middle;perspective:900px;font-variant-numeric:tabular-nums;font-weight:800;color:#1a1a1a;line-height:1;}
        /* 半片：静态背层 + 翻动叶共用 */
        .ck-leaf{position:absolute;left:0;right:0;height:50%;overflow:hidden;background:#e6e6e6;border:1px solid #8a8a8a;backface-visibility:hidden;}
        .ck-leaf-t{top:0;border-radius:.6rem .6rem 0 0;border-bottom:none;transform-origin:bottom center;}
        .ck-leaf-b{bottom:0;border-radius:0 0 .6rem .6rem;border-top:none;transform-origin:top center;}
        .ck-leaf .ck-num{position:absolute;left:0;width:100%;height:var(--ck-size,132px);display:flex;align-items:center;justify-content:center;font-size:calc(var(--ck-size,132px) * .66);text-shadow:0 1px 0 rgba(255,255,255,.4);}
        .ck-leaf-t .ck-num{top:0;}
        .ck-leaf-b .ck-num{bottom:0;}
        /* 静态背层（停留牌面） */
        .ck-back-t{background:linear-gradient(180deg,#ffffff 0%,#dadada 100%);z-index:1;}
        .ck-back-b{background:linear-gradient(180deg,#b6b6b6 0%,#ededed 100%);z-index:1;}
        /* 翻动叶 */
        .ck-flip-t{background:linear-gradient(180deg,#fbfbfb 0%,#dcdcdc 100%);z-index:3;}
        .ck-flip-b{background:linear-gradient(180deg,#cfcfcf 0%,#f4f4f4 100%);z-index:2;transform:rotateX(90deg);}
        /* 翻动阴影，增强机械立体感 */
        .ck-flip-t::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,.32) 100%);}
        .ck-flip-b::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.32) 0%,rgba(0,0,0,0) 45%);}
        /* 中缝 */
        .ck-flip::after{content:'';position:absolute;top:50%;left:0;right:0;height:2px;background:rgba(0,0,0,.42);transform:translateY(-50%);z-index:4;pointer-events:none;box-shadow:0 1px 0 rgba(255,255,255,.28);}
        /* 四角螺丝 */
        .ck-flip::before{content:'';position:absolute;inset:0;border-radius:.6rem;pointer-events:none;z-index:5;background-image:radial-gradient(circle at 7% 7%,#9a9a9a 0 2px,transparent 3px),radial-gradient(circle at 93% 7%,#9a9a9a 0 2px,transparent 3px),radial-gradient(circle at 7% 93%,#9a9a9a 0 2px,transparent 3px),radial-gradient(circle at 93% 93%,#9a9a9a 0 2px,transparent 3px);}
        /* 辉光 */
        .ck-flip.glow .ck-leaf{box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 0 20px var(--ck-glow);}
        /* 真实机械翻页：上叶下折露新顶，下叶上折盖旧底 */
        .ck-flip-t.flip{animation:ck-flipTop .30s ease-in forwards;}
        .ck-flip-b.flip{animation:ck-flipBot .30s ease-out .30s forwards;}
        @keyframes ck-flipTop{0%{transform:rotateX(0)}100%{transform:rotateX(-90deg)}}
        @keyframes ck-flipBot{0%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}
        @keyframes ck-blink{50%{opacity:.15}}
      `}</style>

      {!full && (
        <ClockSettingsBar
          settings={settings}
          onChange={setPartial}
          onFullscreen={toggleFs}
          currentTypeId="flip"
        />
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '0.8rem',
          padding: '4rem 1rem 2rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* 翻牌数字：金属机架 */}
        <div class="ck-flip-rack">
          <FlipDigit char={h[0]} theme={theme} glow={settings.glow} size={size} />
          <FlipDigit char={h[1]} theme={theme} glow={settings.glow} size={size} />
          <span style={{ fontSize: size * 0.48 + 'px', fontWeight: 700, opacity: 0.85, animation: 'ck-blink 1.06s steps(1) infinite', margin: '0 .15rem', color: '#f0f0f0', textShadow: '0 2px 4px rgba(0,0,0,.5)' }}>:</span>
          <FlipDigit char={m[0]} theme={theme} glow={settings.glow} size={size} />
          <FlipDigit char={m[1]} theme={theme} glow={settings.glow} size={size} />
          {settings.showSeconds && (
            <>
              <span style={{ fontSize: size * 0.48 + 'px', fontWeight: 700, opacity: 0.85, animation: 'ck-blink 1.06s steps(1) infinite', margin: '0 .15rem', color: '#f0f0f0', textShadow: '0 2px 4px rgba(0,0,0,.5)' }}>:</span>
              <FlipDigit char={s[0]} theme={theme} glow={settings.glow} size={size} />
              <FlipDigit char={s[1]} theme={theme} glow={settings.glow} size={size} />
            </>
          )}
        </div>

        {/* 日期 + 星期 + 时段：纯文本 */}
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', opacity: 0.8, fontSize: '1rem' }}>
          {settings.showDate && <span>{`${p.year}年${p.month}月${p.day}日 ${p.weekday}`}</span>}
          {settings.hour12 && p.dayPeriod && <span>{p.dayPeriod}</span>}
        </div>

        {/* 时区选择 */}
        <select
          value={tz}
          onInput={(e) => setTz((e.currentTarget as HTMLSelectElement).value)}
          style={{
            borderRadius: '0.6rem',
            padding: '0.3rem 0.6rem',
            fontSize: '0.85rem',
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
