/**
 * 时钟类工具共享的时区数据与时间格式化 helper。
 * 全部基于浏览器内置 Intl API（IANA 时区数据库），零运行时依赖、零联网。
 */

export interface Zone {
  /** 城市中文名 */
  city: string;
  /** IANA 时区标识，如 Asia/Shanghai */
  tz: string;
  /** 中文说明，如「中国标准时间」 */
  cn: string;
  /** 纬度（用于世界时区地图定位） */
  lat: number;
  /** 经度（用于世界时区地图定位） */
  lon: number;
}

/** 全球主要城市时区，覆盖常用办公 / 出行场景 */
export const ZONES: Zone[] = [
  { city: '北京', tz: 'Asia/Shanghai', cn: '中国标准时间', lat: 39.9, lon: 116.4 },
  { city: '香港', tz: 'Asia/Hong_Kong', cn: '香港时间', lat: 22.3, lon: 114.2 },
  { city: '台北', tz: 'Asia/Taipei', cn: '台北时间', lat: 25.0, lon: 121.5 },
  { city: '东京', tz: 'Asia/Tokyo', cn: '日本标准时间', lat: 35.7, lon: 139.7 },
  { city: '首尔', tz: 'Asia/Seoul', cn: '韩国标准时间', lat: 37.6, lon: 126.9 },
  { city: '新加坡', tz: 'Asia/Singapore', cn: '新加坡时间', lat: 1.35, lon: 103.8 },
  { city: '曼谷', tz: 'Asia/Bangkok', cn: '中南半岛时间', lat: 13.75, lon: 100.5 },
  { city: '迪拜', tz: 'Asia/Dubai', cn: '海湾标准时间', lat: 25.2, lon: 55.3 },
  { city: '莫斯科', tz: 'Europe/Moscow', cn: '莫斯科时间', lat: 55.75, lon: 37.6 },
  { city: '巴黎', tz: 'Europe/Paris', cn: '中欧时间', lat: 48.85, lon: 2.35 },
  { city: '柏林', tz: 'Europe/Berlin', cn: '中欧时间', lat: 52.5, lon: 13.4 },
  { city: '伦敦', tz: 'Europe/London', cn: '格林尼治时间', lat: 51.5, lon: -0.12 },
  { city: '纽约', tz: 'America/New_York', cn: '东部时间', lat: 40.7, lon: -74.0 },
  { city: '芝加哥', tz: 'America/Chicago', cn: '中部时间', lat: 41.9, lon: -87.6 },
  { city: '洛杉矶', tz: 'America/Los_Angeles', cn: '太平洋时间', lat: 34.05, lon: -118.2 },
  { city: '圣保罗', tz: 'America/Sao_Paulo', cn: '巴西时间', lat: -23.55, lon: -46.63 },
  { city: '悉尼', tz: 'Australia/Sydney', cn: '东部夏令时间', lat: -33.87, lon: 151.2 },
  { city: '奥克兰', tz: 'Pacific/Auckland', cn: '新西兰时间', lat: -36.85, lon: 174.76 },
];

/** 取某时区的英文星期 + ISO 日期（如 Saturday / 2026-08-15），用于时钟展示 */
export function enDateParts(tz: string, now: Date): { weekday: string; date: string } {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(now);
  // 手动拼 yyyy-mm-dd，避免不同浏览器 locale 分隔符差异
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = dtf.formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return { weekday, date: `${y}-${m}-${d}` };
}

/** 把 IANA 时区在当前时刻的 UTC 偏移格式化成「UTC+8」样式 */
export function offsetLabel(tz: string, now: Date): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName');
    return part ? part.value.replace('GMT', 'UTC') : '';
  } catch {
    return '';
  }
}

/** 取某时区在指定时刻的拆分字段（小时/分/秒/年月日/星期/上下午） */
export function zoneParts(
  tz: string,
  hour12: boolean,
  now: Date,
): Record<string, string> {
  const fmt = new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz,
    hour12,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  const m: Record<string, string> = {};
  for (const p of fmt.formatToParts(now)) m[p.type] = p.value;
  return m;
}
