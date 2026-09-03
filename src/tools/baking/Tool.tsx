import LinearConvert, { type LinUnit } from '@/tools/_shared/linear-convert';

const VOL: LinUnit[] = [
  { id: 'cup', name: '杯', symbol: 'cup', factor: 236.588 },
  { id: 'tbsp', name: '汤匙', symbol: 'tbsp', factor: 14.787 },
  { id: 'tsp', name: '茶匙', symbol: 'tsp', factor: 4.929 },
  { id: 'floz', name: '液量盎司', symbol: 'fl oz', factor: 29.574 },
  { id: 'ml', name: '毫升', symbol: 'mL', factor: 1 },
  { id: 'l', name: '升', symbol: 'L', factor: 1000 },
];

const INGREDIENTS = [
  { name: '中筋面粉', cup: 120 },
  { name: '白砂糖', cup: 200 },
  { name: '糖粉', cup: 120 },
  { name: '水', cup: 237 },
  { name: '牛奶', cup: 240 },
  { name: '黄油', cup: 227 },
  { name: '植物油', cup: 218 },
  { name: '蜂蜜', cup: 340 },
  { name: '可可粉', cup: 85 },
  { name: '生大米', cup: 185 },
];

export default function BakingConvert() {
  return (
    <div class="space-y-5">
      <LinearConvert
        units={VOL}
        note="以毫升（mL）为统一基准：1 cup(US) ≈ 236.6 mL、1 tbsp ≈ 14.79 mL、1 tsp ≈ 4.93 mL、1 fl oz ≈ 29.57 mL。1/2 杯≈118 mL、1/3 杯≈79 mL、1/4 杯≈59 mL。全部计算均在浏览器本地完成。"
      />
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <p class="text-sm font-medium">常见食材：1 杯(cup)约多少克</p>
        <div class="mt-2 overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="opacity-60">
                <th class="text-left font-normal py-1">食材</th>
                <th class="text-right font-normal py-1">1 杯(g)</th>
                <th class="text-right font-normal py-1">1 汤匙(g)</th>
                <th class="text-right font-normal py-1">1 茶匙(g)</th>
              </tr>
            </thead>
            <tbody>
              {INGREDIENTS.map((it) => (
                <tr class="border-t border-base-300/40">
                  <td class="py-1.5">{it.name}</td>
                  <td class="py-1.5 text-right font-mono">{it.cup}</td>
                  <td class="py-1.5 text-right font-mono">{Math.round(it.cup / 16)}</td>
                  <td class="py-1.5 text-right font-mono">{Math.round(it.cup / 48)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p class="mt-2 text-xs opacity-60">
          体积为美制杯勺，克重为常见密度近似；压实、温度会影响实际重量，称量更准。
        </p>
      </div>
    </div>
  );
}
