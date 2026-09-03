import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const PRESETS = [50, 52, 54, 56, 58, 60];

/** 以毫米内周长为基准做各国对照（近似） */
function ringOf(perim: number) {
  const us = (perim - 40.4) / 2.55;
  const r = (n: number) => Math.round(n * 4) / 4;
  const ri = (n: number) => Math.round(n);
  return {
    us: r(us),
    uk: r(us - 0.25),
    hk: ri(us + 7),
    eu: ri(perim),
    jp: ri(perim - 40),
    cn: ri(perim),
  };
}

export default function RingSizeConvert() {
  const [value, setValue] = useState('54');
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
    return ringOf(v);
  }, [value]);

  const rows = result
    ? [
        { k: 'us', label: '美码 (US)', val: result.us },
        { k: 'uk', label: '英码 (UK)', val: result.uk },
        { k: 'hk', label: '港码 (HK)', val: result.hk },
        { k: 'eu', label: '欧码 (EU)', val: result.eu },
        { k: 'jp', label: '日码 (JP)', val: result.jp },
        { k: 'cn', label: '中码 (周长mm)', val: result.cn },
      ]
    : [];

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">手指内周长（mm）</span>
          <input
            type="number"
            inputmode="decimal"
            step="any"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            placeholder="例如 54"
            value={value}
            onInput={(e) => setValue((e.target as HTMLInputElement).value)}
          />
        </label>
        <div class="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button type="button" class="btn btn-xs btn-outline" onClick={() => setValue(String(p))}>
              {p} mm
            </button>
          ))}
        </div>

        {!result && <p class="mt-3 text-sm opacity-60">请输入大于 0 的内周长（毫米）</p>}

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
        以毫米内周长为基准做各国对照：欧码数字约等于内周长毫米数，美码按 (周长−40.4)/2.55 估算，港码≈美码+7，日码≈周长−40。各国品牌标准略有差异，贵重戒指建议到店复测。全部计算均在浏览器本地完成。
      </p>
    </div>
  );
}
