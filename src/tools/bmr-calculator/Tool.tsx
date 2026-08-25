import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

export default function BmrCalc() {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState('30');
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('65');
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    const a = Number(age);
    const h = Number(height);
    const w = Number(weight);
    if (![a, h, w].every(Number.isFinite) || a <= 0 || h <= 0 || w <= 0) return null;
    const base = 10 * w + 6.25 * h - 5 * a;
    const bmr = gender === 'male' ? base + 5 : base - 161;
    if (!Number.isFinite(bmr) || bmr <= 0) return null;
    return { bmr };
  }, [gender, age, height, weight]);

  const copy = async (t: string) => {
    await copyText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm opacity-70">性别</span>
          <div class="tabs tabs-boxed tabs-sm">
            <button
              type="button"
              class={`tab ${gender === 'male' ? 'tab-active' : ''}`}
              onClick={() => setGender('male')}
            >
              男
            </button>
            <button
              type="button"
              class={`tab ${gender === 'female' ? 'tab-active' : ''}`}
              onClick={() => setGender('female')}
            >
              女
            </button>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <label class="form-control">
            <span class="label-text">年龄</span>
            <input
              type="number"
              class="input input-bordered input-sm text-center font-mono"
              value={age}
              onInput={(e) => setAge((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="form-control">
            <span class="label-text">身高(cm)</span>
            <input
              type="number"
              class="input input-bordered input-sm text-center font-mono"
              value={height}
              onInput={(e) => setHeight((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="form-control">
            <span class="label-text">体重(kg)</span>
            <input
              type="number"
              class="input input-bordered input-sm text-center font-mono"
              value={weight}
              onInput={(e) => setWeight((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
        {!res && <p class="text-sm text-error">请输入有效的正数年龄、身高、体重。</p>}
        {res && (
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm opacity-70">基础代谢率 BMR</span>
              <span class="font-mono font-bold text-2xl text-primary">
                {Math.round(res.bmr)} <span class="text-sm">kcal/天</span>
              </span>
            </div>
            <button
              type="button"
              class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => copy(`基础代谢率 ≈ ${Math.round(res.bmr)} kcal/天`)}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        )}
      </div>
      <p class="text-xs opacity-55">
        采用 Mifflin-St Jeor 公式，结果仅供参考，不替代专业营养或医疗建议。全部本地计算。
      </p>
    </div>
  );
}
