/**
 * 微分方程求解器 · 纯 TS 计算层（零依赖）
 *
 * 负责：
 *   1. 把用户写的 f(x, y) 表达式编译成可求值函数（递归下降解析器）
 *   2. 用四阶龙格-库塔法（RK4）对一阶常微分方程初值问题 dy/dx = f(x,y) 做数值积分
 *
 * 这一层完全不依赖 UI，因此既能被 Tool.tsx（客户端）调用，
 * 也能被 build 期的 [...sub].astro（静态生成长尾页采样表）直接 import。
 */

export type Vars = { x: number; y: number };

type Node =
  | { t: 'num'; v: number }
  | { t: 'var'; name: string }
  | { t: 'unary'; op: '-' | '+'; a: Node }
  | { t: 'bin'; op: '+' | '-' | '*' | '/'; a: Node; b: Node }
  | { t: 'pow'; a: Node; b: Node }
  | { t: 'call'; name: string; args: Node[] };

const FUNCS: Record<string, (...a: number[]) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  exp: Math.exp,
  log: Math.log,
  ln: Math.log,
  sqrt: Math.sqrt,
  abs: Math.abs,
  pow: (a, b) => Math.pow(a, b),
  min: Math.min,
  max: Math.max,
  sign: Math.sign,
};

const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

/** 兼容原站 Math.xxx 写法：Math.sin → sin、Math.PI → pi 等 */
function normalize(src: string): string {
  return src
    .replace(/Math\.sin/g, 'sin')
    .replace(/Math\.cos/g, 'cos')
    .replace(/Math\.tan/g, 'tan')
    .replace(/Math\.exp/g, 'exp')
    .replace(/Math\.log/g, 'log')
    .replace(/Math\.sqrt/g, 'sqrt')
    .replace(/Math\.abs/g, 'abs')
    .replace(/Math\.pow/g, 'pow')
    .replace(/Math\.PI/g, 'pi')
    .replace(/Math\.E/g, 'e');
}

function tokenize(s: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const isDigit = (c: string) => c >= '0' && c <= '9';
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }
    if (isDigit(c) || (c === '.' && isDigit(s[i + 1] ?? ''))) {
      let j = i;
      while (j < s.length && (isDigit(s[j]) || s[j] === '.')) j++;
      tokens.push(s.slice(i, j));
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z0-9_]/.test(s[j])) j++;
      tokens.push(s.slice(i, j));
      i = j;
      continue;
    }
    if ('+-*/^()'.includes(c)) {
      tokens.push(c);
      i++;
      continue;
    }
    throw new Error(`无法识别的字符：「${c}」`);
  }
  return tokens;
}

class Parser {
  pos = 0;
  tk: string[];
  constructor(tk: string[]) {
    this.tk = tk;
  }
  peek(): string | undefined {
    return this.tk[this.pos];
  }
  next(): string {
    return this.tk[this.pos++];
  }
  parse(): Node {
    const n = this.expr();
    if (this.pos < this.tk.length) throw new Error(`多余的内容：「${this.tk[this.pos]}」`);
    return n;
  }
  expr(): Node {
    let left = this.term();
    while (this.peek() === '+' || this.peek() === '-') {
      const op = this.next() as '+' | '-';
      left = { t: 'bin', op, a: left, b: this.term() };
    }
    return left;
  }
  term(): Node {
    let left = this.factor();
    while (this.peek() === '*' || this.peek() === '/') {
      const op = this.next() as '*' | '/';
      left = { t: 'bin', op, a: left, b: this.factor() };
    }
    return left;
  }
  factor(): Node {
    if (this.peek() === '-' || this.peek() === '+') {
      const op = this.next() as '-' | '+';
      return { t: 'unary', op, a: this.factor() };
    }
    const base = this.base();
    if (this.peek() === '^') {
      this.next();
      return { t: 'pow', a: base, b: this.factor() }; // 右结合
    }
    return base;
  }
  base(): Node {
    const t = this.peek();
    if (t === '(') {
      this.next();
      const n = this.expr();
      if (this.peek() !== ')') throw new Error('括号不匹配，缺少 )');
      this.next();
      return n;
    }
    if (t === undefined) throw new Error('表达式不完整');
    if (/^[a-zA-Z_]/.test(t)) {
      this.next();
      if (this.peek() === '(') {
        this.next();
        const args: Node[] = [];
        if (this.peek() !== ')') {
          args.push(this.expr());
          while (this.peek() === ',') {
            this.next();
            args.push(this.expr());
          }
        }
        if (this.peek() !== ')') throw new Error(`函数 ${t} 缺少 )`);
        this.next();
        return { t: 'call', name: t, args };
      }
      return { t: 'var', name: t };
    }
    if (/^\d/.test(t) || t === '.') {
      this.next();
      const v = Number(t);
      if (!Number.isFinite(v)) throw new Error(`无效数字：${t}`);
      return { t: 'num', v };
    }
    throw new Error(`无法解析：「${t}」`);
  }
}

function evalNode(n: Node, v: Vars): number {
  switch (n.t) {
    case 'num':
      return n.v;
    case 'var':
      if (n.name === 'x') return v.x;
      if (n.name === 'y') return v.y;
      if (n.name in CONSTS) return CONSTS[n.name];
      throw new Error(`未知变量或常量：「${n.name}」（仅支持 x, y, pi, e）`);
    case 'unary':
      return n.op === '-' ? -evalNode(n.a, v) : evalNode(n.a, v);
    case 'bin': {
      const a = evalNode(n.a, v);
      const b = evalNode(n.b, v);
      switch (n.op) {
        case '+':
          return a + b;
        case '-':
          return a - b;
        case '*':
          return a * b;
        case '/':
          return a / b;
      }
    }
    case 'pow':
      return Math.pow(evalNode(n.a, v), evalNode(n.b, v));
    case 'call': {
      const fn = FUNCS[n.name];
      if (!fn) throw new Error(`未知函数：「${n.name}」`);
      return fn(...n.args.map((arg) => evalNode(arg, v)));
    }
  }
}

/** 编译方程为求值函数；解析失败抛出带原因的 Error */
export function compile(expr: string): (v: Vars) => number {
  const norm = normalize(expr);
  const tk = tokenize(norm);
  if (tk.length === 0) throw new Error('方程不能为空');
  const ast = new Parser(tk).parse();
  return (v: Vars) => evalNode(ast, v);
}

export const MAX_STEPS = 2000;

export interface OdePoint {
  x: number;
  y: number;
}

export interface OdeResult {
  ok: true;
  equation: string;
  x0: number;
  y0: number;
  xEnd: number;
  h: number; // 实际步长（含方向符号）
  steps: number;
  points: OdePoint[];
  yMin: number;
  yMax: number;
  final: OdePoint;
}

export type OdeSolve = { ok: false; error: string } | OdeResult;

/**
 * 求解一阶常微分方程初值问题 dy/dx = f(x, y)。
 * 支持正向（xEnd > x0）与反向（xEnd < x0）积分。
 */
export function solveODE(
  expr: string,
  x0: number,
  y0: number,
  xEnd: number,
  h: number,
): OdeSolve {
  if (
    !Number.isFinite(x0) ||
    !Number.isFinite(y0) ||
    !Number.isFinite(xEnd) ||
    !Number.isFinite(h)
  ) {
    return { ok: false, error: '请填写有效的数字（x₀、y₀、终点、步长）' };
  }
  if (h <= 0) return { ok: false, error: '步长 h 必须大于 0' };

  const dir = xEnd >= x0 ? 1 : -1;
  const span = (xEnd - x0) * dir;
  const steps = Math.round(span / h);
  if (steps <= 0) return { ok: false, error: '终点与起点相同，没有求解区间' };
  if (steps > MAX_STEPS)
    return {
      ok: false,
      error: `步数 ${steps} 超过上限 ${MAX_STEPS}，请增大步长 h 或缩小区间`,
    };

  let f: (v: Vars) => number;
  try {
    f = compile(expr);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '方程解析失败' };
  }

  const hh = h * dir;
  const points: OdePoint[] = [{ x: x0, y: y0 }];
  let x = x0;
  let y = y0;
  let yMin = y;
  let yMax = y;

  for (let i = 0; i < steps; i++) {
    let k1: number, k2: number, k3: number, k4: number;
    try {
      k1 = f({ x, y });
      k2 = f({ x: x + hh / 2, y: y + (hh / 2) * k1 });
      k3 = f({ x: x + hh / 2, y: y + (hh / 2) * k2 });
      k4 = f({ x: x + hh, y: y + hh * k3 });
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : '方程在区间内求值出错' };
    }
    y = y + (hh / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    x = x + hh;
    points.push({ x, y });
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }

  return {
    ok: true,
    equation: expr,
    x0,
    y0,
    xEnd,
    h: hh,
    steps,
    points,
    yMin,
    yMax,
    final: points[points.length - 1],
  };
}
