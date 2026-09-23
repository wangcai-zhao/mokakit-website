import { useState, useMemo } from 'preact/hooks';

type Matrix = number[][];
type Cells = string[][];

const OPS: { id: string; label: string }[] = [
  { id: 'add', label: 'A + B' },
  { id: 'sub', label: 'A − B' },
  { id: 'mul', label: 'A × B' },
  { id: 'mulBA', label: 'B × A' },
  { id: 'scale', label: 'k × A' },
  { id: 'transposeA', label: 'A 的转置' },
  { id: 'transposeB', label: 'B 的转置' },
  { id: 'detA', label: 'A 的行列式' },
  { id: 'detB', label: 'B 的行列式' },
  { id: 'invA', label: 'A 的逆矩阵' },
  { id: 'invB', label: 'B 的逆矩阵' },
];

function round(x: number): number {
  if (!Number.isFinite(x)) return x;
  return Number(x.toFixed(6));
}

function fmt(x: number): string {
  if (!Number.isFinite(x)) return '数值超出可表示范围';
  return String(Number(x.toFixed(4)));
}

function emptyCells(size: number, filler: number): Cells {
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => (r === c ? String(filler) : '0')),
  );
}

function resize(cells: Cells, size: number): Cells {
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => (cells[r] && cells[r][c] !== undefined ? cells[r][c] : '0')),
  );
}

type Parsed = { ok: true; m: Matrix } | { ok: false; error: string };

function parseMatrix(cells: Cells, name: string): Parsed {
  const size = cells.length;
  const m: Matrix = [];
  for (let r = 0; r < size; r += 1) {
    const row: number[] = [];
    for (let c = 0; c < size; c += 1) {
      const raw = (cells[r][c] ?? '').trim();
      if (raw === '') {
        row.push(0);
        continue;
      }
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        if (raw.length > 0 && !/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(raw)) {
          return { ok: false, error: `矩阵 ${name} 第 ${r + 1} 行第 ${c + 1} 列不是有效数字，请填写数字` };
        }
        return { ok: false, error: `矩阵 ${name} 第 ${r + 1} 行第 ${c + 1} 列的数值过大或无法识别，请换个范围` };
      }
      if (Math.abs(n) > 1e15) {
        return { ok: false, error: `矩阵 ${name} 第 ${r + 1} 行第 ${c + 1} 列数值过大，为避免运算溢出请控制在 1e15 以内` };
      }
      row.push(n);
    }
    m.push(row);
  }
  return { ok: true, m };
}

function det(m: Matrix): number {
  const n = m.length;
  if (n === 2) return round(m[0][0] * m[1][1] - m[0][1] * m[1][0]);
  const a = m[0][0];
  const b = m[0][1];
  const c = m[0][2];
  return round(
    a * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
      b * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
      c * (m[1][0] * m[2][1] - m[1][1] * m[2][0]),
  );
}

function transpose(m: Matrix): Matrix {
  return m[0].map((_, c) => m.map((row) => round(row[c])));
}

function multiply(a: Matrix, b: Matrix): Matrix {
  const n = a.length;
  const out: Matrix = [];
  for (let r = 0; r < n; r += 1) {
    const row: number[] = [];
    for (let c = 0; c < n; c += 1) {
      let sum = 0;
      for (let k = 0; k < n; k += 1) sum += a[r][k] * b[k][c];
      row.push(round(sum));
    }
    out.push(row);
  }
  return out;
}

function addOrSub(a: Matrix, b: Matrix, sign: 1 | -1): Matrix {
  return a.map((row, r) => row.map((v, c) => round(v + sign * b[r][c])));
}

function scale(a: Matrix, k: number): Matrix {
  return a.map((row) => row.map((v) => round(v * k)));
}

function inverse(m: Matrix): Matrix | null {
  const d = det(m);
  if (Math.abs(d) < 1e-9) return null;
  const n = m.length;
  if (n === 2) {
    return [
      [round(m[1][1] / d), round(-m[0][1] / d)],
      [round(-m[1][0] / d), round(m[0][0] / d)],
    ];
  }
  const cof: Matrix = [];
  for (let r = 0; r < 3; r += 1) {
    const row: number[] = [];
    for (let c = 0; c < 3; c += 1) {
      const rs = [0, 1, 2].filter((x) => x !== r);
      const cs = [0, 1, 2].filter((x) => x !== c);
      const minor =
        m[rs[0]][cs[0]] * m[rs[1]][cs[1]] - m[rs[0]][cs[1]] * m[rs[1]][cs[0]];
      row.push(round(((r + c) % 2 === 0 ? 1 : -1) * minor));
    }
    cof.push(row);
  }
  // 伴随矩阵 = 余子式矩阵的转置，再除以行列式
  const adj = transpose(cof);
  return adj.map((row) => row.map((v) => round(v / d)));
}

type Result =
  | { ok: false; error: string }
  | { ok: true; matrix: Matrix | null; scalar: number | null; label: string };

export default function MatrixCalculator() {
  const [size, setSize] = useState(2);
  const [a, setA] = useState<Cells>(() => emptyCells(2, 1));
  const [b, setB] = useState<Cells>(() => emptyCells(2, 2));
  const [scalar, setScalar] = useState('2');
  const [op, setOp] = useState('mul');

  const changeSize = (next: number) => {
    setSize(next);
    setA((prev) => resize(prev, next));
    setB((prev) => resize(prev, next));
  };

  const result = useMemo<Result | null>(() => {
    const pa = parseMatrix(a, 'A');
    if (!pa.ok) return { ok: false, error: pa.error };
    const pb = parseMatrix(b, 'B');
    if (!pb.ok) return { ok: false, error: pb.error };
    const k = scalar.trim() === '' ? 1 : Number(scalar);
    if (!Number.isFinite(k)) return { ok: false, error: '标量 k 不是有效数字，请填写数字' };
    if (Math.abs(k) > 1e15) return { ok: false, error: '标量 k 数值过大，请控制在 1e15 以内' };

    const label = OPS.find((o) => o.id === op)?.label ?? '';
    switch (op) {
      case 'add':
        return { ok: true, matrix: addOrSub(pa.m, pb.m, 1), scalar: null, label };
      case 'sub':
        return { ok: true, matrix: addOrSub(pa.m, pb.m, -1), scalar: null, label };
      case 'mul':
        return { ok: true, matrix: multiply(pa.m, pb.m), scalar: null, label };
      case 'mulBA':
        return { ok: true, matrix: multiply(pb.m, pa.m), scalar: null, label };
      case 'scale':
        return { ok: true, matrix: scale(pa.m, k), scalar: null, label };
      case 'transposeA':
        return { ok: true, matrix: transpose(pa.m), scalar: null, label };
      case 'transposeB':
        return { ok: true, matrix: transpose(pb.m), scalar: null, label };
      case 'detA':
        return { ok: true, matrix: null, scalar: det(pa.m), label };
      case 'detB':
        return { ok: true, matrix: null, scalar: det(pb.m), label };
      case 'invA': {
        const inv = inverse(pa.m);
        if (!inv) return { ok: false, error: '该矩阵不可逆（行列式为 0），矩阵 A 是奇异矩阵' };
        return { ok: true, matrix: inv, scalar: null, label };
      }
      case 'invB': {
        const inv = inverse(pb.m);
        if (!inv) return { ok: false, error: '该矩阵不可逆（行列式为 0），矩阵 B 是奇异矩阵' };
        return { ok: true, matrix: inv, scalar: null, label };
      }
      default:
        return { ok: false, error: '未知运算' };
    }
  }, [a, b, scalar, op]);

  const dets = useMemo(() => {
    const pa = parseMatrix(a, 'A');
    const pb = parseMatrix(b, 'B');
    return {
      detA: pa.ok ? det(pa.m) : null,
      detB: pb.ok ? det(pb.m) : null,
    };
  }, [a, b]);

  const setCell = (
    which: 'a' | 'b',
    r: number,
    c: number,
    v: string,
  ) => {
    const setter = which === 'a' ? setA : setB;
    setter((prev) => prev.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)));
  };

  const gridClass = size === 2 ? 'grid-cols-2' : 'grid-cols-3';

  const renderInput = (which: 'a' | 'b', title: string) => {
    const cells = which === 'a' ? a : b;
    return (
      <div>
        <p class="text-sm font-medium">{title}</p>
        <div class={`mt-1.5 grid gap-2 ${gridClass} max-w-xs`}>
          {cells.map((row, r) =>
            row.map((cell, c) => (
              <input
                key={`${which}-${r}-${c}`}
                type="text"
                inputmode="decimal"
                autocomplete="off"
                spellcheck={false}
                class="input input-bordered input-sm w-full text-center font-mono"
                value={cell}
                onInput={(e) => setCell(which, r, c, (e.target as HTMLInputElement).value)}
              />
            )),
          )}
        </div>
      </div>
    );
  };

  const renderMatrix = (m: Matrix) => (
    <div class={`grid gap-2 ${gridClass} max-w-xs`}>
      {m.map((row, r) =>
        row.map((v, c) => (
          <div
            key={`res-${r}-${c}`}
            class="rounded-lg bg-base-100 px-2 py-2 text-center font-mono text-sm"
          >
            {fmt(v)}
          </div>
        )),
      )}
    </div>
  );

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-medium">矩阵规模</span>
          <button
            type="button"
            class={`btn btn-xs ${size === 2 ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => changeSize(2)}
          >
            2 × 2
          </button>
          <button
            type="button"
            class={`btn btn-xs ${size === 3 ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => changeSize(3)}
          >
            3 × 3
          </button>
          <button
            type="button"
            class="btn btn-xs btn-ghost"
            onClick={() => {
              setA(emptyCells(size, 1));
              setB(emptyCells(size, 2));
            }}
          >
            重置为默认矩阵
          </button>
        </div>

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          {renderInput('a', '矩阵 A')}
          {renderInput('b', '矩阵 B')}
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-[auto_1fr]">
          <label class="block max-w-xs">
            <span class="text-sm font-medium">标量 k</span>
            <input
              type="text"
              inputmode="decimal"
              autocomplete="off"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 2"
              value={scalar}
              onInput={(e) => setScalar((e.target as HTMLInputElement).value)}
            />
          </label>
          <div>
            <span class="text-sm font-medium">选择运算</span>
            <div class="mt-1.5 flex flex-wrap gap-2">
              {OPS.map((o) => (
                <button
                  type="button"
                  class={`btn btn-xs ${op === o.id ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setOp(o.id)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {result && !result.ok && (
          <div class="alert alert-error mt-4">
            <span class="text-sm">{result.error}</span>
          </div>
        )}

        {result && result.ok && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge badge-outline">{result.label}</span>
              {result.matrix ? (
                <span class="badge badge-outline">
                  {size} × {size}
                </span>
              ) : (
                <span class="badge badge-outline">标量结果</span>
              )}
            </div>

            {result.matrix && renderMatrix(result.matrix)}

            {result.scalar !== null && (
              <p class="font-mono text-2xl font-bold">{fmt(result.scalar)}</p>
            )}

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">A 的行列式</td>
                    <td class="text-right font-mono">{dets.detA === null ? '输入有误' : fmt(dets.detA)}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">B 的行列式</td>
                    <td class="text-right font-mono">{dets.detB === null ? '输入有误' : fmt(dets.detB)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        矩阵乘法取左矩阵行与右矩阵列逐项相乘求和，因此不满足交换律，工具单独列出了 B × A。求逆先算行列式，行列式为 0
        的奇异矩阵没有逆矩阵，会直接报错。每一步运算后都做六位小数归一化以消除浮点噪声，展示时收敛到四位小数并去掉末尾多余的 0。所有计算在浏览器本地完成。
      </p>
    </div>
  );
}
