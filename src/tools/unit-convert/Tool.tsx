import { useState, useMemo, useEffect } from 'preact/hooks';
import { UNIT_CATEGORIES, convert, type Unit } from './units';
import { formatNumber, withThousands } from './format';

interface Props {
  /** 子页会指定初始类目与单位对，让页面一打开就是用户想要的换算 */
  initialCategory?: string;
  initialFrom?: string;
  initialTo?: string;
}

export default function UnitConvert({
  initialCategory,
  initialFrom,
  initialTo,
}: Props) {
  const [catId, setCatId] = useState(initialCategory ?? 'length');
  const category = useMemo(
    () => UNIT_CATEGORIES.find((c) => c.id === catId) ?? UNIT_CATEGORIES[0]!,
    [catId],
  );

  const [fromId, setFromId] = useState(
    initialFrom ?? category.units[0]!.id,
  );
  const [toId, setToId] = useState(
    initialTo ?? category.units[1]?.id ?? category.units[0]!.id,
  );
  const [input, setInput] = useState('1');

  // 切换类目时把单位重置为该类目的前两个，否则会出现单位与类目不匹配
  useEffect(() => {
    if (!category.units.some((u) => u.id === fromId)) {
      setFromId(category.units[0]!.id);
    }
    if (!category.units.some((u) => u.id === toId)) {
      setToId(category.units[1]?.id ?? category.units[0]!.id);
    }
  }, [category]);

  const from = category.units.find((u) => u.id === fromId) ?? category.units[0]!;
  const to = category.units.find((u) => u.id === toId) ?? category.units[0]!;

  const numeric = input.trim() === '' ? NaN : Number(input);
  const valid = Number.isFinite(numeric);
  const result = valid ? convert(numeric, from, to) : NaN;

  const swap = () => {
    setFromId(to.id);
    setToId(from.id);
    if (valid) setInput(formatNumber(result));
  };

  // 常用数值速查表，同时也是给爬虫看的实质内容
  const quickRows = useMemo(() => {
    const seeds = [1, 2, 5, 10, 20, 50, 100, 500, 1000];
    return seeds.map((n) => ({
      n,
      r: formatNumber(convert(n, from, to), 8),
    }));
  }, [from, to]);

  const unitOption = (u: Unit) => (
    <option value={u.id}>
      {u.name}（{u.symbol}）
    </option>
  );

  return (
    <div>
      {/* 类目切换 */}
      <div class="flex flex-wrap gap-1.5 mb-4" role="tablist" aria-label="换算类目">
        {UNIT_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={c.id === catId}
            class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              c.id === catId
                ? 'bg-primary text-primary-content'
                : 'bg-base-200 hover:bg-base-300'
            }`}
            onClick={() => setCatId(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* 换算主体 */}
      <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div>
          <label
            for="uc-from-value"
            class="block text-sm font-medium mb-1.5 opacity-80"
          >
            输入数值
          </label>
          <input
            id="uc-from-value"
            type="number"
            inputMode="decimal"
            value={input}
            class="input input-bordered w-full text-lg font-mono"
            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
            placeholder="请输入数值"
          />
          <select
            class="select select-bordered w-full mt-2"
            value={fromId}
            aria-label="源单位"
            onChange={(e) => setFromId((e.target as HTMLSelectElement).value)}
          >
            {category.units.map(unitOption)}
          </select>
        </div>

        <button
          type="button"
          class="btn btn-ghost btn-square self-center sm:mb-[4.5rem] mx-auto"
          onClick={swap}
          aria-label="交换单位"
          title="交换单位"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M8 3 4 7l4 4" />
            <path d="M4 7h16" />
            <path d="m16 21 4-4-4-4" />
            <path d="M20 17H4" />
          </svg>
        </button>

        <div>
          <div class="block text-sm font-medium mb-1.5 opacity-80">换算结果</div>
          <output
            class="flex items-center h-12 px-4 rounded-lg bg-base-200 text-lg font-mono break-all"
            aria-live="polite"
          >
            {valid ? withThousands(formatNumber(result)) : '—'}
          </output>
          <select
            class="select select-bordered w-full mt-2"
            value={toId}
            aria-label="目标单位"
            onChange={(e) => setToId((e.target as HTMLSelectElement).value)}
          >
            {category.units.map(unitOption)}
          </select>
        </div>
      </div>

      {valid && (
        <p class="mt-4 text-center text-sm opacity-70">
          <strong class="opacity-100">
            {withThousands(formatNumber(numeric))} {from.name}
          </strong>
          {' = '}
          <strong class="text-primary">
            {withThousands(formatNumber(result))} {to.name}
          </strong>
        </p>
      )}

      {/* 速查表 */}
      <div class="mt-5 pt-4 border-t border-base-300">
        <h3 class="text-sm font-semibold mb-2 opacity-80">
          {from.name}换算{to.name}速查表
        </h3>
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>{from.name}（{from.symbol}）</th>
                <th>{to.name}（{to.symbol}）</th>
              </tr>
            </thead>
            <tbody>
              {quickRows.map((row) => (
                <tr key={row.n}>
                  <td class="font-mono">{withThousands(String(row.n))}</td>
                  <td class="font-mono text-primary">
                    {withThousands(row.r)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
