/**
 * 时区换算纯函数层（零依赖，只用浏览器/Node 内置 Intl，即 IANA 时区数据库）。
 *
 * 为什么单独抽到 src/lib：
 *   1. 与财金算法同一套「单源」原则 —— 前端 UI 只负责渲染，算法只此一份，
 *      将来 MCP Server 要曝时区换算能力时直接 import 本文件，不会再抄一遍；
 *   2. 纯函数、不碰 window / document，可被 node 脚本直接跑回归测试。
 *
 * 与 src/tools/_shared/timezones.ts 的分工（别搞混）：
 *   - `_shared/timezones.ts` 是**时钟栏目展示层**的数据：18 个城市带经纬度，
 *     供世界时钟与世界时区地图定位用，只回答「此刻几点」；
 *   - 本文件是**换算算法层**：城市表按大区分组、不含经纬度，回答「A 地某时刻
 *     对应 B 地几点」，并要处理夏令时跳变与重复时刻。两者服务不同场景，
 *     不要互相 import（lib 层不允许依赖 tools 层）。
 *
 * 夏令时（DST）的两个坑，本文件的处理方式：
 *   - 「不存在的时刻」：春季拨快 1 小时，如纽约 2026-03-08 02:30 从未发生。
 *     两步法求解后会顺延到拨快后的 03:30，并通过 dstShiftMin 告知调用方；
 *   - 「重复的时刻」：秋季拨慢 1 小时，01:30 出现两次。本文件取**先发生**的
 *     那一次（仍处于夏令时），与 Java / Python zoneinfo 的默认 fold=0 一致。
 */
import { err, ok, type ToolResult } from './tool-result';

/** 时区表条目 */
export interface TzCity {
  /** 城市中文名 */
  city: string;
  /** IANA 时区标识，如 Asia/Shanghai */
  tz: string;
  /** 分组，用于下拉框 optgroup */
  region: string;
  /** 补充说明，如「无夏令时」「半小时时区」 */
  note?: string;
}

/** 分组顺序（下拉框按此排列，中国与 UTC 最常用放前面） */
export const TZ_REGIONS = ['基准', '中国', '亚洲', '中东', '欧洲', '美洲', '大洋洲', '非洲'] as const;

/**
 * 常用时区表，覆盖跨境办公、外贸、留学、追剧看球等场景。
 * 顺序即下拉框内的展示顺序，越靠前越常用。
 */
export const TIME_ZONES: TzCity[] = [
  { city: 'UTC 协调世界时', tz: 'UTC', region: '基准', note: '全球时间基准' },
  { city: '北京', tz: 'Asia/Shanghai', region: '中国', note: '无夏令时' },
  { city: '香港', tz: 'Asia/Hong_Kong', region: '中国', note: '无夏令时' },
  { city: '澳门', tz: 'Asia/Macau', region: '中国', note: '无夏令时' },
  { city: '台北', tz: 'Asia/Taipei', region: '中国', note: '无夏令时' },
  { city: '东京', tz: 'Asia/Tokyo', region: '亚洲', note: '无夏令时' },
  { city: '首尔', tz: 'Asia/Seoul', region: '亚洲', note: '无夏令时' },
  { city: '新加坡', tz: 'Asia/Singapore', region: '亚洲', note: '无夏令时' },
  { city: '曼谷', tz: 'Asia/Bangkok', region: '亚洲', note: '无夏令时' },
  { city: '雅加达', tz: 'Asia/Jakarta', region: '亚洲', note: '无夏令时' },
  { city: '马尼拉', tz: 'Asia/Manila', region: '亚洲', note: '无夏令时' },
  { city: '胡志明市', tz: 'Asia/Ho_Chi_Minh', region: '亚洲', note: '无夏令时' },
  { city: '孟买', tz: 'Asia/Kolkata', region: '亚洲', note: 'UTC+5:30 半小时时区' },
  { city: '加德满都', tz: 'Asia/Kathmandu', region: '亚洲', note: 'UTC+5:45 三刻钟时区' },
  { city: '迪拜', tz: 'Asia/Dubai', region: '中东', note: '无夏令时' },
  { city: '利雅得', tz: 'Asia/Riyadh', region: '中东', note: '无夏令时' },
  { city: '特拉维夫', tz: 'Asia/Jerusalem', region: '中东', note: '有夏令时' },
  { city: '伊斯坦布尔', tz: 'Europe/Istanbul', region: '中东', note: '无夏令时' },
  { city: '莫斯科', tz: 'Europe/Moscow', region: '欧洲', note: '无夏令时' },
  { city: '雅典', tz: 'Europe/Athens', region: '欧洲', note: '有夏令时' },
  { city: '柏林', tz: 'Europe/Berlin', region: '欧洲', note: '有夏令时' },
  { city: '巴黎', tz: 'Europe/Paris', region: '欧洲', note: '有夏令时' },
  { city: '阿姆斯特丹', tz: 'Europe/Amsterdam', region: '欧洲', note: '有夏令时' },
  { city: '马德里', tz: 'Europe/Madrid', region: '欧洲', note: '有夏令时' },
  { city: '伦敦', tz: 'Europe/London', region: '欧洲', note: '有夏令时' },
  { city: '纽约', tz: 'America/New_York', region: '美洲', note: '有夏令时' },
  { city: '多伦多', tz: 'America/Toronto', region: '美洲', note: '有夏令时' },
  { city: '芝加哥', tz: 'America/Chicago', region: '美洲', note: '有夏令时' },
  { city: '墨西哥城', tz: 'America/Mexico_City', region: '美洲', note: '已取消夏令时' },
  { city: '丹佛', tz: 'America/Denver', region: '美洲', note: '有夏令时' },
  { city: '洛杉矶', tz: 'America/Los_Angeles', region: '美洲', note: '有夏令时' },
  { city: '温哥华', tz: 'America/Vancouver', region: '美洲', note: '有夏令时' },
  { city: '圣保罗', tz: 'America/Sao_Paulo', region: '美洲', note: '已取消夏令时' },
  { city: '布宜诺斯艾利斯', tz: 'America/Argentina/Buenos_Aires', region: '美洲', note: '无夏令时' },
  { city: '悉尼', tz: 'Australia/Sydney', region: '大洋洲', note: '南半球夏令时（10-4 月）' },
  { city: '墨尔本', tz: 'Australia/Melbourne', region: '大洋洲', note: '南半球夏令时（10-4 月）' },
  { city: '珀斯', tz: 'Australia/Perth', region: '大洋洲', note: '无夏令时' },
  { city: '奥克兰', tz: 'Pacific/Auckland', region: '大洋洲', note: '南半球夏令时（9-4 月）' },
  { city: '开罗', tz: 'Africa/Cairo', region: '非洲', note: '有夏令时' },
  { city: '约翰内斯堡', tz: 'Africa/Johannesburg', region: '非洲', note: '无夏令时' },
  { city: '拉各斯', tz: 'Africa/Lagos', region: '非洲', note: '无夏令时' },
];

/** tz → 城市条目 */
export const TZ_MAP = new Map<string, TzCity>(TIME_ZONES.map((z) => [z.tz, z]));

/** 取城市名，未知时区回退成 IANA 标识本身 */
export function zoneLabel(tz: string): string {
  return TZ_MAP.get(tz)?.city ?? tz;
}

/** 墙上时间（某地日历上的年月日时分，不含时区信息） */
export interface WallTime {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
}

/** 某时区在某一绝对时刻的完整信息 */
export interface ZonedInfo extends WallTime {
  /** 0=周日 … 6=周六 */
  weekday: number;
  /** 该时刻此地的 UTC 偏移（分钟，东正西负） */
  offsetMin: number;
  /** 是否处于夏令时 */
  dst: boolean;
}

const WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function weekdayCn(w: number): string {
  return WEEK_CN[w] ?? '';
}

/** 按 tz 拆解墙上时间的 formatter 缓存，避免每次调用重建（一次换算要建好几次） */
const partsFmtCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(tz: string): Intl.DateTimeFormat {
  let f = partsFmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    partsFmtCache.set(tz, f);
  }
  return f;
}

/** 时区合法性（前端用户输入 / URL 参数都可能带脏值） */
export function isValidZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** 把绝对时刻（epoch 毫秒）拆成某时区的墙上时间 */
export function epochToWall(epochMs: number, tz: string): WallTime & { s: number } {
  const parts = partsFormatter(tz).formatToParts(new Date(epochMs));
  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  return {
    y: pick('year'),
    mo: pick('month'),
    d: pick('day'),
    h: pick('hour'),
    mi: pick('minute'),
    s: pick('second'),
  };
}

/**
 * 求某时区在指定绝对时刻的 UTC 偏移（分钟）。
 * 用「把当地墙上时间当成 UTC，再与真实 epoch 相减」的经典办法，
 * 不依赖 timeZoneName 的 shortOffset/longOffset 支持度差异。
 */
export function getOffsetMinutes(tz: string, epochMs: number): number {
  const w = epochToWall(epochMs, tz);
  const asUtc = Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s);
  return Math.round((asUtc - epochMs) / 60000);
}

/** 取某时区在指定时刻的完整信息（含星期、偏移、是否夏令时） */
export function epochToZone(epochMs: number, tz: string): ZonedInfo {
  const w = epochToWall(epochMs, tz);
  const offsetNow = getOffsetMinutes(tz, epochMs);
  // 夏令时判定：同一地点 1 月与 7 月的偏移不同，且当前偏移等于「夏季那个」
  const jan = getOffsetMinutes(tz, Date.UTC(w.y, 0, 1, 12));
  const jul = getOffsetMinutes(tz, Date.UTC(w.y, 6, 1, 12));
  const dst = jan !== jul && offsetNow === Math.max(jan, jul);
  return {
    y: w.y,
    mo: w.mo,
    d: w.d,
    h: w.h,
    mi: w.mi,
    weekday: new Date(Date.UTC(w.y, w.mo - 1, w.d)).getUTCDay(),
    offsetMin: offsetNow,
    dst,
  };
}

/** 墙上时间 → 从 epoch 起的分钟序号，便于比较 */
function wallMinutes(w: WallTime): number {
  return Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi) / 60000;
}

/** 解析 YYYY-MM-DD 与 HH:MM（也容忍 HH:MM:SS），并做真实日历校验 */
export function parseWallInput(dateStr: string, timeStr: string): ToolResult<WallTime> {
  const dm = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec((dateStr ?? '').trim());
  if (!dm) return err('日期格式应为 2026-01-01');
  const tm = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec((timeStr ?? '').trim());
  if (!tm) return err('时间格式应为 09:30');

  const y = Number(dm[1]);
  const mo = Number(dm[2]);
  const d = Number(dm[3]);
  const h = Number(tm[1]);
  const mi = Number(tm[2]);

  if (y < 1970 || y > 2100) return err('年份请填 1970 - 2100');
  if (h > 23) return err('小时应在 0 - 23 之间');
  if (mi > 59) return err('分钟应在 0 - 59 之间');

  // 用 UTC 反查，避免本地时区把 2 月 30 日「修正」成 3 月 2 日
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== mo - 1 ||
    probe.getUTCDate() !== d
  ) {
    return err(`${y} 年 ${mo} 月没有 ${d} 日`);
  }
  return ok({ y, mo, d, h, mi });
}

/**
 * 墙上时间 → 绝对时刻（epoch 毫秒）。
 *
 * 两步法：
 *   ① 先把墙上时间当成 UTC，用该时刻的偏移试算一个候选 epoch；
 *   ② 用候选 epoch 回查真实偏移，不一致就用新偏移重算一次。
 * 多数时区一次收敛；落在夏令时跳变窗口时，才需要用第三步回读校验。
 *
 * dstShiftMin：输入时刻因「春季拨快」不存在时，实际落地时刻与输入相差的分钟数
 * （0 表示完全命中，无跳变）。
 */
export function wallToEpoch(
  wall: WallTime,
  tz: string,
): { epoch: number; dstShiftMin: number } {
  const guess = Date.UTC(wall.y, wall.mo - 1, wall.d, wall.h, wall.mi);
  const target = wallMinutes(wall);

  const o1 = getOffsetMinutes(tz, guess);
  let epoch = guess - o1 * 60000;
  if (wallMinutes(epochToWall(epoch, tz)) === target) return { epoch, dstShiftMin: 0 };

  const o2 = getOffsetMinutes(tz, epoch);
  const e2 = guess - o2 * 60000;
  if (wallMinutes(epochToWall(e2, tz)) === target) return { epoch: e2, dstShiftMin: 0 };

  // 两个候选都对不上 → 该时刻在跳变窗口里根本不存在。取较晚的候选（顺延）
  const eLate = Math.max(epoch, e2);
  const actual = wallMinutes(epochToWall(eLate, tz));
  return { epoch: eLate, dstShiftMin: actual - target };
}

/** 换算结果 */
export interface ZoneConversion {
  /** 输入时刻对应的绝对时刻（epoch 毫秒），多城对照直接复用它 */
  epoch: number;
  /** 源时区信息 */
  from: ZonedInfo;
  /** 目标时区信息 */
  to: ZonedInfo;
  /** 目标日期减源日期，按各自日历日算（+1 = 次日，-1 = 前一天） */
  dayDiff: number;
  /** 目标偏移减源偏移（分钟），正数表示目标地方时更晚 */
  offsetDiffMin: number;
  /** 输入时刻因夏令时跳变被顺延的分钟数，0 表示未调整 */
  dstShiftMin: number;
}

/** 核心换算：A 地某时刻 → B 地对应时刻 */
export function convertZone(
  wall: WallTime,
  fromTz: string,
  toTz: string,
): ToolResult<ZoneConversion> {
  if (!isValidZone(fromTz)) return err(`未知时区：${fromTz}`);
  if (!isValidZone(toTz)) return err(`未知时区：${toTz}`);

  const { epoch, dstShiftMin } = wallToEpoch(wall, fromTz);
  const from = epochToZone(epoch, fromTz);
  const to = epochToZone(epoch, toTz);

  const dayDiff = Math.round(
    (Date.UTC(to.y, to.mo - 1, to.d) - Date.UTC(from.y, from.mo - 1, from.d)) / 86400000,
  );

  return ok({
    epoch,
    from,
    to,
    dayDiff,
    offsetDiffMin: to.offsetMin - from.offsetMin,
    dstShiftMin,
  });
}

/** 偏移分钟 → 「UTC+8」「UTC-3:30」 */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0 ? `UTC${sign}${h}` : `UTC${sign}${h}:${String(m).padStart(2, '0')}`;
}

/** 日期差 → 「同日」「次日」「前 1 天」 */
export function formatDayDiff(n: number): string {
  if (n === 0) return '同日';
  return n > 0 ? `次日 +${n} 天` : `前 ${Math.abs(n)} 天`;
}

/** 时差分钟 → 「快 13 小时」「慢 5 小时 30 分」「无时差」 */
export function formatDiff(minutes: number): string {
  if (minutes === 0) return '无时差';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const body = m === 0 ? `${h} 小时` : h === 0 ? `${m} 分钟` : `${h} 小时 ${m} 分`;
  return minutes > 0 ? `快 ${body}` : `慢 ${body}`;
}

/** 两位补零 */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 墙上时间 → 「09:30」 */
export function formatHm(w: { h: number; mi: number }): string {
  return `${pad2(w.h)}:${pad2(w.mi)}`;
}

/** 墙上时间 → 「2026-11-04」 */
export function formatYmd(w: { y: number; mo: number; d: number }): string {
  return `${w.y}-${pad2(w.mo)}-${pad2(w.d)}`;
}
