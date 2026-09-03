import LinearConvert, { type LinUnit } from '@/tools/_shared/linear-convert';

const UNITS: LinUnit[] = [
  { id: 'ms2', name: '米/二次方秒', symbol: 'm/s²', factor: 1 },
  { id: 'g', name: '重力加速度', symbol: 'g', factor: 9.80665 },
  { id: 'fts2', name: '英尺/二次方秒', symbol: 'ft/s²', factor: 0.3048 },
  { id: 'gal', name: '伽', symbol: 'Gal', factor: 0.01 },
];

export default function AccelerationConvert() {
  return (
    <LinearConvert
      units={UNITS}
      note="以米每二次方秒（m/s²）为统一基准：1 g ≈ 9.80665 m/s²、1 ft/s² ≈ 0.3048 m/s²、1 Gal = 0.01 m/s²。汽车 3.6 秒破百约 7.72 m/s²。全部计算均在浏览器本地完成，不会上传任何数据。"
    />
  );
}
