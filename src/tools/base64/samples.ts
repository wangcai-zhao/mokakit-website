/**
 * Base64 子页对照表用的样例数据（纯展示数据，不是算法）。
 * 被 [...sub].astro 构建期 import，与 b64.ts 的纯函数层分开。
 */

/** 中文常用字（100+）：覆盖高频字与几组特色字（数字/常见姓） */
export const CHINESE_SAMPLES =
  '的一是不了人我在有他这为之大来以个中上们到说国和地也子时道出而要于就下得可你年生自会那后能对着事其里所去行过家十用发天如然作方成者多日都三小军二无同么经法当起与好看学进种将还分此心前面又定见只主没公从';

/** ASCII 可见字符 33-126 */
export const ASCII_SAMPLES = Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i));

/** 常用 emoji（含 4 字节字符，验证 UTF-8 边界） */
export const EMOJI_SAMPLES = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '🤔', '😴',
  '👍', '👎', '👏', '🙏', '💪', '✌️', '🤝', '👋',
  '❤️', '💔', '🔥', '✨', '🎉', '🎊', '💯', '⭐',
  '🌈', '☀️', '🌙', '⛄', '🐶', '🐱', '🐼', '🦄',
];

/** URL-safe 子页用的 JWT 三段示例（header.payload.signature，标准 vs URL-safe） */
export const JWT_SAMPLE = {
  header: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  payload: 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuW3suW3siIsImFkbWluIjp0cnVlfQ',
  signature: 's0m3-s1gn4tur3-w1th-url-safe-ch4rs+/x=',
};

/** 图片转 Base64 体积膨胀表示例（字节数） */
export const SIZE_SAMPLES = [1024, 10240, 51200, 102400, 1048576, 5242880];
