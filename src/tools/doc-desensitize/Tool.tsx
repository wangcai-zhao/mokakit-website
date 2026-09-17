import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import {
  RULES,
  EXTRA_NAME_RULES,
  desensitize,
  type SensitiveType,
  type MaskMode,
} from './desensitize';

const DEFAULT_ON: SensitiveType[] = [
  'mobile',
  'idcard',
  'bankcard',
  'email',
  'name',
  'address',
  'ip',
  'plate',
  'creditCode',
];

const SAMPLE = `客户信息登记表

姓名：张伟，联系电话 13812345678，邮箱 zhangwei@example.com
身份证号：11010119900307123X
收货地址：北京市朝阳区建国路88号SOHO现代城3栋1201室
公司统一社会信用代码：91110000MA01ABCD2X
办公座机 010-88886666，车牌 京A12345
联系QQ 12345678，微信号：zhangwei_2026
服务器地址 192.168.10.24`;

const MODES: { key: MaskMode; label: string; desc: string }[] = [
  { key: 'partial', label: '保留首尾', desc: '138****5678，还能看出是什么类型' },
  { key: 'full', label: '全部打码', desc: '整段变星号，信息量最少' },
  { key: 'label', label: '换成类型标签', desc: '【手机号】，读的人知道这里有个号' },
  { key: 'code', label: '换成稳定代号', desc: '手机号#a3f2，同一号码每次代号一致，可做关联分析' },
];

export default function DocDesensitizeTool() {
  const [input, setInput] = useState(SAMPLE);
  const [enabled, setEnabled] = useState<SensitiveType[]>(DEFAULT_ON);
  const [extraNames, setExtraNames] = useState<string[]>([]);
  const [whitelist, setWhitelist] = useState('');
  const [mode, setMode] = useState<MaskMode>('partial');
  const [maskChar, setMaskChar] = useState('*');
  const [perType, setPerType] = useState(true);
  const [head, setHead] = useState(3);
  const [tail, setTail] = useState(4);
  const [customs, setCustoms] = useState<{ pattern: string; flags: string }[]>([]);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const customError = useMemo(
    () =>
      customs.some((c) => {
        if (!c.pattern.trim()) return false;
        try {
          new RegExp(c.pattern, c.flags);
          return false;
        } catch {
          return true;
        }
      }),
    [customs],
  );

  const result = useMemo(
    () =>
      desensitize(input, {
        enabled,
        extraNames,
        whitelist: whitelist.split(/[\n,，]/),
        customPatterns: customs,
        mode,
        maskChar: maskChar || '*',
        perType,
        head,
        tail,
      }),
    [input, enabled, extraNames, whitelist, customs, mode, maskChar, perType, head, tail],
  );

  const total = Object.values(result.counts).reduce((a, b) => a + b, 0);

  const toggleType = (t: SensitiveType) =>
    setEnabled((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const pickFile = async (f: File | null) => {
    if (!f) return;
    const text = await f.text();
    setInput(text);
  };

  return (
    <div class="space-y-4">
      <label class="block">
        <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <span class="text-sm font-medium">待脱敏文档</span>
          <div class="join">
            <button type="button" class="btn btn-xs join-item btn-ghost" onClick={() => setInput(SAMPLE)}>
              填入示例
            </button>
            <button
              type="button"
              class="btn btn-xs join-item btn-ghost"
              onClick={() => fileRef.current?.click()}
            >
              导入文本文件
            </button>
            <button type="button" class="btn btn-xs join-item btn-ghost" onClick={() => setInput('')}>
              清空
            </button>
          </div>
        </div>
        <textarea
          class="textarea textarea-bordered w-full font-mono text-sm"
          rows={9}
          placeholder="粘贴合同、名单、日志等含敏感信息的文本"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.csv,.json,.log,.xml,.yml,.yaml,text/plain"
          class="hidden"
          onChange={(e) => {
            const el = e.target as HTMLInputElement;
            void pickFile(el.files?.[0] ?? null);
            el.value = '';
          }}
        />
      </label>

      <div>
        <span class="text-sm font-medium">识别哪些信息</span>
        <div class="mt-2 grid gap-2 sm:grid-cols-2">
          {RULES.map((r) => (
            <label
              class="flex cursor-pointer items-start gap-2 rounded-xl border border-base-300 bg-base-100 p-3"
              key={r.type}
            >
              <input
                type="checkbox"
                class="checkbox checkbox-sm mt-0.5"
                checked={enabled.includes(r.type)}
                onChange={() => toggleType(r.type)}
              />
              <span class="min-w-0">
                <span class="block text-sm">{r.label}</span>
                <span class="block text-xs opacity-50 leading-snug">{r.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <span class="text-sm font-medium">姓名识别增强（误报会变多）</span>
        <div class="mt-2 grid gap-2 sm:grid-cols-2">
          {EXTRA_NAME_RULES.map((r) => (
            <label
              class="flex cursor-pointer items-start gap-2 rounded-xl bg-base-200 px-3 py-2.5"
              key={r.key}
            >
              <input
                type="checkbox"
                class="checkbox checkbox-sm mt-0.5"
                checked={extraNames.includes(r.key)}
                onChange={(e) => {
                  const on = (e.target as HTMLInputElement).checked;
                  setExtraNames((prev) => (on ? [...prev, r.key] : prev.filter((k) => k !== r.key)));
                }}
              />
              <span class="min-w-0">
                <span class="block text-sm">{r.label}</span>
                <span class="block text-xs opacity-50 leading-snug">{r.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">自定义正则（可选）</span>
          <button
            type="button"
            class="btn btn-xs btn-ghost"
            onClick={() => setCustoms((prev) => [...prev, { pattern: '', flags: 'g' }])}
          >
            + 加一条
          </button>
        </div>
        {customs.length === 0 && (
          <p class="text-xs opacity-50">内部工号、订单号这类自家格式，可以自己写一条规则。</p>
        )}
        <div class="space-y-2">
          {customs.map((c, i) => (
            <div class="flex gap-2" key={i}>
              <input
                type="text"
                class="input input-bordered input-sm flex-1 font-mono"
                placeholder="正则，例如 EMP-\d{6}"
                value={c.pattern}
                onInput={(e) =>
                  setCustoms((prev) =>
                    prev.map((x, idx) =>
                      idx === i ? { ...x, pattern: (e.target as HTMLInputElement).value } : x,
                    ),
                  )
                }
              />
              <input
                type="text"
                class="input input-bordered input-sm w-20 font-mono"
                placeholder="flags"
                value={c.flags}
                onInput={(e) =>
                  setCustoms((prev) =>
                    prev.map((x, idx) =>
                      idx === i ? { ...x, flags: (e.target as HTMLInputElement).value } : x,
                    ),
                  )
                }
              />
              <button
                type="button"
                class="btn btn-sm btn-ghost text-error"
                onClick={() => setCustoms((prev) => prev.filter((_, idx) => idx !== i))}
              >
                删除
              </button>
            </div>
          ))}
        </div>
        {customError && <p class="mt-1 text-sm text-error">有一条自定义正则写法不对，请检查</p>}
      </div>

      <label class="block">
        <span class="text-sm font-medium">白名单（命中含这些词就不处理，每行或用逗号分隔）</span>
        <textarea
          class="textarea textarea-bordered mt-1.5 w-full text-sm"
          rows={2}
          placeholder="例如：4008200001、客服电话"
          value={whitelist}
          onInput={(e) => setWhitelist((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <div>
        <span class="text-sm font-medium">脱敏方式</span>
        <div class="mt-2 grid gap-2 sm:grid-cols-2">
          {MODES.map((m) => (
            <button
              type="button"
              key={m.key}
              class={`rounded-xl border p-3 text-left transition ${
                mode === m.key ? 'border-primary bg-primary/5' : 'border-base-300'
              }`}
              onClick={() => setMode(m.key)}
            >
              <span class="block text-sm font-medium">{m.label}</span>
              <span class="mt-0.5 block text-xs opacity-55 leading-snug">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <label class="block">
          <span class="text-sm font-medium">掩码字符</span>
          <input
            type="text"
            class="input input-bordered mt-1.5 w-full font-mono"
            maxlength="2"
            value={maskChar}
            onInput={(e) => setMaskChar((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">保留前几位</span>
          <input
            type="number"
            min="0"
            max="20"
            class="input input-bordered mt-1.5 w-full"
            disabled={perType || mode !== 'partial'}
            value={head}
            onInput={(e) => setHead(Math.max(0, Number((e.target as HTMLInputElement).value) || 0))}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">保留后几位</span>
          <input
            type="number"
            min="0"
            max="20"
            class="input input-bordered mt-1.5 w-full"
            disabled={perType || mode !== 'partial'}
            value={tail}
            onInput={(e) => setTail(Math.max(0, Number((e.target as HTMLInputElement).value) || 0))}
          />
        </label>
      </div>

      <label class="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          class="checkbox checkbox-sm"
          checked={perType}
          disabled={mode !== 'partial'}
          onChange={(e) => setPerType((e.target as HTMLInputElement).checked)}
        />
        按类型自动决定保留位数（手机号 3/4、身份证 6/4、银行卡 4/4）
      </label>

      <div class="flex flex-wrap gap-2">
        <span class="badge badge-primary badge-outline">命中 {total} 处</span>
        {Object.entries(result.counts).map(([k, v]) => (
          <span class="badge badge-ghost" key={k}>
            {k} {v}
          </span>
        ))}
        {total === 0 && input.trim() !== '' && (
          <span class="badge badge-outline">没有识别到敏感信息，可以试试多开几种类型</span>
        )}
      </div>

      <label class="block">
        <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <span class="text-sm font-medium">脱敏结果</span>
          <div class="join">
            <button
              type="button"
              class={`btn btn-xs join-item ${copied ? 'btn-success' : 'btn-outline'}`}
              disabled={!result.text}
              onClick={async () => {
                await copyText(result.text);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              }}
            >
              {copied ? '已复制' : '复制结果'}
            </button>
            <button
              type="button"
              class="btn btn-xs join-item btn-outline"
              disabled={!result.text}
              onClick={() => {
                const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'desensitized.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
              }}
            >
              下载 txt
            </button>
          </div>
        </div>
        <pre class="max-h-80 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm whitespace-pre-wrap break-all">
          {result.text || <span class="opacity-40">脱敏后的内容会实时显示在这里</span>}
        </pre>
      </label>

      {result.hits.length > 0 && (
        <div class="rounded-xl border border-base-300 bg-base-100 p-4">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-medium">命中明细（{result.hits.length} 条）</span>
            <label class="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                class="checkbox checkbox-xs"
                checked={showRaw}
                onChange={(e) => setShowRaw((e.target as HTMLInputElement).checked)}
              />
              显示原文对照
            </label>
          </div>
          {showRaw && (
            <p class="mb-2 text-xs text-warning">
              原文含未脱敏信息，截图或投屏前记得关掉这个开关。
            </p>
          )}
          <div class="max-h-56 overflow-auto">
            <table class="table table-xs">
              <thead>
                <tr>
                  <th>类型</th>
                  <th>脱敏后</th>
                  {showRaw && <th>原文</th>}
                </tr>
              </thead>
              <tbody>
                {result.hits.slice(0, 200).map((h, i) => (
                  <tr key={i}>
                    <td>{h.label}</td>
                    <td class="font-mono">{h.masked}</td>
                    {showRaw && <td class="font-mono opacity-70">{h.raw}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        全部处理在你的浏览器本地完成，文档内容不会上传到任何服务器，这也是它和在线
        API 类脱敏服务最本质的区别。识别靠正则与校验位（身份证校验位、银行卡 Luhn），
        漏报和误报都可能存在，正式外发前请人工过一遍。
      </p>
    </div>
  );
}
