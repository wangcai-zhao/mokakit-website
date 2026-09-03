import { useState, useMemo } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';

// 简单中文→拼音首字母映射（仅常用字，多音字可能不准），用于「中文转拼音」选项
const PY: Record<string, string> = {
  开: 'kai', 发: 'fa', 学: 'xue', 习: 'xi', 入: 'ru', 门: 'men', 指: 'zhi', 南: 'nan', 文: 'wen', 章: 'zhang',
  工: 'gong', 具: 'ju', 箱: 'xiang', 教: 'jiao', 程: 'cheng', 序: 'xu', 设: 'she', 计: 'ji', 网: 'wang', 站: 'zhan',
  实: 'shi', 用: 'yong', 指: 'zhi', 导: 'dao', 速: 'su', 查: 'cha', 转: 'zhuan', 换: 'huan', 链: 'lian', 接: 'jie',
};

function slugify(title: string, keepCn: boolean): string {
  let s = title.trim().toLowerCase();
  if (!keepCn) {
    // 中文转拼音（逐字，缺映射则丢弃）
    s = s
      .split('')
      .map((ch) => {
        const p = PY[ch];
        return p !== undefined ? p : /[一-龥]/.test(ch) ? '' : ch;
      })
      .join('');
  }
  // 保留字母数字，其余变空格/连字符
  s = s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // 去变音符号
    .replace(/[^a-z0-9一-龥]+/g, '-') // 非保留字符变连字符
    .replace(/-+/g, '-') // 合并连字符
    .replace(/^-+|-+$/g, ''); // 去首尾
  return s;
}

export default function SlugGeneratorTool() {
  const [keepCn, setKeepCn] = useState(false);
  const [input, setInput] = useState('如何在 2026 年学会 Rust 编程');

  const output = useMemo(() => {
    const v = input.trim();
    if (v === '') return '';
    return slugify(v, keepCn);
  }, [input, keepCn]);

  return (
    <DevTool
      input={input}
      setInput={setInput}
      output={output}
      placeholder="输入文章标题、产品名，如：如何在 2026 年学会 Rust 编程"
      note="默认把中文转拼音（简单映射，多音字可能不准）；勾选「保留中文」则 slug 中含 UTF-8 中文字符。结果可直贴进 URL。"
    >
      <label class="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          class="checkbox checkbox-sm"
          checked={keepCn}
          onChange={(e) => setKeepCn((e.target as HTMLInputElement).checked)}
        />
        保留中文字符（否则转拼音）
      </label>
    </DevTool>
  );
}
