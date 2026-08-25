import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Kind = 'fold' | 'off'; // fold=打几折(0-10), off=立减百分比

function finalPrice(price: number, kind: Kind, val: number): number | null {
  if (!Number.isFinite(price) || price < 0) return null;
  if (kind === 'fold') {
    if (!Number.isFinite(val) || val < 0 || val > 10) return null;
    return price * (val / 10);
  }
  if (!Number.isFinite(val) || val < 0 || val > 100) return null;
  return price * (1 - val / 100);
}

function num(n: number): string {
  return String(Number(n.toFixed(2)));
}

interface Item {
  price: string;
  kind: Kind;
  val: string;
}

function calcItem(it: Item) {
  const p = finalPrice(Number(it.price), it.kind, Number(it.val));
  if (p === null) return null;
  return { final: p, saved: Number(it.price) - p };
}

export default function DiscountCalculator() {
  const [mode, setMode] = useState<'single' | 'compare'>('single');

  const [a, setA] = useState<Item>({ price: '299', kind: 'fold', val: '8' });
  const [b, setB] = useState<Item>({ price: '320', kind: 'off', val: '20' });

  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const ra = useMemo(() => calcItem(a), [a]);
  const rb = useMemo(() => calcItem(b), [b]);

  const ItemEditor = ({
    item,
    set,
    label,
  }: {
    item: Item;
    set: (v: Item) => void;
    label: string;
  }) => (
    <div class="rounded-lg bg-base-100 p-3">
      <p class="text-sm font-medium mb-2">{label}</p>
      <div class="grid gap-2 sm:grid-cols-3">
        <label class="block">
          <span class="text-xs opacity-60">原价</span>
          <input type="number" class="input input-bordered input-sm mt-1 w-full font-mono" value={item.price} onInput={(e) => set({ ...item, price: (e.target as HTMLInputElement).value })} />
        </label>
        <label class="block">
          <span class="text-xs opacity-60">口径</span>
          <select class="select select-bordered select-sm mt-1 w-full" value={item.kind} onChange={(e) => set({ ...item, kind: (e.target as HTMLSelectElement).value as Kind })}>
            <option value="fold">打几折</option>
            <option value="off">立减 %</option>
          </select>
        </label>
        <label class="block">
          <span class="text-xs opacity-60">{item.kind === 'fold' ? '折数 (0–10)' : '百分比 (0–100)'}</span>
          <input type="number" class="input input-bordered input-sm mt-1 w-full font-mono" value={item.val} onInput={(e) => set({ ...item, val: (e.target as HTMLInputElement).value })} />
        </label>
      </div>
    </div>
  );

  return (
    <div class="space-y-5">
      <div class="join">
        <button type="button" class={`btn btn-sm join-item ${mode === 'single' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('single')}>单件算价</button>
        <button type="button" class={`btn btn-sm join-item ${mode === 'compare' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('compare')}>两件比价</button>
      </div>

      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <ItemEditor item={a} set={setA} label="商品 A" />
        {mode === 'compare' && <ItemEditor item={b} set={setB} label="商品 B" />}

        {mode === 'single' && (
          <>
            {!ra && <p class="text-sm text-error">请输入合法原价与折扣</p>}
            {ra && (
              <div class="flex flex-wrap items-end gap-3">
                <div><p class="text-xs opacity-60">到手价</p><p class="text-3xl font-bold font-mono">{num(ra.final)}</p></div>
                <span class="badge badge-success">省 {num(ra.saved)}</span>
                <button type="button" class={`btn btn-xs ml-auto ${copied === 's' ? 'btn-success' : 'btn-ghost'}`} onClick={() => copy(`到手价 ${num(ra.final)}，省 ${num(ra.saved)}`, 's')}>{copied === 's' ? '已复制' : '复制'}</button>
              </div>
            )}
          </>
        )}

        {mode === 'compare' && (
          <div class="space-y-2">
            {!ra && <p class="text-sm text-error">商品 A 输入不合法</p>}
            {ra && <div class="flex items-center justify-between rounded-lg bg-base-100 px-3 py-2"><span>A 到手价</span><span class="font-mono font-bold">{num(ra.final)}</span></div>}
            {!rb && <p class="text-sm text-error">商品 B 输入不合法</p>}
            {rb && <div class="flex items-center justify-between rounded-lg bg-base-100 px-3 py-2"><span>B 到手价</span><span class="font-mono font-bold">{num(rb.final)}</span></div>}
            {ra && rb && (
              <p class={`text-center text-sm font-medium ${ra.final < rb.final ? 'text-success' : 'text-error'}`}>
                {ra.final === rb.final ? '两件到手价相同' : `商品 ${ra.final < rb.final ? 'A' : 'B'} 更划算，便宜 ${num(Math.abs(ra.final - rb.final))}`}
              </p>
            )}
          </div>
        )}
        <p class="text-xs opacity-55">打几折：到手 = 原价 × 折数 ÷ 10；立减%：到手 = 原价 × (1 − % ÷ 100)</p>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        所有计算均在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
