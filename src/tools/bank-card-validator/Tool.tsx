import { useState, useMemo } from 'preact/hooks';

interface Brand {
  name: string;
  lengths: number[];
}

const BRANDS: Brand[] = [
  { name: '银联 UnionPay', lengths: [16, 17, 18, 19] },
  { name: 'Visa', lengths: [13, 16, 19] },
  { name: 'MasterCard 万事达', lengths: [16] },
  { name: 'JCB', lengths: [16, 17, 18, 19] },
  { name: 'American Express 美国运通', lengths: [15] },
  { name: 'Diners Club 大莱', lengths: [14, 16] },
];

function detectBrand(digits: string): string | null {
  if (!digits) return null;
  if (/^62/.test(digits)) return '银联 UnionPay';
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5])/.test(digits)) return 'MasterCard 万事达';
  const mc2 = Number(digits.slice(0, 4).padEnd(4, '0'));
  if (digits.length >= 4 && mc2 >= 2221 && mc2 <= 2720) return 'MasterCard 万事达';
  if (/^35/.test(digits)) return 'JCB';
  if (/^3[47]/.test(digits)) return 'American Express 美国运通';
  if (/^3[068]/.test(digits)) return 'Diners Club 大莱';
  if (/^30[0-5]/.test(digits)) return 'Diners Club 大莱';
  return null;
}

function brandLengths(name: string | null): number[] | null {
  if (!name) return null;
  const hit = BRANDS.find((b) => b.name === name);
  return hit ? hit.lengths : null;
}

function luhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

function group(digits: string): string {
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

type Result =
  | { ok: false; error: string }
  | {
      ok: true;
      digits: string;
      formatted: string;
      brand: string | null;
      lengthOk: boolean | null;
      lengthHint: string;
      luhnOk: boolean;
    };

function parse(raw: string): Result | null {
  const digits = raw.replace(/[\s-]/g, '');
  if (!digits) return null;

  if (digits.length < 12 || digits.length > 19) {
    return {
      ok: false,
      error: `长度不对：银行卡号通常为 12 到 19 位数字，当前去掉空格与横线后是 ${digits.length} 位`,
    };
  }
  if (!/^\d+$/.test(digits)) {
    return { ok: false, error: '含非法字符：银行卡号只能由数字组成，可带空格或横线作分隔' };
  }

  const brand = detectBrand(digits);
  const lengths = brandLengths(brand);
  const lengthOk = lengths ? lengths.includes(digits.length) : null;
  let lengthHint = '未匹配到已知卡组织号段，无法核对长度规范';
  if (lengths) {
    lengthHint = lengthOk
      ? `符合 ${brand} 的规范长度（${lengths.join(' / ')} 位）`
      : `不符合 ${brand} 的规范长度，该组织常见为 ${lengths.join(' / ')} 位，当前 ${digits.length} 位`;
  }

  return {
    ok: true,
    digits,
    formatted: group(digits),
    brand,
    lengthOk,
    lengthHint,
    luhnOk: luhn(digits),
  };
}

export default function BankCardValidator() {
  const [value, setValue] = useState('6222 0212 3456 7890 011');

  const result = useMemo<Result | null>(() => parse(value), [value]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">银行卡号</span>
          <input
            type="text"
            inputmode="numeric"
            autocomplete="off"
            spellcheck={false}
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            placeholder="请输入银行卡号，可带空格或横线"
            value={value}
            onInput={(e) => setValue((e.target as HTMLInputElement).value)}
          />
        </label>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <span class="text-xs opacity-60">示例</span>
          <button
            type="button"
            class="btn btn-xs btn-outline"
            onClick={() => setValue('6222 0212 3456 7890 011')}
          >
            银联 19 位
          </button>
          <button
            type="button"
            class="btn btn-xs btn-outline"
            onClick={() => setValue('4111 1111 1111 1111')}
          >
            Visa 16 位
          </button>
          <button
            type="button"
            class="btn btn-xs btn-outline"
            onClick={() => setValue('3782 822463 10005')}
          >
            运通 15 位
          </button>
          <button type="button" class="btn btn-xs btn-ghost" onClick={() => setValue('')}>
            清空
          </button>
        </div>

        {!result && <p class="mt-3 text-sm opacity-60">请输入银行卡号，结果会实时更新</p>}

        {result && !result.ok && (
          <div class="alert alert-error mt-3">
            <span class="text-sm">{result.error}</span>
          </div>
        )}

        {result && result.ok && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class={`badge ${result.luhnOk ? 'badge-success' : 'badge-error'}`}>
                Luhn {result.luhnOk ? '通过' : '未通过'}
              </span>
              <span class="badge badge-outline">{result.brand ?? '未知卡组织'}</span>
              <span class="badge badge-outline">{result.digits.length} 位</span>
              {result.lengthOk !== null && (
                <span class={`badge ${result.lengthOk ? 'badge-outline' : 'badge-warning'}`}>
                  长度{result.lengthOk ? '符合规范' : '异常'}
                </span>
              )}
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">去格式化卡号</td>
                    <td class="text-right font-mono">{result.digits}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">分组显示</td>
                    <td class="text-right font-mono">{result.formatted}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">卡组织</td>
                    <td class="text-right font-mono">{result.brand ?? '未识别（号段不在已知范围）'}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">长度规范</td>
                    <td class="text-right">{result.lengthHint}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">Luhn 校验</td>
                    <td class="text-right font-mono">
                      {result.luhnOk ? '求和能被 10 整除，编号规则自洽' : '求和不能被 10 整除，可能输错了一位'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {!result.luhnOk && (
              <div class="alert alert-warning">
                <span class="text-sm">
                  Luhn 校验未通过，最常见的原因是某一位数字输错或相邻两位顺序颠倒，请对照实体卡再核一遍。
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        Luhn 算法从校验位开始倒序处理：奇数位取原值、偶数位乘 2（大于 9 则减 9），全部求和后能被 10
        整除即为通过。卡组织按开头号段判断：62 银联、4 开头 Visa、51 到 55 或 2221 到 2720 万事达、35
        JCB、34 与 37 美国运通、30 与 36 与 38 大莱。输入会自动去掉空格与横线，所有计算在浏览器本地完成。
      </p>
    </div>
  );
}
