import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'wcag-contrast',
  name: 'WCAG 对比度检查',
  tagline: '前景/背景色对比度，过 AA/AAA 无障碍',
  description:
    '免费在线 WCAG 对比度检查工具，输入文字色与背景色（十六进制），按 WCAG 2.x 公式算出相对亮度与对比度比值，判断是否满足 AA/AAA（普通文本与大字文本）。做无障碍设计、配色验收、改版前核对，全部本地计算。',
  keywords: ['对比度', 'wcag', '无障碍', '颜色对比'],
  category: 'dev',
  tags: ['WCAG', '颜色', '无障碍'],
  icon: 'contrast',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['color-converter', 'html-to-markdown'],
  faq: [
    {
      q: '对比度比值怎么算？',
      a: '先把前景/背景色转成 sRGB 相对亮度 L（含伽马校正），再套公式 (L亮+0.05)/(L暗+0.05)。结果为倍数，如 4.5:1。',
    },
    {
      q: 'AA 和 AAA 是什么意思？',
      a: 'WCAG 无障碍门槛：普通文本 AA 需 ≥4.5:1、AAA 需 ≥7:1；大字文本（≥18pt 或 ≥14pt 粗）AA 需 ≥3:1、AAA 需 ≥4.5:1。本工具按这两项判定。',
    },
    {
      q: '为什么浅灰字在白底看不清？',
      a: '灰字与白底对比度可能仅 2–3:1，低于 AA 的 4.5:1，弱视用户难辨。工具会直接标红不达标，提示加深文字色。',
    },
    {
      q: '支持透明度吗？',
      a: '对比度以「实际合成后的颜色」为准。若用了带透明度的前景，请先想清楚它在哪种背景上显示，再分别测该背景下的对比度。',
    },
  ],
});
