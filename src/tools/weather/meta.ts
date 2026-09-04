import { defineTool } from '../types';

export default defineTool({
  id: 'weather',
  name: '天气查询',
  tagline: '查任意城市的实时天气与 7 天预报',
  description:
    '免费天气查询工具，输入城市名（或经纬度）即可获取实时温度、体感温度、湿度、风速风向、紫外线与未来 7 天逐日预报（最高/最低温/降水概率）。数据来自 Open-Meteo 开放接口，免注册、免 API Key、无 CORS 限制，全程在浏览器端获取，不上传你的查询内容。',
  keywords: ['天气查询', '实时天气', '天气预报', '今天天气', '七日天气'],
  category: 'life',
  tags: ['天气', '预报', '城市', '温度', '生活'],
  icon: 'cloud-sun',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-02',
  updatedAt: '2026-09-02',
  priority: 7,
  faq: [
    {
      q: '这个天气工具需要注册或 API Key 吗？',
      a: '不需要。数据来自 Open-Meteo 开放天气接口，完全免费、无需注册、无需 API Key，直接在浏览器端发起请求，不会泄露任何密钥，也不会消耗你的配额。',
    },
    {
      q: '数据准吗？多久更新一次？',
      a: 'Open-Meteo 聚合多家气象机构（如德国 DWD、美国 NOAA、法国 MeteoFrance）的数值预报产品。当前天气通常每 15 分钟更新一次，7 天预报每天刷新，精度对日常出行、通勤、旅行规划足够。',
    },
    {
      q: '支持国外城市吗？',
      a: '支持。输入中文或英文城市名都能识别，例如「北京」「Shanghai」「Tokyo」「New York」，定位基于地理编码，全球覆盖。',
    },
    {
      q: '天气图标和描述看不懂怎么办？',
      a: '本工具把气象代码（WMO code）翻译成了中文描述和 emoji 图标，晴、多云、雨、雪、雷暴等一眼可辨，不需要对照专业术语表。',
    },
  ],
});
