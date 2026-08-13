/**
 * server.mjs —— MokaKit MCP Server（本地版 / 战略核心第一步）
 * ----------------------------------------------------------------------------
 * 协议：Streamable HTTP + JSON-RPC 2.0（符合 MCP 规范的最小可用实现）
 * 传输：零外部依赖，仅用 Node 内置 http / crypto
 *
 * 三原则落地：
 *   1. 同源发现：元数据来自各工具目录下的 meta.ts（meta-loader），不另写清单。
 *   2. compute 入参即契约：直接 import src/lib/*.ts 的纯函数，零重写。
 *   3. 描述从 meta 生成：MCP tool 描述取自对应 meta.ts。
 *
 * 工具清单：
 *   - 14 个计算型 tool（复用 china-tax / social-security / vat / mortgage / china-calc-extra 纯函数）
 *   - 1 个 search-first 入口 mokakit_search（在 100 工具目录里按词检索）
 *
 * 运行：node --experimental-strip-types mcp/server.mjs   （监听 MCP_PORT，默认 18700）
 * 客户端接入 URL：http://localhost:18700/mcp
 */
import http from 'node:http';
import crypto from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { loadAllMeta } from './meta-loader.mjs';

// ── 复用纯计算层（src/lib/*.ts，仅依赖 decimal.js，无浏览器 API）─────────
// 注意：生产态由 mcp/build.mjs 用 esbuild 把本文件与这些 .ts 打成自包含
// deploy/mcp/server.mjs（target=node18），服务器无需 TS 运行时、无需 src/ 源码。
// 6 个中国本土计算器（退休年龄/税后工资/存款利息/契税/加班工资/养老金）的纯函数
// 统一在 china-calc-extra.ts，与 Tool.tsx 同源、零浏览器 API。
import { calcIncomeTaxAnnual, calcBonusTaxSeparate, compareBonus } from '../src/lib/china-tax.ts';
import { calcSocialSecurity } from '../src/lib/china-social-security.ts';
import { calcGeneralVat, calcSimpleVat } from '../src/lib/china-vat.ts';
import { buildSchedule, calcEarlyRepayment } from '../src/lib/mortgage.ts';
import {
  calcRetirementAge,
  calcAfterTaxSalary,
  calcDepositInterest,
  calcDeedTax,
  calcOvertimePay,
  calcPensionEstimate,
} from '../src/lib/china-calc-extra.ts';

const PORT = Number(process.env.MCP_PORT || 18700);
const SERVER_NAME = 'mokakit-mcp';
const SERVER_VERSION = '0.1.0';
const API_VERSION = 'v1';
const SUPPORTED_PROTOCOLS = ['2025-06-18', '2024-11-05'];

// ── 鉴权（可选 Bearer token；未设置 MCP_TOKEN 则不校验，便于本地/验证态）──
const REQUIRED_TOKEN = process.env.MCP_TOKEN || '';

// ── 元数据（同源发现）────────────────────────────────────────────────────
// 优先读构建期生成的 catalog.json（生产态，不依赖 src/ 与 TS 运行时）；
// 读不到再回退运行时扫描 src/tools/*/meta.ts（本地 dev 态）。
function getCatalog() {
  try {
    const p = new URL('./catalog.json', import.meta.url);
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    /* ignore */
  }
  return loadAllMeta();
}
const { tools: CATALOG, errors: META_ERRORS } = getCatalog();
const META_BY_ID = new Map(CATALOG.map((t) => [t.id, t]));

/** catalog id → 对应的计算型 MCP tool 名（search-first 时告诉 AI 可直接调用） */
const CONCRETE_BY_ID = {
  'income-tax-cn': 'income_tax_cn',
  'bonus-tax-cn': 'bonus_tax_cn',
  'social-security-cn': 'social_security_cn',
  'vat-calc': 'vat_general_cn',
  'mortgage-early-repayment': 'mortgage_early_repayment_cn',
  'fund-loan-calc': 'mortgage_schedule_cn',
  'retirement-age': 'retirement_age_cn',
  'after-tax-salary': 'after_tax_salary_cn',
  'deposit-interest': 'deposit_interest_cn',
  'deed-tax': 'deed_tax_cn',
  'overtime-pay': 'overtime_pay_cn',
  'pension-estimate': 'pension_estimate_cn',
};

function desc(id, fallback) {
  const m = META_BY_ID.get(id);
  return m && m.description ? m.description : fallback;
}
function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

// ── search-first 检索 ───────────────────────────────────────────────────────
function searchCatalog(query, limit = 8) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  return CATALOG.map((t) => {
    const hay = [t.name, t.description, t.tagline, ...t.keywords, ...t.tags, t.id, t.category]
      .join(' ')
      .toLowerCase();
    let score = 0;
    for (const tk of tokens) {
      if (t.name.toLowerCase().includes(tk)) score += 5;
      if (t.id.toLowerCase().includes(tk)) score += 3;
      if (hay.includes(tk)) score += 1;
    }
    return { t, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => ({
      id: x.t.id,
      name: x.t.name,
      description: x.t.description,
      category: x.t.category,
      url: x.t.url,
      mcpTool: CONCRETE_BY_ID[x.t.id] || null,
    }));
}

// ── 计算型 tool 定义（compute 入参即契约）─────────────────────────────────
const COMPUTE_TOOLS = [
  {
    name: 'income_tax_cn',
    description: desc(
      'income-tax-cn',
      '中国综合所得（工资薪金）年度个税计算。输入年税前收入、三险一金、专项附加扣除、其他扣除，输出应纳税所得额、税额、税率、到手年收入/月收入、实际税负率。'
    ),
    inputSchema: {
      type: 'object',
      properties: {
        annualGross: { type: 'number', description: '年税前收入（元）' },
        annualSocialInsurance: { type: 'number', description: '全年三险一金个人缴纳合计（元）', default: 0 },
        annualSpecialAddition: { type: 'number', description: '全年专项附加扣除合计（元）', default: 0 },
        annualOtherDeduction: { type: 'number', description: '全年其他依法扣除（元）', default: 0 },
      },
      required: ['annualGross'],
    },
    handler: (a) =>
      calcIncomeTaxAnnual({
        annualGross: num(a.annualGross),
        annualSocialInsurance: num(a.annualSocialInsurance, 0),
        annualSpecialAddition: num(a.annualSpecialAddition, 0),
        annualOtherDeduction: num(a.annualOtherDeduction, 0),
      }),
  },
  {
    name: 'bonus_tax_cn',
    description: desc(
      'bonus-tax-cn',
      '中国全年一次性奖金单独计税（2024-2027 延续政策）。输入奖金金额，输出税额、税率、到手金额，并提示税率跳档盲区（多发 1 元到手反而更少）。'
    ),
    inputSchema: {
      type: 'object',
      properties: {
        bonus: { type: 'number', description: '全年一次性奖金金额（元）' },
      },
      required: ['bonus'],
    },
    handler: (a) => calcBonusTaxSeparate(num(a.bonus)),
  },
  {
    name: 'bonus_compare_cn',
    description: desc(
      'bonus-tax-cn',
      '年终奖「单独计税 vs 并入综合所得」对比。输入奖金金额与当年综合所得应纳税所得额，输出两种方案税额与更优方案。'
    ),
    inputSchema: {
      type: 'object',
      properties: {
        bonus: { type: 'number', description: '全年一次性奖金金额（元）' },
        comprehensiveTaxable: {
          type: 'number',
          description: '当年综合所得应纳税所得额（已扣基本减除/三险一金/专项附加后的金额，元）',
        },
      },
      required: ['bonus', 'comprehensiveTaxable'],
    },
    handler: (a) => compareBonus(num(a.bonus), num(a.comprehensiveTaxable)),
  },
  {
    name: 'social_security_cn',
    description: desc(
      'social-security-cn',
      '中国五险一金计算。输入缴费基数（可含上下限夹取与自定义费率），输出各项个人/单位缴纳额及合计。默认采用全国通用参考费率。'
    ),
    inputSchema: {
      type: 'object',
      properties: {
        base: { type: 'number', description: '缴费基数（元/月）' },
        baseFloor: { type: 'number', description: '基数下限（元/月），不传表示不限制' },
        baseCeil: { type: 'number', description: '基数上限（元/月），不传表示不限制' },
        housingFundEnabled: { type: 'boolean', description: '是否计算住房公积金，默认 true' },
        rates: {
          type: 'object',
          description: '自定义费率（可选）。结构：{ pension:{personal,employer}, medical:{...}, unemployment:{...}, injury:{...}, maternity:{...}, housingFund:{...} }，费率为百分数',
          additionalProperties: true,
        },
      },
      required: ['base'],
    },
    handler: (a) =>
      calcSocialSecurity({
        base: num(a.base),
        baseFloor: a.baseFloor != null ? num(a.baseFloor) : undefined,
        baseCeil: a.baseCeil != null ? num(a.baseCeil) : undefined,
        housingFundEnabled: a.housingFundEnabled != null ? !!a.housingFundEnabled : undefined,
        rates: a.rates,
      }),
  },
  {
    name: 'vat_general_cn',
    description: desc(
      'vat-calc',
      '中国增值税一般计税（一般纳税人）：应纳税额 = 销项税额 − 进项税额。输出销项、进项、净额、本期应纳与留抵税额。'
    ),
    inputSchema: {
      type: 'object',
      properties: {
        salesAmount: { type: 'number', description: '不含税销售额（元）' },
        salesRate: { type: 'number', description: '销项税率（%），如 13 / 9 / 6' },
        purchaseAmount: { type: 'number', description: '不含税采购额（元）' },
        purchaseRate: { type: 'number', description: '进项税率（%）' },
      },
      required: ['salesAmount', 'salesRate', 'purchaseAmount', 'purchaseRate'],
    },
    handler: (a) =>
      calcGeneralVat({
        salesAmount: num(a.salesAmount),
        salesRate: num(a.salesRate),
        purchaseAmount: num(a.purchaseAmount),
        purchaseRate: num(a.purchaseRate),
      }),
  },
  {
    name: 'vat_simple_cn',
    description: desc(
      'vat-calc',
      '中国增值税简易计税（小规模纳税人/特定业务）：应纳税额 = 不含税销售额 × 征收率。输出税额。'
    ),
    inputSchema: {
      type: 'object',
      properties: {
        salesAmount: { type: 'number', description: '不含税销售额（元）' },
        levyRate: { type: 'number', description: '征收率（%），如 3 / 1 / 5' },
      },
      required: ['salesAmount', 'levyRate'],
    },
    handler: (a) => calcSimpleVat({ salesAmount: num(a.salesAmount), levyRate: num(a.levyRate) }),
  },
  {
    name: 'mortgage_schedule_cn',
    description: desc(
      'fund-loan-calc',
      '房贷还款计划计算（商贷/公积金贷）。支持等额本息与等额本金两种还款方式，输出月供、总利息、总还款额及逐期还款明细。'
    ),
    inputSchema: {
      type: 'object',
      properties: {
        principal: { type: 'number', description: '贷款本金（元）' },
        annualRatePct: { type: 'number', description: '年利率（%），如 3.85' },
        periods: { type: 'number', description: '还款总期数（月）' },
        method: { type: 'string', enum: ['equal-payment', 'equal-principal'], description: 'equal-payment=等额本息，equal-principal=等额本金' },
      },
      required: ['principal', 'annualRatePct', 'periods', 'method'],
    },
    handler: (a) =>
      buildSchedule(num(a.principal), num(a.annualRatePct), num(a.periods), a.method),
  },
  {
    name: 'mortgage_early_repayment_cn',
    description: desc(
      'mortgage-early-repayment',
      '房贷提前还款测算。输入原贷款信息与本次提前还款金额，对比「减少月供」与「缩短期限」两种方案，输出节省利息与新月供/新期数。'
    ),
    inputSchema: {
      type: 'object',
      properties: {
        principal: { type: 'number', description: '原贷款本金（元）' },
        annualRatePct: { type: 'number', description: '原年利率（%）' },
        periods: { type: 'number', description: '原还款总期数（月）' },
        method: { type: 'string', enum: ['equal-payment', 'equal-principal'], description: '原还款方式' },
        paidPeriods: { type: 'number', description: '已还期数' },
        prepayAmount: { type: 'number', description: '本次提前还款金额（元）' },
        mode: { type: 'string', enum: ['reduce', 'shorten'], description: 'reduce=减少月供(期限不变)，shorten=缩短期限(月供不变)' },
      },
      required: ['principal', 'annualRatePct', 'periods', 'method', 'paidPeriods', 'prepayAmount', 'mode'],
    },
    handler: (a) =>
      calcEarlyRepayment({
        principal: num(a.principal),
        annualRatePct: num(a.annualRatePct),
        periods: num(a.periods),
        method: a.method,
        paidPeriods: num(a.paidPeriods),
        prepayAmount: num(a.prepayAmount),
        mode: a.mode,
      }),
  },
  {
    name: 'retirement_age_cn',
    description: desc(
      'retirement-age',
      '退休年龄测算。依据 2025 年起实施的渐进式延迟退休政策，输入出生年月与人员类别（男职工 / 女职工干部 / 女工人），自动测算法定退休年龄、延迟月数与具体退休年月。'
    ),
    inputSchema: {
      type: 'object',
      properties: {
        birthYear: { type: 'number', description: '出生年份（1940–2010）' },
        birthMonth: { type: 'number', description: '出生月份（1–12）' },
        category: {
          type: 'string',
          enum: ['male', 'female-cadre', 'female-worker'],
          description: 'male=男职工(60→63)，female-cadre=女职工/女干部(55→58)，female-worker=女工人(50→55)',
          default: 'male',
        },
      },
      required: ['birthYear', 'birthMonth'],
    },
    handler: (a) =>
      calcRetirementAge(num(a.birthYear), num(a.birthMonth), a.category || 'male'),
  },
  {
    name: 'after_tax_salary_cn',
    description: desc(
      'after-tax-salary',
      '税后工资计算器。正算：输入税前月薪、三险一金与专项附加，算出月个税与税后到手；反推：输入税后到手金额，反推对应税前工资。按综合所得年度税率表计算。'
    ),
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['forward', 'reverse'], description: 'forward=正算(税前→税后)，reverse=反推(税后→税前)', default: 'forward' },
        monthlyGross: { type: 'number', description: '每月税前工资（元），mode=forward 时必填' },
        monthlyNet: { type: 'number', description: '每月税后到手（元），mode=reverse 时必填' },
        monthlySocial: { type: 'number', description: '每月三险一金个人缴纳（元）', default: 0 },
        monthlySpecial: { type: 'number', description: '每月专项附加扣除（元）', default: 0 },
      },
      required: ['mode'],
    },
    handler: (a) =>
      calcAfterTaxSalary({
        mode: a.mode || 'forward',
        monthlyGross: a.monthlyGross != null ? num(a.monthlyGross) : undefined,
        monthlyNet: a.monthlyNet != null ? num(a.monthlyNet) : undefined,
        monthlySocial: num(a.monthlySocial, 0),
        monthlySpecial: num(a.monthlySpecial, 0),
      }),
  },
  {
    name: 'deposit_interest_cn',
    description: desc(
      'deposit-interest',
      '存款利息计算器。输入本金、年利率与存期，支持到期一次性还本付息（单利）、自动转存（复利）与按月付息三种计息方式，算出利息金额与到期本息合计。'
    ),
    inputSchema: {
      type: 'object',
      properties: {
        principal: { type: 'number', description: '本金（元）' },
        annualRatePct: { type: 'number', description: '年利率（%），如 2.0' },
        years: { type: 'number', description: '存期（年，可填小数，如 0.25 为 3 个月）' },
        mode: { type: 'string', enum: ['once', 'compound', 'monthly'], description: 'once=一次性付息(单利)，compound=自动转存(复利)，monthly=按月付息', default: 'compound' },
      },
      required: ['principal', 'annualRatePct', 'years'],
    },
    handler: (a) =>
      calcDepositInterest({
        principal: num(a.principal),
        annualRatePct: num(a.annualRatePct),
        years: num(a.years),
        mode: a.mode || 'compound',
      }),
  },
  {
    name: 'deed_tax_cn',
    description: desc(
      'deed-tax',
      '契税计算器。输入房屋成交价格（万元）、建筑面积与家庭住房套数（首套 / 二套 / 三套及以上），按现行契税优惠政策测算适用税率与应缴契税额。支持含税价自动剔除增值税。'
    ),
    inputSchema: {
      type: 'object',
      properties: {
        priceWan: { type: 'number', description: '成交价格（万元）' },
        area: { type: 'number', description: '建筑面积（㎡）' },
        tier: { type: 'string', enum: ['first', 'second', 'third'], description: 'first=家庭唯一住房，second=第二套改善性住房，third=第三套及以上' },
        vatInclusive: { type: 'boolean', description: '成交价是否含 5% 增值税（勾选后自动剔除再计税）', default: false },
      },
      required: ['priceWan', 'area', 'tier'],
    },
    handler: (a) =>
      calcDeedTax({
        priceWan: num(a.priceWan),
        area: num(a.area),
        tier: a.tier,
        vatInclusive: a.vatInclusive != null ? !!a.vatInclusive : false,
      }),
  },
  {
    name: 'overtime_pay_cn',
    description: desc(
      'overtime-pay',
      '加班工资计算器。输入月工资与各类加班小时数，按标准工时制核算加班费：工作日延长 150%、休息日 200%、法定休假日 300%。输出日工资、小时工资与加班费合计。'
    ),
    inputSchema: {
      type: 'object',
      properties: {
        monthlySalary: { type: 'number', description: '每月工资（元）' },
        weekdayHours: { type: 'number', description: '工作日加班小时数', default: 0 },
        restDayHours: { type: 'number', description: '休息日加班小时数', default: 0 },
        holidayHours: { type: 'number', description: '法定节假日加班小时数', default: 0 },
      },
      required: ['monthlySalary'],
    },
    handler: (a) =>
      calcOvertimePay({
        monthlySalary: num(a.monthlySalary),
        weekdayHours: num(a.weekdayHours, 0),
        restDayHours: num(a.restDayHours, 0),
        holidayHours: num(a.holidayHours, 0),
      }),
  },
  {
    name: 'pension_estimate_cn',
    description: desc(
      'pension-estimate',
      '养老金测算。输入退休年龄、当地上年度社平工资、本人平均缴费指数、累计缴费年限与个人账户储存额，按现行职工基本养老保险公式估算每月基础养老金与个人账户养老金。'
    ),
    inputSchema: {
      type: 'object',
      properties: {
        retireAge: { type: 'string', enum: ['50', '55', '60', '65'], description: '退休年龄（对应计发月数 195/170/139/101）', default: '60' },
        avgWage: { type: 'number', description: '当地上年度社平工资（元/月）' },
        index: { type: 'number', description: '本人平均缴费指数（0.6–3）' },
        years: { type: 'number', description: '累计缴费年限（年）' },
        personalBalance: { type: 'number', description: '个人账户储存额（元）' },
      },
      required: ['avgWage', 'index', 'years', 'personalBalance'],
    },
    handler: (a) =>
      calcPensionEstimate({
        retireAge: a.retireAge || '60',
        avgWage: num(a.avgWage),
        index: num(a.index),
        years: num(a.years),
        personalBalance: num(a.personalBalance),
      }),
  },
];

const SEARCH_TOOL = {
  name: 'mokakit_search',
  description:
    '在 MokaKit 摩卡工具箱（全部工具）中按关键词检索。返回匹配的工具 id、名称、说明、分类、站内链接；若该工具配有对应的计算型 MCP 工具，则附带 mcpTool 名称，AI 可直接调用该工具完成计算。这是「先搜后算」的 search-first 入口。',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: '检索词，如「个税」「房贷提前还款」「增值税」「二维码」等' },
      limit: { type: 'number', description: '返回条数上限', default: 8 },
    },
    required: ['query'],
  },
  handler: (a) => ({ query: a.query, count: searchCatalog(a.query, num(a.limit, 8)).length, results: searchCatalog(a.query, num(a.limit, 8)) }),
};

const TOOLS = [...COMPUTE_TOOLS, SEARCH_TOOL];
const TOOL_MAP = new Map(TOOLS.map((t) => [t.name, t]));

// ── JSON-RPC 辅助 ──────────────────────────────────────────────────────────
function rpcResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}
function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

const sessions = new Map();

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      if (!data) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function dispatch(msg, sessionId) {
  if (!msg || typeof msg !== 'object') {
    return { body: rpcError(null, -32700, 'Parse error') };
  }
  const { method, params = {}, id } = msg;
  const isNotification = method && method.startsWith('notifications/') && id === undefined;

  if (!method) {
    return { body: rpcError(id, -32600, 'Invalid Request: missing method') };
  }
  // 非 initialize 必须带有效 session
  if (method !== 'initialize' && !isNotification) {
    if (!sessionId || !sessions.has(sessionId)) {
      return { body: rpcError(id, -32000, 'No valid sessionId. Send initialize first.') };
    }
  }

  if (isNotification) {
    return { notification: true };
  }

  if (method === 'initialize') {
    const reqProto = params && params.protocolVersion;
    const chosen = SUPPORTED_PROTOCOLS.includes(reqProto) ? reqProto : SUPPORTED_PROTOCOLS[0];
    const newId = crypto.randomUUID();
    sessions.set(newId, { createdAt: Date.now() });
    return {
      sessionId: newId,
      body: rpcResult(id, {
        protocolVersion: chosen,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      }),
    };
  }

  if (method === 'ping') {
    return { body: rpcResult(id, {}) };
  }

  if (method === 'tools/list') {
    return {
      body: rpcResult(id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      }),
    };
  }

  if (method === 'tools/call') {
    const name = params && params.name;
    const args = (params && params.arguments) || {};
    const tool = TOOL_MAP.get(name);
    if (!tool) {
      return { body: rpcError(id, -32602, `Unknown tool: ${name}`) };
    }
    try {
      const out = tool.handler(args);
      return {
        body: rpcResult(id, {
          content: [{ type: 'text', text: JSON.stringify(out, null, 2) }],
          structuredContent: out,
          isError: false,
        }),
      };
    } catch (e) {
      return {
        body: rpcResult(id, {
          content: [{ type: 'text', text: `计算失败：${String(e && e.message ? e.message : e)}` }],
          isError: true,
        }),
      };
    }
  }

  return { body: rpcError(id, -32601, `Method not found: ${method}`) };
}

function writeJson(res, code, body, sessionId) {
  const headers = { 'Content-Type': 'application/json' };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  res.writeHead(code, headers);
  res.end(JSON.stringify(body));
}

async function handlePost(req, res) {
  let body;
  try {
    body = await readBody(req);
  } catch {
    writeJson(res, 400, rpcError(null, -32700, 'Invalid JSON'));
    return;
  }
  const headerSession = req.headers['mcp-session-id'];
  const sessionId0 = headerSession && sessions.has(headerSession) ? headerSession : null;
  const messages = Array.isArray(body) ? body : [body];

  const out = [];
  let sessionId = sessionId0;
  let onlyNotification = true;
  for (const msg of messages) {
    const d = dispatch(msg, sessionId);
    if (d.sessionId) sessionId = d.sessionId;
    if (d.notification) continue;
    onlyNotification = false;
    out.push(d.body);
  }

  if (messages.length === 1 && onlyNotification) {
    res.writeHead(202);
    res.end();
    return;
  }
  writeJson(res, 200, messages.length === 1 ? out[0] : out, sessionId);
}

const server = http.createServer(async (req, res) => {
  // ── 鉴权守卫：/mcp 的写操作需 Bearer token（若已配置 MCP_TOKEN）──
  if ((req.method === 'POST' || req.method === 'DELETE') && req.url === '/mcp') {
    if (REQUIRED_TOKEN && req.headers['authorization'] !== `Bearer ${REQUIRED_TOKEN}`) {
      writeJson(res, 401, rpcError(null, -32001, 'Unauthorized: missing/invalid Bearer token'));
      return;
    }
  }
  if (req.method === 'POST' && req.url === '/mcp') {
    await handlePost(req, res);
    return;
  }
  if (req.method === 'DELETE' && req.url === '/mcp') {
    const sid = req.headers['mcp-session-id'];
    if (sid && sessions.has(sid)) {
      sessions.delete(sid);
      res.writeHead(200);
    } else {
      res.writeHead(404);
    }
    res.end();
    return;
  }
  if (req.method === 'GET' && req.url === '/mcp') {
    res.writeHead(405, { Allow: 'POST, DELETE' });
    res.end();
    return;
  }
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        apiVersion: API_VERSION,
        tokenRequired: !!REQUIRED_TOKEN,
        tools: TOOLS.length,
        catalogSize: CATALOG.length,
        metaErrors: META_ERRORS.length,
        endpoint: '/mcp',
      })
    );
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, process.env.HOST || '0.0.0.0', () => {
  const bound = process.env.HOST || '0.0.0.0';
  console.log(`[mokakit-mcp] listening on http://${bound}:${PORT}/mcp`);
  console.log(`[mokakit-mcp] catalog=${CATALOG.length} tools, mcpTools=${TOOLS.length}, metaErrors=${META_ERRORS.length}`);
  if (META_ERRORS.length) {
    console.warn('[mokakit-mcp] meta parse errors:', META_ERRORS.slice(0, 5));
  }
});
