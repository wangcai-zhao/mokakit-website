/**
 * 文档脱敏引擎。
 *
 * 与 UI 分离放在这里的原因：识别规则要能被单独测试与复用，
 * 而且这套逻辑将来要挂到 MCP Server 上给 AI 调用。
 *
 * 设计取舍：
 * 1. 全部靠正则 + 校验位，不引入任何 NLP 依赖，纯前端可跑。
 * 2. 每条规则都带「严格度」：默认只认格式合法且通过校验的（如身份证校验位、银行卡 Luhn），
 *    把误报压到最低；宁可漏掉一些，也不要把正常文本打成星号。
 * 3. 命中区间做重叠消解：谁先出现、谁更长谁优先，避免一条身份证同时被身份证和银行卡规则命中两次。
 */

export type SensitiveType =
  | 'mobile'
  | 'idcard'
  | 'bankcard'
  | 'email'
  | 'name'
  | 'address'
  | 'ip'
  | 'plate'
  | 'creditCode'
  | 'passport'
  | 'qq'
  | 'wechat'
  | 'landline'
  | 'custom';

export interface Rule {
  type: SensitiveType;
  label: string;
  /** 命中后的处理开关由外部控制，这里只定义规则本身 */
  regex: RegExp;
  /** 额外校验，返回 false 则丢弃这次命中（用于降低误报） */
  validate?: (text: string) => boolean;
  /** 屏蔽时保留的头部 / 尾部字符数 */
  head: number;
  tail: number;
  hint: string;
}

/** 常见中文姓氏，用于「激进模式」下的姓名识别 */
const SURNAMES =
  '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳唐罗薛伍余米贝姚孟顾尹江钟徐邱骆高夏蔡田樊胡凌霍虞万支柯管卢莫房解应宗丁宣邓郁单杭洪包诸左石崔吉钮龚程嵇邢滑裴陆荣翁荀羊甄封芮储靳汲邴糜松井段富巫乌焦巴弓牧隗山谷车侯宓蓬全郗班仰秋仲伊宫宁仇栾暴甘钭厉戎祖武符刘景詹束龙叶幸司韶黎蓟薄印宿白怀蒲邰从鄂索咸籍赖卓蔺屠蒙池乔阴郁胥能苍双闻莘党翟谭贡劳逄姬申扶堵冉宰郦雍却璩桑桂濮牛寿通边扈燕冀郏浦尚农温别庄晏柴瞿阎充慕连茹习宦艾鱼容向古易慎戈廖庾终暨居衡步都耿满弘匡国文寇广禄阙东欧殳沃利蔚越夔隆师巩厍聂晁勾敖融冷訾辛阚那简饶空曾毋沙乜养鞠须丰巢关蒯相查后荆红游竺权逯盖益桓公';

/** 姓名的上下文线索：冒号后 / 称谓前，这两种最不容易误伤 */
const NAME_CONTEXT = /([姓名|名字|客户|联系人|申请人|收款人|付款人|法人|投保人|被保险人|员工|负责人|收件人|收货人|用户|病人|患者|考生|业主|股东|代理人|经办人])\s*[：:是]?\s*([\u4e00-\u9fa5]{2,4})/g;
const NAME_TITLE = /([\u4e00-\u9fa5]{2,4})(先生|女士|小姐|同学|老师|医生|护士|工程师|经理|总监|主任|教授|律师|会计)/g;
const NAME_SURNAME = new RegExp(`[${SURNAMES}][\\u4e00-\\u9fa5]{1,2}`, 'g');

/** 身份证校验位（GB 11643-1999 的 ISO 7064:1983.MOD 11-2） */
export function isValidIdCard(v: string): boolean {
  if (!/^\d{17}[\dXx]$/.test(v)) return false;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const codes = '10X98765432';
  let sum = 0;
  for (let i = 0; i < 17; i += 1) sum += Number(v[i]) * weights[i];
  return codes[sum % 11] === v[17].toUpperCase();
}

/** Luhn 校验，银行卡号基本都用 */
export function isValidLuhn(v: string): boolean {
  if (!/^\d{12,19}$/.test(v)) return false;
  let sum = 0;
  let alt = false;
  for (let i = v.length - 1; i >= 0; i -= 1) {
    let d = Number(v[i]);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export const RULES: Rule[] = [
  {
    type: 'mobile',
    label: '手机号',
    regex: /(?<!\d)1[3-9]\d{9}(?!\d)/g,
    head: 3,
    tail: 4,
    hint: '1 开头的 11 位号码',
  },
  {
    type: 'idcard',
    label: '身份证号',
    regex: /(?<!\d)\d{6}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx](?!\d)/g,
    validate: isValidIdCard,
    head: 6,
    tail: 4,
    hint: '18 位，且校验位正确',
  },
  {
    type: 'bankcard',
    label: '银行卡号',
    regex: /(?<!\d)\d{16,19}(?!\d)/g,
    validate: isValidLuhn,
    head: 4,
    tail: 4,
    hint: '16-19 位，且通过 Luhn 校验',
  },
  {
    type: 'email',
    label: '邮箱',
    regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    head: 2,
    tail: 0,
    hint: '完整邮箱地址',
  },
  {
    type: 'name',
    label: '姓名',
    regex: NAME_CONTEXT,
    head: 0,
    tail: 0,
    hint: '「姓名：张三」这类带上下文的两个字以上中文名',
  },
  {
    type: 'address',
    label: '住址',
    regex: /[\u4e00-\u9fa5]{2,}(?:省|市|自治区)[\u4e00-\u9fa5]{0,20}(?:区|县|市)[\u4e00-\u9fa5]{0,30}(?:路|街|道|巷|弄|小区|花园|苑|大厦|广场|村)[\u4e00-\u9fa5\w]{0,20}(?:号|栋|幢|座|单元|层|室|楼)[\u4e00-\u9fa5\w]{0,10}/g,
    head: 6,
    tail: 0,
    hint: '省市区 + 路名 + 门牌号的完整住址',
  },
  {
    type: 'ip',
    label: 'IP 地址',
    regex: /(?<![\d.])(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?![\d.])/g,
    head: 0,
    tail: 0,
    hint: 'IPv4，每段都做 0-255 校验',
  },
  {
    type: 'plate',
    label: '车牌号',
    regex: /[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-HJ-NP-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳领]?/g,
    head: 2,
    tail: 1,
    hint: '含新能源车牌',
  },
  {
    type: 'creditCode',
    label: '统一社会信用代码',
    regex: /[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}/g,
    head: 2,
    tail: 4,
    hint: '18 位，营业执照上的那个号',
  },
  {
    type: 'passport',
    label: '护照号',
    regex: /[A-Za-z][A-Za-z0-9]{8}(?!\w)/g,
    head: 1,
    tail: 2,
    hint: '1 位字母 + 8 位编码',
  },
  {
    type: 'qq',
    label: 'QQ 号',
    regex: /(?<!\d)[1-9]\d{4,10}(?!\d)/g,
    validate: (v) => v.length >= 5 && v.length <= 11,
    head: 2,
    tail: 2,
    hint: '5-11 位纯数字，误报较多建议按需开启',
  },
  {
    type: 'wechat',
    label: '微信号',
    regex: /(?:微信|wechat|WeChat|wx)\s*[:：]?\s*([A-Za-z][-_A-Za-z0-9]{5,19})/g,
    head: 2,
    tail: 2,
    hint: '带「微信」前缀的微信号',
  },
  {
    type: 'landline',
    label: '固定电话',
    regex: /(?<!\d)0\d{2,3}-?\d{7,8}(?!\d)/g,
    head: 4,
    tail: 4,
    hint: '含区号的座机号码',
  },
];

/** 追加的姓名规则（称谓式 / 姓氏式），按需开启 */
export const EXTRA_NAME_RULES: { key: string; label: string; regex: RegExp; hint: string }[] = [
  {
    key: 'nameTitle',
    label: '称谓式姓名',
    regex: NAME_TITLE,
    hint: '「张三先生」「李工程师」这类带称谓的',
  },
  {
    key: 'nameSurname',
    label: '姓氏推断姓名',
    regex: NAME_SURNAME,
    hint: '按百家姓推断，误报明显增多，谨慎开启',
  },
];

export interface Hit {
  type: SensitiveType;
  label: string;
  start: number;
  end: number;
  raw: string;
}

/** 收集所有命中，按起点排序并消解重叠 */
export function collectHits(text: string, rules: Rule[]): Hit[] {
  const raw: Hit[] = [];
  for (const rule of rules) {
    const re = new RegExp(rule.regex.source, rule.regex.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      // 捕获组规则（如「姓名：张三」）只处理组内的那一段
      const hasGroup = m.length > 1 && m[1] !== undefined;
      const value = hasGroup ? m[m.length - 1] : m[0];
      const offset = hasGroup ? m.index + m[0].lastIndexOf(value) : m.index;
      if (!value) continue;
      if (rule.validate && !rule.validate(value)) continue;
      raw.push({
        type: rule.type,
        label: rule.label,
        start: offset,
        end: offset + value.length,
        raw: value,
      });
      if (m.index === re.lastIndex) re.lastIndex += 1;
    }
  }
  raw.sort((a, b) => a.start - b.start || b.end - a.end - (b.start - a.start));
  const kept: Hit[] = [];
  let cursor = -1;
  for (const h of raw) {
    if (h.start < cursor) continue;
    kept.push(h);
    cursor = h.end;
  }
  return kept;
}

/** 稳定哈希：同一个原值每次都映射到同一个代号，脱敏后仍能做关联分析 */
export function stableCode(value: string): string {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).slice(0, 4).padStart(4, '0');
}

export type MaskMode = 'partial' | 'full' | 'label' | 'code';

export interface MaskOptions {
  mode: MaskMode;
  /** partial 模式下的掩码字符 */
  maskChar: string;
  /** 是否用规则自带的保留位数（关闭则用 head/tail 覆盖值） */
  perType: boolean;
  head: number;
  tail: number;
}

export function maskValue(hit: Hit, opts: MaskOptions, rule?: Rule): string {
  const v = hit.raw;
  if (opts.mode === 'full') return opts.maskChar.repeat(Math.min(v.length, 8));
  if (opts.mode === 'label') return `【${hit.label}】`;
  if (opts.mode === 'code') return `${hit.label}#${stableCode(v)}`;

  // partial
  let head = opts.head;
  let tail = opts.tail;
  if (opts.perType && rule) {
    head = rule.head;
    tail = rule.tail;
  }
  if (hit.type === 'email') {
    const at = v.indexOf('@');
    const name = v.slice(0, at);
    const keep = Math.min(head, Math.max(1, name.length - 1));
    return name.slice(0, keep) + opts.maskChar.repeat(Math.max(3, name.length - keep)) + v.slice(at);
  }
  if (hit.type === 'ip') {
    const parts = v.split('.');
    return `${parts[0]}.${opts.maskChar}.${opts.maskChar}.${parts[3]}`;
  }
  if (hit.type === 'name') {
    return v[0] + opts.maskChar.repeat(Math.max(1, v.length - 1));
  }
  const total = v.length;
  const h = Math.min(head, total);
  const t = Math.min(tail, Math.max(0, total - h));
  const mid = Math.max(1, total - h - t);
  return v.slice(0, h) + opts.maskChar.repeat(mid) + (t > 0 ? v.slice(total - t) : '');
}

export interface DesensitizeOptions extends MaskOptions {
  /** 开启的规则类型 */
  enabled: SensitiveType[];
  /** 额外姓名规则 */
  extraNames: string[];
  /** 白名单：命中包含这些词就不处理 */
  whitelist: string[];
  /** 自定义正则 */
  customPatterns: { pattern: string; flags: string }[];
}

/** 命中项 + 它最终被替换成的样子，明细表要靠它展示 */
export interface ProcessedHit extends Hit {
  masked: string;
}

export interface DesensitizeResult {
  text: string;
  hits: ProcessedHit[];
  counts: Record<string, number>;
}

export function desensitize(text: string, opts: DesensitizeOptions): DesensitizeResult {
  const rules: Rule[] = RULES.filter((r) => opts.enabled.includes(r.type));

  for (const extra of EXTRA_NAME_RULES) {
    if (opts.extraNames.includes(extra.key)) {
      rules.push({
        type: 'name',
        label: '姓名',
        regex: extra.regex,
        head: 0,
        tail: 0,
        hint: extra.hint,
      });
    }
  }

  for (const c of opts.customPatterns) {
    if (!c.pattern.trim()) continue;
    try {
      rules.push({
        type: 'custom',
        label: '自定义',
        regex: new RegExp(c.pattern, c.flags.includes('g') ? c.flags : `${c.flags}g`),
        head: 1,
        tail: 1,
        hint: '自定义正则',
      });
    } catch {
      // 正则非法就跳过，UI 层已经提示过了
    }
  }

  const all = collectHits(text, rules);
  const wl = opts.whitelist.map((w) => w.trim()).filter(Boolean);
  const hits = all.filter((h) => !wl.some((w) => h.raw.includes(w)));

  const counts: Record<string, number> = {};
  const processed: ProcessedHit[] = [];
  let out = '';
  let cursor = 0;
  for (const h of hits) {
    const rule = rules.find((r) => r.type === h.type);
    const masked = maskValue(h, opts, rule);
    out += text.slice(cursor, h.start);
    out += masked;
    cursor = h.end;
    counts[h.label] = (counts[h.label] ?? 0) + 1;
    processed.push({ ...h, masked });
  }
  out += text.slice(cursor);
  return { text: out, hits: processed, counts };
}
