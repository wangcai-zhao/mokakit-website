import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { coffeeRatio, coffeeByWater } from '@/lib/life-tools';
import { parseNumber } from '@/lib/tool-result';

type Mode = 'byRatio' | 'byWater';

export default function CoffeeRatio() {
  const [mode, setMode] = useState<Mode>('byRatio');
  const [dose, setDose] = useState('15');
  const [ratio, setRatio] = useState('15');
  const [water, setWater] = useState('225');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const d = parseNumber(dose, { name: '咖啡粉', min: 0 });
    if (!d.ok) return d;
    if (mode === 'byRatio') {
      const r = parseNumber(ratio, { name: '粉水比', min: 0 });
      if (!r.ok) return r;
      return coffeeRatio(d.data, r.data);
    }
    const w = parseNumber(water, { name: '水量', min: 0 });
    if (!w.ok) return w;
    return coffeeByWater(d.data, w.data);
  }, [dose, ratio, water, mode]);

  const copy = async () => {
    if (!result || !result.ok) return;
    await copyText(`水量\t${result.data.waterMl} ml\n粉水比\t1:${result.data.ratio}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class={`btn btn-xs ${mode === 'byRatio' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('byRatio')}
          >
            粉量+比例→水量
          </button>
          <button
            type="button"
            class={`btn btn-xs ${mode === 'byWater' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('byWater')}
          >
            粉量+水量→比例
          </button>
        </div>
        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">咖啡粉 (g)</span>
            <input
              type="number"
              step="any"
              min="0"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={dose}
              onInput={(e) => setDose((e.target as HTMLInputElement).value)}
            />
          </label>
          {mode === 'byRatio' ? (
            <label class="block">
              <span class="text-sm font-medium">粉水比 (1:N)</span>
              <input
                type="number"
                step="any"
                min="0"
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={ratio}
                onInput={(e) => setRatio((e.target as HTMLInputElement).value)}
              />
            </label>
          ) : (
            <label class="block">
              <span class="text-sm font-medium">水量 (ml)</span>
              <input
                type="number"
                step="any"
                min="0"
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={water}
                onInput={(e) => setWater((e.target as HTMLInputElement).value)}
              />
            </label>
          )}
        </div>
      </div>

      {result && !result.ok && (
        <p class="text-sm text-error" role="alert">
          {result.error}
        </p>
      )}

      {result && result.ok && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">冲煮建议</span>
            <button
              type="button"
              class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
              onClick={copy}
            >
              {copied ? '已复制' : '复制结果'}
            </button>
          </div>
          <div class="mt-3 overflow-x-auto">
            <table class="table table-sm">
              <tbody>
                <tr>
                  <td>需水量</td>
                  <td class="text-right font-mono">{result.data.waterMl} ml</td>
                </tr>
                <tr>
                  <td>粉水比</td>
                  <td class="text-right font-mono">1:{result.data.ratio}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        计算在浏览器本地完成。手冲常用 1:15 左右（偏浓可 1:13，偏淡可 1:17）；先定粉量再配比例或水量，两种方式都能快速换算。
      </p>
    </div>
  );
}
