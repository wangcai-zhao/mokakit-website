import { useState } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

interface Course {
  id: number;
  name: string;
  credit: string;
  score: string;
}
interface Scale {
  min: number;
  gp: number;
}

const SCALE_4: Scale[] = [
  { min: 90, gp: 4.0 },
  { min: 85, gp: 3.7 },
  { min: 82, gp: 3.3 },
  { min: 78, gp: 3.0 },
  { min: 75, gp: 2.7 },
  { min: 72, gp: 2.3 },
  { min: 68, gp: 2.0 },
  { min: 64, gp: 1.5 },
  { min: 60, gp: 1.0 },
  { min: 0, gp: 0 },
];
const SCALE_5: Scale[] = [
  { min: 90, gp: 5.0 },
  { min: 85, gp: 4.5 },
  { min: 82, gp: 4.0 },
  { min: 78, gp: 3.5 },
  { min: 75, gp: 3.0 },
  { min: 72, gp: 2.5 },
  { min: 68, gp: 2.0 },
  { min: 64, gp: 1.5 },
  { min: 60, gp: 1.0 },
  { min: 0, gp: 0 },
];

function toGp(score: number, scale: Scale[]): number {
  if (!Number.isFinite(score) || score < 0) return NaN;
  for (const s of scale) if (score >= s.min) return s.gp;
  return 0;
}

export default function GpaCalc() {
  const [scale, setScale] = useState<'4' | '5'>('4');
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, name: '课程1', credit: '3', score: '85' },
    { id: 2, name: '课程2', credit: '4', score: '92' },
  ]);
  const [copied, setCopied] = useState(false);

  const sc = scale === '4' ? SCALE_4 : SCALE_5;

  const summary = (() => {
    let creditSum = 0;
    let gpSum = 0;
    for (const c of courses) {
      const cr = Number(c.credit);
      const s = Number(c.score);
      if (!Number.isFinite(cr) || cr <= 0 || !Number.isFinite(s) || s < 0 || s > 100) return null;
      const g = toGp(s, sc);
      if (Number.isNaN(g)) return null;
      creditSum += cr;
      gpSum += cr * g;
    }
    if (creditSum === 0) return null;
    return { gpa: gpSum / creditSum, creditSum };
  })();

  const update = (id: number, key: 'name' | 'credit' | 'score', val: string) =>
    setCourses((cs) => cs.map((c) => (c.id === id ? { ...c, [key]: val } : c)));
  const add = () =>
    setCourses((cs) => [
      ...cs,
      {
        id: cs.length ? Math.max(...cs.map((c) => c.id)) + 1 : 1,
        name: `课程${cs.length + 1}`,
        credit: '3',
        score: '80',
      },
    ]);
  const remove = (id: number) => setCourses((cs) => cs.filter((c) => c.id !== id));

  const copy = async (t: string) => {
    await copyText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm opacity-70">绩点制式</span>
          <div class="tabs tabs-boxed tabs-sm">
            <button
              type="button"
              class={`tab ${scale === '4' ? 'tab-active' : ''}`}
              onClick={() => setScale('4')}
            >
              4.0 制
            </button>
            <button
              type="button"
              class={`tab ${scale === '5' ? 'tab-active' : ''}`}
              onClick={() => setScale('5')}
            >
              5.0 制
            </button>
          </div>
        </div>
        <div class="space-y-2">
          {courses.map((c) => (
            <div class="grid grid-cols-[1fr_60px_70px_28px] gap-2 items-center">
              <input
                class="input input-bordered input-sm"
                placeholder="课程名"
                value={c.name}
                onInput={(e) => update(c.id, 'name', (e.target as HTMLInputElement).value)}
              />
              <input
                type="number"
                class="input input-bordered input-sm text-center font-mono"
                placeholder="学分"
                value={c.credit}
                onInput={(e) => update(c.id, 'credit', (e.target as HTMLInputElement).value)}
              />
              <input
                type="number"
                class="input input-bordered input-sm text-center font-mono"
                placeholder="成绩"
                value={c.score}
                onInput={(e) => update(c.id, 'score', (e.target as HTMLInputElement).value)}
              />
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                onClick={() => remove(c.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" class="btn btn-outline btn-xs" onClick={add}>
          + 添加课程
        </button>
        {!summary && (
          <p class="text-sm text-error">请为每门课填写有效的学分（&gt;0）与 0–100 的成绩。</p>
        )}
        {summary && (
          <div class="space-y-2 pt-1">
            <div class="flex items-center justify-between">
              <span class="text-sm opacity-70">加权 GPA（{scale}.0 制）</span>
              <span class="font-mono font-bold text-2xl text-primary">{summary.gpa.toFixed(2)}</span>
            </div>
            <p class="text-xs opacity-60">总学分 {summary.creditSum}</p>
            <button
              type="button"
              class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() =>
                copy(`GPA = ${summary.gpa.toFixed(2)}（${scale}.0 制，总学分 ${summary.creditSum}）`)
              }
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        )}
      </div>
      <p class="text-xs opacity-55">
        百分制按常见标准换算绩点，仅供估算；各校算法可能不同。全部本地计算。
      </p>
    </div>
  );
}
