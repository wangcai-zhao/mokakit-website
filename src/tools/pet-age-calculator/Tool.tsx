import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { petAge, type PetSpecies } from '@/lib/life-tools';
import { parseNumber } from '@/lib/tool-result';

export default function PetAgeCalculator() {
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [age, setAge] = useState('3');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const a = parseNumber(age, { name: '宠物年龄' });
    if (!a.ok) return a;
    return petAge(species, a.data);
  }, [species, age]);

  const copy = async () => {
    if (!result || !result.ok) return;
    await copyText(`相当于人类\t${result.data.humanYears} 岁\n生命阶段\t${result.data.stage}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">宠物类型</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={species}
              onChange={(e) => setSpecies((e.target as HTMLSelectElement).value as PetSpecies)}
            >
              <option value="dog">狗</option>
              <option value="cat">猫</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium">年龄（岁）</span>
            <input
              type="number"
              step="any"
              min="0"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={age}
              onInput={(e) => setAge((e.target as HTMLInputElement).value)}
            />
          </label>
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
            <span class="text-sm font-medium">换算结果</span>
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
                  <td>相当于人类</td>
                  <td class="text-right font-mono">{result.data.humanYears} 岁</td>
                </tr>
                <tr>
                  <td>生命阶段</td>
                  <td class="text-right">{result.data.stage}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        计算在浏览器本地完成。采用常用的「首年 15 岁、次年累计 24 岁、之后狗每年 +5、猫每年 +4」的近似换算，仅供娱乐参考。
      </p>
    </div>
  );
}
