/**
 * 换算转换工具纯函数层（angle / data-rate / speed / frequency）。
 * 全部纯函数、无浏览器 API，前端与未来 MCP 可共用同一份。
 */
import { type ToolResult, ok, err } from './tool-result';

export type AngleUnit = 'deg' | 'rad' | 'grad' | 'dms';

/** 把任意角度单位换算为度、弧度、梯度、度分秒 */
export function angleConvert(value: number, from: AngleUnit): ToolResult<{
  deg: number; rad: number; grad: number; dms: string;
}> {
  if (!Number.isFinite(value)) return err('请输入有效角度');
  let deg: number;
  switch (from) {
    case 'deg': deg = value; break;
    case 'rad': deg = (value * 180) / Math.PI; break;
    case 'grad': deg = (value * 9) / 10; break;
    case 'dms': return err('度分秒请直接以十进制度输入，或选择其他单位');
    default: return err('未知角度单位');
  }
  const rad = (deg * Math.PI) / 180;
  const grad = (deg * 10) / 9;
  const dms = degToDms(deg);
  return ok({ deg: round(deg), rad: round(rad), grad: round(grad), dms });
}

function degToDms(deg: number): string {
  const sign = deg < 0 ? '-' : '';
  const a = Math.abs(deg);
  const d = Math.floor(a);
  const mFloat = (a - d) * 60;
  const m = Math.floor(mFloat);
  const s = ((mFloat - m) * 60).toFixed(2);
  return `${sign}${d}°${m}′${s}″`;
}

export type DataRateUnit = 'bps' | 'kbps' | 'Mbps' | 'Gbps';

const DR_FACTOR: Record<DataRateUnit, number> = {
  bps: 1, kbps: 1000, Mbps: 1_000_000, Gbps: 1_000_000_000,
};
const DR_FACTOR_BIN: Record<DataRateUnit, number> = {
  bps: 1, kbps: 1024, Mbps: 1024 ** 2, Gbps: 1024 ** 3,
};

/** 数据速率换算。base=1000 为 SI 十进制，base=1024 为二进制（KiB/s 等） */
export function dataRateConvert(
  value: number,
  from: DataRateUnit,
  base: 1000 | 1024,
): ToolResult<Record<DataRateUnit, number>> {
  if (!Number.isFinite(value) || value < 0) return err('请输入有效速率（非负）');
  const f = base === 1024 ? DR_FACTOR_BIN : DR_FACTOR;
  const bps = value * f[from];
  const out = {} as Record<DataRateUnit, number>;
  (Object.keys(f) as DataRateUnit[]).forEach((u) => {
    out[u] = round(bps / f[u]);
  });
  return ok(out);
}

export type SpeedUnit = 'kmh' | 'mph' | 'ms' | 'knot';

const SP_FACTOR: Record<SpeedUnit, number> = {
  kmh: 1, mph: 1.609344, ms: 3.6, knot: 1.852,
};

/** 速度换算：km/h、mph、m/s、节（kn） */
export function speedConvert(value: number, from: SpeedUnit): ToolResult<Record<SpeedUnit, number>> {
  if (!Number.isFinite(value) || value < 0) return err('请输入有效速度（非负）');
  const kmh = value * SP_FACTOR[from];
  const out = {} as Record<SpeedUnit, number>;
  (Object.keys(SP_FACTOR) as SpeedUnit[]).forEach((u) => {
    out[u] = round(kmh / SP_FACTOR[u]);
  });
  return ok(out);
}

export type FreqUnit = 'Hz' | 'kHz' | 'MHz' | 'GHz';

const FR_FACTOR: Record<FreqUnit, number> = {
  Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9,
};

/** 频率换算：Hz、kHz、MHz、GHz */
export function frequencyConvert(
  value: number,
  from: FreqUnit,
): ToolResult<Record<FreqUnit, number>> {
  if (!Number.isFinite(value) || value < 0) return err('请输入有效频率（非负）');
  const hz = value * FR_FACTOR[from];
  const out = {} as Record<FreqUnit, number>;
  (Object.keys(FR_FACTOR) as FreqUnit[]).forEach((u) => {
    out[u] = round(hz / FR_FACTOR[u]);
  });
  return ok(out);
}

function round(n: number): number {
  if (!Number.isFinite(n)) return n;
  if (Math.abs(n) >= 1) return +n.toFixed(6);
  return +n.toPrecision(6);
}
