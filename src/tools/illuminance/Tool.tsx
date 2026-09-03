import LinearConvert, { type LinUnit } from '@/tools/_shared/linear-convert';

const UNITS: LinUnit[] = [
  { id: 'lux', name: '勒克斯', symbol: 'lux', factor: 1 },
  { id: 'fc', name: '英尺烛光', symbol: 'fc', factor: 10.763910417 },
  { id: 'phot', name: '辐透', symbol: 'phot', factor: 10000 },
];

export default function IlluminanceConvert() {
  return (
    <LinearConvert
      units={UNITS}
      note="所有换算以勒克斯（lux）为统一基准：1 fc ≈ 10.764 lux、1 phot = 10,000 lux。阅读约 300–500 lux、办公室约 500 lux。全部计算均在浏览器本地完成，不会上传任何数据。"
    />
  );
}
