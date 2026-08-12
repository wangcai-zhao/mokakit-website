import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

interface Level {
  label: string;
  badge: string;
  tip: string;
}

/** 中国成人 BMI 分类标准 */
function classify(bmi: number): Level {
  if (bmi < 18.5) {
    return { label: '偏瘦', badge: 'badge-warning', tip: '体重低于健康区间，建议增加优质蛋白与热量摄入。' };
  }
  if (bmi < 24) {
    return { label: '正常', badge: 'badge-success', tip: '体重处于健康区间，继续保持规律饮食与运动。' };
  }
  if (bmi < 28) {
    return { label: '偏胖', badge: 'badge-warning', tip: '已超出健康区间，建议控制热量摄入并增加有氧运动。' };
  }
  return { label: '肥胖', badge: 'badge-error', tip: '肥胖会提高慢性病风险，建议咨询医生制定减重方案。' };
}

const SCALE = [
  { label: '偏瘦', range: '< 18.5' },
  { label: '正常', range: '18.5 ~ 24' },
  { label: '偏胖', range: '24 ~ 28' },
  { label: '肥胖', range: '≥ 28' },
];

type Result =
  | { ok: false; error: string }
  | { ok: true; bmi: string; level: Level; healthy: string };

export default function BmiCalculator() {
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('65');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const result = useMemo<Result | null>(() => {
    const h = Number(height.trim());
    const w = Number(weight.trim());
    if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null;
    if (h < 50 || h > 260) return { ok: false, error: '身高请输入 50 ~ 260 厘米之间的数值' };
    if (w < 10 || w > 500) return { ok: false, error: '体重请输入 10 ~ 500 公斤之间的数值' };
    const m = h / 100;
    const bmi = w / (m * m);
    const level = classify(bmi);
    const min = 18.5 * m * m;
    const max = 24 * m * m;
    return {
      ok: true,
      bmi: bmi.toFixed(1),
      level,
      healthy: `${min.toFixed(1)} ~ ${max.toFixed(1)} kg`,
    };
  }, [height, weight]);

  const summary =
    result && result.ok
      ? `身高 ${height} cm、体重 ${weight} kg，BMI ${result.bmi}，${result.level.label}`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">身高（厘米）</span>
            <input
              type="number"
              inputmode="decimal"
              min={50}
              max={260}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 170"
              value={height}
              onInput={(e) => setHeight((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">体重（公斤）</span>
            <input
              type="number"
              inputmode="decimal"
              min={10}
              max={500}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 65"
              value={weight}
              onInput={(e) => setWeight((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {!result && <p class="mt-3 text-sm text-error">请输入有效的身高与体重</p>}

        {result && !result.ok && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && result.ok && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-center gap-3">
              <span class="text-3xl font-bold font-mono">{result.bmi}</span>
              <span class={`badge ${result.level.badge}`}>{result.level.label}</span>
              <button
                type="button"
                class={`btn btn-xs ml-auto ${copied === 'bmi' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'bmi')}
              >
                {copied === 'bmi' ? '已复制' : '复制结果'}
              </button>
            </div>
            <p class="text-sm opacity-70">{result.level.tip}</p>
            <p class="text-sm">
              <span class="opacity-60">你的健康体重区间：</span>
              <span class="font-mono font-medium">{result.healthy}</span>
            </p>
          </div>
        )}
      </div>

      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>分类</th>
              <th>BMI 范围</th>
            </tr>
          </thead>
          <tbody>
            {SCALE.map((s) => {
              const active = result !== null && result.ok && result.level.label === s.label;
              return (
                <tr class={active ? 'bg-base-200 font-medium' : ''}>
                  <td>{s.label}</td>
                  <td class="font-mono">{s.range}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        计算公式：BMI = 体重(kg) ÷ 身高(m)²，分类采用中国成人标准。BMI 不区分肌肉与脂肪，结果仅供参考，不构成医疗建议。所有计算在浏览器本地完成。
      </p>
    </div>
  );
}
