import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { calcTransferTime, type SizeUnit } from '@/lib/misc-calc';

/**
 * 字节换算、有效带宽与耗时格式化全部复用 src/lib/misc-calc.ts 的
 * calcTransferTime / formatDuration，与 MCP Server 共用同一份实现。
 */

const UNIT_OPTIONS: { value: SizeUnit; label: string }[] = [
  { value: 'MB', label: 'MB（十进制，1MB = 100 万字节）' },
  { value: 'GB', label: 'GB（十进制）' },
  { value: 'TB', label: 'TB（十进制）' },
  { value: 'KB', label: 'KB（十进制）' },
  { value: 'MiB', label: 'MiB（二进制，Windows 显示的「MB」）' },
  { value: 'GiB', label: 'GiB（二进制）' },
  { value: 'TiB', label: 'TiB（二进制）' },
  { value: 'B', label: 'B（字节）' },
];

/** 常用预设：Wi-Fi 与有线实测的典型开销/利用率组合 */
const PRESETS: { label: string; overhead: string; utilization: string }[] = [
  { label: '理论上限（不打折）', overhead: '0', utilization: '100' },
  { label: '有线实测（开销 5% / 利用率 90%）', overhead: '5', utilization: '90' },
  { label: 'Wi-Fi 实测（开销 8% / 利用率 60%）', overhead: '8', utilization: '60' },
];

export default function DownloadTimeCalculator() {
  const [size, setSize] = useState('50');
  const [unit, setUnit] = useState<SizeUnit>('GB');
  const [bandwidth, setBandwidth] = useState('500');
  const [overhead, setOverhead] = useState('0');
  const [utilization, setUtilization] = useState('100');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const result = useMemo(() => {
    const r = calcTransferTime({
      size: Number(size.trim()),
      unit,
      bandwidthMbps: Number(bandwidth.trim()),
      overheadPct: overhead.trim() === '' ? 0 : Number(overhead.trim()),
      utilizationPct: utilization.trim() === '' ? 100 : Number(utilization.trim()),
    });
    if ('error' in r) return { error: r.error };
    return r;
  }, [size, unit, bandwidth, overhead, utilization]);

  const summary =
    result && !('error' in result)
      ? `${size}${unit} 文件在 ${bandwidth}Mbps 带宽下（有效 ${result.effectiveMbps}Mbps）预计耗时 ${result.human}，平均 ${result.megabytesPerSecond} MB/s`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">文件大小</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="0.1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={size}
              onInput={(e) => setSize((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">单位</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={unit}
              onChange={(e) => setUnit((e.target as HTMLSelectElement).value as SizeUnit)}
            >
              {UNIT_OPTIONS.map((o) => (
                <option value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium">带宽（Mbps）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="10"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={bandwidth}
              onInput={(e) => setBandwidth((e.target as HTMLInputElement).value)}
            />
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="text-sm font-medium">协议开销（%）</span>
              <input
                type="number"
                inputmode="decimal"
                min={0}
                max={99}
                step="1"
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={overhead}
                onInput={(e) => setOverhead((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">利用率（%）</span>
              <input
                type="number"
                inputmode="decimal"
                min={1}
                max={100}
                step="1"
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={utilization}
                onInput={(e) => setUtilization((e.target as HTMLInputElement).value)}
              />
            </label>
          </div>
          <div class="flex flex-wrap gap-2 sm:col-span-2">
            {PRESETS.map((p) => (
              <button
                type="button"
                class="btn btn-xs btn-outline"
                onClick={() => {
                  setOverhead(p.overhead);
                  setUtilization(p.utilization);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {result && 'error' in result && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && !('error' in result) && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">预计耗时</p>
                <p class="text-3xl font-bold font-mono text-warning">{result.human}</p>
              </div>
              <span class="badge badge-outline mb-1">{result.megabytesPerSecond} MB/s</span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'dtc' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'dtc')}
              >
                {copied === 'dtc' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">文件字节数</td>
                    <td class="font-mono text-right">{result.bytes.toLocaleString('zh-CN')} B</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">标称带宽</td>
                    <td class="font-mono text-right">{result.bandwidthMbps} Mbps</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">有效带宽（扣开销与利用率）</td>
                    <td class="font-mono text-right">{result.effectiveMbps} Mbps</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">平均速度</td>
                    <td class="font-mono text-right">{result.megabytesPerSecond} MB/s</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">预计耗时</td>
                    <td class="font-mono text-right text-warning font-medium">{result.human}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        有效带宽 = 标称带宽 ×（1 − 协议开销%）× 利用率%，耗时 = 文件字节数 × 8 ÷（有效带宽 × 100 万）。
        十进制单位（KB / MB / GB / TB）按 1000 进位，二进制单位（KiB / MiB / GiB / TiB）按 1024 进位 ——
        Windows 资源管理器显示的「MB」实际是 MiB，所以 500GB 硬盘在系统里显示约 465 GB。
        现实里以太网与 PPPoE 协议开销约 5% 到 10%，Wi-Fi 实际吞吐常为标称的 50% 到 70%，上行带宽通常远小于下行。
        本工具为理论估算，不含对端限速与拥塞；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
