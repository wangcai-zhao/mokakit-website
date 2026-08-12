import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'gitignore-gen',
  name: '.gitignore 生成器',
  tagline: '按技术栈勾选，秒出 .gitignore',
  description:
    '免费在线 .gitignore 生成器，覆盖 macOS / Windows / Linux、VS Code / IntelliJ / Vim 等编辑器、Node / Python / Java / Go / Rust 等 20+ 编程语言，以及 Django / Next.js / Flutter / Unity / Terraform 等框架平台。勾选技术栈即实时拼出标准 .gitignore，支持一键复制与下载，纯本地运行、不收集任何数据。',
  keywords: ['.gitignore生成器', 'gitignore模板', '忽略文件生成', 'git忽略规则', '项目初始化'],
  category: 'dev',
  tags: ['git', '开发', '模板', '初始化', '开源'],
  icon: 'file-text',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 8,
  faq: [
    {
      q: '.gitignore 是什么？为什么每个项目都需要它？',
      a: '.gitignore 是 Git 仓库根目录下的一个文本文件，用来告诉 Git 哪些文件不该被纳入版本控制——比如操作系统自动生成的缩略图、编辑器缓存、依赖目录（node_modules）、编译产物和本地配置文件。忽略它们能避免把大体积或无意义的文件提交进仓库，保持仓库干净、冲突更少。',
    },
    {
      q: '生成的 .gitignore 怎么用？',
      a: '点「下载 .gitignore」把文件放到你的项目根目录即可（文件名就是 .gitignore，没有扩展名）。也可以点「复制」后手动粘贴。已经在被跟踪的文件不会自动忽略，需要用 git rm --cached 移除后再忽略。',
    },
    {
      q: '规则内容准确吗？会误删我的文件吗？',
      a: '.gitignore 只是「忽略清单」，本工具不会触碰你电脑上的任何文件，生成与下载都在浏览器本地完成。规则整理自社区广泛使用的通用 gitignore 片段；若你的项目有特殊构建产物，建议下载后再手工补一两行。',
    },
    {
      q: '要不要把依赖目录（如 node_modules）提交到仓库？',
      a: '一般不要。node_modules、vendor、target 这类依赖目录体积大且可由包管理器重建，应该忽略。但 lock 文件（package-lock.json、yarn.lock 等）通常建议提交，以保证团队成员安装到完全一致的版本——它们不在本工具的忽略范围内。',
    },
  ],
  related: ['github-stars', 'json-formatter', 'case-converter', 'text-diff'],
});
