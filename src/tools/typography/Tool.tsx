import LinearConvert, { type LinUnit } from '@/tools/_shared/linear-convert';

const UNITS: LinUnit[] = [
  { id: 'pt', name: '点', symbol: 'pt', factor: 0.3527777778 },
  { id: 'pc', name: '派卡', symbol: 'pc', factor: 4.2333333333 },
  { id: 'mm', name: '毫米', symbol: 'mm', factor: 1 },
  { id: 'cm', name: '厘米', symbol: 'cm', factor: 10 },
  { id: 'q', name: '级', symbol: 'Q', factor: 0.25 },
  { id: 'px', name: '像素(96dpi)', symbol: 'px', factor: 0.2645833333 },
  { id: 'in', name: '英寸', symbol: 'in', factor: 25.4 },
  { id: 'em', name: 'em(16px基准)', symbol: 'em', factor: 4.2333333333 },
];

export default function TypographyConvert() {
  return (
    <LinearConvert
      units={UNITS}
      note="以毫米为统一基准：1 pt ≈ 0.3528 mm、1 px(96dpi) ≈ 0.2646 mm、1 Q = 0.25 mm、12 pt ≈ 16 px。em 为相对单位，此处按 16px 网页基准近似。全部计算均在浏览器本地完成，不会上传任何数据。"
    />
  );
}
