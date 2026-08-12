import { useState, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/** 常见中文姓氏 */
const SURNAMES = [
  '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周',
  '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗',
  '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹',
  '彭', '曾', '肖', '田', '董', '袁', '潘', '蒋', '蔡', '余',
];

/** 常用名字用字 */
const GIVEN_CHARS = [
  '伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '洋', '艳',
  '杰', '娟', '涛', '明', '超', '霞', '平', '刚', '英', '华',
  '玉', '兰', '凤', '云', '建', '文', '辉', '雪', '春', '宇',
  '晨', '泽', '佳', '欣', '悦', '浩', '然', '轩', '子', '梓',
  '涵', '诗', '嘉', '睿', '博', '鑫', '琳', '婷', '怡', '安',
  '清', '思', '若', '语', '菲', '航', '瑶', '楠', '恒', '洁',
];

/** 常见英文名 */
const EN_FIRST = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Emily',
  'Oliver', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia',
];

/** 常见英文姓 */
const EN_LAST = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris',
  'Clark', 'Lewis', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott',
];

function randInt(max: number): number {
  if (max <= 1) return 0;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let v = 0;
    do {
      crypto.getRandomValues(buf);
      v = buf[0];
    } while (v >= limit);
    return v % max;
  }
  return Math.floor(Math.random() * max);
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(arr.length)] as T;
}

type Lang = 'zh' | 'en';
type Len = 'auto' | '1' | '2';

function makeZh(len: Len): string {
  const n = len === 'auto' ? (randInt(10) < 7 ? 2 : 1) : Number(len);
  let given = '';
  for (let i = 0; i < n; i++) given += pick(GIVEN_CHARS);
  return pick(SURNAMES) + given;
}

function makeEn(): string {
  return `${pick(EN_FIRST)} ${pick(EN_LAST)}`;
}

function generate(lang: Lang, len: Len, count: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  // 尽量去重，但避免样本不足时死循环
  for (let guard = 0; out.length < count && guard < count * 30; guard++) {
    const name = lang === 'zh' ? makeZh(len) : makeEn();
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  while (out.length < count) out.push(lang === 'zh' ? makeZh(len) : makeEn());
  return out;
}

export default function NameGenerator() {
  const [lang, setLang] = useState<Lang>('zh');
  const [len, setLen] = useState<Len>('auto');
  const [count, setCount] = useState(8);
  const [list, setList] = useState<string[]>(() => generate('zh', 'auto', 8));
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const refresh = (l: Lang, ln: Len, c: number) => {
    setList(generate(l, ln, c));
    setCopied(null);
  };

  const copy = async (text: string, key: string) => {
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="join">
          <button
            type="button"
            class={`btn btn-sm join-item ${lang === 'zh' ? 'btn-active btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setLang('zh');
              refresh('zh', len, count);
            }}
          >
            中文名
          </button>
          <button
            type="button"
            class={`btn btn-sm join-item ${lang === 'en' ? 'btn-active btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setLang('en');
              refresh('en', len, count);
            }}
          >
            英文名
          </button>
        </div>

        {lang === 'zh' && (
          <label class="text-sm font-medium flex items-center gap-2">
            名字字数
            <select
              class="select select-bordered select-sm w-24"
              value={len}
              onChange={(e) => {
                const v = (e.target as HTMLSelectElement).value as Len;
                setLen(v);
                refresh(lang, v, count);
              }}
            >
              <option value="auto">随机</option>
              <option value="1">单字名</option>
              <option value="2">双字名</option>
            </select>
          </label>
        )}

        <label class="text-sm font-medium flex items-center gap-2">
          数量
          <input
            type="number"
            min={1}
            max={50}
            class="input input-bordered input-sm w-20"
            value={count}
            onInput={(e) => {
              const n = Number((e.target as HTMLInputElement).value);
              const c = Math.max(1, Math.min(50, Math.floor(n) || 1));
              setCount(c);
              refresh(lang, len, c);
            }}
          />
        </label>
      </div>

      <div class="join">
        <button
          type="button"
          class="btn btn-sm btn-primary join-item"
          onClick={() => refresh(lang, len, count)}
        >
          换一批
        </button>
        <button
          type="button"
          class={`btn btn-sm join-item ${copied === 'all' ? 'btn-success' : 'btn-outline'}`}
          onClick={() => copy(list.join('\n'), 'all')}
        >
          {copied === 'all' ? '已复制全部' : '复制全部'}
        </button>
      </div>

      <ul class="grid gap-2 sm:grid-cols-2">
        {list.map((name, i) => (
          <li class="flex items-center gap-2 rounded-xl bg-base-200 px-3 py-2" key={`${name}-${i}`}>
            <span class="flex-1 text-base font-medium break-all">{name}</span>
            <button
              type="button"
              class={`btn btn-xs ${copied === String(i) ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => copy(name, String(i))}
            >
              {copied === String(i) ? '已复制' : '复制'}
            </button>
          </li>
        ))}
      </ul>

      <p class="text-xs opacity-55 leading-relaxed">
        姓氏与用字表内置在页面中，随机组合全部在本地完成，不联网、不记录。结果可能与真人重名，请勿用于冒充身份。
      </p>
    </div>
  );
}
