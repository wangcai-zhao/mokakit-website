import LinearConvert, { type LinUnit } from '@/tools/_shared/linear-convert';

const UNITS: LinUnit[] = [
  { id: 'mls', name: '毫升/秒', symbol: 'mL/s', factor: 0.001 },
  { id: 'ls', name: '升/秒', symbol: 'L/s', factor: 1 },
  { id: 'lmin', name: '升/分', symbol: 'L/min', factor: 60 },
  { id: 'm3h', name: '立方米/时', symbol: 'm³/h', factor: 0.2777777778 },
  { id: 'gpm', name: '加仑/分(美)', symbol: 'gpm(US)', factor: 0.0630901964 },
  { id: 'cfm', name: '立方英尺/分', symbol: 'cfm', factor: 0.4719474432 },
];

export default function FlowRateConvert() {
  return (
    <LinearConvert
      units={UNITS}
      note="所有换算以升每秒（L/s）为统一基准：1 m³/h ≈ 0.2778 L/s、1 gpm(US) ≈ 0.0631 L/s、1 cfm ≈ 0.472 L/s。注意 1 L/min = 60 L/h。全部计算均在浏览器本地完成，不会上传任何数据。"
    />
  );
}
