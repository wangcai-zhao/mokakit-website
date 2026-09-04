import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'magnetic',
  name: '磁感应强度换算',
  tagline: 'T、mT、μT、nT、G 等磁感应强度在线互转',
  description:
    '免费在线磁感应强度（磁通密度）单位换算工具，覆盖特斯拉（T）、毫特（mT）、微特（μT）、纳特（nT）、高斯（G）与毫高斯（mG）等常用单位。适合磁场测量、电子罗盘、地磁分析、MRI 设备与无磁实验室场景，输入即时换算，全部本地计算。',
  keywords: ['磁感应强度换算', '特斯拉', '高斯', 'T G', 'mT μT', '磁通密度'],
  category: 'convert',
  tags: ['磁场', '换算'],
  icon: 'magnet',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['unit-convert'],
  faq: [
    {
      q: '磁感应强度单位怎么换算？',
      a: '以特斯拉（T）为基准：1 T = 1000 mT = 1,000,000 μT = 1,000,000,000 nT；1 高斯（G） = 10⁻⁴ T = 100 μT。',
    },
    {
      q: '地球磁场有多大？',
      a: '地磁场约 25–65 μT（即 0.25–0.65 G），赤道弱、两极强。手机磁力计读出的就是微特级。',
    },
    {
      q: '医院 MRI 磁场多大？',
      a: '常见医用磁共振为 1.5 T 或 3.0 T，科研强场可达 7 T、10 T 以上。 strength 越高图像越清晰，但安全要求越严。',
    },
    {
      q: '普通磁铁有多强？',
      a: '玩具磁铁约 0.05–0.1 T，冰箱贴更弱；钕铁硼强磁可达 1 T 以上的表面场。1 T = 10,000 G，所以强磁标"10000 高斯"即 1 T。',
    },
  ],
});
