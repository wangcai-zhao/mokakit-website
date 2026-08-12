import { defineTool } from '../types';

export default defineTool({
  id: 'mcp-config-generator',
  name: 'MCP 配置生成器',
  tagline: '选服务生成 mcp.json 配置',
  description:
    '免费在线 MCP 配置生成工具，支持同时添加多个 MCP 服务（文件系统、GitHub、Fetch、Puppeteer、Notion、PostgreSQL、Slack、Brave 搜索、Google Drive、Memory、Time 及自定义 stdio），逐个配置后自动组合成完整 mcp.json，可直接合并进 WorkBuddy 的 mcp.json 启用。',
  keywords: ['MCP配置', 'mcp.json生成', 'Model Context Protocol', 'WorkBuddy配置', 'MCP服务', '多服务组合'],
  category: 'ai',
  tags: ['mcp', 'workbuddy', '配置', 'ai', '智能体'],
  icon: 'plug',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 5,
  faq: [
    {
      q: '生成的 mcp.json 放在哪里？',
      a: 'WorkBuddy 的 MCP 配置文件是用户主目录下的 ~/.workbuddy/mcp.json。把生成的 {"mcpServers": {...}} 内容合并进该文件的 mcpServers 字段即可，新服务器不会覆盖已有配置。',
    },
    {
      q: 'stdio 和 HTTP/SSE 类型有什么区别？',
      a: '本工具生成的是最常见的 stdio 类型（本地用命令启动）。若你接入的是远程 HTTP/SSE 服务，需改用 url 字段，可参考官方文档手动调整。',
    },
  ],
});
