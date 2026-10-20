import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'data-rate-convert',
  name: '数据速率换算',
  seoTitle: '数据速率换算 - bps kbps Mbps Gbps 在线互转',
  tagline: 'bps/kbps/Mbps/Gbps 互转',
  description:
    '免费在线数据速率换算工具，支持 bps、kbps、Mbps、Gbps 在十进制（1000）与二进制（1024）两种基准间互转，适合网络带宽、存储吞吐与下载速度评估，浏览器本地计算。',
  keywords: ['数据速率换算', '带宽换算', 'Mbps', 'Gbps', 'kbps'],
  category: 'convert',
  tags: ['换算', '网络', '速率'],
  icon: 'gauge',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 6,
  faq: [
    {
      q: '十进制和二进制有什么区别？',
      a: '网络带宽常用十进制（1 Mbps = 1,000,000 bps），而存储与系统常用二进制（1 MiB/s = 1,048,576 B/s）。选错基准会让数值差约 5%。',
    },
    {
      q: '为什么下载速度常比宽带标称慢？',
      a: '运营商标的是比特（bit），下载软件显示的是字节（Byte），1 Byte = 8 bit，再扣除协议开销，实际速度约为标称值的八分之一左右。',
    },
  ],
  related: ['bytes-size-converter', 'download-time-calculator', 'unit-convert'],
});
