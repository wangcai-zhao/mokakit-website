import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'angular-velocity',
  name: '角速度换算',
  tagline: 'rad/s、rpm、°/s、rps 等角速度单位在线互转',
  description:
    '免费在线角速度单位换算工具，覆盖弧度每秒（rad/s）、转每分（rpm）、度每秒（°/s）、转每秒（rps）等常用单位。适合电机、机械与物理运动分析，全部本地计算。',
  keywords: ['角速度换算', 'rad/s rpm', '转每分', '弧度每秒', '度每秒', '转速'],
  category: 'convert',
  tags: ['角速度', '转速', '换算'],
  icon: 'rotate-cw',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['unit-convert'],
  faq: [
    {
      q: '角速度单位怎么换算？',
      a: '以 rad/s 为基准：1 rpm = 2π/60 ≈ 0.10472 rad/s；1 °/s = π/180 ≈ 0.017453 rad/s；1 rps = 2π ≈ 6.2832 rad/s。',
    },
    {
      q: 'rpm 和 rad/s 怎么对上？',
      a: '电机标 rpm，物理公式用 rad/s。例：3000 rpm = 3000 × 2π/60 ≈ 314.16 rad/s；100 rpm ≈ 10.47 rad/s。',
    },
    {
      q: '电风扇、硬盘转速是多少？',
      a: '家用电风扇几百到几千 rpm，机械硬盘 5400/7200 rpm，CPU 风扇可达 2000–3000 rpm，精密主轴可达数万 rpm。',
    },
    {
      q: '度每秒和弧度每秒哪个常用？',
      a: '°/s 用于直观显示转速（如陀螺仪、云台），rad/s 用于动力学计算（力矩、转动惯量）。本工具两者都能互转。',
    },
  ],
});
