import { useState, useMemo } from 'preact/hooks';

const PROVINCES: Record<string, string> = {
  '11': '北京市',
  '12': '天津市',
  '13': '河北省',
  '14': '山西省',
  '15': '内蒙古自治区',
  '21': '辽宁省',
  '22': '吉林省',
  '23': '黑龙江省',
  '31': '上海市',
  '32': '江苏省',
  '33': '浙江省',
  '34': '安徽省',
  '35': '福建省',
  '36': '江西省',
  '37': '山东省',
  '41': '河南省',
  '42': '湖北省',
  '43': '湖南省',
  '44': '广东省',
  '45': '广西壮族自治区',
  '46': '海南省',
  '50': '重庆市',
  '51': '四川省',
  '52': '贵州省',
  '53': '云南省',
  '54': '西藏自治区',
  '61': '陕西省',
  '62': '甘肃省',
  '63': '青海省',
  '64': '宁夏回族自治区',
  '65': '新疆维吾尔自治区',
  '71': '台湾省',
  '81': '香港特别行政区',
  '82': '澳门特别行政区',
  '91': '国外',
};

const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

type Result =
  | { ok: false; error: string }
  | {
      ok: true;
      kind: '18' | '15';
      region: string;
      regionCode: string;
      birthday: string;
      age: number;
      gender: string;
      upgrade?: string;
    };

function calcCheckCode(first17: string): string {
  let sum = 0;
  for (let i = 0; i < 17; i += 1) sum += Number(first17[i]) * WEIGHTS[i];
  return CHECK_CODES[sum % 11];
}

function toDate(text: string): Date | null {
  const y = Number(text.slice(0, 4));
  const m = Number(text.slice(4, 6));
  const d = Number(text.slice(6, 8));
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

function ageOf(birth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const before =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (before) age -= 1;
  return age < 0 ? 0 : age;
}

function formatBirth(birth: Date): string {
  const m = String(birth.getMonth() + 1).padStart(2, '0');
  const d = String(birth.getDate()).padStart(2, '0');
  return `${birth.getFullYear()} 年 ${m} 月 ${d} 日`;
}

function parse(raw: string): Result | null {
  const id = raw.trim().toUpperCase();
  if (!id) return null;

  if (id.length !== 18 && id.length !== 15) {
    return {
      ok: false,
      error: `位数不对：身份证号应为 18 位或 15 位，当前是 ${id.length} 位`,
    };
  }

  if (id.length === 18) {
    if (!/^\d{17}[\dX]$/.test(id)) {
      if (!/^[0-9X]+$/.test(id)) {
        return { ok: false, error: '含非法字符：18 位身份证前 17 位只能是数字，最后一位只能是数字或字母 X' };
      }
      return { ok: false, error: '格式有误：字母 X 只能出现在最后一位，前 17 位必须全是数字' };
    }
    const birthText = id.slice(6, 14);
    const birth = toDate(birthText);
    if (!birth) {
      return { ok: false, error: `出生日期不合法：第 7 到 14 位「${birthText}」不是一个真实存在的日期` };
    }
    const now = new Date();
    if (birth.getTime() > now.getTime()) {
      return { ok: false, error: '出生日期不合法：出生日期晚于今天，请检查是否输错' };
    }
    if (birth.getFullYear() < 1900) {
      return { ok: false, error: '出生日期不合法：出生年份早于 1900 年，请检查是否输错' };
    }
    const expect = calcCheckCode(id.slice(0, 17));
    if (expect !== id[17]) {
      return {
        ok: false,
        error: `校验位错误：按 GB 11643-1999 计算最后一位应为「${expect}」，实际是「${id[17]}」`,
      };
    }
    const code2 = id.slice(0, 2);
    const genderDigit = Number(id[16]);
    return {
      ok: true,
      kind: '18',
      region: PROVINCES[code2] ?? '未知地区（地址码前两位未登记）',
      regionCode: id.slice(0, 6),
      birthday: formatBirth(birth),
      age: ageOf(birth),
      gender: genderDigit % 2 === 1 ? '男' : '女',
    };
  }

  if (!/^\d{15}$/.test(id)) {
    return { ok: false, error: '含非法字符：15 位身份证必须全部是数字' };
  }
  const birthText = `19${id.slice(6, 12)}`;
  const birth = toDate(birthText);
  if (!birth) {
    return { ok: false, error: `出生日期不合法：第 7 到 12 位「${id.slice(6, 12)}」补成 ${birthText} 后不是一个真实存在的日期` };
  }
  const first17 = `${id.slice(0, 6)}19${id.slice(6)}`;
  const code2 = id.slice(0, 2);
  const genderDigit = Number(id[14]);
  return {
    ok: true,
    kind: '15',
    region: PROVINCES[code2] ?? '未知地区（地址码前两位未登记）',
    regionCode: id.slice(0, 6),
    birthday: formatBirth(birth),
    age: ageOf(birth),
    gender: genderDigit % 2 === 1 ? '男' : '女',
    upgrade: `${first17}${calcCheckCode(first17)}`,
  };
}

export default function IdCardCheck() {
  const [value, setValue] = useState('11010519491231002X');

  const result = useMemo<Result | null>(() => parse(value), [value]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">身份证号</span>
          <input
            type="text"
            inputmode="text"
            autocomplete="off"
            spellcheck={false}
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            placeholder="请输入 18 位或 15 位身份证号"
            value={value}
            onInput={(e) => setValue((e.target as HTMLInputElement).value)}
          />
        </label>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <span class="text-xs opacity-60">示例</span>
          <button
            type="button"
            class="btn btn-xs btn-outline"
            onClick={() => setValue('11010519491231002X')}
          >
            18 位示例
          </button>
          <button
            type="button"
            class="btn btn-xs btn-outline"
            onClick={() => setValue('110105491231002')}
          >
            15 位示例
          </button>
          <button type="button" class="btn btn-xs btn-ghost" onClick={() => setValue('')}>
            清空
          </button>
        </div>

        {!result && <p class="mt-3 text-sm opacity-60">请输入身份证号，结果会实时更新</p>}

        {result && !result.ok && (
          <div class="alert alert-error mt-3">
            <span class="text-sm">{result.error}</span>
          </div>
        )}

        {result && result.ok && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge badge-success">校验通过</span>
              <span class="badge badge-outline">{result.kind} 位</span>
              <span class="badge badge-outline">{result.region}</span>
              <span class="badge badge-outline">{result.gender}</span>
              <span class="badge badge-outline">{result.age} 周岁</span>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">发证地区（地址码）</td>
                    <td class="text-right font-mono">
                      {result.region} {result.regionCode}
                    </td>
                  </tr>
                  <tr>
                    <td class="opacity-60">出生日期</td>
                    <td class="text-right font-mono">{result.birthday}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">当前周岁</td>
                    <td class="text-right font-mono">{result.age} 岁</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">性别</td>
                    <td class="text-right font-mono">{result.gender}</td>
                  </tr>
                  {result.upgrade && (
                    <tr>
                      <td class="opacity-60">升位为 18 位</td>
                      <td class="text-right font-mono">{result.upgrade}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {result.upgrade && (
              <p class="text-xs opacity-70">
                这是 15 位老身份证，本身没有校验位，只能校验位数与出生日期。上表已给出按规则补出的 18 位号码，仅供参考。
              </p>
            )}
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        18 位校验码采用 GB 11643-1999（ISO 7064:1983 MOD 11-2）：前 17 位按固定权重加权求和后对 11
        取余，余数 0 到 10 依次对应 1、0、X、9、8、7、6、5、4、3、2。性别看顺序码最后一位，奇数男偶数女。所有计算在浏览器本地完成，输入不会上传。
      </p>
    </div>
  );
}
