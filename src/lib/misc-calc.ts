/**
 * misc-calc.ts —— 通用杂项纯计算层（非财税类）
 * ----------------------------------------------------------------------------
 * 与 china-*.ts 同属「纯函数层」：零浏览器 API、零副作用，供页面组件与
 * MokaKit MCP Server 共用同一份实现（战略原则：算法只能有一份）。
 *
 * 收录范围：快递运费、传输时间这类**没有政策口径、但公式容易各写一份**的通用换算。
 * 财税 / 社保 / 房贷类一律放 china-*.ts，不进本文件。
 *
 * 单位约定：金额用元（保留到分），重量用 kg，带宽用 Mbps，文件大小入参带单位枚举。
 */

import Decimal from 'decimal.js';

/** 金额四舍五入到分（ROUND_HALF_UP），与 china-tax / china-vat / mortgage 同口径 */
function money2(n: Decimal.Value): number {
  return new Decimal(n).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. 快递运费估算（shipping-fee-calculator）
// ═══════════════════════════════════════════════════════════════════════════

/** 计费重量的进位规则 */
export type WeightRounding =
  /** 按 0.5kg 向上取整（通达系常见） */
  | 'up-0.5'
  /** 按 1kg 向上取整（整数计费） */
  | 'up-1'
  /** 不进位，按实际重量计费 */
  | 'actual';

/** 默认首重重量（kg） */
export const DEFAULT_FIRST_WEIGHT_KG = 1;

export interface ShippingFeeResult {
  /** 实际重量（kg） */
  weightKg: number;
  /** 计费重量（kg，已按 rounding 进位） */
  billableWeightKg: number;
  /** 首重（kg） */
  firstWeightKg: number;
  /** 首重价（元） */
  firstPrice: number;
  /** 续重重量（kg） */
  extraWeightKg: number;
  /** 续重单价（元/kg） */
  additionalPricePerKg: number;
  /** 续重费（元） */
  additionalFee: number;
  /** 偏远地区附加费（元） */
  remoteSurcharge: number;
  /** 保价声明价值（元） */
  insuredValue: number;
  /** 保价费（元） */
  insuranceFee: number;
  /** 优惠减免（元） */
  discount: number;
  /** 运费合计（元） */
  total: number;
  /** 折合每公斤（元/kg） */
  perKg: number;
}

/**
 * 快递运费估算（首重 + 续重 + 附加费 + 保价 − 优惠）。
 *
 * 计费重量按 rounding 规则进位后分段计价：
 *   运费 = 首重价 + max(0, 计费重量 − 首重) × 续重单价
 *
 * @param params.weightKg             实际重量（kg），必填且 > 0
 * @param params.firstWeightKg        首重（kg），默认 1
 * @param params.firstPrice           首重价（元），默认 0 → 常见于免首重的月结客户
 * @param params.additionalPricePerKg 续重单价（元/kg），默认 0
 * @param params.rounding             计费重量进位规则，默认 'up-0.5'
 * @param params.remoteSurcharge      偏远地区附加费（元），默认 0
 * @param params.insuredValue         保价声明价值（元），默认 0（不保价）
 * @param params.insuredRatePct       保价费率（%），常见 0.3–1，默认 0
 * @param params.discount             优惠减免（元），默认 0
 * @returns 成功返回 ShippingFeeResult；入参非法时返回 `{ error: 中文提示 }`
 * @throws 不抛异常，失败统一走 `{ error }`，与本站 calc* 系列一致
 *
 * 边界输入行为：
 *   - weightKg 缺失 / null / NaN / ≤ 0 → `{ error: '重量需为大于 0 的数字' }`
 *   - 价格类入参为负 → `{ error: '价格与费用不能为负' }`（首重价、续重单价、附加费、优惠、保价价值）
 *   - 所有可选金额不传 → 按 0 处理，等价于「只算续重」
 *   - 优惠大于合计 → total 夹取为 0，不会出现负数运费
 *   - rounding 传了未知值 → 按 'up-0.5' 处理
 *
 * @example
 * // 2.3kg、首重 12 元含 1kg、续重 5 元/kg、按 0.5kg 进位 → 计费 2.5kg
 * calcShippingFee({ weightKg: 2.3, firstPrice: 12, additionalPricePerKg: 5 })
 * // → { billableWeightKg: 2.5, extraWeightKg: 1.5, additionalFee: 7.5, total: 19.5 }
 *
 * @example
 * // 1kg 以内、保价 1000 元、费率 0.5%
 * calcShippingFee({ weightKg: 0.8, firstPrice: 10, insuredValue: 1000, insuredRatePct: 0.5 })
 * // → { billableWeightKg: 1, insuranceFee: 5, total: 15 }
 */
export function calcShippingFee(params: {
  weightKg: number;
  firstWeightKg?: number;
  firstPrice?: number;
  additionalPricePerKg?: number;
  rounding?: WeightRounding;
  remoteSurcharge?: number;
  insuredValue?: number;
  insuredRatePct?: number;
  discount?: number;
}): ShippingFeeResult | { error: string } {
  const weight = params?.weightKg as unknown;
  const w = typeof weight === 'number' ? weight : Number(weight);
  if (!Number.isFinite(w) || w <= 0) return { error: '重量需为大于 0 的数字' };

  const firstWeightKg = params.firstWeightKg ?? DEFAULT_FIRST_WEIGHT_KG;
  const firstPrice = params.firstPrice ?? 0;
  const additionalPricePerKg = params.additionalPricePerKg ?? 0;
  const remoteSurcharge = params.remoteSurcharge ?? 0;
  const insuredValue = params.insuredValue ?? 0;
  const insuredRatePct = params.insuredRatePct ?? 0;
  const discount = params.discount ?? 0;
  const rounding: WeightRounding =
    params.rounding === 'up-1' || params.rounding === 'actual' ? params.rounding : 'up-0.5';

  if (firstWeightKg <= 0) return { error: '首重需大于 0' };
  if (firstPrice < 0 || additionalPricePerKg < 0 || remoteSurcharge < 0 || discount < 0)
    return { error: '价格与费用不能为负' };
  if (insuredValue < 0 || insuredRatePct < 0) return { error: '保价价值与费率不能为负' };

  // 计费重量进位：0.5kg 档最常用，避免 2.3kg 被算成 3kg 引起争议
  let billable = w;
  if (rounding === 'up-1') billable = Math.ceil(w);
  else if (rounding === 'up-0.5') billable = Math.ceil(w / 0.5) * 0.5;
  const billableWeightKg = new Decimal(billable).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

  const extraWeightKg = Math.max(0, money2(new Decimal(billableWeightKg).minus(firstWeightKg)));
  const additionalFee = money2(new Decimal(extraWeightKg).times(additionalPricePerKg));
  const insuranceFee = money2(new Decimal(insuredValue).times(insuredRatePct).div(100));

  const rawTotal = new Decimal(firstPrice)
    .plus(additionalFee)
    .plus(remoteSurcharge)
    .plus(insuranceFee)
    .minus(discount);
  const total = Math.max(0, money2(rawTotal));
  const perKg = billableWeightKg > 0 ? money2(new Decimal(total).div(billableWeightKg)) : 0;

  return {
    weightKg: money2(w),
    billableWeightKg,
    firstWeightKg,
    firstPrice: money2(firstPrice),
    extraWeightKg,
    additionalPricePerKg,
    additionalFee,
    remoteSurcharge: money2(remoteSurcharge),
    insuredValue: money2(insuredValue),
    insuranceFee,
    discount: money2(discount),
    total,
    perKg,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. 下载 / 上传时间估算（download-time-calculator）
// ═══════════════════════════════════════════════════════════════════════════

/** 文件大小单位。十进制（MB=1,000,000B）与二进制（MiB=1,048,576B）分开，避免"1GB 到底多大"的歧义 */
export type SizeUnit = 'B' | 'KB' | 'MB' | 'GB' | 'TB' | 'KiB' | 'MiB' | 'GiB' | 'TiB';

/** 各单位对应的字节数 */
export const SIZE_UNIT_BYTES: Record<SizeUnit, number> = {
  B: 1,
  KB: 1e3,
  MB: 1e6,
  GB: 1e9,
  TB: 1e12,
  KiB: 1024,
  MiB: 1024 ** 2,
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
};

export interface TransferTimeResult {
  /** 文件字节数 */
  bytes: number;
  /** 文件比特数 */
  bits: number;
  /** 标称带宽（Mbps） */
  bandwidthMbps: number;
  /** 扣掉协议开销与带宽利用率后的有效带宽（Mbps） */
  effectiveMbps: number;
  /** 预计耗时（秒） */
  seconds: number;
  /** 可读耗时，如 '2 天 3 小时 4 分 5 秒' */
  human: string;
  /** 平均速度（MB/s，十进制） */
  megabytesPerSecond: number;
}

/**
 * 按带宽估算文件传输耗时。
 *
 * 有效带宽 = 标称带宽 ×(1 − 协议开销%)×(利用率%)
 * 耗时(秒)= 文件字节数 × 8 ÷(有效带宽 × 1,000,000)
 *
 * 默认不打折（overheadPct=0 / utilizationPct=100），即理论上限速度；
 * 现实里 TCP + 以太网/PPPoE 开销约 5%–10%，Wi-Fi 实际吞吐常为标称的 50%–70%。
 *
 * @param params.size            文件大小（数值），必填且 > 0
 * @param params.unit            单位，默认 'MB'
 * @param params.bandwidthMbps   带宽（Mbps），必填且 > 0
 * @param params.overheadPct     协议开销百分比，0 ≤ x < 100，默认 0
 * @param params.utilizationPct  带宽实际利用率百分比，0 < x ≤ 100，默认 100
 * @returns 成功返回 TransferTimeResult；入参非法时返回 `{ error: 中文提示 }`
 * @throws 不抛异常，失败统一走 `{ error }`
 *
 * 边界输入行为：
 *   - size / bandwidthMbps 缺失、NaN、≤ 0 → `{ error: '文件大小与带宽都需为大于 0 的数字' }`
 *   - overheadPct 不在 [0,100) → `{ error: '协议开销需在 0–99 之间' }`（取 100 会除零）
 *   - utilizationPct 不在 (0,100] → `{ error: '带宽利用率需在 1–100 之间' }`
 *   - 文件极小或带宽极大 → 秒数 < 1 时 human 显示到毫秒级（保留 2 位小数）
 *   - 耗时超过 100 年 → 仍照实计算，human 以「天」为单位显示，不做截断
 *
 * @example
 * // 100MB 文件、100Mbps 宽带：理论 8 秒
 * calcTransferTime({ size: 100, unit: 'MB', bandwidthMbps: 100 })
 * // → { seconds: 8, human: '8 秒', megabytesPerSecond: 12.5 }
 *
 * @example
 * // 50GB 蓝光原盘、500Mbps 实测只有 60%、协议开销 8%
 * calcTransferTime({ size: 50, unit: 'GB', bandwidthMbps: 500, overheadPct: 8, utilizationPct: 60 })
 * // → effectiveMbps = 276 → 24 分 9 秒（1449.28 秒）
 */
export function calcTransferTime(params: {
  size: number;
  unit?: SizeUnit;
  bandwidthMbps: number;
  overheadPct?: number;
  utilizationPct?: number;
}): TransferTimeResult | { error: string } {
  const rawSize = params?.size as unknown;
  const size = typeof rawSize === 'number' ? rawSize : Number(rawSize);
  const rawBw = params?.bandwidthMbps as unknown;
  const bandwidth = typeof rawBw === 'number' ? rawBw : Number(rawBw);
  if (!Number.isFinite(size) || !Number.isFinite(bandwidth) || size <= 0 || bandwidth <= 0)
    return { error: '文件大小与带宽都需为大于 0 的数字' };

  const unit: SizeUnit = (params.unit && params.unit in SIZE_UNIT_BYTES ? params.unit : 'MB') as SizeUnit;
  const overheadPct = params.overheadPct ?? 0;
  const utilizationPct = params.utilizationPct ?? 100;
  if (overheadPct < 0 || overheadPct >= 100) return { error: '协议开销需在 0–99 之间' };
  if (utilizationPct <= 0 || utilizationPct > 100) return { error: '带宽利用率需在 1–100 之间' };

  const bytes = new Decimal(size).times(SIZE_UNIT_BYTES[unit]);
  const bits = bytes.times(8);
  const effectiveMbps = new Decimal(bandwidth)
    .times(new Decimal(1).minus(new Decimal(overheadPct).div(100)))
    .times(new Decimal(utilizationPct).div(100));
  const seconds = bits.div(effectiveMbps.times(1e6)).toNumber();

  return {
    bytes: bytes.toNumber(),
    bits: bits.toNumber(),
    bandwidthMbps: bandwidth,
    effectiveMbps: effectiveMbps.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    seconds,
    human: formatDuration(seconds),
    megabytesPerSecond: new Decimal(effectiveMbps)
      .div(8)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      .toNumber(),
  };
}

/**
 * 把秒数格式化成中文可读串，按需省略为 0 的高位单位。
 * - < 1 秒 → '0.42 秒'（保留 2 位小数）
 * - 其它 → '2 天 3 小时 4 分 5 秒'（跳过为 0 的单位，最小落到秒）
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  if (seconds < 1) return `${seconds.toFixed(2)} 秒`;

  const total = Math.round(seconds);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const parts: string[] = [];
  if (d) parts.push(`${d} 天`);
  if (h) parts.push(`${h} 小时`);
  if (m) parts.push(`${m} 分`);
  if (s || parts.length === 0) parts.push(`${s} 秒`);
  return parts.join(' ');
}
