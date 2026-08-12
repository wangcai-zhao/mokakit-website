import { useState, useMemo, useRef } from 'preact/hooks';
import { LICENSES, FAMILY_LABEL, type License } from './data';
import { copyText } from '@/tools/_shared/copy';

export default function LicenseGen() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [owner, setOwner] = useState('');
  const [selectedId, setSelectedId] = useState<string>('mit');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  // 问答式「帮我选」
  const [needPatent, setNeedPatent] = useState<'na' | 'yes' | 'no'>('na');
  const [allowClosed, setAllowClosed] = useState<'na' | 'yes' | 'no'>('na');
  const [copyleft, setCopyleft] = useState<'na' | 'none' | 'weak' | 'strong'>('na');

  const recommended: string[] = useMemo(() => {
    if (allowClosed === 'yes') {
      if (needPatent === 'yes') return ['apache-2.0'];
      return ['mit', 'bsd-3', 'isc', 'unlicense'];
    }
    if (allowClosed === 'no' || copyleft !== 'na') {
      if (copyleft === 'weak') return ['mpl-2.0', 'lgpl-3.0'];
      if (copyleft === 'strong') return ['agpl-3.0', 'gpl-3.0'];
      return ['gpl-3.0', 'agpl-3.0'];
    }
    return [];
  }, [allowClosed, needPatent, copyleft]);

  const selected = LICENSES.find((l) => l.id === selectedId) as License;

  const output = useMemo(() => {
    const y = year.trim() || String(new Date().getFullYear());
    const o = owner.trim() || 'Your Name';
    return selected.full.replace(/\{\{\s*year\s*\}\}/g, y).replace(/\{\{\s*owner\s*\}\}/g, o);
  }, [selected, year, owner]);

  const copy = async () => {
      await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LICENSE';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetQuiz = () => {
    setNeedPatent('na');
    setAllowClosed('na');
    setCopyleft('na');
  };

  const fam = (f: License['family']) => FAMILY_LABEL[f];

  return (
    <div class="space-y-5">
      {/* 帮我选 */}
      <div class="rounded-2xl bg-base-200 p-4">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold">🤔 不知道选哪个？回答三个问题</h3>
          <button type="button" class="btn btn-xs btn-ghost" onClick={resetQuiz}>
            重置
          </button>
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="space-y-1.5">
            <p class="text-xs opacity-70">是否允许闭源/专有使用？</p>
            <div class="flex gap-1.5">
              <button class={`btn btn-xs ${allowClosed === 'yes' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setAllowClosed('yes'); setCopyleft('na'); }}>允许</button>
              <button class={`btn btn-xs ${allowClosed === 'no' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setAllowClosed('no'); setCopyleft('strong'); }}>必须开源</button>
            </div>
          </div>
          <div class="space-y-1.5">
            <p class="text-xs opacity-70">需要明确的专利授权？</p>
            <div class="flex gap-1.5">
              <button class={`btn btn-xs ${needPatent === 'yes' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setNeedPatent('yes')} disabled={allowClosed === 'no'}>需要</button>
              <button class={`btn btn-xs ${needPatent === 'no' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setNeedPatent('no')} disabled={allowClosed === 'no'}>无所谓</button>
            </div>
          </div>
          <div class="space-y-1.5">
            <p class="text-xs opacity-70">开源力度（若须开源）？</p>
            <div class="flex gap-1.5">
              <button class={`btn btn-xs ${copyleft === 'weak' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setCopyleft('weak'); setAllowClosed('no'); }} disabled={allowClosed === 'yes'}>弱</button>
              <button class={`btn btn-xs ${copyleft === 'strong' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setCopyleft('strong'); setAllowClosed('no'); }} disabled={allowClosed === 'yes'}>强</button>
            </div>
          </div>
        </div>
        {recommended.length > 0 && (
          <div class="mt-3 rounded-xl bg-primary/10 p-3 text-sm">
            推荐你看看：
            {recommended.map((id) => {
              const l = LICENSES.find((x) => x.id === id)!;
              return (
                <button
                  type="button"
                  class="btn btn-xs btn-primary ml-2"
                  onClick={() => setSelectedId(id)}
                >
                  {l.spdx}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* 左：选择区 */}
        <div class="space-y-3">
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label class="flex flex-col gap-1 text-xs">
              <span class="opacity-70">年份（版权声明）</span>
              <input type="text" class="input input-bordered input-sm w-full" value={year} onInput={(e) => setYear((e.target as HTMLInputElement).value)} placeholder="2026" />
            </label>
            <label class="flex flex-col gap-1 text-xs">
              <span class="opacity-70">版权所有者（个人/组织名）</span>
              <input type="text" class="input input-bordered input-sm w-full" value={owner} onInput={(e) => setOwner((e.target as HTMLInputElement).value)} placeholder="Your Name" />
            </label>
          </div>

          <div class="max-h-[460px] space-y-2 overflow-y-auto pr-1">
            {LICENSES.map((l) => (
              <button
                type="button"
                key={l.id}
                onClick={() => setSelectedId(l.id)}
                class={`block w-full rounded-xl border p-3 text-left transition ${
                  selectedId === l.id ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200 hover:bg-base-300'
                }`}
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold">{l.spdx}</span>
                  <span class="badge badge-sm">{fam(l.family)}</span>
                </div>
                <p class="mt-1 text-xs opacity-65">{l.note}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 右：预览区 */}
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">LICENSE 全文预览</span>
            <div class="flex gap-2">
              <button type="button" class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`} onClick={copy}>
                {copied ? '已复制' : '复制'}
              </button>
              <button type="button" class="btn btn-sm btn-primary" onClick={download}>
                下载 LICENSE
              </button>
            </div>
          </div>
          <pre class="max-h-[460px] overflow-auto rounded-xl bg-base-300 p-3 font-mono text-xs leading-relaxed">
            {output}
          </pre>
          <p class="text-xs opacity-55 leading-relaxed">
            生成完全在浏览器本地完成，不上传任何数据。GPL / AGPL 等超长协议在下载文件中指向官方权威全文；其余协议为可直接使用的完整文本，把年份与版权所有者替换后放到仓库根目录即可。
          </p>
        </div>
      </div>
    </div>
  );
}
