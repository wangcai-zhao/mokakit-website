import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const CUPS = ['AA', 'A', 'B', 'C', 'D', 'E', 'F'];
const PRESETS_BAND = [68, 73, 78, 83, 88];

/** 下围 cm + 罩杯 -> 各国标号（近似对照） */
function braOf(bandCm: number, cup: string) {
  const eu = Math.round(bandCm);
  const us = Math.round(bandCm * 0.4 + 4); // 欧码->美码近似（75≈34, 80≈36, 85≈38）
  return {
    eu: `${eu}${cup}`,
    us: `${us}${cup}`,
    uk: `${us}${cup}`,
    fr: `${eu}${cup}`,
    jp: `${cup}${eu}`,
  };
}

export default function BraSizeConvert() {
  const [band, setBand] = useState('75');
  const [cup, setCup] = useState('C');
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
    const v = Number(band.trim());
    if (!Number.isFinite(v) || v <= 0) return null;
    return braOf(v, cup);
  }, [band, cup]);

  const rows = result
    ? [
        { k: 'eu', label: '欧码', val: result.eu },
        { k: 'us', label: '美/英码', val: result.us },
        { k: 'fr', label: '法码', val: result.fr },
        { k: 'jp', label: '日码', val: result.jp },
      ]
    : [];

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-sm font-medium">下围（cm）</span>
            <input
              type="number"
              inputmode="decimal"
              step="any"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 75"
              value={band}
              onInput={(e) => setBand((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">罩杯</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={cup}
              onChange={(e) => setCup((e.target as HTMLSelectElement).value)}
            >
              {CUPS.map((c) => (
                <option value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          {PRESETS_BAND.map((p) => (
            <button type="button" class="btn btn-xs btn-outline" onClick={() => setBand(String(p))}>
              {p} cm
            </button>
          ))}
        </div>

        {!result && <p class="mt-3 text-sm opacity-60">请输入大于 0 的下围（厘米）</p>}

        {result && (
          <ul class="mt-4 space-y-2">
            {rows.map(({ k, label, val }) => {
              const text = `${label} ${val}`;
              return (
                <li class="flex items-center gap-2 rounded-lg bg-base-100 px-3 py-2">
                  <span class="w-28 shrink-0 text-sm opacity-60">{label}</span>
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
        输入下围（乳房下缘松量厘米）与罩杯，输出欧/美英/法/日近似标号。欧码数字≈下围厘米（75/80/85），美英下围≈其英寸折算（34/36/38），罩杯字母各国基本通用。版型差异大，实际以试穿为准。全部计算均在浏览器本地完成。
      </p>
    </div>
  );
}
