import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'port-lookup',
  name: '端口号速查',
  tagline: '常见端口号与用途速查，TCP/UDP 一览',
  description:
    '免费在线端口号速查工具，收录 HTTP、HTTPS、SSH、数据库、容器、消息队列等常见端口及用途，支持按端口号或关键词搜索。排查服务冲突、配置防火墙时随手查，全部本地数据。',
  keywords: ['端口号', '端口速查', '常见端口', 'port lookup'],
  category: 'dev',
  tags: ['网络', '端口', '开发'],
  icon: 'network',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['http-status', 'url-parser'],
  faq: [
    {
      q: '端口号范围是多少？',
      a: '端口是 16 位无符号整数，范围 0–65535。0–1023 为系统/知名端口（需特权），1024–49151 为注册端口，49152–65535 为动态/私有端口。',
    },
    {
      q: 'TCP 和 UDP 端口为什么分开算？',
      a: 'TCP 和 UDP 是不同协议，各自有独立端口空间。例如 53 同时被 DNS 的 UDP（查询）和 TCP（区域传送）使用，二者不冲突。',
    },
    {
      q: '怎么看端口被谁占用？',
      a: '本工具只查「端口号→用途」对照。要看本机占用可用系统命令：Linux/macOS 用 `lsof -i :端口` 或 `ss -tulnp`，Windows 用 `netstat -ano | findstr 端口`。',
    },
    {
      q: '自定义服务该用哪个端口？',
      a: '优先选 1024 以上的注册/私有端口，避开知名服务。容器、微服务常用 3000、8080、8000、9000 等，注意别与已跑服务撞车。',
    },
  ],
});
