import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'mcp-tool-generator',
  name: 'MCP 工具定义生成器',
  tagline: '写出合规的 MCP 工具',
  description:
    '免费在线 MCP 工具定义生成器：按行填写工具名、描述与参数（名称、类型、必填），一键生成符合 Model Context Protocol 的 tool 定义 JSON（含 inputSchema），方便你给自己的 MCP Server 增工具，本地生成不上传。',
  keywords: ["MCP","工具定义","Model Context Protocol","inputSchema","MCP Server"],
  category: 'ai',
  tags: ["mcp","工具定义","json-schema","协议","智能体"],
  icon: 'plug',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-11',
  updatedAt: '2026-10-11',
  priority: 8,
  faq: [
    {
      q: '和函数调用生成器区别？',
      a: '语义接近，但本工具输出严格遵循 MCP 的 tool / inputSchema 结构，可直接被支持 MCP 的客户端识别。',
    },
    {
      q: '支持嵌套对象吗？',
      a: '支持 object / array 类型，可描述较复杂的入参。',
    },
    {
      q: '会上传吗？',
      a: '不会，本地生成。',
    },
  ],
});
