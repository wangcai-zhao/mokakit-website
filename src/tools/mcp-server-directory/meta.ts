import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'mcp-server-directory',
  name: 'MCP 服务器清单',
  tagline: '热门 MCP Server 一站速览',
  description:
    '免费在线 MCP 服务器清单：按官方参考实现、数据库、云服务、开发工具等维度整理热门 Model Context Protocol 服务器，附仓库链接与一句话定位，帮你快速找到能接进 Claude / Cursor 的 MCP Server，纯静态导航不上传。',
  keywords: ["MCP Server","MCP清单","模型上下文协议","Claude MCP","Cursor MCP"],
  category: 'ai',
  tags: ["mcp","服务器","导航","协议","智能体"],
  icon: 'server',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-11',
  updatedAt: '2026-10-11',
  priority: 8,
  faq: [
    {
      q: '清单全吗？',
      a: '收录的是各维度代表项，非全量；MCP 生态更新极快，新 Server 持续出现。',
    },
    {
      q: '这些 Server 安全吗？',
      a: '链接均指向官方仓库，但实际运行请自行审阅代码与权限，尤其涉及文件 / 网络的工具。',
    },
    {
      q: '怎么接？',
      a: '在支持 MCP 的客户端（如 Claude Desktop、Cursor）配置对应 Server 的启动命令或 URL 即可。',
    },
  ],
});
