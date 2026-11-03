/**
 * 场景选模型助手 · 算法回归测试
 *
 * 跑法：
 *   node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs \
 *     scripts/test-ai-model-select.mjs
 *
 * 断言重点不是「谁该排第一」（能力评分本身是人工维护的口径，会随时调整），
 * 而是「打分链路有没有坏」：权重是否归一、约束是否真的过滤、
 * 价格是否与比价页同源、自然语言识别会不会把客户需求认错场景。
 */
import assert from 'node:assert/strict';
import {
  REF_RATE,
  buildWeights,
  costScore,
  estimateCost,
  parseNeed,
  recommend,
  scoreModel,
  taskFocus,
  verdictText,
} from '../src/tools/ai-model-selector/logic.ts';
import {
  CONSTRAINTS,
  DIMS,
  MODELS,
  TASKS,
  TASK_BY_ID,
} from '../src/tools/ai-model-selector/data.ts';
import { TASK_PAGES } from '../src/tools/ai-model-selector/seo.ts';

let pass = 0;
const fails = [];

function check(name, fn) {
  try {
    fn();
    pass++;
  } catch (e) {
    fails.push({ name, msg: e.message });
  }
}

const near = (a, b, eps = 0.001) => Math.abs(a - b) <= eps;

// ---------------------------------------------------------------- 数据完整性

check('每个模型都有价格快照（与比价页同源，不能有两套价）', () => {
  const missing = MODELS.filter((m) => !m.price).map((m) => m.name);
  assert.deepEqual(missing, [], `缺价格的模型：${missing.join('、')}`);
});

check('模型名不重复', () => {
  const names = MODELS.map((m) => m.name);
  assert.equal(new Set(names).size, names.length);
});

check('每个场景的权重和为 1', () => {
  for (const t of TASKS) {
    const sum = Object.values(t.weights).reduce((s, v) => s + (v ?? 0), 0);
    assert.ok(near(sum, 1), `${t.id} 权重和 ${sum.toFixed(3)}`);
  }
});

check('场景覆盖足够宽（≥16 类）且分组都有内容', () => {
  assert.ok(TASKS.length >= 16, `只有 ${TASKS.length} 个场景`);
  const groups = new Set(TASKS.map((t) => t.group));
  assert.equal(groups.size, 5);
});

check('每个场景都能生成非空权重画像', () => {
  for (const t of TASKS) {
    const focus = taskFocus(t.id);
    assert.ok(focus.length >= 3, `${t.id} 画像为空`);
    assert.ok(focus[0].pct > 0);
  }
});

check('所有能力分都在 0-10', () => {
  for (const m of MODELS) {
    for (const d of DIMS) {
      const v = d.id === 'cost' ? costScore(m) : d.id === 'private' ? m.privateScore : m.scores[d.id];
      assert.ok(v >= 0 && v <= 10, `${m.name} 的 ${d.id} = ${v}`);
    }
  }
});

// ---------------------------------------------------------------- 权重

check('buildWeights 归一化：任意场景 × 任意约束组合', () => {
  const ids = CONSTRAINTS.map((c) => c.id);
  for (const t of TASKS) {
    for (const c of [null, ...ids]) {
      const w = buildWeights(t.id, c ? [c] : []);
      const sum = DIMS.reduce((s, d) => s + w[d.id], 0);
      assert.ok(near(sum, 1), `${t.id}+${c} 权重和 ${sum}`);
      assert.ok(DIMS.every((d) => w[d.id] >= 0), `${t.id}+${c} 出现负权重`);
    }
  }
});

check('约束加成真的改变排序依据（预算敏感会抬高成本权重）', () => {
  const base = buildWeights('code', []);
  const withBudget = buildWeights('code', ['budget']);
  assert.ok(withBudget.cost > base.cost, `cost 权重 ${base.cost} → ${withBudget.cost}`);
});

check('「准确率优先」压低成本权重但不会变负', () => {
  const w = buildWeights('batch', ['accuracy']);
  assert.ok(w.cost >= 0);
  assert.ok(w.reasoning > buildWeights('batch', []).reasoning);
});

// ---------------------------------------------------------------- 硬过滤

check('「必须能读图」过滤后所有入选模型视觉 ≥7', () => {
  const r = recommend('writing', ['visionNeed']);
  assert.ok(r.included.length > 0, '过滤后没有可用模型');
  for (const x of r.included) assert.ok(x.model.scores.vision >= 7, `${x.model.name} 视觉 ${x.model.scores.vision}`);
  assert.ok(r.excluded.length > 0, '应该有人被排除');
  assert.ok(r.excluded.every((x) => x.excludeReason && x.excludeReason.includes('图像理解')));
});

check('「私有化」过滤后只剩开放权重模型', () => {
  const r = recommend('code', ['privacy']);
  assert.ok(r.included.length >= 2, '私有化可用模型太少');
  for (const x of r.included) assert.ok(x.model.openWeights, `${x.model.name} 非开放权重却入选`);
});

check('「国内直连」过滤后只剩境内模型', () => {
  const r = recommend('customer', ['cnDirect']);
  for (const x of r.included) assert.equal(x.model.region, 'cn');
});

check('「超长材料」过滤后上下文都 ≥300K', () => {
  const r = recommend('summary', ['ultraLong']);
  for (const x of r.included) assert.ok(x.model.ctxTokens >= 300_000, `${x.model.name} 上下文不足`);
});

check('「稳定 JSON」过滤后结构化都 ≥7', () => {
  const r = recommend('rag', ['jsonStable']);
  for (const x of r.included) assert.ok(x.model.scores.structured >= 7);
});

check('多约束叠加不会把结果清空', () => {
  const combos = [
    ['budget', 'visionNeed'],
    ['cnDirect', 'jsonStable'],
    ['privacy', 'ultraLong'],
    ['lowLatency', 'accuracy'],
  ];
  for (const c of combos) {
    const r = recommend('agent', c);
    assert.ok(r.included.length > 0, `${c.join('+')} 无可用模型`);
  }
});

// ---------------------------------------------------------------- 排序合理性

check('写代码场景：首选编码能力 ≥8', () => {
  const r = recommend('code', []);
  assert.ok(r.top, '没有首选');
  assert.ok(r.top.model.scores.coding >= 8, `${r.top.model.name} 编码 ${r.top.model.scores.coding}`);
});

check('中文客服（含默认约束）：首选中文 ≥9 且成本友好 ≥7', () => {
  const r = recommend('customer', TASK_BY_ID.get('customer').defaults);
  assert.ok(r.top.model.scores.chinese >= 9, `${r.top.model.name} 中文 ${r.top.model.scores.chinese}`);
  assert.ok(costScore(r.top.model) >= 7, `${r.top.model.name} 成本分 ${costScore(r.top.model)}`);
});

check('图像场景：首选视觉 ≥8', () => {
  const r = recommend('ocr', []);
  assert.ok(r.top.model.scores.vision >= 8);
});

check('数学推理：首选推理 ≥9（不允许被通用模型靠广度挤掉）', () => {
  const r = recommend('math', []);
  assert.ok(r.top.model.scores.reasoning >= 9, `${r.top.model.name} 推理 ${r.top.model.scores.reasoning}`);
});

check('长文摘要：首选上下文 ≥1M', () => {
  const r = recommend('summary', []);
  assert.ok(r.top.model.ctxTokens >= 1_000_000);
});

check('匹配度落在 0-100 且降序', () => {
  const r = recommend('research', []);
  let prev = 101;
  for (const x of r.included) {
    assert.ok(x.fit >= 0 && x.fit <= 100, `fit ${x.fit}`);
    assert.ok(x.fit <= prev, '未按匹配度降序');
    prev = x.fit;
  }
});

check('备选一定换了一家厂商', () => {
  const r = recommend('writing', []);
  assert.ok(r.runnerUp);
  assert.notEqual(r.runnerUp.model.provider, r.top.model.provider);
});

check('省钱替代确实更便宜', () => {
  const r = recommend('summary', ['budget']);
  if (r.budgetPick) {
    assert.ok(costScore(r.budgetPick.model) > costScore(r.top.model), '省钱替代不比首选便宜');
    assert.ok(r.budgetPick.fit >= r.top.fit - 8, '省钱替代分数掉太多');
  }
});

check('每个推荐都带可解释的理由与代价', () => {
  const r = recommend('legal', []);
  for (const x of r.included.slice(0, 5)) {
    assert.ok(x.reasons.length >= 2, `${x.model.name} 没有推荐理由`);
    assert.ok(x.contributions.length >= 3);
    assert.ok(near(x.contributions.reduce((s, c) => s + c.share, 0), 1, 0.02), '贡献占比不为 1');
  }
});

// ---------------------------------------------------------------- 成本估算

check('成本估算口径：输入 + 输出分别计价', () => {
  const gpt54 = MODELS.find((m) => m.name === 'GPT-5.4');
  const c = estimateCost(gpt54, 100, 2000, 1000);
  // 2.5/M × 2000 + 15/M × 1000 = 0.005 + 0.015 = 0.02 USD/次
  assert.ok(near(c.perCall, 0.02, 1e-6), `perCall=${c.perCall}`);
  assert.ok(near(c.usd, 0.02 * 30 * 100, 1e-6));
  assert.ok(near(c.cny, c.usd * REF_RATE, 1e-6));
});

check('输出价未公开的模型不给瞎估', () => {
  const doubao = MODELS.find((m) => m.name === 'Doubao 旗舰');
  assert.equal(estimateCost(doubao, 100, 1000, 500), null);
});

// ---------------------------------------------------------------- 自然语言识别

const cases = [
  {
    text: '我要给公司做一个中文客服机器人，每天大概 2 万次对话，预算有限',
    task: 'customer',
    has: ['budget', 'highVolume'],
  },
  { text: '几十万字的合同要审，条款之间还互相引用，不能出错', task: 'legal', has: ['ultraLong', 'accuracy'] },
  { text: '把截图里的表格识别出来，输出 JSON 给系统用', task: 'ocr', has: ['visionNeed', 'jsonStable'] },
  { text: '公司内网要做私有化部署的中文知识库问答', task: 'rag', has: ['privacy'] },
  { text: '帮我写小红书文案，语气要像真人', task: 'writing', has: [] },
  { text: '用 React 写一个后台管理页面，还要能跑单元测试', task: 'code', has: [] },
  { text: '做成客服售后机器人，接进企业微信，走国内直连', task: 'customer', has: ['cnDirect'] },
  { text: '给短视频写口播脚本，前三秒要抓人', task: 'script', has: [] },
  { text: '每天 100 万条数据打标清洗，越便宜越好', task: 'batch', has: ['highVolume', 'budget'] },
];

for (const c of cases) {
  check(`需求识别：${c.text.slice(0, 18)}… → ${c.task}`, () => {
    const p = parseNeed(c.text);
    assert.equal(p.taskId, c.task, `识别成 ${p.taskId}`);
    for (const id of c.has) assert.ok(p.constraints.includes(id), `漏了约束 ${id}（实际 ${p.constraints.join(',')}）`);
    assert.ok(p.confidence > 0);
    assert.ok(p.hits.length > 0);
  });
}

check('空输入不瞎猜', () => {
  const p = parseNeed('   ');
  assert.equal(p.taskId, undefined);
  assert.equal(p.constraints.length, 0);
  assert.equal(p.confidence, 0);
});

check('识别结果能直接跑推荐（端到端）', () => {
  const p = parseNeed('做一个国内直连的中文客服机器人，预算敏感');
  const r = recommend(p.taskId, p.constraints);
  assert.ok(r.top, '识别后无推荐');
  assert.ok(r.included.every((x) => x.model.region === 'cn'));
});

// ---------------------------------------------------------------- 导出文案

check('推荐结论文案包含首选、理由与免责声明', () => {
  const r = recommend('code', []);
  const txt = verdictText(r, TASK_BY_ID.get('code'), { calls: 200, inTok: 4000, outTok: 1500 });
  assert.ok(txt.includes('首选：'));
  assert.ok(txt.includes('匹配度'));
  assert.ok(txt.includes('月成本估算'));
  assert.ok(txt.includes('最终以自身数据压测为准'));
});

// ---------------------------------------------------------------- 长尾子页

check('18 个场景都有对应的长尾子页文案', () => {
  assert.equal(Object.keys(TASK_PAGES).length, TASKS.length);
  for (const t of TASKS) assert.ok(TASK_PAGES[t.id], `场景 ${t.id} 缺子页文案`);
});

check('子页 slug 全小写连字符、无重复、长度可读', () => {
  const slugs = Object.values(TASK_PAGES).map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, `slug 有重复：${slugs.join(',')}`);
  for (const s of slugs) {
    assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/, `slug 不合规：${s}`);
    assert.ok(s.length <= 24, `slug 过长：${s}`);
  }
});

check('子页标题与描述长度落在可展示区间', () => {
  for (const [id, p] of Object.entries(TASK_PAGES)) {
    assert.ok(p.title.length >= 6 && p.title.length <= 18, `${id} h1 长度异常（${p.title.length}）`);
    assert.ok(p.seoTitle.length >= 18 && p.seoTitle.length <= 34, `${id} seoTitle 长度异常（${p.seoTitle.length}）`);
    assert.ok(p.description.length >= 70 && p.description.length <= 130, `${id} description 长度异常（${p.description.length}）`);
    assert.ok(p.faq.length >= 2, `${id} FAQ 少于 2 条`);
  }
});

// ---------------------------------------------------------------- 输出

console.log(`\n场景选模型助手 · 算法回归\n${'─'.repeat(52)}`);
console.log(`模型 ${MODELS.length} 个 · 场景 ${TASKS.length} 类 · 约束 ${CONSTRAINTS.length} 项 · 维度 ${DIMS.length} 个`);
console.log(`通过 ${pass} 项，失败 ${fails.length} 项\n`);
if (fails.length) {
  for (const f of fails) console.log(`✗ ${f.name}\n  ${f.msg}`);
  process.exit(1);
}
console.log('✅ 全部通过');
