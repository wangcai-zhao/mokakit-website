import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { calcVehiclePurchaseTax, type VehiclePowerType } from '@/lib/china-calc-extra';

/** 千分位金额，保留两位小数 */
function money(n: number): string {
  const fixed = n.toFixed(2);
  const [int = '0', dec = '00'] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

/**
 * 车辆购置税的税率、计税价格还原与新能源减免窗口全部复用
 * src/lib/china-calc-extra.ts 的 calcVehiclePurchaseTax，与 MCP Server 共用同一份实现。
 * 组件里不写任何税率或减免上限常量 —— 政策变了只改库一处。
 */

const POWER_LABEL: Record<VehiclePowerType, string> = {
  fuel: '燃油车 / 常规动力',
  nev: '新能源汽车（纯电 / 插混含增程 / 燃料电池）',
};

const RELIEF_LABEL: Record<string, string> = {
  none: '无减免',
  full: '全额免征',
  half: '减半征收',
  unknown: '政策未覆盖（按全额估算）',
};

export default function VehiclePurchaseTax() {
  const [mode, setMode] = useState<'total' | 'exclusive'>('total');
  const [price, setPrice] = useState('226000');
  const [powerType, setPowerType] = useState<VehiclePowerType>('fuel');
  const [date, setDate] = useState('');
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
    const p = Number(price.trim());
    if (!Number.isFinite(p) || p <= 0) return { error: '请输入大于 0 的购车价格' };
    const r = calcVehiclePurchaseTax({
      invoiceTotal: mode === 'total' ? p : undefined,
      taxExclusivePrice: mode === 'exclusive' ? p : undefined,
      powerType,
      purchaseDate: date || undefined,
    });
    // 库里失败统一返回 { error }，这里原样透传给 UI
    if ('error' in r) return { error: r.error };
    return r;
  }, [price, mode, powerType, date]);

  const summary =
    result && !('error' in result)
      ? `计税价格 ${money(result.taxablePrice)} 元，车辆购置税税率 ${(result.taxRate * 100).toFixed(0)}%，` +
        (result.relief > 0
          ? `减免 ${money(result.relief)} 元（${RELIEF_LABEL[result.reliefMode]}，上限 ${money(result.reliefCap)} 元），实缴 ${money(result.payable)} 元`
          : `实缴 ${money(result.payable)} 元`)
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">价格口径</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={mode}
              onChange={(e) => setMode((e.target as HTMLSelectElement).value as 'total' | 'exclusive')}
            >
              <option value="total">发票价税合计（含 13% 增值税）</option>
              <option value="exclusive">不含税价（发票上的不含税金额）</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium">{mode === 'total' ? '价税合计（元）' : '不含税价（元）'}</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="100"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={price}
              onInput={(e) => setPrice((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">动力类型</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={powerType}
              onChange={(e) => setPowerType((e.target as HTMLSelectElement).value as VehiclePowerType)}
            >
              <option value="fuel">{POWER_LABEL.fuel}</option>
              <option value="nev">{POWER_LABEL.nev}</option>
            </select>
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">购置日期（发票开具日期，选填）</span>
            <input
              type="date"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={date}
              onInput={(e) => setDate((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {result && 'error' in result && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && !('error' in result) && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">应缴车辆购置税</p>
                <p class="text-3xl font-bold font-mono text-warning">{money(result.payable)}</p>
              </div>
              <span class="badge badge-outline mb-1">税率 {(result.taxRate * 100).toFixed(0)}%</span>
              {result.relief > 0 && (
                <span class="badge badge-success mb-1">减免 {money(result.relief)} 元</span>
              )}
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'vpt' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'vpt')}
              >
                {copied === 'vpt' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">计税价格（不含增值税）</td>
                    <td class="font-mono text-right">{money(result.taxablePrice)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">减按前应纳税额</td>
                    <td class="font-mono text-right">{money(result.fullTax)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">减免方式</td>
                    <td class="font-mono text-right">
                      {RELIEF_LABEL[result.reliefMode]}
                      {result.reliefCap > 0 && `（上限 ${money(result.reliefCap)} 元）`}
                    </td>
                  </tr>
                  <tr>
                    <td class="opacity-60">减免税额</td>
                    <td class="font-mono text-right text-success">−{money(result.relief)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">应缴车辆购置税</td>
                    <td class="font-mono text-right text-warning font-medium">{money(result.payable)} 元</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p class="text-xs opacity-70 leading-relaxed">{result.note}</p>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        车辆购置税 = 不含增值税的计税价格 × 10%（《车辆购置税法》）。新能源汽车减免依据财政部、税务总局、工信部公告 2023 年第 10 号：
        2024-01-01 至 2025-12-31 购置免征（每辆乘用车免税额上限 3 万元），2026-01-01 至 2027-12-31 购置减半（每辆乘用车减税额上限 1.5 万元），
        购置日期以发票开具日期为准，且车型须在《减免车辆购置税的新能源汽车车型目录》内。购车后需在 60 日内申报缴纳。本工具为估算，具体以主管税务机关核定为准；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
