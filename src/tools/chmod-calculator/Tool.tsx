import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const PERMS = [
  { bit: 4, char: 'r', label: '读' },
  { bit: 2, char: 'w', label: '写' },
  { bit: 1, char: 'x', label: '执行' },
];

const GROUPS = [
  { key: 'u', label: '所有者', hint: 'user' },
  { key: 'g', label: '所属组', hint: 'group' },
  { key: 'o', label: '其他人', hint: 'others' },
] as const;

type GroupKey = (typeof GROUPS)[number]['key'];

const SPECIAL: { bit: number; char: string; label: string; hint: string }[] = [
  { bit: 4, char: 's', label: 'setuid', hint: '以文件所有者身份执行' },
  { bit: 2, char: 's', label: 'setgid', hint: '以文件所属组身份执行' },
  { bit: 1, char: 't', label: 'sticky', hint: '只有所有者能删自己的文件' },
];

const PRESETS = [
  { label: '644 普通文件', value: 644, desc: '所有者可读写，其他人只读' },
  { label: '755 可执行 / 目录', value: 755, desc: '所有者全权限，其他人可读可执行' },
  { label: '600 私钥 / 密钥', value: 600, desc: '只有所有者能读写' },
  { label: '700 个人目录', value: 700, desc: '只有所有者能访问' },
  { label: '666 不推荐', value: 666, desc: '所有人可读写，安全性差' },
  { label: '777 危险', value: 777, desc: '所有人全权限，别用在生产环境' },
  { label: '775 团队共享', value: 775, desc: '组内可写，其他人只读' },
  { label: '1777 /tmp 风格', value: 1777, desc: '任何人可写但只能删自己的' },
];

export default function ChmodCalculatorTool() {
  const [octal, setOctal] = useState(755);
  const [copied, setCopied] = useState(false);

  const groups = useMemo(() => {
    const s = String(octal).padStart(3, '0').slice(-3);
    return { u: Number(s[0]), g: Number(s[1]), o: Number(s[2]) };
  }, [octal]);

  const special = useMemo(() => (octal > 777 ? Math.floor(octal / 1000) : 0), [octal]);

  const has = (group: number, bit: number) => (group & bit) !== 0;

  const symbolic = useMemo(() => {
    const parts = GROUPS.map((g) => {
      const v = groups[g.key];
      return PERMS.map((p) => (has(v, p.bit) ? p.char : '-')).join('');
    });
    let s = parts.join('');
    if (special & 4) s = s.slice(0, 2) + (has(groups.u, 1) ? 's' : 'S') + s.slice(3);
    if (special & 2) s = s.slice(0, 5) + (has(groups.g, 1) ? 's' : 'S') + s.slice(6);
    if (special & 1) s = s.slice(0, 8) + (has(groups.o, 1) ? 't' : 'T');
    return s;
  }, [groups, special]);

  const toggle = (key: GroupKey, bit: number) => {
    const cur = groups[key];
    const next = has(cur, bit) ? cur & ~bit : cur | bit;
    const arr = [groups.u, groups.g, groups.o];
    const idx = GROUPS.findIndex((g) => g.key === key);
    arr[idx] = next;
    setOctal(Number(arr.join('')) + special * 1000);
  };

  const toggleSpecial = (bit: number) => {
    const next = special & bit ? special & ~bit : special | bit;
    setOctal(next * 1000 + groups.u * 100 + groups.g * 10 + groups.o);
  };

  const chmodCmd = `chmod ${String(octal).padStart(special ? 4 : 3, '0')} filename`;
  const symbolicCmd = useMemo(() => {
    const ops: string[] = [];
    for (const g of GROUPS) {
      const v = groups[g.key];
      const chars = PERMS.filter((p) => has(v, p.bit)).map((p) => p.char).join('');
      ops.push(`${g.key}=${chars || ''}`);
    }
    return `chmod ${ops.join(',')} filename`;
  }, [groups]);

  return (
    <div class="space-y-4">
      <label class="block">
        <span class="text-sm font-medium">八进制权限</span>
        <input
          type="number"
          min="0"
          max="7777"
          class="input input-bordered mt-1.5 w-full font-mono text-lg"
          value={octal}
          onInput={(e) => {
            const v = Number((e.target as HTMLInputElement).value) || 0;
            setOctal(Math.min(7777, Math.max(0, v)));
          }}
        />
      </label>

      <div class="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            type="button"
            key={p.label}
            class={`btn btn-xs ${octal === p.value ? 'btn-primary' : 'btn-outline'}`}
            title={p.desc}
            onClick={() => setOctal(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div class="overflow-x-auto rounded-xl border border-base-300">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>作用对象</th>
              {PERMS.map((p) => (
                <th key={p.char} class="text-center">
                  {p.label}（{p.char}）
                </th>
              ))}
              <th class="text-center">数字</th>
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((g) => (
              <tr key={g.key}>
                <td>
                  <span class="font-medium">{g.label}</span>
                  <span class="ml-1 font-mono text-xs opacity-50">{g.hint}</span>
                </td>
                {PERMS.map((p) => (
                  <td class="text-center" key={p.char}>
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      checked={has(groups[g.key], p.bit)}
                      onChange={() => toggle(g.key, p.bit)}
                    />
                  </td>
                ))}
                <td class="text-center font-mono">{groups[g.key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <span class="text-sm font-medium">特殊权限位</span>
        <div class="mt-2 flex flex-wrap gap-4 rounded-xl bg-base-200 px-4 py-3">
          {SPECIAL.map((s) => (
            <label class="flex cursor-pointer items-center gap-2 text-sm" key={s.label}>
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                checked={(special & s.bit) !== 0}
                onChange={() => toggleSpecial(s.bit)}
              />
              <span>
                {s.label}
                <span class="ml-1 text-xs opacity-50">{s.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div class="rounded-xl border border-base-300 bg-base-100 p-4">
        <span class="text-xs opacity-60">符号表示</span>
        <p class="mt-1 font-mono text-2xl font-bold tracking-widest text-primary">{symbolic}</p>
        <p class="mt-1 text-xs opacity-55">
          {special > 0 ? `${special}${groups.u}${groups.g}${groups.o}（特殊位 ${special}）` : '普通三位权限'}
        </p>
      </div>

      <div class="space-y-2">
        {[
          { label: '数字形式命令', cmd: chmodCmd },
          { label: '符号形式命令', cmd: symbolicCmd },
        ].map((c) => (
          <div
            class="flex items-center justify-between gap-3 rounded-xl bg-base-200 px-4 py-2.5"
            key={c.label}
          >
            <div class="min-w-0">
              <span class="block text-xs opacity-60">{c.label}</span>
              <code class="font-mono text-sm">{c.cmd}</code>
            </div>
            <button
              type="button"
              class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={async () => {
                await copyText(c.cmd);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              }}
            >
              复制
            </button>
          </div>
        ))}
      </div>

      <p class="text-xs leading-relaxed opacity-55">
        目录要有 x 权限才能进入，文件有 x 才能执行。777
        在生产环境几乎是事故的同义词，日志、私钥、配置文件一律收紧到
        600 或 640。计算全在本地完成。
      </p>
    </div>
  );
}
