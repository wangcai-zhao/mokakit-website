import LinearConvert, { type LinUnit } from '@/tools/_shared/linear-convert';

const UNITS: LinUnit[] = [
  { id: 'nh', name: '纳亨', symbol: 'nH', factor: 1e-9 },
  { id: 'uh', name: '微亨', symbol: 'μH', factor: 1e-6 },
  { id: 'mh', name: '毫亨', symbol: 'mH', factor: 1e-3 },
  { id: 'h', name: '亨利', symbol: 'H', factor: 1 },
];

export default function InductanceConvert() {
  return (
    <LinearConvert
      units={UNITS}
      note="所有换算以亨利（H）为统一基准，例如 1 mH = 1000 μH、1 H = 1,000,000 μH。结果保留有效数字。全部计算均在浏览器本地完成，不会上传任何数据。"
    />
  );
}
