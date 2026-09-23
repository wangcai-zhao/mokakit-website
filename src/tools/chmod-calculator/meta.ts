import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'chmod-calculator',
  name: 'chmod 权限计算器',
  tagline: '权限数字与符号互转',
  description:
    '免费在线 chmod 权限计算器，勾选读写执行复选框即可实时得到八进制数字与 rwxr-xr-x 符号表示，支持 setuid、setgid、sticky 三个特殊权限位，内置 644、755、600、777 等八组常用预设，并给出可直接复制的命令。',
  keywords: ['chmod 计算器', 'Linux 权限', '文件权限计算', 'rwx 换算', '755 644 含义'],
  category: 'dev',
  tags: ['Linux', '权限', '运维'],
  icon: 'lock',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 7,
  faq: [
    {
      q: '755 和 644 该怎么选？',
      a: '目录和可执行文件用 755（所有者全权限，其他人可读可执行）；普通文件用 644（所有者可读写，其他人只读）。私钥、配置文件收紧到 600。',
    },
    {
      q: '目录为什么必须有 x 权限？',
      a: '目录的 x 表示「能否进入」。没有 x 权限，即使有 r 权限也 cd 不进去、访问不了里面的文件。',
    },
    {
      q: 'sticky 位是干嘛的？',
      a: '典型场景是 /tmp：所有人都能写，但只能删除自己创建的文件。权限数字表现为 1777。',
    },
  ],
  related: ['security-headers', 'nginx-config-gen'],
});
