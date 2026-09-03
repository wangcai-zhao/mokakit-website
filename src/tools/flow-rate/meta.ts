import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'flow-rate',
  name: '体积流量换算',
  tagline: 'L/s、L/min、m³/h、gpm、cfm 等流量单位在线互转',
  description:
    '免费在线体积流量换算工具，覆盖升每秒（L/s）、升每分（L/min）、立方米每小时（m³/h）、美制加仑每分（gpm US）、立方英尺每分（cfm）等常用单位。适合水泵、鱼缸、水管、空调与燃气表场景，全部本地计算。',
  keywords: ['流量换算', '升每秒', '立方米每小时', '加仑每分钟', 'L/min m3/h gpm', '体积流量'],
  category: 'convert',
  tags: ['流量', '换算'],
  icon: 'droplet',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['unit-convert'],
  faq: [
    {
      q: '体积流量单位怎么换算？',
      a: '以升每秒（L/s）为基准：1 m³/h ≈ 0.2778 L/s，1 L/min ≈ 0.01667 L/s，1 gpm(US) ≈ 0.06309 L/s，1 cfm ≈ 0.47195 L/s。',
    },
    {
      q: 'gpm 和 L/min 怎么换算？',
      a: '1 gpm(US) = 3.785 L/min；1 cfm（立方英尺每分）≈ 28.317 L/min。看进口水泵、净水器参数时常遇到 gpm。',
    },
    {
      q: '鱼缸水泵标 L/h 还是 L/min？',
      a: '两种都有，注意区分：1 L/min = 60 L/h。比如标 1200 L/h 的水泵，实际每分钟约 20 L。选泵时按实际水体循环需求算。',
    },
    {
      q: '水表/燃气表为什么用 m³/h？',
      a: '管道流量大，用立方米每小时更直观；民用水表累计读数是 m³（吨），峰值流量才用 m³/h。1 m³/h ≈ 0.2778 L/s。',
    },
  ],
});
