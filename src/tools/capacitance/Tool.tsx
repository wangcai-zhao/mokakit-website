import LinearConvert, { type LinUnit } from '@/tools/_shared/linear-convert';

const UNITS: LinUnit[] = [
  { id: 'pf', name: '皮法', symbol: 'pF', factor: 1e-12 },
  { id: 'nf', name: '纳法', symbol: 'nF', factor: 1e-9 },
  { id: 'uf', name: '微法', symbol: 'μF', factor: 1e-6 },
  { id: 'mf', name: '毫法', symbol: 'mF', factor: 1e-3 },
  { id: 'f', name: '法拉', symbol: 'F', factor: 1 },
];

export default function CapacitanceConvert() {
  return (
    <LinearConvert
      units={UNITS}
      note="所有换算以法拉（F）为统一基准，例如 1 μF = 1,000,000 pF、1 F = 1,000,000 μF。结果保留有效数字。全部计算均在浏览器本地完成，不会上传任何数据。"
    />
  );
}
