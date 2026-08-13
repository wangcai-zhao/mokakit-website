import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/** 千分位金额，保留两位小数 */
function money(n: number): string {
  const fixed = n.toFixed(2);
  const [int = '0', dec = '00'] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

/** 把输入解析成非负小时数；空或非法按 0 处理 */
function hrs(v: string): number {
  const n = Number(v.trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export default function OvertimePay() {
  const [salary, setSalary] = useState('8000');
  const [weekday, setWeekday] = useState('10');
  const [rest, setRest] = useState('8');
  const [holiday, setHoliday] = useState('0');
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
    const s = Number(salary.trim());
    if (!Number.isFinite(s) || s <= 0) return { error: '月工资需大于 0' };
    const wd = hrs(weekday);
    const rs = hrs(rest);
    const hd = hrs(holiday);
    const dayWage = s / 21.75;
    const hourWage = dayWage / 8;
    const weekdayPay = hourWage * 1.5 * wd;
    const restPay = hourWage * 2 * rs;
    const holidayPay = hourWage * 3 * hd;
    const total = weekdayPay + restPay + holidayPay;
    return { s, dayWage, hourWage, wd, rs, hd, weekdayPay, restPay, holidayPay, total };
  }, [salary, weekday, rest, holiday]);

  const summary =
    result && !('error' in result)
      ? `月工资 ${money(result.s)} 元，小时工资 ${money(result.hourWage)} 元；工作日加班 ${result.wd}h 得 ${money(
          result.weekdayPay
        )} 元，休息日 ${result.rs}h 得 ${money(result.restPay)} 元，法定节假日 ${result.hd}h 得 ${money(
          result.holidayPay
        )} 元，加班费合计 ${money(result.total)} 元`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">每月工资（元）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={salary}
              onInput={(e) => setSalary((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">工作日加班（小时）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="0.5"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={weekday}
              onInput={(e) => setWeekday((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">休息日加班（小时）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="0.5"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={rest}
              onInput={(e) => setRest((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">法定节假日加班（小时）</span>
            <input
              type="number"
              inputmode="decimal"
              min={0}
              step="0.5"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={holiday}
              onInput={(e) => setHoliday((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {result && 'error' in result && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && !('error' in result) && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">加班费合计</p>
                <p class="text-3xl font-bold font-mono text-warning">{money(result.total)}</p>
              </div>
              <span class="badge badge-outline mb-1">小时工资 {money(result.hourWage)} 元</span>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'ot' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'ot')}
              >
                {copied === 'ot' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">日工资（÷21.75）</td>
                    <td class="font-mono text-right">{money(result.dayWage)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">小时工资（÷8）</td>
                    <td class="font-mono text-right">{money(result.hourWage)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">工作日加班 {result.wd}h · 150%</td>
                    <td class="font-mono text-right text-warning">{money(result.weekdayPay)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">休息日加班 {result.rs}h · 200%</td>
                    <td class="font-mono text-right text-warning">{money(result.restPay)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">法定节假日 {result.hd}h · 300%</td>
                    <td class="font-mono text-right text-warning">{money(result.holidayPay)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60 font-medium">加班费合计</td>
                    <td class="font-mono text-right font-medium">{money(result.total)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">含加班应发工资</td>
                    <td class="font-mono text-right font-medium">{money(result.s + result.total)} 元</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        按标准工时制：日工资 = 月工资 ÷ 21.75，小时工资 = 日工资 ÷ 8。工作日延长工作时间支付不低于 150%、休息日不能补休支付
        200%、法定休假日支付 300% 的加班工资。本工具按「法定节假日额外 300%」口径计算，具体以劳动合同与当地劳动规定为准；所有计算在浏览器本地完成，不上传数据。
      </p>
    </div>
  );
}
