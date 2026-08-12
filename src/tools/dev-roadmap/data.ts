import type { ResourceItem, ResourceCat } from '@/tools/_shared/ResourceList';

export const CATS: ResourceCat[] = [
  { id: 'fe', name: '前端' },
  { id: 'be', name: '后端' },
  { id: 'devops', name: 'DevOps' },
  { id: 'fs', name: '全栈' },
  { id: 'data', name: '数据 / AI' },
  { id: 'sec', name: '安全' },
];

export const ITEMS: ResourceItem[] = [
  // 前端
  { name: 'HTML / CSS 基础', desc: '语义化标签、盒模型、Flex/Grid 布局，一切的起点。', cat: 'fe', url: 'https://developer.mozilla.org/zh-CN/docs/Web/HTML', tag: '基础' },
  { name: 'JavaScript 深入', desc: '原型链、闭包、事件循环、异步，前端绕不开的核心。', cat: 'fe', url: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript', tag: '基础' },
  { name: 'TypeScript', desc: '类型系统让中大型项目更稳，现代前端事实标准。', cat: 'fe', url: 'https://www.typescriptlang.org', tag: '推荐' },
  { name: 'React', desc: '组件化 + Hooks，生态最大、岗位最多。', cat: 'fe', url: 'https://react.dev', tag: '框架' },
  { name: 'Vue', desc: '上手平缓、文档友好，国内采用率高。', cat: 'fe', url: 'https://vuejs.org', tag: '框架' },
  { name: '构建工具 Vite', desc: '极速冷启动与 HMR，替代 webpack 的新标准。', cat: 'fe', url: 'https://vitejs.dev', tag: '工程化' },
  { name: '浏览器原理', desc: '渲染流程、重排重绘、事件机制，性能优化的根基。', cat: 'fe', url: 'https://developer.mozilla.org/zh-CN/docs/Web/Performance', tag: '进阶' },
  { name: '前端测试', desc: 'Vitest / Playwright，给组件与流程加保护网。', cat: 'fe', url: 'https://vitest.dev', tag: '工程化' },

  // 后端
  { name: '一门服务端语言', desc: 'Go / Java / Python / Node 任选，先吃透一门。', cat: 'be', url: 'https://go.dev', tag: '基础' },
  { name: '关系型数据库与 SQL', desc: '表设计、索引、事务，后端的命脉。', cat: 'be', url: 'https://www.postgresql.org/docs', tag: '基础' },
  { name: 'REST / API 设计', desc: '资源建模、状态码、版本与鉴权，写好对外接口。', cat: 'be', url: 'https://restfulapi.net', tag: '基础' },
  { name: 'Redis 缓存', desc: '缓存、会话、排行榜，缓解数据库压力。', cat: 'be', url: 'https://redis.io', tag: '推荐' },
  { name: '消息队列', desc: 'Kafka / RabbitMQ，解耦与削峰的常用手段。', cat: 'be', url: 'https://kafka.apache.org', tag: '进阶' },
  { name: '认证与授权', desc: 'JWT / OAuth2 / 会话管理，安全的第一道门。', cat: 'be', url: 'https://jwt.io/introduction', tag: '安全' },

  // DevOps
  { name: 'Linux 基础', desc: '常用命令、权限、进程与网络，运维的母语。', cat: 'devops', url: 'https://www.linux.org', tag: '基础' },
  { name: 'Docker 容器', desc: '镜像与容器，环境一致性的关键。', cat: 'devops', url: 'https://docs.docker.com', tag: '基础' },
  { name: 'Kubernetes', desc: '容器编排、扩缩容、自愈，云原生核心。', cat: 'devops', url: 'https://kubernetes.io', tag: '进阶' },
  { name: 'CI / CD', desc: 'GitHub Actions / GitLab CI，把构建测试部署自动化。', cat: 'devops', url: 'https://docs.github.com/actions', tag: '工程化' },
  { name: '可观测性', desc: '日志、指标、链路追踪，出问题能快速定位。', cat: 'devops', url: 'https://grafana.com', tag: '进阶' },

  // 全栈
  { name: 'Next.js', desc: 'React 全栈框架，SSR/路由/API 一体。', cat: 'fs', url: 'https://nextjs.org', tag: '框架' },
  { name: 'Nuxt', desc: 'Vue 全栈框架，SSR 与服务端能力开箱即用。', cat: 'fs', url: 'https://nuxt.com', tag: '框架' },
  { name: '前后端协作', desc: '接口约定、错误处理、环境隔离，全栈的软技能。', cat: 'fs', url: 'https://github.com/kamranahmede/developer-roadmap', tag: '综合' },

  // 数据 / AI
  { name: 'Python 数据分析', desc: 'Pandas / NumPy，处理表格与统计。', cat: 'data', url: 'https://pandas.pydata.org', tag: '基础' },
  { name: 'SQL 进阶', desc: '窗口函数、CTE、执行计划，数据分析利器。', cat: 'data', url: 'https://mode.com/sql-tutorial', tag: '基础' },
  { name: '机器学习', desc: 'scikit-learn 入门分类/回归，理解模型评估。', cat: 'data', url: 'https://scikit-learn.org', tag: '进阶' },
  { name: '深度学习框架', desc: 'PyTorch 入手神经网络与训练流水线。', cat: 'data', url: 'https://pytorch.org', tag: '进阶' },

  // 安全
  { name: 'OWASP Top 10', desc: 'Web 十大安全风险，开发与审计的通用语言。', cat: 'sec', url: 'https://owasp.org/www-project-top-ten', tag: '必读' },
  { name: '密码学基础', desc: '哈希、对称/非对称加密，理解「为什么安全」。', cat: 'sec', url: 'https://en.wikipedia.org/wiki/Cryptography', tag: '基础' },
  { name: '渗透测试入门', desc: 'PortSwigger / HackTheBox，理解攻击者视角。', cat: 'sec', url: 'https://portswigger.net/web-security', tag: '进阶' },
];
