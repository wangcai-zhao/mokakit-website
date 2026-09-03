import LinearConvert, { type LinUnit } from '@/tools/_shared/linear-convert';

const UNITS: LinUnit[] = [
  { id: 'kgm3', name: '千克/立方米', symbol: 'kg/m³', factor: 1 },
  { id: 'gcc', name: '克/立方厘米', symbol: 'g/cm³', factor: 1000 },
  { id: 'gml', name: '克/毫升', symbol: 'g/mL', factor: 1000 },
  { id: 'lbft3', name: '磅/立方英尺', symbol: 'lb/ft³', factor: 16.018463373 },
  { id: 'lbgal', name: '磅/加仑(美)', symbol: 'lb/gal', factor: 119.8264273 },
];

export default function DensityConvert() {
  return (
    <LinearConvert
      units={UNITS}
      note="以千克每立方米（kg/m³）为统一基准：1 g/cm³ = 1 g/mL = 1000 kg/m³、1 lb/ft³ ≈ 16.0185 kg/m³。水约 1 g/cm³，铁约 7.87 g/cm³。全部计算均在浏览器本地完成，不会上传任何数据。"
    />
  );
}
