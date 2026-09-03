import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'paper-size',
  name: '纸张尺寸换算',
  tagline: 'A/B/C 系列、Letter、Legal 等纸张尺寸在线互转',
  description:
    '免费在线纸张尺寸换算工具，覆盖 ISO A 系列（A0–A8）、B 系列（B0–B8）、C 系列（C4/C5/C6 信封）以及北美 Letter、Legal、Tabloid 等规格，支持毫米/厘米/英寸互显。打印、设计、论文排版一站搞定，全部本地计算。',
  keywords: ['纸张尺寸', 'A4尺寸', '纸张换算', 'Letter', 'mm cm inch', 'A3 A5'],
  category: 'convert',
  tags: ['纸张', '尺寸', '换算'],
  icon: 'printer',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['unit-convert', 'typography'],
  faq: [
    {
      q: 'A4 尺寸到底是多少？',
      a: 'A4 = 210 × 297 mm（约 8.27 × 11.69 英寸）。ISO A 系列长宽为 √2 比例，每张对半裁切就是下一号。',
    },
    {
      q: 'A3、A5 和 A4 的关系？',
      a: 'A3 = 2 张 A4（297 × 420 mm），A5 = ½ 张 A4（148 × 210 mm），A2 = 4 张 A4，A1 = 8 张 A4，A0 = 16 张 A4（841 × 1189 mm）。',
    },
    {
      q: 'Letter 和 A4 一样大吗？',
      a: '不一样。北美 Letter = 215.9 × 279.4 mm，比 A4 略宽略短；Legal = 215.9 × 355.6 mm。中英混排文档要注意页面尺寸。',
    },
    {
      q: 'C 系列纸张是干什么的？',
      a: 'C 系列主要用于信封：C4 装得下对折的 A4，C5 装得下 A5，C6 装得下 A6。设计信封装帧时常用。',
    },
  ],
});
