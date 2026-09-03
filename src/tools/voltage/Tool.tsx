import LinearConvert, { type LinUnit } from '@/tools/_shared/linear-convert';

const UNITS: LinUnit[] = [
  { id: 'uv', name: '微伏', symbol: 'μV', factor: 1e-6 },
  { id: 'mv', name: '毫伏', symbol: 'mV', factor: 1e-3 },
  { id: 'v', name: '伏特', symbol: 'V', factor: 1 },
  { id: 'kv', name: '千伏', symbol: 'kV', factor: 1e3 },
  { id: 'mv2', name: '兆伏', symbol: 'MV', factor: 1e6 },
];

export default function VoltageConvert() {
  return (
    <LinearConvert
      units={UNITS}
      note="所有换算以伏特（V）为统一基准，例如 1 kV = 1000 V、1 V = 1,000,000 μV。结果保留有效数字。全部计算均在浏览器本地完成，不会上传任何数据。"
    />
  );
}
