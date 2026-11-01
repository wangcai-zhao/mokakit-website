/**
 * gs1.ts 纯函数回归：GTIN 校验位 / 发码机构 / 日期解析。
 *
 * 测试向量来源：
 *  - marius103/gtin-checksum（MIT）README 公开向量：
 *    computeCheckDigit('400638133393')=1；
 *    isValidGtin('4006381333931')=true、('036000291452')=true、
 *    ('73513537')=true、('00012345678905')=true、('4006381333932')=false
 *    （后三例为完整码，其数据位→校验位由本脚本反推验证）
 *  - QRSalt/gs1-digital-link（MIT）README：gtinCheckDigit('0950600013435')=2
 *  - 今日计划验收样例：0690123456789 → 校验位 2
 *
 * 跑法：node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs scripts/test-gs1.mjs
 */
import {
  gtinCheckDigit,
  gtinCheck,
  isValidGtin,
  appendCheckDigit,
  validateGtinField,
  validateDateField,
  gs1PrefixRegion,
  gtinStructure,
  expandYear,
  parseGs1Date,
  AI_DEFS,
  GS1_AI,
  DATE_AIS,
} from '../src/lib/gs1.ts';

let pass = 0;
let fail = 0;
function ok(cond, label, extra = '') {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error(`✗ ${label}${extra ? '\n  ' + extra : ''}`);
  }
}
function eq(actual, expected, label) {
  ok(actual === expected, label, `期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
}

// ① computeCheckDigit：官方 / 计划向量
eq(gtinCheckDigit('400638133393'), 1, "computeCheckDigit('400638133393')=1（gtin-checksum README）");
eq(gtinCheckDigit('7351353'), 7, "computeCheckDigit('7351353')=7（README isValidGtin('73513537')=true 反推）");
eq(gtinCheckDigit('03600029145'), 2, "computeCheckDigit('03600029145')=2（README isValidGtin('036000291452')=true 反推）");
eq(gtinCheckDigit('0001234567890'), 5, "computeCheckDigit('0001234567890')=5（README isValidGtin('00012345678905')=true 反推）");
eq(gtinCheckDigit('0950600013435'), 2, "computeCheckDigit('0950600013435')=2（gs1-digital-link README）");
eq(gtinCheckDigit('0690123456789'), 2, "computeCheckDigit('0690123456789')=2（今日计划验收样例）");

// ② isValidGtin：完整码
eq(isValidGtin('4006381333931'), true, "isValidGtin('4006381333931')");
eq(isValidGtin('036000291452'), true, "isValidGtin('036000291452')");
eq(isValidGtin('73513537'), true, "isValidGtin('73513537')");
eq(isValidGtin('00012345678905'), true, "isValidGtin('00012345678905')");
eq(isValidGtin('06901234567892'), true, "isValidGtin('06901234567892')");
eq(isValidGtin('4006381333932'), false, "isValidGtin('4006381333932')=false（README 反例）");
eq(isValidGtin('06901234567893'), false, "isValidGtin('06901234567893')=false（末位改 3）");
eq(isValidGtin('not-a-number'), false, "isValidGtin 非数字不抛错返回 false");
eq(isValidGtin('12345'), false, "isValidGtin 长度非法返回 false");
eq(isValidGtin(''), false, 'isValidGtin 空串返回 false');

// ③ appendCheckDigit
eq(appendCheckDigit('400638133393'), '4006381333931', "appendCheckDigit('400638133393')='4006381333931'");
eq(appendCheckDigit('0690123456789'), '06901234567892', "appendCheckDigit('0690123456789')='06901234567892'（计划验收）");
eq(appendCheckDigit('abc'), null, 'appendCheckDigit 非法输入返回 null');

// ④ gtinCheck：指出应为哪位（QRSalt 提示设计）
{
  const c = gtinCheck('06901234567893');
  eq(c.ok, false, 'gtinCheck 末位错误 → ok=false');
  eq(c.expected, '2', 'gtinCheck 末位错误 → expected=2（指出应为哪位）');
eq(gtinCheck('06901234567892').ok, true, 'gtinCheck 正确末位 → ok=true');
eq(gtinCheck('0690123456789').expected, '7', 'gtinCheck 对 13 位完整码正常校验（期望末位 7）');
eq(gtinCheck('0690123').expected, '', 'gtinCheck 7 位（非完整码长度）→ expected 空');
eq(gtinCheck('0690123456789a').expected, '', 'gtinCheck 含非数字 → expected 空');
eq(gtinCheck('06901234567890').expected, '2', 'gtinCheck 对 14 位完整码正常校验（期望末位 2）');
}

// ⑤ validateGtinField（udi-generator 输入框）
{
  const v13 = validateGtinField('0690123456789');
  eq(v13.level, 'warn', '13 位 → warn（可补位）');
  ok(v13.msg.includes('2'), '13 位提示含校验位 2', v13.msg);
  const v14ok = validateGtinField('06901234567892');
  eq(v14ok.level, 'ok', '14 位校验通过 → ok');
  ok(v14ok.msg.includes('中国大陆'), 'ok 提示含发码机构', v14ok.msg);
  const v14bad = validateGtinField('06901234567893');
  eq(v14bad.level, 'error', '14 位校验失败 → error');
  eq(v14bad.msg, '校验位不合法，应为 2', '14 位校验失败提示应为 2');
  eq(validateGtinField('ABC').level, 'error', '非数字 → error');
  eq(validateGtinField('0690123').level, 'error', '7 位 → error（长度不对）');
  eq(validateGtinField('').level, 'error', '空 → error');
}

// ⑥ validateDateField
eq(validateDateField('260401').ok, true, 'YYMMDD 260401 合法');
eq(validateDateField('20261301').ok, false, '20261301 非法（月 13）');
eq(validateDateField('260132').ok, false, '260132 非法（日 32）');
eq(validateDateField('26040').ok, false, '5 位非法');
eq(validateDateField('abcd01').ok, false, '非数字非法');

// ⑦ 发码机构前缀
eq(gs1PrefixRegion('06901234567892'), '中国大陆', '690 → 中国大陆');
eq(gs1PrefixRegion('0690123456789'), '美国', '13 位 EAN-13 前缀 069 → 美国（仅 GTIN-14 跳过包装指示位）');
eq(gs1PrefixRegion('4891234567890'), '中国香港', '489 → 中国香港');
eq(gs1PrefixRegion('4711234567890'), '中国台湾', '471 → 中国台湾');
eq(gs1PrefixRegion('9581234567890'), '中国澳门', '958 → 中国澳门');
eq(gs1PrefixRegion('4006381333931'), '德国', '400 → 德国');
eq(gs1PrefixRegion('012345678905'), '美国', '012 → 美国');

// ⑧ gtinStructure
{
  const s = gtinStructure('06901234567892');
  ok(s !== null, 'gtinStructure 合法码返回对象');
  eq(s?.prefix, '690', 'prefix=690');
  eq(s?.region, '中国大陆', 'region=中国大陆');
  eq(s?.checkOk, true, 'checkOk=true');
  eq(gtinStructure('06901234567893')?.checkOk, false, '错码 checkOk=false');
  eq(gtinStructure('abc'), null, '非数字返回 null');
}

// ⑨ 日期世纪规则（固定阈值：00-49→20xx，50-99→19xx）
eq(expandYear('26'), '2026', '26 → 2026');
eq(expandYear('49'), '2049', '49 → 2049');
eq(expandYear('50'), '1950', '50 → 1950');
eq(expandYear('99'), '1999', '99 → 1999');
eq(parseGs1Date('260401'), '2026-04-01', '260401 → 2026-04-01');
eq(parseGs1Date('301231'), '2030-12-31', '301231 → 2030-12-31（计划勘误样例：固定阈值下为 2030）');
eq(parseGs1Date('500101'), '1950-01-01', '500101 → 1950-01-01');
eq(parseGs1Date('991231'), '1999-12-31', '991231 → 1999-12-31');
eq(parseGs1Date('260132'), null, '260132 日非法 → null');
eq(parseGs1Date('261301'), null, '261301 月非法 → null');
eq(parseGs1Date('26041'), null, '5 位 → null');

// ⑩ 字典完整性
ok(AI_DEFS.length >= 30, `AI_DEFS ≥30 条（实际 ${AI_DEFS.length}）`);
ok(Object.keys(GS1_AI).length === AI_DEFS.length, 'GS1_AI 与 AI_DEFS 同步');
eq(GS1_AI['01'], '全球贸易项目代码（GTIN，即设备标识 DI）', 'AI 01 含义（官方口径）');
eq(GS1_AI['22'], '消费者产品变体（CPV）', 'AI 22 = CPV（官方修正）');
eq(GS1_AI['250'], '次级序列号', 'AI 250 = 次级序列号（官方修正）');
eq(GS1_AI['7001'], '北约库存号（NSN）', 'AI 7001 = NSN（官方修正）');
eq(GS1_AI['8003'], '全球可回收资产标识（GRAI）', 'AI 8003 = GRAI（官方口径）');
eq(GS1_AI['8018'], '服务接收方关系号（GSRN - recipient）', 'AI 8018 = GSRN（官方修正）');
eq(GS1_AI['411'], '账单 / 发票方位置码（Bill to GLN）', 'AI 411 = Bill to（官方修正）');
ok(DATE_AIS.has('11') && DATE_AIS.has('17') && !DATE_AIS.has('10'), 'DATE_AIS 含 11/17 不含 10');

// ⑪ 区间族长度边界：gtinCheckDigit 对 7/11/12/13 位均可用
for (const len of [7, 11, 12, 13]) {
  const data = '9'.repeat(len);
  const cd = gtinCheckDigit(data);
  ok(cd !== null && isValidGtin(data + cd), `${len} 位数据位自洽（compute→validate 闭环）`);
}

console.log(`\ntest-gs1: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);
