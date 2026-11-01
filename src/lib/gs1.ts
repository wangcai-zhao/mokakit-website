/**
 * GS1 / GTIN 纯函数层（udi-decoder 与 udi-generator 共用，MCP 同源）。
 *
 * 校验位算法依据：GS1 General Specifications §7.9 模 10 ——
 * 从最右数据位起权重 3/1 交替加权求和，校验位 = (10 - sum % 10) % 10。
 *
 * 借鉴来源（均为 MIT license，借鉴思路与测试向量并备注来源，未直拷代码）：
 *  - marius103/gtin-checksum：computeCheckDigit / isValidGtin / appendCheckDigit
 *    的 API 拆分设计与公开测试向量（400638133393→1 等，见 scripts/test-gs1.mjs）
 *  - QRSalt/gs1-digital-link（GS1 Digital Link URI Syntax 1.7.0）：
 *    「校验失败时指出应为哪位」的提示设计（gtinCheck.expected）
 *  - AI 字典与数据格式：GS1 官方数据集 ref.gs1.org/ai
 */

/** 单个 AI 定义：含义 + 数据格式（供「AI 大全」子页渲染速查表） */
export interface AiDef {
  ai: string;
  name: string;
  format: string;
}

/**
 * GS1 常用应用标识符字典。
 * 含义以 GS1 官方数据集（ref.gs1.org/ai）为准；310n/320n/330n/390n/392n/723x
 * 为区间族代表写法（末位 n 表示小数位或序号档位）。
 */
export const AI_DEFS: AiDef[] = [
  { ai: '00', name: '系列货运集装箱代码（SSCC）', format: '18 位数字（定长）' },
  { ai: '01', name: '全球贸易项目代码（GTIN，即设备标识 DI）', format: '14 位数字（定长，末位校验位）' },
  { ai: '02', name: '物流单元内贸易项目代码（CONTENT GTIN）', format: '14 位数字（定长）' },
  { ai: '03', name: 'Made-to-Order 贸易项目代码（MTO GTIN）', format: '14 位数字（定长）' },
  { ai: '10', name: '批号 / 批（Lot）', format: '字符 ≤20（变长）' },
  { ai: '11', name: '生产日期', format: '日期 YYMMDD' },
  { ai: '12', name: '付款单到期日', format: '日期 YYMMDD' },
  { ai: '13', name: '包装日期', format: '日期 YYMMDD' },
  { ai: '15', name: '保质期（最佳食用日期）', format: '日期 YYMMDD' },
  { ai: '16', name: '销售截止日', format: '日期 YYMMDD' },
  { ai: '17', name: '失效日期 / 有效期', format: '日期 YYMMDD' },
  { ai: '20', name: '内部产品变体', format: '字符 ≤2（变长）' },
  { ai: '21', name: '序列号（Serial）', format: '字符 ≤20（变长）' },
  { ai: '22', name: '消费者产品变体（CPV）', format: '字符 ≤20（变长）' },
  { ai: '235', name: '第三方控制的序列化 GTIN 扩展（TPX）', format: '字符 ≤28（变长）' },
  { ai: '240', name: '厂商分配的附加产品标识', format: '字符 ≤30（变长）' },
  { ai: '241', name: '客户部件号', format: '字符 ≤30（变长）' },
  { ai: '242', name: 'Made-to-Order 变体号', format: '数字 ≤6（变长）' },
  { ai: '243', name: '包装组件号（PCN）', format: '字符 ≤6（变长）' },
  { ai: '250', name: '次级序列号', format: '字符 ≤30（变长）' },
  { ai: '251', name: '源实体参考', format: '字符 ≤30（变长）' },
  { ai: '253', name: '全球文件类型标识（GDTI）', format: '13 位数字 + 字符 ≤17' },
  { ai: '254', name: '全球位置码扩展组件（GLN 扩展）', format: '字符 ≤20（变长）' },
  { ai: '255', name: '全球优惠券编号（GCN）', format: '13 位数字 + 字符 ≤17' },
  { ai: '30', name: '包装内可变数量', format: '数字 ≤8（变长）' },
  { ai: '310n', name: '净重（千克，末位为小数位数）', format: '6 位数字' },
  { ai: '320n', name: '净重（磅，末位为小数位数）', format: '6 位数字' },
  { ai: '330n', name: '总重（千克，末位为小数位数）', format: '6 位数字' },
  { ai: '37', name: '物流单元内贸易项目数量', format: '数字 ≤8（变长）' },
  { ai: '390n', name: '应付金额 / 优惠券面值', format: '15 位数字（含货币代码）' },
  { ai: '392n', name: '可变重量商品应付款金额', format: '15 位数字（含货币代码）' },
  { ai: '400', name: '客户采购订单号', format: '字符 ≤30（变长）' },
  { ai: '401', name: '货运全球标识（GINC）', format: '字符 ≤30（变长）' },
  { ai: '402', name: '货运标识号（GSIN）', format: '17 位数字' },
  { ai: '403', name: '路径代码（Routing code）', format: '字符 ≤30（变长）' },
  { ai: '410', name: '收货方位置码（Ship to GLN）', format: '13 位数字' },
  { ai: '411', name: '账单 / 发票方位置码（Bill to GLN）', format: '13 位数字' },
  { ai: '412', name: '采购 / 供方位置码（Purchase from GLN）', format: '13 位数字' },
  { ai: '413', name: '代发 / 转发方位置码（Ship for GLN）', format: '13 位数字' },
  { ai: '414', name: '物理位置码（Physical location GLN）', format: '13 位数字' },
  { ai: '415', name: '开票方位置码（Pay to GLN）', format: '13 位数字' },
  { ai: '416', name: '生产 / 服务位置码（GLN）', format: '13 位数字' },
  { ai: '417', name: '参与方位置码（Party GLN）', format: '13 位数字' },
  { ai: '420', name: '收货方邮政编码', format: '字符 ≤20（变长）' },
  { ai: '421', name: '收货方邮编 + ISO 国家代码', format: '3 位国别 + 字符 ≤10' },
  { ai: '422', name: '贸易项目原产国', format: '3 位数字（ISO 3166）' },
  { ai: '7001', name: '北约库存号（NSN）', format: '13 位数字' },
  { ai: '7003', name: '失效日期与时间', format: 'YYMMDDhhmm（10 位数字）' },
  { ai: '7230', name: '认证参考（Cert #0，7230-7239 同族）', format: '字符 ≤30（变长）' },
  { ai: '8001', name: '卷料尺寸（宽 / 长 / 芯径 / 方向 / 接头）', format: '14 位数字' },
  { ai: '8003', name: '全球可回收资产标识（GRAI）', format: '14 位数字 + 字符 ≤16' },
  { ai: '8004', name: '全球单个资产标识（GIAI）', format: '字符 ≤30（变长）' },
  { ai: '8006', name: '单个贸易项目件标识（ITIP）', format: '14 位数字 + 4 位数字' },
  { ai: '8007', name: '国际银行账号（IBAN）', format: '字符 ≤34（变长）' },
  { ai: '8008', name: '生产日期与时间', format: 'YYMMDDhh[mm[ss]]' },
  { ai: '8013', name: '全球型号号（GMN）', format: '13 位数字 + 字符 ≤17' },
  { ai: '8017', name: '服务提供方关系号（GSRN - provider）', format: '18 位数字' },
  { ai: '8018', name: '服务接收方关系号（GSRN - recipient）', format: '18 位数字' },
  { ai: '8019', name: '服务关系实例号（SRIN）', format: '字符 ≤20（变长）' },
  { ai: '8020', name: '付款单参考号', format: '字符 ≤25（变长）' },
  { ai: '8026', name: '物流单元内 ITIP 件标识', format: '14 位数字 + 4 位数字' },
  { ai: '90', name: '贸易伙伴约定内部数据', format: '字符 ≤30（变长）' },
];

/** AI → 含义（解析时查表，未命中显示「未知应用标识符」） */
export const GS1_AI: Record<string, string> = Object.fromEntries(
  AI_DEFS.map((d) => [d.ai, d.name]),
);

/** 日期型 AI（YYMMDD 格式） */
export const DATE_AIS = new Set(['11', '12', '13', '15', '16', '17']);

/** GS1 GTIN 数据位合法长度：7/11/12/13（对应 GTIN-8/12/13/14） */
const DATA_LENGTHS = [7, 11, 12, 13];

/** GTIN 完整码合法长度：8/12/13/14 */
const GTIN_LENGTHS = [8, 12, 13, 14];

/**
 * 年份展开：GS1 固定阈值 —— YY 00-49 视为 20xx，50-99 视为 19xx。
 * 与 content.mdx / meta.faq 口径一致（非滚动窗口）。
 */
export function expandYear(yy: string): string {
  const y = parseInt(yy, 10);
  return y >= 50 ? `19${yy}` : `20${yy}`;
}

/** 解析 YYMMDD → YYYY-MM-DD；月 / 日非法或长度不对返回 null */
export function parseGs1Date(val: string): string | null {
  const m = /^(\d{2})(\d{2})(\d{2})$/.exec(val.trim());
  if (!m) return null;
  const [, yy, mm, dd] = m;
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${expandYear(yy)}-${mm}-${dd}`;
}

/**
 * GS1 模 10 校验位（GS1 General Specifications §7.9）。
 * 输入数据位（GTIN 去掉校验位）：纯数字且长度 ∈ {7,11,12,13}，否则返回 null。
 */
export function gtinCheckDigit(dataDigits: string): number | null {
  const t = dataDigits.trim();
  if (!/^\d+$/.test(t) || !DATA_LENGTHS.includes(t.length)) return null;
  let sum = 0;
  // 从最右数据位起权重 3/1 交替（最右数据位权重 3）
  for (let i = t.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) {
    sum += parseInt(t[i], 10) * w;
  }
  return (10 - (sum % 10)) % 10;
}

/** 13 位数据位 → 追加校验位得 14 位 GTIN；输入非法返回 null */
export function appendCheckDigit(dataDigits: string): string | null {
  const cd = gtinCheckDigit(dataDigits.trim());
  return cd === null ? null : dataDigits.trim() + cd;
}

/** 校验完整 GTIN（长度 ∈ {8,12,13,14}）；任何畸形输入返回 false，不抛错 */
export function isValidGtin(gtin: string): boolean {
  const t = gtin.trim();
  if (!/^\d+$/.test(t) || !GTIN_LENGTHS.includes(t.length)) return false;
  return gtinCheck(t).ok;
}

/**
 * 校验并指出应为哪位（借鉴 QRSalt/gs1-digital-link 的提示设计：
 * 「转置相邻两位是最常见的抄错方式，错误信息应点名正确数字」）。
 */
export function gtinCheck(gtin: string): { ok: boolean; expected: string } {
  const t = gtin.trim();
  if (!/^\d+$/.test(t) || !GTIN_LENGTHS.includes(t.length)) {
    return { ok: false, expected: '' };
  }
  const data = t.slice(0, -1);
  const cd = gtinCheckDigit(data);
  if (cd === null) return { ok: false, expected: '' };
  return { ok: String(cd) === t.slice(-1), expected: String(cd) };
}

/**
 * udi-generator 输入框校验。
 * level: ok=14 位且校验通过 / warn=13 位可自动补位 / error=非法
 */
export function validateGtinField(
  v: string,
): { level: 'ok' | 'warn' | 'error'; msg: string } {
  const t = v.trim();
  if (t === '') return { level: 'error', msg: 'DI（GTIN）不能为空' };
  if (!/^\d*$/.test(t)) return { level: 'error', msg: 'GTIN 只能填数字' };
  if (t.length === 13) {
    const cd = gtinCheckDigit(t);
    return {
      level: 'warn',
      msg:
        cd === null
          ? 'GTIN 需 13 位数据位 + 1 位校验位'
          : `已按 GS1 模 10 补校验位：${cd}`,
    };
  }
  if (t.length !== 14) {
    return {
      level: 'error',
      msg: `当前 ${t.length} 位；GTIN 需 14 位（13 位数据位 + 校验位）`,
    };
  }
  const c = gtinCheck(t);
  if (!c.ok) return { level: 'error', msg: `校验位不合法，应为 ${c.expected}` };
  return { level: 'ok', msg: `校验位通过 · 发码机构：${gs1PrefixRegion(t)}` };
}

/** udi-generator 日期字段校验：YYMMDD，月 01-12 / 日 01-31 */
export function validateDateField(v: string): { ok: boolean; msg: string } {
  const t = v.trim();
  if (!/^\d{6}$/.test(t)) return { ok: false, msg: '日期需 6 位 YYMMDD，如 260401' };
  const mm = parseInt(t.slice(2, 4), 10);
  const dd = parseInt(t.slice(4, 6), 10);
  if (mm < 1 || mm > 12) return { ok: false, msg: '月份应在 01-12' };
  if (dd < 1 || dd > 31) return { ok: false, msg: '日应在 01-31' };
  return { ok: true, msg: '' };
}

/**
 * GS1 公司前缀（GTIN 前 3 位）→ 发码机构所属国家 / 地区。
 * 区间依据 GS1 官方前缀分配表（常用子集）。
 */
const PREFIX_RANGES: [number, number, string][] = [
  [690, 699, '中国大陆'],
  [489, 489, '中国香港'],
  [471, 471, '中国台湾'],
  [958, 958, '中国澳门'],
  [0, 19, '美国'],
  [30, 39, '美国'],
  [60, 139, '美国'],
  [300, 379, '法国'],
  [380, 380, '保加利亚'],
  [383, 383, '斯洛文尼亚'],
  [385, 385, '克罗地亚'],
  [400, 440, '德国'],
  [450, 459, '日本'],
  [490, 499, '日本'],
  [460, 469, '俄罗斯'],
  [470, 470, '吉尔吉斯斯坦'],
  [474, 474, '爱沙尼亚'],
  [475, 475, '拉脱维亚'],
  [476, 476, '阿塞拜疆'],
  [477, 477, '立陶宛'],
  [478, 478, '乌兹别克斯坦'],
  [479, 479, '斯里兰卡'],
  [480, 480, '菲律宾'],
  [481, 481, '白俄罗斯'],
  [482, 482, '乌克兰'],
  [484, 484, '摩尔多瓦'],
  [485, 485, '亚美尼亚'],
  [486, 486, '格鲁吉亚'],
  [487, 487, '哈萨克斯坦'],
  [488, 488, '塔吉克斯坦'],
  [500, 509, '英国'],
  [520, 520, '希腊'],
  [528, 528, '黎巴嫩'],
  [529, 529, '塞浦路斯'],
  [530, 530, '阿尔巴尼亚'],
  [531, 531, '北马其顿'],
  [535, 535, '马耳他'],
  [539, 539, '爱尔兰'],
  [540, 549, '比利时 / 卢森堡'],
  [560, 560, '葡萄牙'],
  [569, 569, '冰岛'],
  [570, 579, '丹麦'],
  [590, 590, '波兰'],
  [594, 594, '罗马尼亚'],
  [599, 599, '匈牙利'],
  [600, 601, '南非'],
  [603, 603, '加纳'],
  [608, 608, '巴林'],
  [609, 609, '毛里求斯'],
  [611, 611, '摩洛哥'],
  [613, 613, '阿尔及利亚'],
  [615, 615, '尼日利亚'],
  [616, 616, '肯尼亚'],
  [618, 618, '科特迪瓦'],
  [619, 619, '突尼斯'],
  [620, 620, '坦桑尼亚'],
  [621, 621, '叙利亚'],
  [622, 622, '埃及'],
  [623, 623, '文莱'],
  [624, 624, '利比亚'],
  [625, 625, '约旦'],
  [626, 626, '伊朗'],
  [627, 627, '科威特'],
  [628, 628, '沙特阿拉伯'],
  [629, 629, '阿联酋'],
  [640, 649, '芬兰'],
  [700, 709, '挪威'],
  [729, 729, '以色列'],
  [730, 739, '瑞典'],
  [740, 740, '危地马拉'],
  [741, 741, '萨尔瓦多'],
  [742, 742, '洪都拉斯'],
  [743, 743, '尼加拉瓜'],
  [744, 744, '哥斯达黎加'],
  [745, 745, '巴拿马'],
  [746, 746, '多米尼加'],
  [750, 750, '墨西哥'],
  [754, 755, '加拿大'],
  [759, 759, '委内瑞拉'],
  [760, 769, '瑞士 / 列支敦士登'],
  [770, 771, '哥伦比亚'],
  [773, 773, '乌拉圭'],
  [775, 775, '秘鲁'],
  [777, 777, '玻利维亚'],
  [779, 779, '阿根廷'],
  [780, 780, '智利'],
  [784, 784, '巴拉圭'],
  [786, 786, '厄瓜多尔'],
  [789, 790, '巴西'],
  [800, 839, '意大利'],
  [840, 849, '西班牙'],
  [850, 850, '古巴'],
  [858, 858, '斯洛伐克'],
  [859, 859, '捷克'],
  [860, 860, '塞尔维亚'],
  [865, 865, '蒙古'],
  [867, 867, '朝鲜'],
  [869, 869, '土耳其'],
  [870, 879, '荷兰'],
  [880, 880, '韩国'],
  [884, 884, '柬埔寨'],
  [885, 885, '泰国'],
  [888, 888, '新加坡'],
  [890, 890, '印度'],
  [893, 893, '越南'],
  [896, 896, '巴基斯坦'],
  [899, 899, '印度尼西亚'],
  [900, 919, '奥地利'],
  [930, 939, '澳大利亚'],
  [940, 949, '新西兰'],
  [955, 955, '马来西亚'],
  [977, 977, '连续出版物（ISSN）'],
  [978, 979, '图书（ISBN）'],
];

/**
 * 取国家 / 地区前缀（前 3 位）。
 * GTIN-14 首位是包装指示位（indicator 1-8/0/9），前缀从第 2 位起取；
 * GTIN-8/12/13 前 3 位即前缀。
 */
function prefixDigits(gtin: string): string {
  const t = gtin.trim();
  if (!/^\d+$/.test(t)) return '';
  return t.length === 14 ? t.slice(1, 4) : t.slice(0, 3);
}

/** 前缀数字 → 国家 / 地区；无法识别返回兜底说明 */
export function gs1PrefixRegion(gtin: string): string {
  const p3 = prefixDigits(gtin);
  if (!/^\d{3}$/.test(p3)) return '';
  const p = parseInt(p3, 10);
  for (const [lo, hi, name] of PREFIX_RANGES) {
    if (p >= lo && p <= hi) return name;
  }
  return '其他 GS1 成员国';
}

/**
 * GTIN 结构信息（udi-decoder 展示用）。
 * 注：厂商前缀与项目代码的精确切分需要 GS1 注册数据，此处只到前缀区。
 */
export function gtinStructure(
  gtin: string,
): { prefix: string; region: string; checkOk: boolean; expected: string } | null {
  const t = gtin.trim();
  const c = gtinCheck(t);
  if (c.expected === '') return null;
  const p3 = prefixDigits(t);
  return {
    prefix: p3,
    region: gs1PrefixRegion(t),
    checkOk: c.ok,
    expected: c.expected,
  };
}
