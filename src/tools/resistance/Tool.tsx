import LinearConvert, { type LinUnit } from '@/tools/_shared/linear-convert';

const UNITS: LinUnit[] = [
  { id: 'mo', name: '毫欧', symbol: 'mΩ', factor: 0.001 },
  { id: 'ohm', name: '欧姆', symbol: 'Ω', factor: 1 },
  { id: 'ko', name: '千欧', symbol: 'kΩ', factor: 1000 },
  { id: 'mo2', name: '兆欧', symbol: 'MΩ', factor: 1e6 },
  { id: 'go', name: '吉欧', symbol: 'GΩ', factor: 1e9 },
];

export default function ResistanceConvert() {
  return (
    <LinearConvert
      units={UNITS}
      note="所有换算以欧姆（Ω）为统一基准，例如 1 kΩ = 1000 Ω、1 MΩ = 1,000,000 Ω。结果保留有效数字。全部计算均在浏览器本地完成，不会上传任何数据。"
    />
  );
}
