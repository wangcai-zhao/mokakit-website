import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

interface MyTpl {
  name: string;
  tpl: string;
  vars: string;
}
const MY_KEY = 'mokakit_ptemplates';

const PRESETS: { label: string; tpl: string; vars: string }[] = [
  {
    label: '角色扮演',
    tpl: '你是一位{{role}}，请用{{tone}}的语气与用户交流。\n任务：{{task}}\n要求：{{req}}',
    vars: 'role=资深产品经理\ntone=专业且友好\ntask=帮我写一份项目周报\nreq=不超过 200 字，列出 3 个要点',
  },
  {
    label: '系统提示词',
    tpl: '你是{{role}}。\n你的职责：{{duty}}\n约束：{{rules}}\n回答语言：{{lang}}',
    vars: 'role=严谨的技术评审\nduty=审查代码并给出改进建议\nrules=不修改代码，只给建议；指出风险\nlang=中文',
  },
  {
    label: 'Few-shot 示例',
    tpl: '请按示例完成{{task}}。\n\n示例输入：{{eg_in}}\n示例输出：{{eg_out}}\n\n现在处理：{{input}}',
    vars: 'task=情感分类\neg_in=这家店服务真差\neg_out=负面\neg_in=物流很快很满意\neg_out=正面\ninput=味道一般但价格实惠',
  },
  {
    label: '翻译',
    tpl: '将下面内容翻译成{{target}}，保持原意与语气：\n\n{{text}}',
    vars: 'target=英文\ntext=今天天气真好，我们出去走走吧。',
  },
  {
    label: '代码审查',
    tpl: '请审查以下{{lang}}代码，重点关注 {{focus}}：\n\n```\n{{code}}\n```',
    vars: 'lang=TypeScript\nfocus=空值与异常处理\ncode=function divide(a,b){ return a/b }',
  },
  {
    label: 'SEO 文章',
    tpl: '写一篇关于{{topic}}的 SEO 文章，目标关键词：{{kw}}，字数约 {{words}} 字，语气 {{tone}}。',
    vars: 'topic=居家健身\nkw=居家健身计划\nwords=800\ntone=轻松易懂',
  },
];

const DEMO_TPL = PRESETS[0].tpl;
const DEMO_VARS = PRESETS[0].vars;

function parseVars(s: string): Record<string, string> {
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

export default function PromptTemplate() {
  const [tpl, setTpl] = useState(DEMO_TPL);
  const [vars, setVars] = useState(DEMO_VARS);
  const [copied, setCopied] = useState(false);
  const [presetSel, setPresetSel] = useState('');
  const [mySel, setMySel] = useState('');
  const [myTemplates, setMyTemplates] = useState<MyTpl[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState('');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MY_KEY);
      if (raw) setMyTemplates(JSON.parse(raw));
    } catch {
      /* 忽略 */
    }
  }, []);

  const out = useMemo(() => {
    const vmap = parseVars(vars);
    return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vmap ? vmap[k] : `{{${k}}}`));
  }, [tpl, vars]);

  const missing = useMemo(() => {
    const vmap = parseVars(vars);
    const used = new Set<string>();
    (tpl.match(/\{\{(\w+)\}\}/g) || []).forEach((m) => used.add(m.slice(2, -2)));
    return [...used].filter((k) => !(k in vmap) || vmap[k] === '');
  }, [tpl, vars]);

  const copy = async () => {
    if (!out) return;
    await copyText(out);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const persist = (list: MyTpl[]) => {
    setMyTemplates(list);
    try {
      localStorage.setItem(MY_KEY, JSON.stringify(list));
    } catch {
      /* 忽略 */
    }
  };

  const onPreset = (e: any) => {
    const i = (e.target as HTMLSelectElement).value;
    if (i === '') return;
    const p = PRESETS[+i];
    setTpl(p.tpl);
    setVars(p.vars);
    setPresetSel('');
  };

  const onMy = (e: any) => {
    const i = (e.target as HTMLSelectElement).value;
    if (i === '') return;
    const t = myTemplates[+i];
    setTpl(t.tpl);
    setVars(t.vars);
    setMySel('');
  };

  const saveCurrent = () => {
    const name = saveName.trim();
    if (!name) return;
    persist([...myTemplates, { name, tpl, vars }]);
    setSaveName('');
    setShowSave(false);
  };

  const deleteMy = (idx: number) => {
    persist(myTemplates.filter((_, i) => i !== idx));
  };

  return (
    <div class="space-y-3">
      <div class="flex flex-wrap gap-2 items-center">
        <select
          class="select select-bordered select-sm"
          value={presetSel}
          onChange={onPreset}
        >
          <option value="">载入内置预设…</option>
          {PRESETS.map((p, i) => (
            <option value={i}>{p.label}</option>
          ))}
        </select>
        <select
          class="select select-bordered select-sm"
          value={mySel}
          onChange={onMy}
        >
          <option value="">我的模板…</option>
          {myTemplates.map((t, i) => (
            <option value={i}>{t.name}</option>
          ))}
        </select>
        <button
          type="button"
          class="btn btn-sm btn-outline"
          onClick={() => setShowSave((v) => !v)}
        >
          保存当前为模板
        </button>
      </div>

      {showSave && (
        <div class="flex flex-wrap gap-2 items-center">
          <input
            class="input input-bordered input-sm flex-1 min-w-[160px]"
            placeholder="模板名称，例如：客服话术"
            value={saveName}
            onInput={(e) => setSaveName((e.target as HTMLInputElement).value)}
          />
          <button type="button" class="btn btn-sm btn-primary" onClick={saveCurrent}>
            确认保存
          </button>
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            onClick={() => {
              setShowSave(false);
              setSaveName('');
            }}
          >
            取消
          </button>
        </div>
      )}

      {myTemplates.length > 0 && (
        <div class="flex flex-wrap gap-1">
          {myTemplates.map((t, i) => (
            <span class="badge badge-outline gap-1">
              {t.name}
              <button
                type="button"
                class="text-error leading-none"
                title="删除该模板"
                onClick={() => deleteMy(i)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium" for="pt-tpl">
              模板（用 {'{{变量名}}'} 占位）
            </label>
            <textarea
              id="pt-tpl"
              class="textarea textarea-bordered mt-1 w-full h-44 font-mono text-sm"
              value={tpl}
              onInput={(e) => setTpl((e.target as HTMLTextAreaElement).value)}
            />
          </div>
          <div>
            <label class="text-sm font-medium" for="pt-vars">
              变量（每行 KEY=VALUE）
            </label>
            <textarea
              id="pt-vars"
              class="textarea textarea-bordered mt-1 w-full h-28 font-mono text-sm"
              value={vars}
              onInput={(e) => setVars((e.target as HTMLTextAreaElement).value)}
            />
          </div>
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">渲染结果</label>
          <textarea
            class="textarea textarea-bordered w-full h-44 font-mono text-sm"
            value={out}
            readOnly
          />
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              class={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
              onClick={copy}
            >
              {copied ? '已复制' : '复制结果'}
            </button>
            {missing.length > 0 && (
              <span class="text-xs text-warning">
                未替换：{missing.map((m) => `{{${m}}}`).join(' ')}
              </span>
            )}
          </div>
          <p class="mt-2 text-xs opacity-55 leading-relaxed">
            支持中英文变量名；未提供值的占位符会原样保留，方便你检查遗漏。
          </p>
        </div>
      </div>
    </div>
  );
}
