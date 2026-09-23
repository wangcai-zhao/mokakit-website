import { useState, useMemo } from 'preact/hooks';

/**
 * 单位表。base 是相对 Byte 的倍率集合，分别给二进制(1024)与十进制(1000)两套。
 * bit 单独处理：1 Byte = 8 bit，它是唯一小于 Byte 的单位。
 */
const UNITS = [
  { key: 'bit', name: '比特', short: 'bit' },
  { key: 'B', name: '字节', short: 'B' },
  { key: 'KB', name: '千字节', short: 'KB' },
  { key: 'MB', name: '兆字节', short: 'MB' },
  { key: 'GB', name: '吉字节', short: 'GB' },
  { key: 'TB', name: '太字节', short: 'TB' },
  { key: 'PB', name: '拍字节', short: 'PB' },
] as const;

type UnitKey = (typeof UNITS)[number]['key'];

/** 该单位在给定进制下等于多少 Byte；bit 特殊：等于 1/8 Byte */
function toBytes(value: number, unit: UnitKey, base: number): number {
  if (unit === 'bit') return value / 8;
  const order: UnitKey[] = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const idx = order.indexOf(unit);
  if (idx < 0) return NaN;
  return value * Math.pow(base, idx);
}

/** 保留有效位：数值太大不展示无意义的小数，太小避免过度取整丢失精度 */
function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e12) return n.toExponential(4);
  if (abs >= 1000) return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  if (abs >= 1) return String(Number(n.toFixed(4)));
  if (abs >= 1e-6) return String(Number(n.toFixed(8)));
  return n.toExponential(4);
}

/** 把字节数拆成「最大单位 + 余数」的自然读法，例如 12.5MB */
function humanize(bytes: number, base: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const labels = base === 1024 ? ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] : ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  // 1024 进制下习惯标注 KB/MB，但严格应写 KiB —— 这里沿用大众习惯的写法
  let idx = 0;
  let v = bytes;
  while (v >= base && idx < labels.length - 1) {
    v /= base;
    idx++;
  }
  return `${Number(v.toFixed(idx === 0 ? 0 : 2))} ${labels[idx]}`;
}

export default function BytesSizeConverter() {
  const [value, setValue] = useState('1');
  const [unit, setUnit] = useState<UnitKey>('GB');
  const [base, setBase] = useState<1024 | 1000>(1024);
  const [bandwidthMbps, setBandwidthMbps] = useState('100');

  const parsed = useMemo(() => {
    const v = Number(value.trim());
    if (!Number.isFinite(v)) return { ok: false as const, error: '请输入有效数字' };
    if (v < 0) return { ok: false as const, error: '大小不能为负数' };
    const bytes = toBytes(v, unit, base);
    if (!Number.isFinite(bytes)) return { ok: false as const, error: '换算失败，请检查输入' };
    return { ok: true as const, bytes, input: v };
  }, [value, unit, base]);

  // 按带宽估算下载耗时（秒）
  const download = useMemo(() => {
    if (!parsed.ok) return null;
    const mbps = Number(bandwidthMbps.trim());
    if (!Number.isFinite(mbps) || mbps <= 0) return null;
    const bytesPerSecond = (mbps * 1_000_000) / 8; // Mbps 按十进制比特计
    const seconds = parsed.bytes / bytesPerSecond;
    if (!Number.isFinite(seconds)) return null;
    const h = Math.floor(seconds / 3600);
    const mm = Math.floor((seconds % 3600) / 60);
    const ss = Math.round(seconds % 60);
    const parts: string[] = [];
    if (h > 0) parts.push(`${h} 小时`);
    if (mm > 0) parts.push(`${mm} 分`);
    parts.push(`${ss} 秒`);
    return { seconds, text: parts.join(' ') };
  }, [parsed, bandwidthMbps]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="text-sm font-medium">数值</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="any"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 1"
              value={value}
              onInput={(e) => setValue((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">单位</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={unit}
              onChange={(e) => setUnit((e.target as HTMLSelectElement).value as UnitKey)}
            >
              {UNITS.map((u) => (
                <option value={u.key}>
                  {u.short}（{u.name}）
                </option>
              ))}
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium">进制</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={String(base)}
              onChange={(e) =>
                setBase(Number((e.target as HTMLSelectElement).value) === 1000 ? 1000 : 1024)
              }
            >
              <option value="1024">1024（操作系统/内存）</option>
              <option value="1000">1000（硬盘厂商/网盘）</option>
            </select>
          </label>
        </div>

        {!parsed.ok && <p class="mt-3 text-sm text-error">{parsed.error}</p>}

        {parsed.ok && (
          <div class="mt-4 space-y-3">
            <div>
              <p class="text-xs opacity-60">直观大小</p>
              <p class="text-3xl font-bold font-mono break-all">{humanize(parsed.bytes, base)}</p>
              <p class="mt-1 text-xs opacity-60 font-mono break-all">
                = {fmt(parsed.bytes)} 字节（Byte）
              </p>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>单位</th>
                    <th class="text-right">换算结果</th>
                  </tr>
                </thead>
                <tbody>
                  {UNITS.map((u) => {
                    // bit 由 Byte × 8 得到，其余按进制回除
                    const b = toBytes(parsed.input, unit, base);
                    let shown: number;
                    if (u.key === 'bit') shown = b * 8;
                    else {
                      const order: UnitKey[] = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
                      shown = b / Math.pow(base, order.indexOf(u.key));
                    }
                    return (
                      <tr>
                        <td class="opacity-70">{u.short}</td>
                        <td class="font-mono text-right break-all">{fmt(shown)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">估算下载时间（宽带带宽，Mbps）</span>
          <input
            type="number"
            inputmode="decimal"
            min="0"
            step="any"
            class="input input-bordered input-sm mt-1.5 w-full max-w-xs font-mono"
            placeholder="例如 100"
            value={bandwidthMbps}
            onInput={(e) => setBandwidthMbps((e.target as HTMLInputElement).value)}
          />
        </label>
        {download && (
          <p class="mt-3 text-sm">
            理论耗时约 <span class="font-mono font-semibold text-primary">{download.text}</span>
          </p>
        )}
        {!download && parsed.ok && (
          <p class="mt-3 text-sm text-error">请输入大于 0 的带宽数值</p>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        换算规则：操作系统、内存与文件系统普遍按 1024 进制逐级进位；硬盘、U 盘厂商与部分网盘按 1000
        进制标称，两种口径在 TB 级别会差出约 9%。带宽按 1 字节等于 8 比特折算，理论耗时不含网络抖动与服务器限速。所有计算在你的浏览器本地完成，不上传任何数据。
      </p>
    </div>
  );
}
