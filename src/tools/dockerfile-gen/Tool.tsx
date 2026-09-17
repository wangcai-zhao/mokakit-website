import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Stack = 'node' | 'python' | 'go' | 'java' | 'static';

const STACKS: { key: Stack; label: string }[] = [
  { key: 'node', label: 'Node.js' },
  { key: 'python', label: 'Python' },
  { key: 'go', label: 'Go' },
  { key: 'java', label: 'Java' },
  { key: 'static', label: '静态站点（Nginx）' },
];

export default function DockerfileGenTool() {
  const [stack, setStack] = useState<Stack>('node');
  const [base, setBase] = useState('node:22-alpine');
  const [workdir, setWorkdir] = useState('/app');
  const [port, setPort] = useState(3000);
  const [entry, setEntry] = useState('npm start');
  const [multistage, setMultistage] = useState(true);
  const [nonroot, setNonroot] = useState(true);
  const [pm2, setPm2] = useState(false);
  const [copied, setCopied] = useState(false);

  const images: Record<Stack, string[]> = {
    node: ['node:22-alpine', 'node:20-alpine', 'node:22-slim', 'node:18-alpine'],
    python: ['python:3.13-slim', 'python:3.12-slim', 'python:3.11-alpine'],
    go: ['golang:1.24-alpine', 'golang:1.23-alpine'],
    java: ['eclipse-temurin:21-jre-alpine', 'eclipse-temurin:17-jre-alpine'],
    static: ['nginx:1.27-alpine', 'nginx:stable-alpine'],
  };

  const dockerfile = useMemo(() => {
    const L: string[] = [];
    const add = (s: string) => L.push(s);
    const blank = () => L.push('');

    if (stack === 'go' && multistage) {
      add('# ---- 构建阶段 ----');
      add(`FROM golang:1.24-alpine AS builder`);
      add(`WORKDIR ${workdir}`);
      add('COPY go.mod go.sum ./');
      add('RUN go mod download');
      add('COPY . .');
      add('RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server');
      blank();
      add('# ---- 运行阶段 ----');
      add('FROM alpine:3.21');
      add('RUN apk add --no-cache ca-certificates tzdata');
      add(`WORKDIR ${workdir}`);
      add('COPY --from=builder /app/server ./server');
      if (nonroot) {
        add('RUN addgroup -S app && adduser -S app -G app');
        add('USER app');
      }
      add(`EXPOSE ${port}`);
      add('CMD ["./server"]');
      return L.join('\n');
    }

    if (stack === 'java' && multistage) {
      add('# ---- 构建阶段 ----');
      add('FROM maven:3.9-eclipse-temurin-21 AS builder');
      add(`WORKDIR ${workdir}`);
      add('COPY pom.xml ./');
      add('COPY src ./src');
      add('RUN mvn -q -DskipTests package');
      blank();
      add('# ---- 运行阶段 ----');
      add(`FROM ${base}`);
      add(`WORKDIR ${workdir}`);
      add('COPY --from=builder /app/target/*.jar app.jar');
      if (nonroot) add('USER 10001');
      add(`EXPOSE ${port}`);
      add('ENTRYPOINT ["java","-jar","/app/app.jar"]');
      return L.join('\n');
    }

    add(`FROM ${base}`);
    blank();
    add(`WORKDIR ${workdir}`);
    blank();

    if (stack === 'node') {
      add('# 先装依赖，利用 Docker 层缓存');
      add('COPY package*.json ./');
      add('RUN npm ci --omit=dev || npm install --omit=dev');
      if (pm2) add('RUN npm install -g pm2');
      blank();
      add('COPY . .');
      blank();
      if (nonroot) {
        add('RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app');
        add('USER app');
        blank();
      }
      add(`EXPOSE ${port}`);
      add(pm2 ? `CMD ["pm2-runtime","start","${entry}"]` : `CMD ${JSON.stringify(entry.split(' '))}`);
      return L.join('\n');
    }

    if (stack === 'python') {
      add('ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1');
      add('COPY requirements.txt ./');
      add('RUN pip install --no-cache-dir -r requirements.txt');
      blank();
      add('COPY . .');
      blank();
      if (nonroot) {
        add('RUN useradd -m app && chown -R app:app /app');
        add('USER app');
        blank();
      }
      add(`EXPOSE ${port}`);
      add(`CMD ${JSON.stringify(entry.split(' '))}`);
      return L.join('\n');
    }

    if (stack === 'go') {
      add('COPY go.mod go.sum ./');
      add('RUN go mod download');
      add('COPY . .');
      add('RUN CGO_ENABLED=0 go build -o server .');
      if (nonroot) {
        add('RUN addgroup -S app && adduser -S app -G app');
        add('USER app');
      }
      add(`EXPOSE ${port}`);
      add('CMD ["./server"]');
      return L.join('\n');
    }

    if (stack === 'java') {
      add('COPY target/*.jar app.jar');
      if (nonroot) add('USER 10001');
      add(`EXPOSE ${port}`);
      add('ENTRYPOINT ["java","-jar","/app/app.jar"]');
      return L.join('\n');
    }

    // static
    add('COPY dist/ /usr/share/nginx/html/');
    add('COPY nginx.conf /etc/nginx/conf.d/default.conf');
    add(`EXPOSE ${port || 80}`);
    add('CMD ["nginx","-g","daemon off;"]');
    return L.join('\n');
  }, [stack, base, workdir, port, entry, multistage, nonroot, pm2]);

  const dockerignore = `node_modules
.git
.gitignore
dist
*.log
.env
.DS_Store
__pycache__
target`;

  return (
    <div class="space-y-4">
      <div>
        <span class="text-sm font-medium">技术栈</span>
        <div class="mt-2 flex flex-wrap gap-2">
          {STACKS.map((s) => (
            <button
              type="button"
              key={s.key}
              class={`btn btn-sm ${stack === s.key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setStack(s.key);
                setBase(images[s.key][0]);
                setPort(s.key === 'static' ? 80 : 3000);
                setEntry(
                  s.key === 'node'
                    ? 'npm start'
                    : s.key === 'python'
                      ? 'python app.py'
                      : s.key === 'java'
                        ? 'java -jar app.jar'
                        : 'nginx -g daemon off;',
                );
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">基础镜像</span>
          <input
            type="text"
            class="input input-bordered mt-1.5 w-full font-mono text-sm"
            value={base}
            onInput={(e) => setBase((e.target as HTMLInputElement).value)}
          />
          <span class="mt-1 block text-xs opacity-50">
            常用：{images[stack].join(' / ')}
          </span>
        </label>
        <label class="block">
          <span class="text-sm font-medium">工作目录</span>
          <input
            type="text"
            class="input input-bordered mt-1.5 w-full font-mono text-sm"
            value={workdir}
            onInput={(e) => setWorkdir((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">暴露端口</span>
          <input
            type="number"
            class="input input-bordered mt-1.5 w-full font-mono"
            value={port}
            onInput={(e) => setPort(Number((e.target as HTMLInputElement).value) || 80)}
          />
        </label>
        {stack !== 'static' && (
          <label class="block">
            <span class="text-sm font-medium">启动命令</span>
            <input
              type="text"
              class="input input-bordered mt-1.5 w-full font-mono text-sm"
              value={entry}
              onInput={(e) => setEntry((e.target as HTMLInputElement).value)}
            />
          </label>
        )}
      </div>

      <div class="flex flex-wrap gap-4 rounded-xl bg-base-200 px-4 py-3">
        {(stack === 'go' || stack === 'java') && (
          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              checked={multistage}
              onChange={(e) => setMultistage((e.target as HTMLInputElement).checked)}
            />
            多阶段构建（镜像更小）
          </label>
        )}
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={nonroot}
            onChange={(e) => setNonroot((e.target as HTMLInputElement).checked)}
          />
            用非 root 用户运行
          </label>
        {stack === 'node' && (
          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              checked={pm2}
              onChange={(e) => setPm2((e.target as HTMLInputElement).checked)}
            />
            用 pm2 托管进程
          </label>
        )}
      </div>

      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">Dockerfile</span>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
            onClick={async () => {
              await copyText(dockerfile);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            }}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="max-h-96 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-xs leading-relaxed whitespace-pre">
          {dockerfile}
        </pre>
      </label>

      <label class="block">
        <span class="text-sm font-medium">配套 .dockerignore</span>
        <pre class="mt-1.5 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-xs">
          {dockerignore}
        </pre>
      </label>

      <p class="text-xs leading-relaxed opacity-55">
        先复制清单文件（package.json / requirements.txt）再装依赖，改代码时才能命中 Docker
        层缓存，不用每次重装依赖。非 root 运行是生产环境的基本要求，能挡掉一大类容器逃逸风险。
      </p>
    </div>
  );
}
