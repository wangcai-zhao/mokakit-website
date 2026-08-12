import { defineTool } from '../types';

export default defineTool({
  id: 'color-converter',
  name: '颜色转换',
  tagline: 'HEX / RGB / HSL 互转',
  description:
    '免费在线颜色转换工具，支持 HEX、RGB、HSL 三种格式互转，实时预览色块并可一键复制，帮助设计师与前端开发者快速换算颜色值，避免手动计算色相饱和度出错。',
  keywords: ['颜色转换', 'HEX转RGB', 'RGB转HSL', '在线颜色', '颜色值换算'],
  category: 'convert',
  tags: ['颜色', 'HEX', 'RGB', 'HSL', '转换'],
  icon: 'palette',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 5,
  faq: [
    {
      q: 'HEX 和 RGB 有什么区别？',
      a: '两者表达的是同一个颜色，只是写法不同。HEX（如 #ff8c00）是十六进制简写，RGB（如 rgb(255,140,0)）是十进制分量。绝大多数设计软件和 CSS 都同时支持，按习惯或团队规范选用即可。',
    },
    {
      q: '什么时候用 HSL？',
      a: 'HSL（色相/饱和度/亮度）更贴近人眼对颜色的感知，调亮、调暗、换色相时比 RGB 直观得多。例如把亮度从 50% 调到 70% 就能快速得到同色系的浅色，适合做主题色衍生。',
    },
  ],
});
