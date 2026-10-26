/**
 * jian-fan.ts 纯函数回归（src/lib/jian-fan.ts）
 * 跑法：node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs scripts/test-jian-fan.mjs
 */
import { convert } from '../src/lib/jian-fan.ts';

let pass = 0;
let fail = 0;
function eq(actual, expected, label) {
  if (actual === expected) {
    pass++;
  } else {
    fail++;
    console.error(`✗ ${label}\n  期望: ${expected}\n  实际: ${actual}`);
  }
}

const j2f = (s, region) => convert(s, { direction: 'j2f', region: region ?? 'generic' });
const f2j = (s, region) => convert(s, { direction: 'f2j', region: region ?? 'generic' });

// P0 数据修复（计划验收样例）
eq(j2f('处理'), '處理', '处境脏数据已删：处理→處理');
eq(j2f('发展'), '發展', '发→發（原被髮覆盖）：发展→發展');
eq(j2f('回来'), '回來', '回迴 已删：回来→回來');
eq(j2f('干部'), '幹部', '干→幹（原被乾覆盖）：干部→幹部');
eq(j2f('干净'), '乾淨', '词组优先：干净→乾淨');
eq(j2f('头发'), '頭髮', '词组优先：头发→头发→頭髮');
eq(j2f('公里'), '公里', '词组兜底：公里不被 里→裡 污染');
eq(j2f('脏乱'), '髒亂', '词组优先：脏乱→髒亂');
eq(j2f('肮脏'), '骯髒', '词组优先：肮脏→骯髒');
eq(j2f('干燥'), '乾燥', '词组优先：干燥→乾燥');

// 地区三档（计划验收样例）
eq(j2f('这款软件的信息', 'generic'), '這款軟件的信息', '通用档');
eq(j2f('这款软件的信息', 'tw'), '這款軟體的資訊', '台湾档');
eq(j2f('这款软件的信息', 'hk'), '這款軟件的信息', '香港档');
eq(j2f('数据与网络', 'tw'), '資料與網路', '台湾档：数据→資料 网络→網路');
eq(j2f('数据与网络', 'hk'), '數據與網絡', '香港档：数据→數據 网络→網絡');

// 反向（繁→简）：先到先得，不被后项覆盖
eq(f2j('發展'), '发展', 'f2j：發展→发展');
eq(f2j('幹部'), '干部', 'f2j：幹部→干部');
eq(f2j('乾淨'), '干净', 'f2j：乾淨→干净');
eq(f2j('軟體的資訊', 'tw'), '软件的信息', 'f2j 台湾档词组反向');
eq(f2j('处理'), '处理', 'f2j 无映射字符原样');

// 单字基础映射抽查
eq(j2f('国图书'), '國圖書', '单字映射');
eq(j2f(''), '', '空串');
eq(j2f('Hello 世界 123'), 'Hello 世界 123', '非中文原样保留');

// 词组最长匹配（不应把长词拆成字）
eq(j2f('计算机网络'), '計算機網絡', '最长匹配：计算机 命中后网络走字级');
eq(j2f('计算机网络', 'tw'), '電腦網路', '最长匹配 tw：计算机→電腦 网络→網路');

console.log(`\ntest-jian-fan: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);
