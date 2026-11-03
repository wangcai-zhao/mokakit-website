import { defineTool } from '../types';

export default defineTool({
  id: 'mcp-config-generator',
  name: 'MCP 配置生成器',
  seoTitle: 'MCP配置生成器 - 在线生成mcp.json，支持stdio与HTTP/SSE远程服务',
  tagline: '选服务生成 mcp.json 配置',
  description:
    '免费在线 MCP 配置生成器，内置文件系统、GitHub、Fetch、PostgreSQL、Slack 等常见 MCP 服务，支持自定义 stdio 命令与 SSE / Streamable HTTP 远程服务，可同时添加多个并逐个配置，自动组合成完整 mcp.json，合并进 WorkBuddy 等客户端即可启用。',
  keywords: ['MCP配置', 'mcp.json生成', 'Model Context Protocol', 'WorkBuddy配置', 'MCP服务', '多服务组合'],
  category: 'ai',
  tags: ['mcp', 'workbuddy', '配置', 'ai', '智能体'],
  icon: 'plug',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-08-04',
  updatedAt: '2026-11-01',
  priority: 5,
  related: ['mcp-server-directory', 'mcp-tool-generator', 'json-formatter', 'env-parser'],
  faq: [
    {
      q: '生成的 mcp.json 放在哪里？',
      a: 'WorkBuddy 的 MCP 配置文件是用户主目录下的 ~/.workbuddy/mcp.json。把生成的 {"mcpServers": {...}} 内容合并进该文件的 mcpServers 字段即可，新服务器不会覆盖已有配置。',
    },
    {
      q: 'stdio 和 HTTP/SSE 类型有什么区别？',
      a: '两种都支持。本地服务（文件系统、GitHub 等预置）生成 stdio 配置：客户端用 command + args 在本地拉起进程，零网络依赖；远程服务选「SSE」或「Streamable HTTP」类型，填服务地址 URL 即可生成带 type/url 字段的配置，部分服务还需要请求头（headers），适合团队共享的集中部署。',
    },
    {
      q: '自定义命令的参数带空格怎么办？',
      a: '用双引号把含空格的路径或参数整段包起来，例如 npx -y some-server "D:\\My Docs\\data"，生成 JSON 时引号内的内容会作为一个完整参数保留，Windows 路径不会被空格截断。',
    },
  ],
});
