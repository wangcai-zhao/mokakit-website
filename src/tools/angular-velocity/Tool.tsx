import LinearConvert, { type LinUnit } from '@/tools/_shared/linear-convert';

const UNITS: LinUnit[] = [
  { id: 'radps', name: '弧度/秒', symbol: 'rad/s', factor: 1 },
  { id: 'rpm', name: '转/分', symbol: 'rpm', factor: 0.1047197551 },
  { id: 'degs', name: '度/秒', symbol: '°/s', factor: 0.01745329252 },
  { id: 'rps', name: '转/秒', symbol: 'rps', factor: 6.283185307 },
];

export default function AngularVelocityConvert() {
  return (
    <LinearConvert
      units={UNITS}
      note="以弧度每秒（rad/s）为统一基准：1 rpm = 2π/60 ≈ 0.10472 rad/s、1 °/s = π/180 ≈ 0.017453 rad/s、1 rps = 2π rad/s。全部计算均在浏览器本地完成，不会上传任何数据。"
    />
  );
}
