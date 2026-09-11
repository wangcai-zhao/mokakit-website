import { useState, useMemo } from 'preact/hooks';

/** 以克为基准的换算表 */
const UNITS: { id: string; name: string; grams: number }[] = [
  { id: 'g', name: '克（g）', grams: 1 },
  { id: 'kg', name: '千克（kg）', grams: 1000 },
  { id: 'liang', name: '市两（大陆，50g）', grams: 50 },
  { id: 'qian', name: '钱（大陆，5g）', grams: 5 },
  { id: 'ozt', name: '金衡盎司（ozt，31.1035g）', grams: 31.1034768 },
  { id: 'sima', name: '香港司马两（37.429g）', grams: 37.429 },
];

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1000) return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  return String(Number(n.toFixed(4)));
}

function money(n: number): string {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function GoldWeightConvert() {
  const [value, setValue] = useState('50');
  const [unit, setUnit] = useState('liang');
  const [pricePerGram, setPricePerGram] = useState('760');

  const r = useMemo(() => {
    const v = Number(value);
    const u = UNITS.find((x) => x.id === unit);
    if (!Number.isFinite(v) || !u || v < 0) return null;
    const grams = v * u.grams;
    const price = Number(pricePerGram);
    const worth = Number.isFinite(price) && price >= 0 ? grams * price : null;
    return { grams, worth, list: UNITS.map((x) => ({ ...x, val: grams / x.grams })) };
  }, [value, unit, pricePerGram]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block sm:col-span-1">
            <span class="text-sm font-medium">重量数值</span>
            <input
              type="number" inputmode="decimal" min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={value}
              onInput={(e) => setValue((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">单位</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={unit}
              onChange={(e) => setUnit((e.target as HTMLSelectElement).value)}
            >
              {UNITS.map((u) => (
                <option value={u.id}>{u.name}</option>
              ))}
            </select>
          </label>
          <label class="block sm:col-span-3">
            <span class="text-sm font-medium">金价（元/克，用于估值，可改）</span>
            <input
              type="number" inputmode="decimal" min={0} step="0.01"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={pricePerGram}
              onInput={(e) => setPricePerGram((e.target as HTMLInputElement).value)}
            />
            <p class="mt-1 text-xs opacity-50">默认值仅为示例，请按当日实时金价填写</p>
          </label>
        </div>

        {r && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">折合克数</p>
                <p class="text-3xl font-bold font-mono text-warning">{fmt(r.grams)} g</p>
              </div>
              {r.worth !== null && <span class="badge badge-outline mb-1">估值 {money(r.worth)} 元</span>}
            </div>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>单位</th>
                    <th class="text-right">换算值</th>
                  </tr>
                </thead>
                <tbody>
                  {r.list.map((x) => (
                    <tr>
                      <td class="opacity-60">{x.name}</td>
                      <td class="font-mono text-right">{fmt(x.val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        换算基准：大陆市制 1 两 = 50 克、1 钱 = 5 克；金衡盎司 1 ozt = 31.1034768 克（国际金价报价单位）；香港司马两 ≈ 37.429 克（港澳金饰行惯用）。国际品牌金饰（如按"两"标价）务必先确认口径再换算；估值按你填写的元/克单价线性计算，仅供参考；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
