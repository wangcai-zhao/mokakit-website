import LinearConvert, { type LinUnit } from '@/tools/_shared/linear-convert';

const UNITS: LinUnit[] = [
  { id: 'pas', name: '帕·秒', symbol: 'Pa·s', factor: 1000 },
  { id: 'mpas', name: '毫帕·秒', symbol: 'mPa·s', factor: 1 },
  { id: 'cp', name: '厘泊', symbol: 'cP', factor: 1 },
  { id: 'kgms', name: '千克/(米·秒)', symbol: 'kg/(m·s)', factor: 1000 },
];

export default function ViscosityConvert() {
  return (
    <LinearConvert
      units={UNITS}
      note="以毫帕·秒（mPa·s，等于 cP）为统一基准：1 Pa·s = 1000 mPa·s = 1000 cP。20℃ 水约 1 cP，蜂蜜约 2000–10000 cP。全部计算均在浏览器本地完成，不会上传任何数据。"
    />
  );
}
