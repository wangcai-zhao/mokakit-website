/**
 * case-converter 纯函数回归（src/tools/case-converter/case.ts）
 * 跑法：node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs scripts/test-case.mjs
 */
import { splitWords, convertLine, convertLines, MODES } from '../src/tools/case-converter/case.ts';

let pass = 0;
let fail = 0;
function eq(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    pass++;
  } else {
    fail++;
    console.error(`✗ ${label}\n  期望: ${e}\n  实际: ${a}`);
  }
}

const mode = (id) => MODES.find((m) => m.id === id);

// 切词边界
eq(splitWords('myAPIKey2'), ['my', 'API', 'Key2'], '连续大写按词边界切开');
eq(splitWords('XMLHttpRequest'), ['XML', 'Http', 'Request'], 'XMLHttpRequest 三词');
eq(splitWords('USER_ID'), ['USER', 'ID'], '分隔符+全大写');
eq(splitWords('some.snake'), ['some', 'snake'], '点号分隔');
eq(splitWords('user2Name'), ['user2', 'Name'], '默认不切数字');
eq(splitWords('user2Name', true), ['user', '2', 'Name'], 'separateNumbers 开启切数字');
eq(splitWords('  Hello   World  '), ['Hello', 'World'], '多余空白');
eq(splitWords(''), [], '空串');

// 计划验收样例
eq(convertLine('myAPIKey2', mode('constant')), 'MY_API_KEY2', 'myAPIKey2 → CONSTANT_CASE');
eq(convertLine('hello WORLD foo', mode('sentence')), 'Hello world foo', 'Sentence case');
eq(convertLine('user_name', mode('camel')), 'userName', 'snake → camel');
eq(convertLine('USER_ID', mode('camel')), 'userId', 'USER_ID → camel（ID 作为整体）');
eq(convertLine('userName', mode('snake')), 'user_name', 'camel → snake');
eq(convertLine('some-value', mode('pascal')), 'SomeValue', 'kebab → pascal');
eq(convertLine('Hello World', mode('kebab')), 'hello-world', '空格 → kebab');
eq(convertLine('MAX_SIZE', mode('lower')), 'max size', 'CONSTANT → 小写词组');

// 多行批量（每行独立，行数守恒）
eq(
  convertLines('myUserName\nHello World\nuser-name\nUSER_ID\nsome.snake', mode('camel')),
  ['myUserName', 'helloWorld', 'userName', 'userId', 'someSnake'],
  '5 行混合风格批量转 camel',
);
eq(convertLines('a\n\nb', mode('upper')), ['A', '', 'B'], '空行保留占位');

// 模式清单完整（9 种）
eq(MODES.length, 9, '共 9 种模式');
eq(MODES.map((m) => m.id), ['camel', 'pascal', 'snake', 'kebab', 'constant', 'sentence', 'upper', 'lower', 'title'], '模式 id 顺序');

console.log(`\ntest-case: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);
