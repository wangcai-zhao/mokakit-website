import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const EXAMPLE = {
  name: 'pdf-summarizer',
  desc: '提取 PDF 核心内容并生成结构化摘要',
  triggers: '总结这份 PDF\n提取合同要点\n把报告压缩成摘要',
  params: 'path: 待摘要的 PDF 路径（必填）\nlang: 输出语言，默认中文',
  body: `1. 读取用户提供的 PDF 路径或上传内容。
2. 调用解析工具提取全文文本。
3. 按「目的 / 结论 / 关键数据 / 待办」四段式输出摘要。
4. 内容过长时，先给执行摘要，再给分节细节。`,
  examples: '用户：总结这份年报\n助手：（输出四段式结构化摘要）',
  notes: '仅处理用户明确授权的文件；敏感内容需脱敏后再摘要。',
  deps: '需要文件系统读取权限与 PDF 解析工具（如 pdftotext）。',
};

function parseFrontmatter(md: string): { fm: Record<string, string>; body: string } {
  const m = md.match(/^---\s*\n([\s\S]*?)\n---/);
  const fm: Record<string, string> = {};
  let body = md;
  if (m) {
    m[1].split('\n').forEach((line) => {
      const i = line.indexOf(':');
      if (i > 0) {
        const k = line.slice(0, i).trim();
        const v = line.slice(i + 1).trim();
        if (k) fm[k] = v;
      }
    });
    body = md.slice(m[0].length);
  }
  return { fm, body };
}

function parseSections(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  const parts = body.split(/^##\s+/m);
  for (const seg of parts.slice(1)) {
    const nl = seg.indexOf('\n');
    const title = (nl >= 0 ? seg.slice(0, nl) : seg).trim();
    const content = (nl >= 0 ? seg.slice(nl + 1) : '').trim();
    if (title) out[title] = content;
  }
  return out;
}

export default function SkillGenerator() {
  const [name, setName] = useState(EXAMPLE.name);
  const [desc, setDesc] = useState(EXAMPLE.desc);
  const [triggers, setTriggers] = useState(EXAMPLE.triggers);
  const [params, setParams] = useState(EXAMPLE.params);
  const [body, setBody] = useState(EXAMPLE.body);
  const [examples, setExamples] = useState(EXAMPLE.examples);
  const [notes, setNotes] = useState(EXAMPLE.notes);
  const [deps, setDeps] = useState(EXAMPLE.deps);
  const [copied, setCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const timer = useRef<number | undefined>(undefined);

  const output = useMemo(() => {
    const name_ = name.trim() || 'my-skill';
    const desc_ = desc.trim() || '描述这个技能的用途';
    const trigLines = triggers
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);
    const sections: [string, string][] = [];
    if (trigLines.length)
      sections.push(['触发场景', trigLines.map((t) => `- ${t}`).join('\n')]);
    if (params.trim()) sections.push(['参数', params.trim()]);
    if (body.trim()) sections.push(['详细步骤', body.trim()]);
    if (examples.trim()) sections.push(['示例', examples.trim()]);
    if (notes.trim()) sections.push(['注意事项', notes.trim()]);
    if (deps.trim()) sections.push(['依赖', deps.trim()]);
    const sectionText = sections.map(([t, c]) => `## ${t}\n${c}`).join('\n\n');
    return `---\nname: ${name_}\ndescription: ${desc_}\n---\n\n# ${name_}\n\n${desc_}\n\n${sectionText}\n`;
  }, [name, desc, triggers, params, body, examples, notes, deps]);

  const copy = async () => {
      await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SKILL.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importMd = (md: string) => {
    const { fm, body } = parseFrontmatter(md);
    const secs = parseSections(body);
    const h = body.match(/^#\s+(.+)$/m);
    const strip = (s: string) =>
      s
        .split('\n')
        .map((l) => l.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, ''))
        .join('\n')
        .trim();
    setName(fm.name || (h ? h[1].trim() : '') || 'my-skill');
    setDesc(fm.description || '');
    setTriggers(secs['触发场景'] ? strip(secs['触发场景']) : '');
    setParams(secs['参数'] || '');
    setBody(secs['详细步骤'] || secs['步骤'] || '');
    setExamples(secs['示例'] || secs['Examples'] || '');
    setNotes(secs['注意事项'] || secs['限制'] || '');
    setDeps(secs['依赖'] || secs['Dependencies'] || '');
    setImportText('');
    setImportOpen(false);
  };

  return (
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-3">
        {importOpen && (
          <div class="rounded-xl border border-base-300 p-3 space-y-2">
            <textarea
              class="textarea textarea-bordered w-full h-28 font-mono text-xs"
              placeholder="粘贴已有的 SKILL.md 内容，点击解析后会自动回填下方表单……"
              value={importText}
              onInput={(e) => setImportText((e.target as HTMLTextAreaElement).value)}
            />
            <div class="flex gap-2">
              <button
                type="button"
                class="btn btn-primary btn-xs"
                onClick={() => importMd(importText)}
              >
                解析并填入
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                onClick={() => {
                  setImportOpen(false);
                  setImportText('');
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium" for="sk-name">
              技能名称（name）
            </label>
            <input
              id="sk-name"
              class="input input-bordered mt-1 w-full font-mono text-sm"
              value={name}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
              placeholder="pdf-summarizer"
            />
          </div>
          <div>
            <label class="text-sm font-medium" for="sk-desc">
              一句话简介（description）
            </label>
            <input
              id="sk-desc"
              class="input input-bordered mt-1 w-full text-sm"
              value={desc}
              onInput={(e) => setDesc((e.target as HTMLInputElement).value)}
              placeholder="这个技能做什么、什么情况下用"
            />
          </div>
        </div>

        <div>
          <label class="text-sm font-medium" for="sk-trig">
            触发场景（每行一个）
          </label>
          <textarea
            id="sk-trig"
            class="textarea textarea-bordered mt-1 w-full h-20 text-sm"
            value={triggers}
            onInput={(e) =>
              setTriggers((e.target as HTMLTextAreaElement).value)
            }
            placeholder={'用户问到……时使用\n例如：总结这份 PDF'}
          />
        </div>

        <div>
          <label class="text-sm font-medium" for="sk-params">
            参数（可选）
          </label>
          <textarea
            id="sk-params"
            class="textarea textarea-bordered mt-1 w-full h-20 font-mono text-xs"
            value={params}
            onInput={(e) => setParams((e.target as HTMLTextAreaElement).value)}
            placeholder={'path: 待处理的文件路径（必填）\nlang: 输出语言，默认 zh'}
          />
        </div>

        <div>
          <label class="text-sm font-medium" for="sk-body">
            详细步骤 / 正文
          </label>
          <textarea
            id="sk-body"
            class="textarea textarea-bordered mt-1 w-full h-32 text-sm"
            value={body}
            onInput={(e) => setBody((e.target as HTMLTextAreaElement).value)}
          />
        </div>

        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium" for="sk-ex">
              示例（可选）
            </label>
            <textarea
              id="sk-ex"
              class="textarea textarea-bordered mt-1 w-full h-20 text-sm"
              value={examples}
              onInput={(e) => setExamples((e.target as HTMLTextAreaElement).value)}
            />
          </div>
          <div>
            <label class="text-sm font-medium" for="sk-note">
              注意事项（可选）
            </label>
            <textarea
              id="sk-note"
              class="textarea textarea-bordered mt-1 w-full h-20 text-sm"
              value={notes}
              onInput={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
            />
          </div>
        </div>

        <div>
          <label class="text-sm font-medium" for="sk-dep">
            依赖（可选）
          </label>
          <textarea
            id="sk-dep"
            class="textarea textarea-bordered mt-1 w-full h-16 text-sm"
            value={deps}
            onInput={(e) => setDeps((e.target as HTMLTextAreaElement).value)}
            placeholder="需要的工具 / 权限 / 运行环境"
          />
        </div>
      </div>

      <div>
        <label class="text-sm font-medium mb-1 block">生成的 SKILL.md</label>
        <textarea
          class="textarea textarea-bordered w-full h-80 font-mono text-xs"
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
            下载 SKILL.md
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline"
            onClick={() => setImportOpen((v) => !v)}
          >
            导入已有 SKILL.md
          </button>
        </div>
        <p class="mt-2 text-xs opacity-55 leading-relaxed">
          放入 <code>~/.workbuddy/skills/&lt;技能名&gt;/SKILL.md</code>（用户级）或
          项目 <code>.workbuddy/skills/</code> 目录即可被 WorkBuddy 自动发现。
        </p>
      </div>
    </div>
  );
}
