import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'typography',
  name: '排版单位换算',
  tagline: 'pt、px、mm、Q、pc 等字号单位在线互转',
  description:
    '免费在线排版/字体单位换算工具，覆盖点（pt）、像素（px，按 96dpi）、毫米（mm）、厘米（cm）、级（Q）、派卡（pc）等。设计稿、印刷品、网页字号对照不再乱，全部本地计算。',
  keywords: ['排版单位换算', 'pt px mm', '字号换算', '磅 像素', '字体单位', '点派卡'],
  category: 'convert',
  tags: ['排版', '字体', '换算'],
  icon: 'type',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['unit-convert'],
  faq: [
    {
      q: 'pt 和 px 怎么换算？',
      a: '印刷上 1 pt = 1/72 英寸；屏幕按 96dpi 时 1 px = 1/96 英寸，因此 1 pt ≈ 1.333 px，12 pt ≈ 16 px。CSS 里 12pt 约等于 16px。',
    },
    {
      q: 'mm 和 pt 的关系？',
      a: '1 pt = 25.4/72 ≈ 0.3528 mm；1 inch = 72 pt = 25.4 mm。印刷品标毫米尺寸时常用此关系换算字号。',
    },
    {
      q: 'Q（级）是什么单位？',
      a: 'Q 是日本排版常用的"级"，1 Q = 0.25 mm = 1/40 mm，主要用于照排字号。1 Q ≈ 0.709 pt。',
    },
    {
      q: 'em 是绝对单位吗，能换算吗？',
      a: 'em 是相对单位，等于"当前字号"，不是绝对长度，不能直接跨场景换算。本工具将 em 以 16px（常见网页基准）近似换算，仅作参考。',
    },
  ],
});
