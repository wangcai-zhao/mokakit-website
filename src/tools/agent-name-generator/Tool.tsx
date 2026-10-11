import { useState } from 'preact/hooks';

const BANKS: Record<string, { pre: string[]; core: string[]; suf: string[] }> = {
  科技感: {
    pre: ['Neo', 'Hyper', 'Quantum', 'Cyber', 'Nova', 'Aero', 'Syn', 'Meta'],
    core: ['Mind', 'Bot', 'Core', 'Flow', 'Pulse', 'Linx', 'Forge', 'Grid'],
    suf: ['AI', 'X', 'Lab', 'OS', 'Pro'],
  },
  可爱: {
    pre: ['小', '萌', '糖', '波', '果', '星', '布', '豆'],
    core: ['灵', '喵', '团', '仔', '宝', '丸', '仔', '叽'],
    suf: ['酱', '君', '同学', '助手', '宝宝'],
  },
  专业: {
    pre: ['智', '云', '数', '信', '睿', '通', '联', '衡'],
    core: ['析', '策', '管', '达', '擎', '枢', '维', '瞻'],
    suf: ['官', '师', '员', '台', '引擎'],
  },
  极简: {
    pre: ['', 'One', 'Go', 'Hi', 'We', 'Yu', 'Ai', 'Zen'],
    core: ['Bot', 'Now', 'Hub', 'Key', 'Link', 'Say', 'Do', 'Mind'],
    suf: ['', '.ai', 'Lite', 'Mini'],
  },
};

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export default function AgentNameGenerator() {
  const [kw, setKw] = useState('');
  const [style, setStyle] = useState<keyof typeof BANKS>('科技感');
  const [names, setNames] = useState<string[]>([]);

  const gen = () => {
    const bank = BANKS[style];
    const out: string[] = [];
    const seen = new Set<string>();
    let guard = 0;
    while (out.length < 8 && guard < 200) {
      guard++;
      const n = `${pick(bank.pre)}${kw}${pick(bank.core)}${pick(bank.suf)}`.replace(/\s+/g, '');
      if (n.trim() && !seen.has(n)) {
        seen.add(n);
        out.push(n);
      }
    }
    setNames(out);
  };

  return (
    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="form-control">
          <span class="label-text text-xs mb-1">关键词（可选）</span>
          <input class="input input-sm input-bordered" placeholder="如：财 / 研 / 客" value={kw} onInput={(e) => setKw((e.target as HTMLInputElement).value)} />
        </label>
        <label class="form-control">
          <span class="label-text text-xs mb-1">风格</span>
          <select class="select select-sm select-bordered" value={style} onChange={(e) => setStyle((e.target as HTMLSelectElement).value as keyof typeof BANKS)}>
            {Object.keys(BANKS).map((s) => (
              <option value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <button class="btn btn-primary btn-sm" onClick={gen}>生成候选名</button>

      {names.length > 0 && (
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {names.map((n) => (
            <div class="badge badge-lg badge-outline w-full justify-center py-3">{n}</div>
          ))}
        </div>
      )}
      <p class="text-xs opacity-60">组合来自内置词库，可能与现有产品重名，正式使用前请自行检索商标 / 域名。</p>
    </div>
  );
}
