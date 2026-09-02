import { useState, useMemo } from 'preact/hooks';

const MAP = [
  { intl: 'S', cn: '165', eu: '44', us: 'XS' },
  { intl: 'M', cn: '170', eu: '46', us: 'S' },
  { intl: 'L', cn: '175', eu: '48', us: 'M' },
  { intl: 'XL', cn: '180', eu: '50', us: 'L' },
  { intl: 'XXL', cn: '185', eu: '52', us: 'XL' },
  { intl: 'XXXL', cn: '190', eu: '54', us: 'XXL' },
];

export default function ClothingSize() {
  const [sel, setSel] = useState('L');
  const row = useMemo(() => MAP.find((x) => x.intl === sel) ?? MAP[2], [sel]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <label class="block">
          <span class="text-sm font-medium">选国际码</span>
          <select
            class="select select-bordered select-sm mt-1.5 w-full"
            value={sel}
            onChange={(e) => setSel((e.target as HTMLSelectElement).value)}
          >
            {MAP.map((m) => (
              <option value={m.intl}>{m.intl}</option>
            ))}
          </select>
        </label>
        <div class="grid grid-cols-3 gap-2 pt-1">
          <Stat label="国际码" value={row.intl} highlight />
          <Stat label="中国标号" value={row.cn} />
          <Stat label="欧码 EU" value={row.eu} />
          <Stat label="美码 US" value={row.us} span />
        </div>
      </div>
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-2">
        <div class="text-sm font-medium">完整对照表</div>
        <table class="table table-sm">
          <thead>
            <tr>
              <th>国际</th>
              <th>中国(身高)</th>
              <th>欧码</th>
              <th>美码</th>
            </tr>
          </thead>
          <tbody>
            {MAP.map((m) => (
              <tr class={m.intl === sel ? 'font-bold' : ''}>
                <td>{m.intl}</td>
                <td>{m.cn}</td>
                <td>{m.eu}</td>
                <td>{m.us}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        中国标号含胸围（如 175/92A），不能只看身高。女装、鞋裤品类差异大，本表为通用上装近似对照，最终以具体商品尺码表为准。所有计算本地完成。
      </p>
    </div>
  );
}

function Stat({ label, value, highlight, span }: { label: string; value: string; highlight?: boolean; span?: boolean }) {
  return (
    <div class={`rounded-lg p-3 ${highlight ? 'bg-primary text-primary-content' : 'bg-base-100'} ${span ? 'col-span-3' : ''}`}>
      <div class="text-xs opacity-60">{label}</div>
      <div class="text-lg font-bold font-mono mt-0.5">{value}</div>
    </div>
  );
}
