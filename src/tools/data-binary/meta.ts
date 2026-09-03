import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'data-binary',
  name: '存储单位换算',
  tagline: 'bit/B/KB/KiB/MB/MiB/GB/GiB 等存储容量在线互转',
  description:
    '免费在线数据存储单位换算工具，同时支持十进制（SI：KB=1000B）与二进制（IEC：KiB=1024B）两套体系，覆盖 bit、Byte、KB、KiB、MB、MiB、GB、GiB、TB、TiB、PB、PiB。一眼看清硬盘标称容量与系统显示差异，全部本地计算。',
  keywords: ['存储换算', 'KB KiB 区别', '十进制二进制存储', 'GB GiB', '比特字节', '硬盘容量'],
  category: 'convert',
  tags: ['存储', '数据', '换算'],
  icon: 'memory-stick',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 8,
  related: ['unit-convert'],
  faq: [
    {
      q: 'KB 和 KiB 到底差多少？',
      a: 'KB 按十进制 = 1000 字节，KiB 按二进制 = 1024 字节。1 KiB 比 1 KB 大约 2.4%；到 GB/GiB 级别，1 GiB 比 1 GB 大约 7.4%。本工具两种都列出来，避免混淆。',
    },
    {
      q: '为什么硬盘标 1TB，电脑只显示约 931GB？',
      a: '厂商按十进制标称：1 TB = 10¹² 字节；而操作系统按二进制计数（1 TiB = 2⁴⁰ ≈ 1.0995×10¹² 字节），所以系统把 1TB 盘显示为约 931 GiB（常被简写成 GB）。这是单位口径差异，不是缩水。',
    },
    {
      q: 'bit 和 Byte 怎么换算？',
      a: '1 Byte = 8 bit。带宽 100 Mbps（兆比特每秒）= 12.5 MB/s（兆字节每秒，理论峰值）；下载速度显示的 MB/s 通常是 MiB/s。',
    },
    {
      q: '内存/显存标 MB 实际是 MiB 吗？',
      'a': '基本是。内存、显存、U 盘容量常被厂商写成 MB/GB，但底层按二进制（MiB/GiB）寻址。本工具用 IEC 标准（KiB/MiB/GiB）与 SI 标准（KB/MB/GB）并列显示，方便对照。',
    },
  ],
});
