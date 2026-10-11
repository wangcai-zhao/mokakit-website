import { useState } from 'preact/hooks';

interface Server {
  name: string;
  url: string;
  desc: string;
  cat: string;
}

const SERVERS: Server[] = [
  { name: 'Model Context Protocol (官方)', url: 'https://github.com/modelcontextprotocol', desc: 'MCP 协议规范与参考实现', cat: '官方' },
  { name: 'MCP TypeScript SDK', url: 'https://github.com/modelcontextprotocol/typescript-sdk', desc: '官方 TS SDK，写 Server 首选', cat: '官方' },
  { name: 'MCP Python SDK', url: 'https://github.com/modelcontextprotocol/python-sdk', desc: '官方 Python SDK', cat: '官方' },
  { name: 'MokaKit MCP', url: 'https://www.mokakit.com/mcp', desc: '本站中国本土计算工具接入', cat: '官方' },
  { name: 'Postgres MCP', url: 'https://github.com/modelcontextprotocol/servers', desc: '只读查询、写入、迁移数据库', cat: '数据库' },
  { name: 'SQLite MCP', url: 'https://github.com/modelcontextprotocol/servers', desc: '本地 SQLite 读写', cat: '数据库' },
  { name: 'Supabase MCP', url: 'https://supabase.com/docs/guides/ai/mcp-server', desc: 'Supabase 项目管理与查询', cat: '数据库' },
  { name: 'MongoDB MCP', url: 'https://www.mongodb.com/products/mongodb-ai/mcp-server', desc: 'MongoDB 聚合与查询', cat: '数据库' },
  { name: 'Google Drive MCP', url: 'https://github.com/modelcontextprotocol/servers', desc: 'Google 云端硬盘读写', cat: '云服务' },
  { name: 'GitHub MCP', url: 'https://github.com/github/github-mcp-server', desc: '仓库、Issue、PR 操作', cat: '开发' },
  { name: 'GitLab MCP', url: 'https://gitlab.com/gitlab-org/modelops/applied-ai/mcp', desc: 'GitLab 项目自动化', cat: '开发' },
  { name: 'Filesystem MCP', url: 'https://github.com/modelcontextprotocol/servers', desc: '受控目录的文件读写', cat: '开发' },
  { name: 'Fetch MCP', url: 'https://github.com/modelcontextprotocol/servers', desc: '抓取网页并转成 Markdown', cat: '开发' },
  { name: 'Puppeteer MCP', url: 'https://github.com/modelcontextprotocol/servers', desc: '浏览器自动化与截图', cat: '开发' },
  { name: 'Slack MCP', url: 'https://github.com/modelcontextprotocol/servers', desc: 'Slack 消息收发', cat: '协作' },
  { name: 'Notion MCP', url: 'https://github.com/makenotion/mcp-servers', desc: 'Notion 页面读写', cat: '协作' },
  { name: 'Sentry MCP', url: 'https://github.com/getsentry/sentry-mcp', desc: '错误监控与 issue 查询', cat: '开发' },
  { name: 'Brave Search MCP', url: 'https://github.com/modelcontextprotocol/servers', desc: '联网搜索（Brave）', cat: '云服务' },
];

const CATS = ['全部', ...Array.from(new Set(SERVERS.map((s) => s.cat)))];

export default function McpServerDirectory() {
  const [cat, setCat] = useState('全部');
  const [q, setQ] = useState('');

  const list = SERVERS.filter((s) => (cat === '全部' || s.cat === cat) && (s.name + s.desc).toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div class="space-y-3">
      <div class="flex flex-wrap gap-2 items-center">
        <input
          class="input input-sm input-bordered flex-1 min-w-40"
          placeholder="搜索 Server…"
          value={q}
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        />
        <div class="flex flex-wrap gap-1">
          {CATS.map((c) => (
            <button class={`btn btn-xs ${cat === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {list.map((s) => (
          <a class="card bg-base-200 p-3 space-y-1 hover:bg-base-300 transition-colors" href={s.url} target="_blank" rel="nofollow noopener">
            <div class="flex items-center justify-between">
              <div class="font-medium text-sm">{s.name}</div>
              <span class="badge badge-ghost badge-xs">{s.cat}</span>
            </div>
            <div class="text-xs opacity-70">{s.desc}</div>
          </a>
        ))}
      </div>
      {list.length === 0 && <div class="text-center text-xs opacity-60">没有匹配的 Server。</div>}
      <p class="text-xs opacity-60">收录各维度代表项，生态更新极快；实际运行请自行审阅代码与权限。</p>
    </div>
  );
}
