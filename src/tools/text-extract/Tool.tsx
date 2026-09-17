import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

interface Rule {
  key: string;
  label: string;
  re: RegExp;
}

const RULES: Rule[] = [
  { key: 'mobile', label: '手机号', re: /(?<!\d)1[3-9]\d{9}(?!\d)/g },
  { key: 'email', label: '邮箱', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { key: 'url', label: '网址', re: /https?:\/\/[^\s，。；、）)"'」』]+/g },
  { key: 'ip', label: 'IP 地址', re: /(?<!\d)((?:\d{1,3}\.){3}\d{1,3})(?!\d)/g },
  {
    key: 'idcard',
    label: '身份证号',
    re: /(?<!\d)\d{6}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx](?!\d)/g,
  },
  { key: 'bank', label: '银行卡号', re: /(?<!\d)\d{16,19}(?!\d)/g },
  { key: 'datecn', label: '日期', re: /(?:19|20)\d{2}[-/年]\d{1,2}[-/月]\d{1,2}日?/g },
  { key: 'money', label: '金额', re: /[¥￥$]\s?\d+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?\s?元/g },
  { key: 'number', label: '数字', re: /-?\d+(?:\.\d+)?/g },
  { key: 'cn', label: '中文片段', re: /[\u4e00-\u9fa5]{2,}/g },
  { key: 'en', label: '英文单词', re: /[A-Za-z]{2,}/g },
];

export default function TextExtractTool() {
  const [input, setInput] = useState('');
  const [picked, setPicked] = useState<string[]>(['mobile', 'email', 'url']);
  const [custom, setCustom] = useState('');
  const [flags, setFlags] = useState('g');
  const [dedup, setDedup] = useState(true);
  const [copied, setCopied] = useState(false);

  const { groups, total } = useMemo(() => {
    const out: { label: string; items: string[] }[] = [];
    let count = 0;

    for (const rule of RULES) {
      if (!picked.includes(rule.key)) continue;
      const found = input.match(new RegExp(rule.re.source, rule.re.flags)) ?? [];
      const items = dedup ? [...new Set(found)] : found;
      if (items.length) {
        out.push({ label: rule.label, items });
        count += items.length;
      }
    }

    if (custom.trim()) {
      try {
        const re = new RegExp(custom, flags.includes('g') ? flags : `${flags}g`);
        const found = input.match(re) ?? [];
        const items = dedup ? [...new Set(found)] : found;
        if (items.length) {
          out.push({ label: '自定义正则', items });
          count += items.length;
        }
      } catch {
        // 正则还没写完，提示交给 effect 之外的渲染
      }
    }

    return { groups: out, total: count };
  }, [input, picked, custom, flags, dedup]);

  const invalid = useMemo(() => {
    if (!custom.trim()) return false;
    try {
      new RegExp(custom, flags);
      return false;
    } catch {
      return true;
    }
  }, [custom, flags]);

  const flat = groups.map((g) => `【${g.label}】\n${g.items.join('\n')}`).join('\n\n');
  const plain = groups.flatMap((g) => g.items).join('\n');

  return (
    <div class="space-y-4">
      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">原始文本</span>
          <button
            type="button"
            class="btn btn-xs btn-ghost"
            onClick={() =>
              setInput(
                '联系人张伟 13812345678，邮箱 zhangwei@example.com\n公司官网 https://www.mokakit.com/tools/\n服务器 192.168.1.20，身份证 11010119900307123X\n合同金额 ¥128,000.00，签订于 2026年3月15日',
              )
            }
          >
            填入示例
          </button>
        </div>
        <textarea
          class="textarea textarea-bordered w-full font-mono text-sm"
          rows={7}
          placeholder="把需要提取的文本粘贴到这里"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <div>
        <span class="text-sm font-medium">要提取的内容</span>
        <div class="mt-2 flex flex-wrap gap-x-4 gap-y-2 rounded-xl bg-base-200 px-4 py-3">
          {RULES.map((r) => (
            <label class="flex cursor-pointer items-center gap-2 text-sm" key={r.key}>
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                checked={picked.includes(r.key)}
                onChange={(e) => {
                  const on = (e.target as HTMLInputElement).checked;
                  setPicked((prev) => (on ? [...prev, r.key] : prev.filter((k) => k !== r.key)));
                }}
              />
              {r.label}
            </label>
          ))}
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label class="block">
          <span class="text-sm font-medium">自定义正则（可选）</span>
          <input
            type="text"
            class={`input input-bordered mt-1.5 w-full font-mono text-sm ${
              invalid ? 'input-error' : ''
            }`}
            placeholder="例如：\d{4}-\d{2}-\d{2}"
            value={custom}
            onInput={(e) => setCustom((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">修饰符</span>
          <input
            type="text"
            class="input input-bordered mt-1.5 w-24 font-mono text-sm"
            value={flags}
            onInput={(e) => setFlags((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>
      {invalid && <p class="text-sm text-error">正则表达式写法有问题，请检查后再试</p>}

      <label class="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          class="checkbox checkbox-sm"
          checked={dedup}
          onChange={(e) => setDedup((e.target as HTMLInputElement).checked)}
        />
        去重（同一内容只保留一次）
      </label>

      <div class="flex flex-wrap gap-2">
        <span class="badge badge-ghost">命中 {total} 条</span>
        <span class="badge badge-outline">{groups.length} 类</span>
      </div>

      {groups.length > 0 && (
        <div class="space-y-3">
          {groups.map((g) => (
            <div class="rounded-xl border border-base-300 bg-base-100 p-4" key={g.label}>
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm font-semibold">{g.label}</span>
                <span class="text-xs opacity-55">{g.items.length} 条</span>
              </div>
              <pre class="max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-xs leading-relaxed">
                {g.items.join('\n')}
              </pre>
            </div>
          ))}

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
              onClick={async () => {
                await copyText(plain);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              }}
            >
              {copied ? '已复制' : '复制纯结果'}
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline"
              onClick={() => copyText(flat)}
            >
              复制带分类
            </button>
          </div>
        </div>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        全部匹配在浏览器本地跑，文本不会上传。手机号、身份证、银行卡用的是常见的格式规则，
        不能保证 100% 准确（比如身份证不做校验位验算），重要场景请人工复核。
      </p>
    </div>
  );
}
