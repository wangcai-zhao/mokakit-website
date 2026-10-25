import { defineTool } from '../types';

export default defineTool({
  id: 'base64',
  name: 'Base64 编解码',
  tagline: '文本与 Base64 互转',
  description:
    '免费在线 Base64 编解码工具，支持中文与 emoji 的 UTF-8 正确处理（不是 Latin1），可将文本/文件编码为 Base64 或将 Base64 还原为原文，支持 URL-safe 模式与字符/字节/膨胀率统计，常用于接口传输（JWT/DataURL）、图片内联（CSS/HTML）、数据伪装与签名调试。',
  keywords: ['Base64编码', 'Base64解码', '在线base64', 'base64转文本', 'utf8 base64'],
  category: 'dev',
  tags: ['Base64', '编码', '解码', '开发'],
  icon: 'file-code',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-08-04',
  updatedAt: '2026-10-24',
  priority: 6,
  seoTitle: 'Base64编解码 - 在线Base64转文本 支持URLSafe与文件编码',
  related: ['url-encoder', 'jwt-decoder', 'hash-calculator', 'base32-encoder'],
  faq: [
    {
      q: '为什么直接用 btoa 处理中文会报错？',
      a: 'btoa 只能处理 Latin1（单字节）字符，中文是双字节 UTF-8，直接传入会抛 DOMException。正确做法是用 TextEncoder 把字符串转成 UTF-8 字节，再做 Base64。本工具已内置该处理，中文和 emoji 都能正常编解码。',
    },
    {
      q: 'Base64 是加密吗？',
      a: '不是。Base64 只是一种编码方式，没有任何密钥，任何人都能瞬间解码还原。它用于在不支持二进制的场景里「搬运」数据，不能用来保护信息。',
    },
    {
      q: 'URL-safe 模式是什么？',
      a: '标准 Base64 用 + 和 / 两个字符，它们在 URL 和文件名里有特殊含义。URL-safe 模式把 + 换成 -、/ 换成 _，还可去掉结尾的 = 补位，JWT 就用这种变体。本工具编码时可开启，解码时自动识别，无需手动切换。',
    },
    {
      q: '文件转 Base64 有大小限制吗？',
      a: '没有硬性限制，但全部计算在你的浏览器本地完成，超过 2MB 的文件会给出性能提示；体积很大的文件建议用命令行工具处理，避免页面卡顿。',
    },
  ],
  subpages: () => [
    {
      slug: 'chinese-base64-table',
      title: '中文 Base64 编码对照表',
      seoTitle: '中文Base64编码对照表 - 常用汉字Base64转换查询',
      description:
        '常用汉字 Base64 编码对照表：收录 100+ 高频汉字及其 UTF-8 字节、Base64 编码结果，构建时静态生成，爬虫可抓取，适合接口调试与编码学习时快速查阅。',
      data: { b64Kind: 'chinese' },
      faq: [
        {
          q: '为什么一个汉字 Base64 后是 4 个字符？',
          a: '常用汉字在 UTF-8 下占 3 字节，Base64 每 3 字节编成 4 个字符，所以一个汉字恰好对应 4 个 Base64 字符，长度可预期。',
        },
        {
          q: '生僻字也一样吗？',
          a: '不一定。生僻字可能占 4 字节 UTF-8，编码后是 8 个字符（含 = 补位）；本表只收录常用汉字。',
        },
      ],
    },
    {
      slug: 'ascii-base64-table',
      title: 'ASCII Base64 编码对照表',
      seoTitle: 'ASCII字符Base64编码对照表 - 可打印字符转换查询',
      description:
        'ASCII 可打印字符（33-126）Base64 编码对照表：每个字符的十六进制、UTF-8 字节与 Base64 编码一一对应，构建时静态生成，适合编码学习与接口调试。',
      data: { b64Kind: 'ascii' },
      faq: [
        {
          q: 'ASCII 字符编码后长度固定吗？',
          a: '不固定。1-2 个字符编成 4 个 Base64 字符（带 1-2 个 = 补位），3 个字符刚好 4 个，以此类推每 3 字节一组。',
        },
      ],
    },
    {
      slug: 'emoji-base64-table',
      title: 'Emoji Base64 编码对照表',
      seoTitle: 'Emoji Base64编码对照表 - 常用表情符号Base64转换',
      description:
        '常用 emoji Base64 编码对照表：收录 32 个高频表情的 UTF-8 字节数与 Base64 编码，覆盖 4 字节字符边界，适合含表情的接口数据传输调试。',
      data: { b64Kind: 'emoji' },
      faq: [
        {
          q: 'emoji 编码后为什么特别长？',
          a: 'emoji 在 UTF-8 下通常占 4 字节，Base64 编码后约 8 个字符（含补位）；带 ZWJ 组合或肤色修饰的 emoji 更长。',
        },
      ],
    },
    {
      slug: 'url-safe-base64',
      title: 'URL-safe Base64 专题',
      seoTitle: 'URL-safe Base64 - JWT 用的 Base64URL 编解码说明',
      description:
        'URL-safe Base64（Base64URL）专题：为什么 JWT 要用 - _ 替代 + /、padding 如何处理、与标准 Base64 的对照示例，附在线转换工具入口。',
      data: { b64Kind: 'urlsafe' },
      faq: [
        {
          q: 'JWT 的三段分别是什么？',
          a: 'JWT 由 header.payload.signature 三段 Base64URL 串用点号连接：前两段是 JSON 的 Base64URL 编码（可解码查看），第三段是签名，防篡改。',
        },
        {
          q: 'URL-safe 串能直接当标准 Base64 解吗？',
          a: '可以，本工具解码时自动识别：遇到 - _ 会还原成 + /，缺 padding 自动补全，所以 JWT 串直接粘贴即可解码。',
        },
      ],
    },
    {
      slug: 'image-to-base64',
      title: '图片转 Base64 专题',
      seoTitle: '图片转Base64 - dataURL格式说明与体积膨胀表',
      description:
        '图片转 Base64 专题：data:image/png;base64,... 格式说明、CSS/HTML 内联图片的用法、体积膨胀对照表（1KB 图片编码后多大），附在线文件转 Base64 工具。',
      data: { b64Kind: 'image' },
      faq: [
        {
          q: '图片转 Base64 后会变大多少？',
          a: 'Base64 编码使体积增大约 33%（每 3 字节变 4 字符），1KB 图片编码后约 1.4KB。小图标适合内联省请求，大图建议仍用文件链接。',
        },
        {
          q: 'dataURL 可以直接放 img src 吗？',
          a: '可以。格式为 data:图片MIME;base64,Base64串，本工具上传图片后可直接复制带前缀的完整 dataURL 使用。',
        },
      ],
    },
  ],
});
