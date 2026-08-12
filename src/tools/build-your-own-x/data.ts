import type { ResourceItem, ResourceCat } from '@/tools/_shared/ResourceList';

export const CATS: ResourceCat[] = [
  { id: 'lang', name: '语言与编译器' },
  { id: 'db', name: '存储与数据库' },
  { id: 'sys', name: '网络与系统' },
  { id: 'cli', name: '编辑器与 CLI' },
  { id: 'web', name: 'Web 框架' },
  { id: 'algo', name: '算法与图形' },
];

export const ITEMS: ResourceItem[] = [
  // 语言与编译器
  { name: '编程语言解释器', desc: '从词法、语法到执行，造一门小语言的解释器。', cat: 'lang', url: 'https://craftinginterpreters.com', tag: '经典' },
  { name: '编译器', desc: '把源码翻译成机器码/字节码，理解编译全流程。', cat: 'lang', url: 'https://github.com/DoctorWkt/acwj' },
  { name: '正则表达式引擎', desc: '自己实现一个正则匹配器，搞懂 NFA/DFA。', cat: 'lang', url: 'https://build-your-own.org/b2a/r0_intro' },
  { name: '垃圾回收器', desc: '理解标记-清除，手写一个最简单的垃圾回收器。', cat: 'lang', url: 'http://journal.stuffwithstuff.com/2013/12/08/babys-first-garbage-collector/' },

  // 存储与数据库
  { name: '数据库', desc: '造一个能存能查的数据库，理解 B 树、WAL。', cat: 'db', url: 'https://cstack.github.io/db_tutorial/' },
  { name: '键值存储', desc: '类似 Redis 的内存 KV，理解哈希索引与持久化。', cat: 'db', url: 'https://www.build-redis-from-scratch.dev/' },
  { name: '文本搜索引擎', desc: '倒排索引 + 排序，造个迷你 Elasticsearch。', cat: 'db', url: 'https://boyter.org/2010/08/build-vector-space-search-engine-python/' },
  { name: '图数据库', desc: '用内存图数据库 Dagoba，理解图查询与遍历。', cat: 'db', url: 'http://aosabook.org/en/500L/dagoba-an-in-memory-graph-database.html' },

  // 网络与系统
  { name: '操作系统内核', desc: '从 bootloader 到进程调度，最硬核的练手。', cat: 'sys', url: 'https://github.com/cfenollosa/os-tutorial' },
  { name: '容器 / Docker', desc: '用 namespace 与 cgroup 理解容器隔离原理。', cat: 'sys', url: 'https://www.infoq.com/articles/build-a-container-golang' },
  { name: '负载均衡器', desc: '轮询、最少连接、一致性哈希，造个反向代理。', cat: 'sys', url: 'https://kasvith.me/posts/lets-create-a-simple-lb-go/' },
  { name: 'DNS 服务器', desc: '解析域名到 IP，理解递归与权威解析。', cat: 'sys', url: 'https://engineerhead.github.io/dns-server/' },
  { name: 'TCP/IP 协议栈', desc: '从以太网、ARP 到 TCP，手写一个迷你网络栈。', cat: 'sys', url: 'http://www.saminiir.com/lets-code-tcp-ip-stack-1-ethernet-arp/' },

  // 编辑器与 CLI
  { name: '文本编辑器', desc: '像 Vim 一样处理缓冲区与光标，理解编辑模型。', cat: 'cli', url: 'https://viewsourcecode.org/snaptoken/kilo/' },
  { name: 'Shell', desc: '造个能跑管道与内置命令的命令行解释器。', cat: 'cli', url: 'https://brennan.io/2015/01/16/write-a-shell-in-c/' },
  { name: '终端模拟器', desc: '渲染 PTY、处理转义序列。', cat: 'cli', url: 'https://ishuah.com/2021/03/10/build-a-terminal-emulator-in-100-lines-of-go/' },
  { name: '版本控制系统', desc: '理解 diff/patch 与对象存储，造个迷你 Git。', cat: 'cli', url: 'https://wyag.thb.lt/' },

  // Web 框架
  { name: 'Web 服务器', desc: '从 socket 到 HTTP 解析，理解请求生命周期。', cat: 'web', url: 'https://ruslanspivak.com/lsbaws-part1/' },
  { name: 'Web 框架', desc: '路由、中间件、模板，造个迷你 React。', cat: 'web', url: 'https://pomb.us/build-your-own-react/' },
  { name: '模板引擎', desc: '把模板编译成渲染函数，理解 JSX 的底层。', cat: 'web', url: 'http://krasimirtsonev.com/blog/article/Javascript-template-engine-in-just-20-line' },
  { name: '模块打包器', desc: '像 Minipack 一样，理解打包器如何收集与拼装模块。', cat: 'web', url: 'https://github.com/ronami/minipack' },

  // 算法与图形
  { name: '区块链', desc: '哈希链、共识、挖矿，理解去中心化账本。', cat: 'algo', url: 'https://jeiwan.net/posts/building-blockchain-in-go-part-1/' },
  { name: 'BitTorrent 客户端', desc: '分块下载与做种，理解 P2P 协议。', cat: 'algo', url: 'https://blog.jse.li/posts/torrent/' },
  { name: 'OCR 文字识别', desc: '图像到文本，入门计算机视觉流水线。', cat: 'algo', url: 'http://aosabook.org/en/500L/optical-character-recognition-ocr.html' },
  { name: '光线追踪渲染器', desc: '一周末实现光线追踪，入门计算机图形学。', cat: 'algo', url: 'https://raytracing.github.io/books/RayTracingInOneWeekend.html' },
];
