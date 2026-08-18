/**
 * 世界时区地图（SVG，等距圆柱投影）。
 *
 * 大陆轮廓与投影思路来自 SEN LTD 的 tz-world-map（MIT 许可证）：
 * https://github.com/sen-ltd/tz-world-map
 *
 * 改进点：
 * - 用 SVG 替代 canvas，响应式缩放、无 devicePixelRatio 处理。
 * - 昼夜线基于当前太阳赤纬计算，比简单经线遮罩更准确。
 * - 标注约 100 个世界城市，用户已选城市高亮并显示名称。
 * - 支持容器全屏。
 */

import { useState, useEffect, useRef } from 'preact/hooks';
import { MAP_CITIES } from '@/tools/_shared/map-cities';
import { offsetLabel } from '@/tools/_shared/timezones';

interface Props {
  list: string[]; // 已选时区 tz 列表（世界时钟卡片中显示的城市）
  hour12: boolean;
  accent?: string;
  fg?: string;
}

const W = 1000;
const H = 500;

// 手绘简化大陆轮廓（来自 sen-ltd/tz-world-map，MIT）
const CONTINENT_PATHS = [
  // North America (incl. Alaska + Greenland)
  'M40,75 L100,60 L140,55 L180,65 L210,80 L235,110 L260,130 L280,160 L300,180 L290,210 L260,235 L220,250 L185,255 L155,250 L130,235 L110,210 L90,185 L75,160 L60,135 L48,110 Z M270,55 L310,50 L335,65 L325,90 L300,100 L280,85 Z',
  // South America
  'M260,275 L300,260 L330,275 L350,310 L355,355 L345,400 L320,440 L295,460 L280,440 L275,400 L270,360 L255,325 L255,300 Z',
  // Europe
  'M470,80 L505,75 L540,80 L565,100 L575,125 L555,140 L525,145 L500,135 L478,118 L465,100 Z',
  // Africa
  'M490,165 L530,160 L570,170 L600,195 L615,225 L620,270 L615,320 L595,365 L570,395 L540,410 L515,395 L500,365 L490,335 L485,300 L490,260 L495,225 L490,195 Z',
  // Asia
  'M555,75 L620,70 L685,75 L735,90 L780,110 L810,135 L825,160 L835,185 L815,200 L780,210 L740,215 L705,205 L675,195 L640,180 L605,170 L575,155 L555,135 L550,110 Z',
  // Southeast Asia + Indonesia
  'M755,225 L790,225 L820,235 L835,255 L835,275 L815,285 L790,278 L770,265 L755,250 Z',
  // Australia
  'M820,355 L860,345 L895,355 L910,375 L905,395 L880,405 L850,402 L825,390 L815,372 Z',
  // Antarctica strip
  'M0,475 L1000,475 L1000,500 L0,500 Z',
];

function project(lat: number, lon: number, width = W, height = H) {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

function hourMeridians(width = W) {
  const lines = [];
  for (let h = -12; h <= 12; h++) {
    const lon = h * 15;
    const x = ((lon + 180) / 360) * width;
    lines.push({ hour: h, lon, x });
  }
  return lines;
}

function normalizeLon(lon: number) {
  return ((lon + 180) % 360) - 180;
}

/** 当前太阳赤纬（度）与子太阳点经度（度） */
function solarPosition(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
  const dayOfYear = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  // δ ≈ -23.44° * cos(2π * (day + 10) / 365)
  const declinationDeg = -23.44 * Math.cos((2 * Math.PI * (dayOfYear + 10)) / 365);

  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const subSolarLonDeg = normalizeLon((12 - utcHours) * 15);
  return { declinationDeg, subSolarLonDeg };
}

/** 构建昼区多边形 path（允许坐标超出 0..W，后续用 mask 裁剪到地图内） */
function dayPathD(now: Date) {
  const { declinationDeg, subSolarLonDeg } = solarPosition(now);
  const δ = (declinationDeg * Math.PI) / 180;
  const λs = subSolarLonDeg;

  const right: string[] = [];
  const left: string[] = [];
  const step = 5;

  for (let φ = 90; φ >= -90; φ -= step) {
    const φr = (φ * Math.PI) / 180;
    let rightLon: number;
    let leftLon: number;

    if (Math.abs(φ) >= 89.9) {
      // 极点：极昼/极夜由太阳赤纬符号决定
      if ((φ > 0 && δ > 0) || (φ < 0 && δ < 0)) {
        rightLon = λs + 180;
        leftLon = λs - 180;
      } else {
        rightLon = λs;
        leftLon = λs;
      }
    } else {
      const tφ = Math.tan(φr);
      const tδ = Math.tan(δ);
      const prod = tφ * tδ;
      if (prod >= 1) {
        // 极昼
        rightLon = λs + 180;
        leftLon = λs - 180;
      } else if (prod <= -1) {
        // 极夜：昼区缩成一条线
        rightLon = λs;
        leftLon = λs;
      } else {
        const dLon = (Math.acos(Math.min(1, Math.max(-1, -prod))) * 180) / Math.PI;
        rightLon = λs + dLon;
        leftLon = λs - dLon;
      }
    }

    const r = project(φ, rightLon, W, H);
    right.push(`${r.x.toFixed(1)},${r.y.toFixed(1)}`);
    const l = project(φ, leftLon, W, H);
    left.unshift(`${l.x.toFixed(1)},${l.y.toFixed(1)}`);
  }

  return `M ${right.join(' L ')} L ${left.join(' L ')} Z`;
}

/** 判断某城市当前是否处于白昼（与晨昏线一致） */
function isCityDay(lat: number, lon: number, now: Date) {
  const { declinationDeg, subSolarLonDeg } = solarPosition(now);
  const δ = (declinationDeg * Math.PI) / 180;
  const φ = (lat * Math.PI) / 180;
  const Δlon = ((lon - subSolarLonDeg + 540) % 360) - 180;
  const ΔlonRad = (Δlon * Math.PI) / 180;
  // cos(太阳天顶距) = sinφ sinδ + cosφ cosδ cosΔlon
  const cosDist = Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ) * Math.cos(ΔlonRad);
  return cosDist > 0;
}

function localTimeLabel(tz: string, now: Date, hour12: boolean) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12,
    }).format(now);
  } catch {
    return '';
  }
}

export default function WorldTimeMap({ list, hour12, accent = '#2ee6a6', fg = '#ffffff' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const toggleFs = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const selected = new Set(list);
  const dayPath = dayPathD(now);
  const meridians = hourMeridians();

  return (
    <div style={{ position: 'relative', marginBottom: '1.1rem' }}>
      <div
        ref={wrapRef}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '2 / 1',
          minHeight: '260px',
          borderRadius: '1rem',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,.35)',
          background: 'rgba(10,20,40,0.35)',
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block', width: '100%', height: '100%' }}
        >
          <defs>
            <mask id="ck-day-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
              {/* 白色 = 夜间层可见；黑色 = 夜间层挖空（露出白昼区） */}
              <rect x={0} y={0} width={W} height={H} fill="white" />
              <path d={dayPath} fill="black" />
            </mask>
          </defs>

          {/* 海洋 */}
          <rect x={0} y={0} width={W} height={H} fill="rgba(8,16,32,0.45)" />

          {/* 大陆 */}
          {CONTINENT_PATHS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill={fg}
              fillOpacity={0.12}
              stroke={fg}
              strokeOpacity={0.18}
              strokeWidth={0.8}
            />
          ))}

          {/* 经线网格（每 15°） */}
          {meridians.map((m) => (
            <line
              key={m.hour}
              x1={m.x}
              x2={m.x}
              y1={0}
              y2={H}
              stroke={fg}
              strokeOpacity={0.08}
              strokeWidth={m.hour === 0 ? 1.2 : 0.6}
              strokeDasharray={m.hour === 0 ? undefined : '4 4'}
            />
          ))}
          {/* 纬线网格（每 30°） */}
          {[-60, -30, 30, 60].map((lat) => {
            const y = project(lat, 0, W, H).y;
            return (
              <line
                key={lat}
                x1={0}
                x2={W}
                y1={y}
                y2={y}
                stroke={fg}
                strokeOpacity={0.06}
                strokeWidth={0.5}
                strokeDasharray="4 4"
              />
            );
          })}
          {/* 赤道 */}
          <line
            x1={0}
            x2={W}
            y1={H / 2}
            y2={H / 2}
            stroke={fg}
            strokeOpacity={0.16}
            strokeWidth={1}
          />
          {/* 本初子午线（已在 hour=0 加粗） */}
          {/* 国际日期变更线 */}
          <line
            x1={project(0, 180, W, H).x - 0.5}
            x2={project(0, 180, W, H).x - 0.5}
            y1={0}
            y2={H}
            stroke={fg}
            strokeOpacity={0.18}
            strokeWidth={1}
            strokeDasharray="6 4"
          />
          <text x={project(0, 180, W, H).x - 6} y={20} fill={fg} fillOpacity={0.5} fontSize={12} textAnchor="end">
            IDL
          </text>

          {/* 经线标签（每 3 小时） */}
          {meridians
            .filter((m) => m.hour % 3 === 0)
            .map((m) => (
              <text
                key={`l-${m.hour}`}
                x={m.x + 3}
                y={14}
                fill={fg}
                fillOpacity={0.45}
                fontSize={11}
              >
                {`${m.hour >= 0 ? '+' : ''}${m.hour}h`}
              </text>
            ))}

          {/* 夜间遮罩 */}
          <rect
            x={0}
            y={0}
            width={W}
            height={H}
            fill="rgba(2,6,18,0.55)"
            mask="url(#ck-day-mask)"
          />

          {/* 城市标记 */}
          {MAP_CITIES.map((city) => {
            const { x, y } = project(city.lat, city.lon, W, H);
            if (x < -20 || x > W + 20 || y < -20 || y > H + 20) return null;
            const sel = selected.has(city.tz);
            const day = isCityDay(city.lat, city.lon, now);
            const fill = sel ? accent : day ? '#ffd166' : '#7aa2ff';
            const r = sel ? 5 : day ? 3.5 : 2.8;
            const label = `${city.name}, ${city.country} — ${city.tz} (${offsetLabel(city.tz, now)}) · ${localTimeLabel(city.tz, now, hour12)}`;
            return (
              <g key={`${city.name}-${city.tz}`}>
                {/* 光晕 */}
                <circle cx={x} cy={y} r={r + 3} fill={fill} fillOpacity={0.18} />
                <circle cx={x} cy={y} r={r} fill={fill} stroke="rgba(0,0,0,0.55)" strokeWidth={1.2} />
                <title>{label}</title>
                {sel && (
                  <text
                    x={x + 8}
                    y={y + 1}
                    fill={fg}
                    fillOpacity={0.9}
                    fontSize={12}
                    fontWeight={600}
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                  >
                    {city.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <button
        onClick={toggleFs}
        style={{
          position: 'absolute',
          top: '0.6rem',
          right: '0.6rem',
          borderRadius: '0.6rem',
          padding: '0.35rem 0.7rem',
          fontSize: '0.78rem',
          color: '#fff',
          background: 'rgba(0,0,0,0.45)',
          border: '1px solid rgba(255,255,255,0.25)',
          cursor: 'pointer',
        }}
        title="全屏查看世界时区地图"
      >
        ⛶ 全屏地图
      </button>
      <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.35rem', paddingLeft: '0.2rem' }}>
        黄点 = 白昼，蓝点 = 夜间；绿点 = 已选城市。昼夜线按当前 UTC 与太阳赤纬实时计算。
      </div>
    </div>
  );
}
