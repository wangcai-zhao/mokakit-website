import { useState, useMemo } from 'preact/hooks';

interface Port {
  port: number;
  proto: string;
  name: string;
  desc: string;
}

const PORTS: Port[] = [
  { port: 20, proto: 'TCP', name: 'FTP 数据', desc: '文件传输协议数据通道' },
  { port: 21, proto: 'TCP', name: 'FTP 控制', desc: 'FTP 命令控制端口' },
  { port: 22, proto: 'TCP', name: 'SSH', desc: '安全远程登录 / SCP / Git' },
  { port: 23, proto: 'TCP', name: 'Telnet', desc: '明文远程终端（不安全，勿公网暴露）' },
  { port: 25, proto: 'TCP', name: 'SMTP', desc: '邮件发送（服务器间）' },
  { port: 53, proto: 'TCP/UDP', name: 'DNS', desc: '域名解析（UDP 查询 / TCP 区域传送）' },
  { port: 80, proto: 'TCP', name: 'HTTP', desc: '明文网页，建议 301 到 HTTPS' },
  { port: 110, proto: 'TCP', name: 'POP3', desc: '邮件接收' },
  { port: 123, proto: 'UDP', name: 'NTP', desc: '网络时间同步' },
  { port: 143, proto: 'TCP', name: 'IMAP', desc: '邮件接收（含文件夹）' },
  { port: 443, proto: 'TCP', name: 'HTTPS', desc: '加密网页（TLS）' },
  { port: 465, proto: 'TCP', name: 'SMTPS', desc: '加密邮件发送' },
  { port: 587, proto: 'TCP', name: 'SMTP 提交', desc: '客户端发信（STARTTLS）' },
  { port: 3306, proto: 'TCP', name: 'MySQL', desc: 'MySQL 数据库' },
  { port: 5432, proto: 'TCP', name: 'PostgreSQL', desc: 'PostgreSQL 数据库' },
  { port: 6379, proto: 'TCP', name: 'Redis', desc: 'Redis 缓存/数据库' },
  { port: 11211, proto: 'TCP', name: 'Memcached', desc: '内存缓存' },
  { port: 27017, proto: 'TCP', name: 'MongoDB', desc: 'MongoDB 数据库' },
  { port: 8080, proto: 'TCP', name: 'HTTP 备用', desc: '开发/代理常用（Tomcat、代理）' },
  { port: 8443, proto: 'TCP', name: 'HTTPS 备用', desc: '开发环境加密端口' },
  { port: 9000, proto: 'TCP', name: '多用途', desc: 'SonarQube / 容器 / 开发端口' },
  { port: 9200, proto: 'TCP', name: 'Elasticsearch', desc: 'ES HTTP 接口' },
  { port: 6379, proto: 'TCP', name: 'Redis', desc: 'Redis' },
  { port: 1883, proto: 'TCP', name: 'MQTT', desc: '物联网消息（明文）' },
  { port: 8883, proto: 'TCP', name: 'MQTTS', desc: '加密 MQTT' },
  { port: 5000, proto: 'TCP', name: 'Flask 默认', desc: 'Python 开发服务器' },
  { port: 3000, proto: 'TCP', name: 'Node 开发', desc: 'React/Next/Vite 开发服务器' },
  { port: 8000, proto: 'TCP', name: '多用途', desc: 'Django / 开发 / 本地服务' },
  { port: 9090, proto: 'TCP', name: '监控面板', desc: 'Prometheus / 各类 admin' },
  { port: 5672, proto: 'TCP', name: 'AMQP', desc: 'RabbitMQ 消息队列' },
  { port: 15672, proto: 'TCP', name: 'RabbitMQ 管理', desc: 'RabbitMQ 管理后台' },
  { port: 6379, proto: 'TCP', name: 'Redis', desc: 'Redis' },
];

export default function PortLookupTool() {
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s === '') return PORTS;
    return PORTS.filter(
      (p) =>
        String(p.port).includes(s) ||
        p.name.toLowerCase().includes(s) ||
        p.desc.toLowerCase().includes(s) ||
        p.proto.toLowerCase().includes(s),
    );
  }, [q]);

  return (
    <div class="space-y-4">
      <input
        type="text"
        class="input input-bordered input-sm w-full"
        placeholder="搜索端口号、名称或用途，如 443 / redis / 数据库"
        value={q}
        onInput={(e) => setQ((e.target as HTMLInputElement).value)}
      />
      <div class="overflow-x-auto rounded-xl border border-base-300">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-base-200 opacity-80">
              <th class="px-3 py-2 text-left font-normal">端口</th>
              <th class="px-3 py-2 text-left font-normal">协议</th>
              <th class="px-3 py-2 text-left font-normal">名称</th>
              <th class="px-3 py-2 text-left font-normal">用途</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p, i) => (
              <tr class={`border-t border-base-300 ${i % 2 ? 'bg-base-100' : ''}`}>
                <td class="px-3 py-2 font-mono">{p.port}</td>
                <td class="px-3 py-2">{p.proto}</td>
                <td class="px-3 py-2 font-medium">{p.name}</td>
                <td class="px-3 py-2 opacity-70">{p.desc}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={4} class="px-3 py-6 text-center opacity-60">
                  没有匹配的端口，换个关键词试试
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        收录常见服务端口，数据本地内置。端口范围 0–65535，0–1023 为知名端口（需特权）。排查占用请用系统命令（如
        lsof -i :端口）。
      </p>
    </div>
  );
}
