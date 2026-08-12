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
 *   - 8 个计算型 tool（复用 china-tax / social-security / vat / mortgage 纯函数）
 *   - 1 个 search-first 入口 mokakit_search（在 94 工具目录里按词检索）
 *
 * 运行：node --experimental-strip-types mcp/server.mjs   （监听 MCP_PORT，默认 18700）
 * 客户端接入 URL：http://localhost:18700/mcp
 */
import http from 'node:http';
import crypto from 'node:crypto';
import { loadAllMeta } from './meta-loader.mjs';

// ── 复用纯计算层（src/lib/*.ts，仅依赖 decimal.js，无浏览器 API）─────────
import { calcIncomeTaxAnnual, calcBonusTaxSeparate, compareBonus } from '../src/lib/china-tax.ts';
import { calcSocialSecurity } from '../src/lib/china-social-security.ts';
import { calcGeneralVat, calcSimpleVat } from '../src/lib/china-vat.ts';
import { buildSchedule, calcEarlyRepayment } from '../src/lib/mortgage.ts';

const PORT = Number(process.env.MCP_PORT || 18700);
const SERVER_NAME = 'mokakit-mcp';
const SERVER_VERSION = '0.1.0';
const SUPPORTED_PROTOCOLS = ['2025-06-18', '2024-11-05'];

// ── 元数据（同源发现）────────────────────────────────────────────────────
const { tools: CATALOG, errors: META_ERRORS } = loadAllMeta();
const META_BY_ID = new Map(CATALOG.map((t) => [t.id, t]));

/** catalog id → 对应的计算型 MCP tool 名（search-first 时告诉 AI 可直接调用） */
const CONCRETE_BY_ID = {
  'income-tax-cn': 'income_tax_cn',
  'bonus-tax-cn': 'bonus_tax_cn',
  'social-security-cn': 'social_security_cn',
  'vat-calc': 'vat_general_cn',
  'mortgage-early-repayment': 'mortgage_early_repayment_cn',
  'fund-loan-calc': 'mortgage_schedule_cn',
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

server.listen(PORT, () => {
  console.log(`[mokakit-mcp] listening on http://localhost:${PORT}/mcp`);
  console.log(`[mokakit-mcp] catalog=${CATALOG.length} tools, mcpTools=${TOOLS.length}, metaErrors=${META_ERRORS.length}`);
  if (META_ERRORS.length) {
    console.warn('[mokakit-mcp] meta parse errors:', META_ERRORS.slice(0, 5));
  }
});
