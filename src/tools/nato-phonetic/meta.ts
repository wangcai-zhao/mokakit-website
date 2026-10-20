import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'nato-phonetic',
  name: 'NATO 字母拼读',
  seoTitle: 'NATO 字母拼读 - 在线字母转拼音表',
  tagline: '字母转 NATO 拼音便于口头拼读',
  description:
    '免费在线 NATO 字母拼读工具，把英文字母与数字转换为 Alpha、Bravo、Charlie 等标准拼音词，方便电话、无线电与工单里准确报读拼写，全部在浏览器本地完成。',
  keywords: ['NATO 拼音', '字母拼读', ' phonetic', 'Alpha Bravo', '无线电拼写'],
  category: 'text',
  tags: ['文本', '编码', '拼写'],
  icon: 'book',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 6,
  faq: [
    {
      q: '什么是 NATO 拼音表？',
      a: '它是国际通用的字母拼写标准，每个字母对应一个易辨读的单词，如 A=Alfa、B=Bravo，避免口头报读时 B 与 P、M 与 N 混淆。',
    },
    {
      q: '数字怎么拼读？',
      a: '数字 0-9 也各有对应词：0=Zero、1=One，直到 9=Nine，方便连数字一起准确报读。',
    },
  ],
  related: ['unicode-escape', 'base64', 'text-reverse'],
});
