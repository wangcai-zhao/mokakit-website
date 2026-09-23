import { useState, useMemo, useRef, useEffect } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/** 千分位 + 两位小数 */
function money(n: number): string {
  const safe = Number.isFinite(n) ? n : 0;
  const fixed = safe.toFixed(2);
  const parts = fixed.split('.');
  const int = parts[0] ?? '0';
  const dec = parts[1] ?? '00';
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

function int(n: number): string {
  const safe = Number.isFinite(n) ? n : 0;
  return Math.round(safe).toLocaleString('zh-CN');
}

interface Scenario {
  label: string;
  qty: number;
  revenue: number;
  variable: number;
  profit: number;
}

type Result =
  | { ok: false; error: string }
  | {
      ok: true;
      unitMargin: number;
      marginRate: number;
      exactQty: number;
      qty: number;
      revenue: number;
      scenarios: Scenario[];
    };

export default function BreakEvenCalculator() {
  const [fixedCost, setFixedCost] = useState('60000');
  const [variableCost, setVariableCost] = useState('35');
  const [unitPrice, setUnitPrice] = useState('80');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const result = useMemo<Result>(() => {
    const fcRaw = fixedCost.trim();
    const vcRaw = variableCost.trim();
    const pRaw = unitPrice.trim();
    if (!fcRaw || !vcRaw || !pRaw) return { ok: false, error: '三个输入框都要填写，空着算不出结果' };
    const fc = Number(fcRaw);
    const vc = Number(vcRaw);
    const price = Number(pRaw);
    if (!Number.isFinite(fc) || !Number.isFinite(vc) || !Number.isFinite(price)) {
      return { ok: false, error: '请填写有效数字，不要输入字母或符号' };
    }
    if (fc < 0) return { ok: false, error: '固定成本总额不能为负数' };
    if (vc < 0) return { ok: false, error: '单位变动成本不能为负数' };
    if (price <= 0) return { ok: false, error: '产品单价必须大于 0' };
    if (price <= vc) {
      return {
        ok: false,
        error:
          vc > 0
            ? `产品单价 ${money(price)} 不大于单位变动成本 ${money(vc)}，每卖一件都在亏，不存在盈亏平衡点`
            : '产品单价必须大于单位变动成本',
      };
    }
    const unitMargin = price - vc;
    const exactQty = fc / unitMargin;
    const scenarios = [0.8, 1, 1.2].map((ratio) => {
      const qty = exactQty * ratio;
      const revenue = qty * price;
      const variable = qty * vc;
      return {
        label: `${Math.round(ratio * 100)}% 保本销量`,
        qty,
        revenue,
        variable,
        profit: revenue - variable - fc,
      };
    });
    return {
      ok: true,
      unitMargin,
      marginRate: unitMargin / price,
      exactQty,
      qty: Math.ceil(exactQty),
      revenue: exactQty * price,
      scenarios,
    };
  }, [fixedCost, variableCost, unitPrice]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async (text: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const summary = useMemo(() => {
    if (!result.ok) return '';
    return [
      `固定成本 ${money(Number(fixedCost))}，单位变动成本 ${money(Number(variableCost))}，单价 ${money(Number(unitPrice))}`,
      `单位边际贡献 ${money(result.unitMargin)}，盈亏平衡销量 ${int(result.qty)} 件`,
      `盈亏平衡销售额 ${money(result.revenue)}`,
    ].join('\n');
  }, [result, fixedCost, variableCost, unitPrice]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="text-sm font-medium">固定成本总额（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step={100}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 60000"
              value={fixedCost}
              onInput={(e) => setFixedCost((e.target as HTMLInputElement).value)}
            />
            <span class="text-xs opacity-55">房租、设备、工资等不随产量变化的支出</span>
          </label>
          <label class="block">
            <span class="text-sm font-medium">单位变动成本（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step={1}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 35"
              value={variableCost}
              onInput={(e) => setVariableCost((e.target as HTMLInputElement).value)}
            />
            <span class="text-xs opacity-55">原材料、包装、佣金等每卖一件多一份</span>
          </label>
          <label class="block">
            <span class="text-sm font-medium">产品单价（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step={1}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 80"
              value={unitPrice}
              onInput={(e) => setUnitPrice((e.target as HTMLInputElement).value)}
            />
            <span class="text-xs opacity-55">需大于单位变动成本</span>
          </label>
        </div>

        {!result.ok && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result.ok && (
          <div class="mt-4 space-y-3">
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div class="rounded-xl bg-base-100 p-3">
                <p class="text-xs opacity-60">盈亏平衡销量</p>
                <p class="font-mono text-xl font-bold tabular-nums">{int(result.qty)}</p>
                <p class="text-[11px] opacity-50">件（精确值 {result.exactQty.toFixed(2)}）</p>
              </div>
              <div class="rounded-xl bg-base-100 p-3">
                <p class="text-xs opacity-60">盈亏平衡销售额</p>
                <p class="font-mono text-xl font-bold tabular-nums text-primary">{money(result.revenue)}</p>
                <p class="text-[11px] opacity-50">元</p>
              </div>
              <div class="rounded-xl bg-base-100 p-3">
                <p class="text-xs opacity-60">单位边际贡献</p>
                <p class="font-mono text-xl font-bold tabular-nums">{money(result.unitMargin)}</p>
                <p class="text-[11px] opacity-50">单价 - 单位变动成本</p>
              </div>
              <div class="rounded-xl bg-base-100 p-3">
                <p class="text-xs opacity-60">边际贡献率</p>
                <p class="font-mono text-xl font-bold tabular-nums">{(result.marginRate * 100).toFixed(2)}%</p>
                <p class="text-[11px] opacity-50">每 1 元收入能覆盖固定成本的比例</p>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>销量档位</th>
                    <th class="text-right">销量</th>
                    <th class="text-right">销售收入</th>
                    <th class="text-right">变动成本合计</th>
                    <th class="text-right">固定成本</th>
                    <th class="text-right">利润</th>
                  </tr>
                </thead>
                <tbody>
                  {result.scenarios.map((s) => (
                    <tr key={s.label}>
                      <td>
                        <span class="font-medium">{s.label}</span>
                        <span
                          class={`badge badge-xs ml-1.5 ${
                            s.profit > 0.005 ? 'badge-success' : s.profit < -0.005 ? 'badge-error' : 'badge-ghost'
                          }`}
                        >
                          {s.profit > 0.005 ? '盈利' : s.profit < -0.005 ? '亏损' : '保本'}
                        </span>
                      </td>
                      <td class="font-mono text-right tabular-nums">{int(s.qty)}</td>
                      <td class="font-mono text-right tabular-nums">{money(s.revenue)}</td>
                      <td class="font-mono text-right tabular-nums">{money(s.variable)}</td>
                      <td class="font-mono text-right tabular-nums">{money(Number(fixedCost))}</td>
                      <td
                        class={`font-mono text-right tabular-nums font-semibold ${
                          s.profit > 0.005 ? 'text-success' : s.profit < -0.005 ? 'text-error' : ''
                        }`}
                      >
                        {money(s.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div class="flex items-center justify-end">
              <button
                type="button"
                class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary)}
              >
                {copied ? '已复制' : '复制计算结果'}
              </button>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        盈亏平衡销量 = 固定成本总额 ÷（产品单价 - 单位变动成本），其中「单价 - 单位变动成本」叫单位边际贡献；盈亏平衡销售额 =
        盈亏平衡销量 × 产品单价，也等于固定成本总额 ÷ 边际贡献率。表格给出保本销量 80%、100%、120% 三档的收支对照，利润 = 销售收入 -
        变动成本合计 - 固定成本。销量按向上取整显示。所有计算在浏览器本地完成。
      </p>
    </div>
  );
}
