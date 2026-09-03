import { useState, useMemo } from 'preact/hooks';

interface SV {
  major: number;
  minor: number;
  patch: number;
  pre: { num: number | null; str: string | null }[];
}

function parseSemver(v: string): SV | null {
  const m = v
    .trim()
    .match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.\-]+))?(?:\+[0-9A-Za-z.\-]+)?$/);
  if (!m) return null;
  const pre = m[4]
    ? m[4]
        .split('.')
        .map((id) =>
          /^\d+$/.test(id) ? { num: parseInt(id, 10), str: null } : { num: null, str: id },
        )
    : [];
  return { major: +m[1], minor: +m[2], patch: +m[3], pre };
}

function cmpPre(a: SV['pre'], b: SV['pre']): number {
  if (a.length === 0 && b.length === 0) return 0;
  if (a.length === 0) return 1;
  if (b.length === 0) return -1;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i];
    const y = b[i];
    if (!x) return -1;
    if (!y) return 1;
    if (x.num !== null && y.num !== null) {
      if (x.num !== y.num) return x.num - y.num;
    } else if (x.num !== null) {
      return -1;
    } else if (y.num !== null) {
      return 1;
    } else {
      if (x.str !== y.str) return x.str! < y.str! ? -1 : 1;
    }
  }
  return 0;
}

export default function SemverCompareTool() {
  const [a, setA] = useState('1.2.3');
  const [b, setB] = useState('1.10.0');

  const result = useMemo(() => {
    const pa = parseSemver(a);
    const pb = parseSemver(b);
    if (!pa || !pb) return { ok: false, text: '版本号格式无效，应为 主.次.修 形式（可带 -预发布）。' };
    let c = pa.major - pb.major;
    if (c === 0) c = pa.minor - pb.minor;
    if (c === 0) c = pa.patch - pb.patch;
    if (c === 0) c = cmpPre(pa.pre, pb.pre);
    const label = c > 0 ? `${a} 更新` : c < 0 ? `${b} 更新` : '两版本相等';
    return { ok: true, text: label };
  }, [a, b]);

  return (
    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="block">
          <span class="text-sm font-medium">版本 A</span>
          <input
            class="input input-bordered w-full font-mono text-sm mt-1.5"
            value={a}
            onInput={(e) => setA((e.target as HTMLInputElement).value)}
            placeholder="1.2.3"
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">版本 B</span>
          <input
            class="input input-bordered w-full font-mono text-sm mt-1.5"
            value={b}
            onInput={(e) => setB((e.target as HTMLInputElement).value)}
            placeholder="1.10.0"
          />
        </label>
      </div>

      <div class="rounded-xl bg-base-200 p-4 text-center font-semibold">
        {result.text}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        遵循 Semantic Versioning 2.0.0：比较 主.次.修，再比预发布标签（正式版 &gt; 预发布；预发布按
        数字/字典序）。本地计算。
      </p>
    </div>
  );
}
