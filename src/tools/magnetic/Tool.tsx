import LinearConvert, { type LinUnit } from '@/tools/_shared/linear-convert';

const UNITS: LinUnit[] = [
  { id: 't', name: '特斯拉', symbol: 'T', factor: 1 },
  { id: 'mt', name: '毫特', symbol: 'mT', factor: 0.001 },
  { id: 'ut', name: '微特', symbol: 'μT', factor: 1e-6 },
  { id: 'nt', name: '纳特', symbol: 'nT', factor: 1e-9 },
  { id: 'g', name: '高斯', symbol: 'G', factor: 1e-4 },
];

export default function MagneticConvert() {
  return (
    <LinearConvert
      units={UNITS}
      note="以特斯拉（T）为统一基准：1 T = 1000 mT = 1,000,000 μT、1 G（高斯）= 10⁻⁴ T = 100 μT。地磁场约 25–65 μT，医用 MRI 约 1.5–3 T。全部计算均在浏览器本地完成，不会上传任何数据。"
    />
  );
}
