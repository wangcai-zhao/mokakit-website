import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const PRESETS = [54, 56, 57, 58, 59, 60];

/** 以头围 cm 为基准做各国对照（近似） */
function hatOf(cm: number) {
  const us = cm / 2.54 / 3.14159;
  const r = (n: number) => Math.round(n * 8) / 8;
  const ri = (n: number) => Math.round(n);
  return {
    us: r(us),
    uk: r(us),
    eu: ri(cm),
    cn: ri(cm),
  };
}

export default function HatSizeConvert() {
  const [value, setValue] = useState('57');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const result = useMemo(() => {
    const raw = value.trim();
    const v = Number(raw);
    if (!Number.isFinite(v) || v <= 0) return null;
    return hatOf(v);
  }, [value]);

  const rows = result
    ? [
        { k: 'us', label: '美码 (US)', val: result.us },
        { k: 'uk', label: '英码 (UK)', val: result.uk },
        { k: 'eu', label: '欧码 (EU)', val: result.eu },
        { k: 'cn', label: '中码 (头围cm)', val: result.cn },
      ]
    : [];

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">头围（cm）</span>
          <input
            type="number"
            inputmode="decimal"
            step="any"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            placeholder="例如 57"
            value={value}
            onInput={(e) => setValue((e.target as HTMLInputElement).value)}
          />
        </label>
        <div class="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button type="button" class="btn btn-xs btn-outline" onClick={() => setValue(String(p))}>
              {p} cm
            </button>
          ))}
        </div>

        {!result && <p class="mt-3 text-sm opacity-60">请输入大于 0 的头围（厘米）</p>}

        {result && (
          <ul class="mt-4 space-y-2">
            {rows.map(({ k, label, val }) => {
              const text = `${label} ${val}`;
              return (
                <li class="flex items-center gap-2 rounded-lg bg-base-100 px-3 py-2">
                  <span class="w-36 shrink-0 text-sm opacity-60">{label}</span>
                  <code class="flex-1 font-mono text-lg font-semibold">{val}</code>
                  <button
                    type="button"
                    class={`btn btn-xs shrink-0 ${copied === k ? 'btn-success' : 'btn-ghost'}`}
                    onClick={() => copy(text, k)}
                  >
                    {copied === k ? '已复制' : '复制'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        以头围厘米为基准做各国对照：欧码/中码数字约等于头围厘米数，美码按 头围cm ÷ 2.54 ÷ π 估算（如 57cm≈7⅛）。棒球帽多可调节，礼帽按码数更严。全部计算均在浏览器本地完成。
      </p>
    </div>
  );
}
