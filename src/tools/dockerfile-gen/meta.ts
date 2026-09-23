import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'dockerfile-gen',
  name: 'Dockerfile 生成',
  tagline: '多语言镜像构建文件',
  description:
    '免费在线 Dockerfile 生成工具，支持 Node.js、Python、Go、Java、静态站点五种技术栈，可开关多阶段构建与非 root 用户运行，自动安排好依赖安装与代码复制的顺序以命中 Docker 层缓存，附赠 .dockerignore。本地生成不上传。',
  keywords: ['Dockerfile 生成', 'Docker 镜像', '多阶段构建', '容器化配置', 'dockerignore'],
  category: 'dev',
  tags: ['Docker', '运维', '构建'],
  icon: 'box',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 7,
  faq: [
    {
      q: '为什么要先复制 package.json 再复制代码？',
      a: '为了利用 Docker 的层缓存。只改代码不改依赖时，装依赖那一步会直接命中缓存，不用重装，构建速度差好几倍。',
    },
    {
      q: '多阶段构建有什么好处？',
      a: '构建阶段需要编译器和完整依赖，运行阶段只需要编译产物。分开之后最终镜像能小一个数量级，也少了很多不必要的攻击面。',
    },
    {
      q: '非 root 运行有必要吗？',
      a: '有必要。容器里用 root 跑应用，一旦被突破就能拿到较高的权限。加一个普通用户运行能挡掉一大类风险，是生产环境的基本要求。',
    },
  ],
  related: ['nginx-config-gen', 'gitignore-gen'],
});
