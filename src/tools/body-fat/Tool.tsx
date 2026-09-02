import { useState, useMemo } from 'preact/hooks';

function classify(sex: 'm' | 'f', bf: number): string {
  if (sex === 'm') {
    if (bf < 6) return '偏低（低于必需脂肪）';
    if (bf < 14) return '运动员';
    if (bf < 18) return '健身';
    if (bf < 25) return '平均';
    return '偏高';
  }
  if (bf < 14) return '偏低（低于必需脂肪）';
  if (bf < 21) return '运动员';
  if (bf < 25) return '健身';
  if (bf < 32) return '平均';
  return '偏高';
}

export default function BodyFat() {
  const [sex, setSex] = useState<'m' | 'f'>('m');
  const [height, setHeight] = useState('175');
  const [waist, setWaist] = useState('85');
  const [neck, setNeck] = useState('38');
  const [hip, setHip] = useState('95');

  const result = useMemo<{ error?: string; bf?: number; level?: string }>(() => {
    const h = Number(height), w = Number(waist), n = Number(neck), hp = Number(hip);
    if (![h, w, n].every(Number.isFinite) || h <= 0 || w <= 0 || n <= 0) return { error: '请填写有效的正数围度' };
    if (sex === 'f' && (!Number.isFinite(hp) || hp <= 0)) return { error: '女性请填写臀围' };
    const log10 = Math.log10;
    let bf: number;
    if (sex === 'm') {
      const d = w - n;
      if (d <= 0) return { error: '腰围应大于颈围' };
      bf = 495 / (1.0324 - 0.19077 * log10(d) + 0.15456 * log10(h)) - 450;
    } else {
      const d = w + hp - n;
      if (d <= 0) return { error: '腰围 + 臀围应大于颈围' };
      bf = 495 / (1.29579 - 0.35004 * log10(d) + 0.221 * log10(h)) - 450;
    }
    bf = Math.max(0, bf);
    return { bf, level: classify(sex, bf) };
  }, [sex, height, waist, neck, hip]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <div class="flex gap-2">
          <button type="button" class={`btn btn-sm flex-1 ${sex === 'm' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSex('m')}>男</button>
          <button type="button" class={`btn btn-sm flex-1 ${sex === 'f' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSex('f')}>女</button>
        </div>
        <Num label="身高（厘米）" value={height} set={setHeight} />
        <Num label="腰围（厘米，肚脐上方最细处）" value={waist} set={setWaist} />
        <Num label="颈围（厘米，喉结下方）" value={neck} set={setNeck} />
        {sex === 'f' && <Num label="臀围（厘米，最宽处）" value={hip} set={setHip} />}
      </div>

      {result.error && <p class="text-sm text-error">{result.error}</p>}

      {result.bf !== undefined && (
        <div class="rounded-xl bg-base-200 p-4 text-center">
          <div class="text-3xl font-bold font-mono">{result.bf.toFixed(1)}%</div>
          <div class="badge badge-primary mt-2">{result.level}</div>
          <p class="text-xs opacity-60 mt-2">美国海军法估算，误差约 ±3%</p>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        男性：495 ÷ (1.0324 − 0.19077·log₁₀(腰−颈) + 0.15456·log₁₀(身高)) − 450；女性增加臀围项。仅皮尺测量、无专业仪器时家用足够。所有计算本地完成。
      </p>
    </div>
  );
}

function Num({ label, value, set }: { label: string; value: string; set: (v: string) => void }) {
  return (
    <label class="block">
      <span class="text-sm font-medium">{label}</span>
      <input
        type="number"
        inputmode="decimal"
        min={0}
        class="input input-bordered input-sm mt-1.5 w-full font-mono"
        value={value}
        onInput={(e) => set((e.target as HTMLInputElement).value)}
      />
    </label>
  );
}
