import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { solveODE, type OdePoint } from './solve';
import { EXAMPLES } from './examples';

interface Props {
  initialEquation?: string;
  initialX0?: string;
  initialY0?: string;
  initialXEnd?: string;
  initialH?: string;
}

const PAD = 36;

/** 最多保留 8 位有效数并去掉多余 0 */
function num(n: number, sig = 8): string {
  if (!Number.isFinite(n)) return '—';
  return String(Number(n.toPrecision(sig)));
}

function parseNum(s: string): number | null {
  const v = s.trim();
  if (v === '' || v === '-') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function OdeSolver(props: Props) {
  const [equation, setEquation] = useState(props.initialEquation ?? '-2*y + x');
  const [x0, setX0] = useState(props.initialX0 ?? '0');
  const [y0, setY0] = useState(props.initialY0 ?? '1');
  const [xEnd, setXEnd] = useState(props.initialXEnd ?? '2');
  const [h, setH] = useState(props.initialH ?? '0.05');

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
    const _x0 = parseNum(x0);
    const _y0 = parseNum(y0);
    const _xEnd = parseNum(xEnd);
    const _h = parseNum(h);
    if (_x0 === null || _y0 === null || _xEnd === null || _h === null) return null;
    if (equation.trim() === '') return null;
    return solveODE(equation, _x0, _y0, _xEnd, _h);
  }, [equation, x0, y0, xEnd, h]);

  const json = useMemo(() => {
    if (!result || !result.ok) return '';
    return JSON.stringify(
      {
        solver: 'RK4 (四阶龙格-库塔)',
        equation: result.equation,
        initial: { x0: result.x0, y0: result.y0 },
        step_size: Math.abs(result.h),
        points_count: result.points.length,
        sampled_data: result.points.map((p) => ({ x: p.x, y: p.y })),
        final_point: result.final,
      },
      null,
      2,
    );
  }, [result]);

  // 均匀降采样到约 20 行用于表格展示
  const tableRows = useMemo(() => {
    if (!result || !result.ok) return [] as OdePoint[];
    const pts = result.points;
    const n = pts.length;
    const target = 20;
    if (n <= target) return pts;
    const step = (n - 1) / (target - 1);
    const out: OdePoint[] = [];
    for (let i = 0; i < target; i++) out.push(pts[Math.round(i * step)]);
    return out;
  }, [result]);

  // 手绘 SVG 解曲线（无图表库）
  const svg = useMemo(() => {
    if (!result || !result.ok) return null;
    const pts = result.points;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const xmin = Math.min(...xs);
    const xmax = Math.max(...xs);
    const ymin = Math.min(...ys);
    const ymax = Math.max(...ys);
    const W = 600;
    const H = 300;
    const dx = xmax - xmin || 1;
    const dy = ymax - ymin || 1;
    const sx = (x: number) => PAD + ((x - xmin) / dx) * (W - 2 * PAD);
    const sy = (v: number) => H - PAD - ((v - ymin) / dy) * (H - 2 * PAD);
    const d = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`)
      .join(' ');
    return {
      W,
      H,
      d,
      xmin,
      xmax,
      ymin,
      ymax,
      yAxisX: sx(0),
      xAxisY: sy(0),
    };
  }, [result]);

  return (
    <div class="space-y-5">
      {/* 方程输入 */}
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">方程 dy/dx = f(x, y)</span>
          <input
            type="text"
            spellcheck={false}
            class="input input-bordered input-sm mt-1 w-full font-mono"
            value={equation}
            onInput={(e) => setEquation((e.target as HTMLInputElement).value)}
            placeholder="-2*y + x"
          />
        </label>
        <p class="mt-1 text-xs opacity-55">
          支持 sin cos tan exp log sqrt pow abs 与常量 pi、e，变量 x、y；乘法需显式写
          <code class="px-1">*</code>，幂用<code class="px-1">^</code>或
          <code class="px-1">pow</code>。
        </p>
      </div>

      {/* 参数 */}
      <div class="grid gap-3 sm:grid-cols-4">
        <label class="block">
          <span class="text-xs opacity-60">x₀（初始点）</span>
          <input
            type="number"
            inputmode="decimal"
            step="any"
            class="input input-bordered input-sm mt-1 w-full font-mono"
            value={x0}
            onInput={(e) => setX0((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-xs opacity-60">y₀ = y(x₀)</span>
          <input
            type="number"
            inputmode="decimal"
            step="any"
            class="input input-bordered input-sm mt-1 w-full font-mono"
            value={y0}
            onInput={(e) => setY0((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-xs opacity-60">终点 x_end</span>
          <input
            type="number"
            inputmode="decimal"
            step="any"
            class="input input-bordered input-sm mt-1 w-full font-mono"
            value={xEnd}
            onInput={(e) => setXEnd((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-xs opacity-60">步长 h（&gt;0）</span>
          <input
            type="number"
            inputmode="decimal"
            step="any"
            class="input input-bordered input-sm mt-1 w-full font-mono"
            value={h}
            onInput={(e) => setH((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      {/* 示例库 */}
      <div>
        <p class="text-xs opacity-60 mb-2">常用方程示例库（点击一键填充）：</p>
        <div class="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              type="button"
              class="btn btn-sm btn-outline"
              onClick={() => {
                setEquation(ex.equation);
                setX0(String(ex.x0));
                setY0(String(ex.y0));
                setXEnd(String(ex.xEnd));
                setH(String(ex.h));
              }}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* 状态 */}
      {!result && <p class="text-sm text-error">请填写方程与有效的数字参数</p>}
      {result && !result.ok && <p class="text-sm text-error">{result.error}</p>}

      {result && result.ok && (
        <>
          {/* 摘要 */}
          <div class="rounded-xl bg-base-200 p-3 sm:p-4">
            <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span>
                共计算 <strong class="font-mono">{result.points.length}</strong> 个点
              </span>
              <span>
                终点 y({num(result.xEnd)}) ={' '}
                <strong class="font-mono">{num(result.final.y)}</strong>
              </span>
              <span>
                y 范围：
                <span class="font-mono">{num(result.yMin)}</span> ~{' '}
                <span class="font-mono">{num(result.yMax)}</span>
              </span>
            </div>
          </div>

          {/* 解曲线 */}
          {svg && (
            <div class="rounded-xl bg-base-200 p-3 sm:p-4">
              <p class="text-sm font-medium mb-2">解曲线 y(x)</p>
              <svg
                viewBox={`0 0 ${svg.W} ${svg.H}`}
                class="w-full h-auto"
                role="img"
                aria-label="微分方程数值解曲线"
              >
                <line
                  x1={svg.yAxisX}
                  y1={PAD}
                  x2={svg.yAxisX}
                  y2={svg.H - PAD}
                  stroke="currentColor"
                  stroke-opacity="0.25"
                />
                <line
                  x1={PAD}
                  y1={svg.xAxisY}
                  x2={svg.W - PAD}
                  y2={svg.xAxisY}
                  stroke="currentColor"
                  stroke-opacity="0.25"
                />
                <path d={svg.d} fill="none" stroke="currentColor" stroke-width="2" />
                <text x={PAD} y={svg.H - 10} font-size="11" fill="currentColor" opacity="0.6">
                  {num(svg.xmin, 4)}
                </text>
                <text
                  x={svg.W - PAD - 44}
                  y={svg.H - 10}
                  font-size="11"
                  fill="currentColor"
                  opacity="0.6"
                >
                  {num(svg.xmax, 4)}
                </text>
                <text x={PAD + 4} y={PAD + 2} font-size="11" fill="currentColor" opacity="0.6">
                  {num(svg.ymax, 4)}
                </text>
              </svg>
            </div>
          )}

          {/* 采样表 */}
          <div class="rounded-xl bg-base-200 p-3 sm:p-4">
            <p class="text-sm font-medium mb-2">数值采样表（均匀间隔，仅展示部分节点）</p>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>x</th>
                    <th>y(x)</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((p, i) => (
                    <tr key={i}>
                      <td class="font-mono">{num(p.x)}</td>
                      <td class="font-mono">{num(p.y)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p class="mt-2 text-xs opacity-55">
              完整 {result.points.length} 个节点见下方 JSON。
            </p>
          </div>

          {/* JSON 导出 */}
          <div class="rounded-xl bg-base-200 p-3 sm:p-4">
            <div class="flex items-center gap-3">
              <p class="text-sm font-medium">求解数据（JSON）</p>
              <button
                type="button"
                class={`btn btn-xs ${copied === 'json' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(json, 'json')}
              >
                {copied === 'json' ? '已复制' : '复制 JSON'}
              </button>
            </div>
            <details class="mt-2">
              <summary class="cursor-pointer text-xs opacity-70">展开查看</summary>
              <pre class="mt-2 max-h-64 overflow-auto rounded bg-base-300 p-2 text-xs font-mono">
                {json}
              </pre>
            </details>
          </div>
        </>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        所有计算均在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
