import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type FieldDef = { key: string; label: string; placeholder?: string; default: string };
type PresetId =
  | 'filesystem'
  | 'github'
  | 'fetch'
  | 'puppeteer'
  | 'sequentialthinking'
  | 'notion'
  | 'postgres'
  | 'slack'
  | 'brave'
  | 'gdrive'
  | 'memory'
  | 'time'
  | 'custom';

interface PresetDef {
  id: PresetId;
  label: string;
  fields: FieldDef[];
  build: (f: Record<string, string>) => {
    command: string;
    args: string[];
    env?: Record<string, string>;
  };
}

function parseArgs(s: string): string[] {
  if (!s.trim()) return [];
  return s
    .split(/[\s,]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseEnv(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  s.split('\n').forEach((line) => {
    const i = line.indexOf('=');
    if (i > 0) {
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim();
      if (k) out[k] = v;
    }
  });
  return out;
}

const PRESETS: PresetDef[] = [
  {
    id: 'filesystem',
    label: '文件系统（filesystem）',
    fields: [{ key: 'dir', label: '授权目录路径', default: '/path/to/dir' }],
    build: (f) => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', f.dir || '/path/to/dir'],
    }),
  },
  {
    id: 'github',
    label: 'GitHub',
    fields: [{ key: 'token', label: 'GitHub Token', default: 'ghp_xxx' }],
    build: (f) => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_TOKEN: f.token || 'ghp_xxx' },
    }),
  },
  {
    id: 'fetch',
    label: 'Fetch（mcp-server-fetch）',
    fields: [],
    build: () => ({ command: 'uvx', args: ['mcp-server-fetch'] }),
  },
  {
    id: 'puppeteer',
    label: 'Puppeteer',
    fields: [],
    build: () => ({ command: 'npx', args: ['-y', '@modelcontextprotocol/server-puppeteer'] }),
  },
  {
    id: 'sequentialthinking',
    label: 'Sequential Thinking（思维链）',
    fields: [],
    build: () => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    }),
  },
  {
    id: 'notion',
    label: 'Notion',
    fields: [{ key: 'token', label: 'Notion Token', default: 'ntn_xxx' }],
    build: (f) => ({
      command: 'npx',
      args: ['-y', '@notionhq/notion-mcp-server'],
      env: {
        OPENAPI_MCP_HEADERS:
          '{"Authorization":"Bearer ' +
          (f.token || 'ntn_xxx') +
          '","Notion-Version":"2022-06-28"}',
      },
    }),
  },
  {
    id: 'postgres',
    label: 'PostgreSQL',
    fields: [
      { key: 'conn', label: '连接串', default: 'postgresql://user:pass@localhost:5432/db' },
    ],
    build: (f) => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres', f.conn || 'postgresql://user:pass@localhost:5432/db'],
    }),
  },
  {
    id: 'slack',
    label: 'Slack',
    fields: [
      { key: 'bot', label: 'SLACK_BOT_TOKEN', default: 'xoxb-xxx' },
      { key: 'team', label: 'SLACK_TEAM_ID', default: 'T0XXXX' },
    ],
    build: (f) => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-slack'],
      env: { SLACK_BOT_TOKEN: f.bot || 'xoxb-xxx', SLACK_TEAM_ID: f.team || 'T0XXXX' },
    }),
  },
  {
    id: 'brave',
    label: 'Brave 搜索',
    fields: [{ key: 'key', label: 'BRAVE_API_KEY', default: 'BSAxxx' }],
    build: (f) => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-brave-search'],
      env: { BRAVE_API_KEY: f.key || 'BSAxxx' },
    }),
  },
  {
    id: 'gdrive',
    label: 'Google Drive',
    fields: [],
    build: () => ({ command: 'npx', args: ['-y', '@modelcontextprotocol/server-gdrive'] }),
  },
  {
    id: 'memory',
    label: 'Memory（记忆）',
    fields: [],
    build: () => ({ command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'] }),
  },
  {
    id: 'time',
    label: 'Time（时间）',
    fields: [],
    build: () => ({ command: 'uvx', args: ['mcp-server-time'] }),
  },
  {
    id: 'custom',
    label: '自定义 stdio',
    fields: [
      { key: 'name', label: '服务名（key）', default: 'my-server' },
      { key: 'command', label: '启动命令', default: 'npx' },
      { key: 'args', label: '参数（空格或逗号分隔）', default: '' },
      { key: 'env', label: '环境变量（每行 KEY=VALUE）', default: '' },
    ],
    build: (f) => {
      const cfg: { command: string; args: string[]; env?: Record<string, string> } = {
        command: f.command || 'npx',
        args: parseArgs(f.args || ''),
      };
      const env = parseEnv(f.env || '');
      if (Object.keys(env).length) cfg.env = env;
      return cfg;
    },
  },
];

interface ServerRow {
  id: string;
  preset: PresetId;
  key: string;
  fields: Record<string, string>;
}

function defaultFields(preset: PresetId): Record<string, string> {
  const def = PRESETS.find((p) => p.id === preset)!;
  const out: Record<string, string> = {};
  def.fields.forEach((f) => (out[f.key] = f.default));
  return out;
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function McpConfigGenerator() {
  const [servers, setServers] = useState<ServerRow[]>([
    { id: newId(), preset: 'filesystem', key: 'filesystem', fields: defaultFields('filesystem') },
  ]);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const output = useMemo(() => {
    const mcp: Record<string, any> = {};
    for (const s of servers) {
      const def = PRESETS.find((p) => p.id === s.preset)!;
      const cfg = def.build(s.fields);
      const key = s.key.trim() || s.preset;
      mcp[key] = cfg;
    }
    return JSON.stringify({ mcpServers: mcp }, null, 2);
  }, [servers]);

  const addServer = () => {
    setServers((prev) => [
      ...prev,
      { id: newId(), preset: 'fetch', key: 'fetch', fields: defaultFields('fetch') },
    ]);
  };

  const removeServer = (id: string) =>
    setServers((prev) => prev.filter((s) => s.id !== id));

  const setPreset = (id: string, preset: PresetId) => {
    setServers((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, preset, key: preset, fields: defaultFields(preset) } : s
      )
    );
  };

  const setRowKey = (id: string, key: string) =>
    setServers((prev) => prev.map((s) => (s.id === id ? { ...s, key } : s)));

  const setField = (id: string, k: string, v: string) =>
    setServers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, fields: { ...s.fields, [k]: v } } : s))
    );

  const copy = async () => {
      await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mcp.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-3">
        <p class="text-xs opacity-60">
          可添加多个 MCP 服务，自动组合成一个完整的 <code>mcp.json</code>。
        </p>

        {servers.map((s, idx) => {
          const def = PRESETS.find((p) => p.id === s.preset)!;
          return (
            <div class="rounded-xl border border-base-300 p-3 space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <input
                  class="input input-bordered input-sm w-28 font-mono"
                  value={s.key}
                  placeholder="服务名"
                  onInput={(e) => setRowKey(s.id, (e.target as HTMLInputElement).value)}
                />
                <select
                  class="select select-bordered select-sm"
                  value={s.preset}
                  onChange={(e) =>
                    setPreset(s.id, (e.target as HTMLSelectElement).value as PresetId)
                  }
                >
                  {PRESETS.map((p) => (
                    <option value={p.id}>{p.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost text-error ml-auto"
                  onClick={() => removeServer(s.id)}
                  disabled={servers.length === 1}
                >
                  删除
                </button>
              </div>
              {def.fields.map((fld) => (
                <div key={fld.key}>
                  <label class="text-xs opacity-60">{fld.label}</label>
                  {fld.key === 'env' ? (
                    <textarea
                      class="textarea textarea-bordered w-full h-16 font-mono text-xs"
                      value={s.fields[fld.key] || ''}
                      placeholder={fld.placeholder}
                      onInput={(e) =>
                        setField(s.id, fld.key, (e.target as HTMLTextAreaElement).value)
                      }
                    />
                  ) : fld.key === 'args' ? (
                    <input
                      class="input input-bordered w-full font-mono text-sm"
                      value={s.fields[fld.key] || ''}
                      placeholder={fld.placeholder}
                      onInput={(e) =>
                        setField(s.id, fld.key, (e.target as HTMLInputElement).value)
                      }
                    />
                  ) : (
                    <input
                      class="input input-bordered w-full font-mono text-sm"
                      value={s.fields[fld.key] || ''}
                      placeholder={fld.placeholder}
                      onInput={(e) =>
                        setField(s.id, fld.key, (e.target as HTMLInputElement).value)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })}

        <button type="button" class="btn btn-sm btn-outline w-full" onClick={addServer}>
          + 添加 MCP 服务
        </button>

        <p class="text-xs opacity-55 leading-relaxed">
          预置服务来自 Model Context Protocol 官方与社区仓库；远程 HTTP/SSE 类型可生成后手动加
          <code> url </code> 字段。
        </p>
      </div>

      <div>
        <label class="text-sm font-medium mb-1 block">生成的 mcp.json</label>
        <textarea
          class="textarea textarea-bordered w-full h-[28rem] font-mono text-xs"
          value={output}
          readOnly
        />
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            class={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
            onClick={copy}
          >
            {copied ? '已复制' : '复制'}
          </button>
          <button type="button" class="btn btn-sm btn-ghost" onClick={download}>
            下载 mcp.json
          </button>
        </div>
        <p class="mt-2 text-xs opacity-55 leading-relaxed">
          合并进 <code>~/.workbuddy/mcp.json</code> 的 <code>mcpServers</code> 字段即可生效。
        </p>
      </div>
    </div>
  );
}
