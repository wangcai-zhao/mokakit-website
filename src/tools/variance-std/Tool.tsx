import { useState, useMemo } from 'preact/hooks';

export default function VarianceStd() {
  const [raw, setRaw] = useState('80, 85, 90, 75, 95');

  const result = useMemo(() => {
    const nums = raw
      .split(/[\s,，、]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n));
    const n = nums.length;
    if (n < 1) return null;
    const mean = nums.reduce((a, b) => a + b, 0) / n;
    const sumSq = nums.reduce((a, b) => a + (b - mean) ** 2, 0);
    const popVar = sumSq / n;
    const popStd = Math.sqrt(popVar);
    const sampleVar = n > 1 ? sumSq / (n - 1) : NaN;
    const sampleStd = n > 1 ? Math.sqrt(sampleVar) : NaN;
    return {
      n,
      mean,
      popVar,
      popStd,
      sampleVar,
      sampleStd,
      min: Math.min(...nums),
      max: Math.max(...nums),
      sum: nums.reduce((a, b) => a + b, 0),
    };
  }, [raw]);

  const f = (x: number) => x.toLocaleString('zh-CN', { maximumFractionDigits: 4 });

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">输入一组数字（逗号 / 空格 / 换行分隔）</span>
          <textarea
            class="textarea textarea-bordered mt-1.5 w-full font-mono text-sm"
            rows={3}
            value={raw}
            onInput={(e) => setRaw((e.target as HTMLTextAreaElement).value)}
            placeholder="如 80, 85, 90, 75, 95"
          />
        </label>
      </div>

      {!result && <p class="text-sm text-error">请输入至少一个有效数字</p>}

      {result && (
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <tbody>
              <Row k="数据个数 n" v={String(result.n)} />
              <Row k="总和" v={f(result.sum)} />
              <Row k="最小值 / 最大值" v={`${f(result.min)} / ${f(result.max)}`} />
              <Row k="均值" v={f(result.mean)} />
              <Row k="总体方差" v={f(result.popVar)} />
              <Row k="总体标准差" v={f(result.popStd)} />
              <Row k="样本方差" v={Number.isNaN(result.sampleVar) ? '—（n<2）' : f(result.sampleVar)} />
              <Row k="样本标准差" v={Number.isNaN(result.sampleStd) ? '—（n<2）' : f(result.sampleStd)} />
            </tbody>
          </table>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        总体除以 n，样本除以 n−1（贝塞尔校正）。样本标准差仅在 n≥2 时有效。所有计算在浏览器本地完成。
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr>
      <td class="opacity-70">{k}</td>
      <td class="font-mono font-medium text-right">{v}</td>
    </tr>
  );
}
