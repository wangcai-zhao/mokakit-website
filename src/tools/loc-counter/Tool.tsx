import { useState, useMemo } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';

function countLoc(text: string) {
  const lines = text.split(/\r?\n/);
  let total = lines.length;
  let blank = 0;
  let comment = 0;
  let block = false;
  for (const raw of lines) {
    const l = raw.trim();
    if (l === '') {
      blank++;
      continue;
    }
    if (block) {
      comment++;
      if (l.includes('*/')) block = false;
      continue;
    }
    if (l.startsWith('//') || l.startsWith('#') || l.startsWith(';') || l.startsWith('*') || l.startsWith('<!--')) {
      comment++;
      if (l.startsWith('<!--') && !l.includes('-->')) block = true;
      continue;
    }
    if (l.startsWith('/*')) {
      comment++;
      if (!l.includes('*/')) block = true;
      continue;
    }
    if (l.startsWith('"""') || l.startsWith("'''")) {
      comment++;
      continue;
    }
  }
  const code = total - blank - comment;
  return { total, blank, comment, code };
}

export default function LocCounterTool() {
  const [input, setInput] = useState(
    '// 统计代码行数\nfunction add(a, b) {\n  return a + b; // 返回和\n}\n\n/* 多行注释 */\nconst x = 1;',
  );

  const result = useMemo(() => {
    if (input.trim() === '') return '';
    const s = countLoc(input);
    return [
      `总行数：       ${s.total}`,
      `代码行：       ${s.code}`,
      `注释行：       ${s.comment}`,
      `空行：         ${s.blank}`,
      `注释占比：     ${s.total > 0 ? ((s.comment / s.total) * 100).toFixed(1) : '0'}%`,
    ].join('\n');
  }, [input]);

  return (
    <DevTool
      input={input}
      setInput={setInput}
      output={result}
      placeholder="粘贴源代码…"
      note="按行统计：空行、注释行（// # ; /* */ <!-- --> 及文档字符串）、代码行。本地统计，不上传。"
    />
  );
}
