import LinearConvert, { type LinUnit } from '@/tools/_shared/linear-convert';

const UNITS: LinUnit[] = [
  { id: 'ua', name: '微安', symbol: 'μA', factor: 1e-6 },
  { id: 'ma', name: '毫安', symbol: 'mA', factor: 1e-3 },
  { id: 'a', name: '安培', symbol: 'A', factor: 1 },
  { id: 'ka', name: '千安', symbol: 'kA', factor: 1e3 },
];

export default function CurrentConvert() {
  return (
    <LinearConvert
      units={UNITS}
      note="所有换算以安培（A）为统一基准，例如 1 A = 1000 mA、1 kA = 1000 A。结果保留有效数字。全部计算均在浏览器本地完成，不会上传任何数据。"
    />
  );
}
