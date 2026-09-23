/**
 * 把 2026-09-18 批次的新工具接入 src/components/WidgetHost.astro。
 *
 * Astro 的 client:* 指令要求组件引用在编译期静态可解析，
 * 所以新工具必须在这里补：1 个静态 import + 1 个 isX 常量 +
 * 加进 known 表达式 + 3 行水合条件块。一次性脚本，跑完即可删除。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'src', 'components', 'WidgetHost.astro');

const TOOLS = [
  ['image-compress', 'ImageCompress', 'isImgCompress', '图片压缩'],
  ['image-resize', 'ImageResize', 'isImgResize', '图片尺寸调整'],
  ['image-convert', 'ImageConvert', 'isImgConvert', '图片格式转换'],
  ['image-base64', 'ImageBase64', 'isImgB64', '图片 Base64 转换'],
  ['image-watermark', 'ImageWatermark', 'isImgWM', '图片水印'],
  ['image-crop', 'ImageCrop', 'isImgCrop', '图片裁剪'],
  ['image-filter', 'ImageFilter', 'isImgFilter', '图片滤镜'],
  ['image-info', 'ImageInfo', 'isImgInfo', '图片信息查看'],
  ['favicon-generator', 'FaviconGenerator', 'isFavGen', 'Favicon 生成'],
  ['placeholder-image', 'PlaceholderImage', 'isPlaceholder', '占位图生成'],
  ['text-extract', 'TextExtract', 'isTxtExtract', '文本提取'],
  ['text-replace', 'TextReplace', 'isTxtReplace', '批量替换'],
  ['text-whitespace', 'TextWhitespace', 'isTxtWS', '空白清理'],
  ['text-split-join', 'TextSplitJoin', 'isTxtSplitJoin', '文本分割合并'],
  ['text-pad', 'TextPad', 'isTxtPad', '文本补齐对齐'],
  ['unicode-escape', 'UnicodeEscape', 'isUniEsc', 'Unicode 转义'],
  ['chinese-number', 'ChineseNumber', 'isCnNum', '中文数字转换'],
  ['text-similarity', 'TextSimilarity', 'isTxtSim', '文本相似度'],
  ['markdown-toc', 'MarkdownToc', 'isMdToc', 'Markdown 目录生成'],
  ['lorem-ipsum', 'LoremIpsum', 'isLorem', '占位文本生成'],
  ['json-diff', 'JsonDiff', 'isJsonDiff', 'JSON 对比'],
  ['json-to-typescript', 'JsonToTypescript', 'isJson2Ts', 'JSON 转 TypeScript'],
  ['json-flatten', 'JsonFlatten', 'isJsonFlat', 'JSON 扁平化'],
  ['curl-converter', 'CurlConverter', 'isCurlConv', 'curl 命令转换'],
  ['chmod-calculator', 'ChmodCalculator', 'isChmod', 'chmod 权限计算器'],
  ['nginx-config-gen', 'NginxConfigGen', 'isNginxGen', 'Nginx 配置生成'],
  ['dockerfile-gen', 'DockerfileGen', 'isDockerGen', 'Dockerfile 生成'],
  ['markdown-table-gen', 'MarkdownTableGen', 'isMdTable', 'Markdown 表格生成'],
  ['security-headers', 'SecurityHeaders', 'isSecHeaders', '安全响应头生成'],
  ['git-command-gen', 'GitCommandGen', 'isGitCmd', 'Git 命令生成'],
  ['doc-desensitize', 'DocDesensitize', 'isDesens', '文档脱敏'],
];

let src = readFileSync(FILE, 'utf8');

// ---- 1. 静态 import：插在 interface Props 之前（也就是 import 区块末尾）----
const imports = TOOLS.map(
  ([id, comp]) => `import ${comp} from '@/tools/${id}/Tool.tsx';`,
).join('\n');
if (!src.includes(`import ${TOOLS[0][1]} from`)) {
  src = src.replace(
    '\ninterface Props {',
    `\n// 2026-09-18 批次：图片处理 ×10 / 文本处理 ×10 / 开发辅助 ×10 / 文档脱敏 ×1\n${imports}\n\ninterface Props {`,
  );
}

// ---- 2. isX 常量：插在 const known = 之前 ----
const consts = TOOLS.map(
  ([id, , flag]) => `const ${flag} = tool.id === '${id}';`,
).join('\n');
if (!src.includes(`const ${TOOLS[0][2]} =`)) {
  src = src.replace('\nconst known =', `\n${consts}\nconst known =`);
}

// ---- 3. known 表达式：把最后的 ; 改成 || 再追加 ----
if (!src.includes(TOOLS[0][2] + ';')) {
  src = src.replace(
    'isElecCost || isFuelCost || isGoldW || isVolW;',
    `isElecCost || isFuelCost || isGoldW || isVolW ||\n  ` +
      TOOLS.map(([, , flag]) => flag).join(' || ') +
      ';',
  );
}

// ---- 4. 水合条件块：插在「未接入水合岛屿的工具」之前 ----
const blocks = TOOLS.map(([, comp, flag, label]) => {
  return (
    `<!-- ${label} -->\n` +
    `{${flag} && mode === 'load' && <${comp} client:load {...widgetProps} />}\n` +
    `{${flag} && mode === 'idle' && <${comp} client:idle {...widgetProps} />}\n` +
    `{${flag} && mode === 'visible' && <${comp} client:visible {...widgetProps} />}`
  );
}).join('\n\n');

if (!src.includes(`{${TOOLS[0][2]} && mode === 'load'`)) {
  src = src.replace(
    '<!-- 未接入水合岛屿的工具 -->',
    `<!-- 2026-09-18 批次：图片处理 / 文本处理 / 开发辅助 / 文档脱敏 -->\n${blocks}\n\n<!-- 未接入水合岛屿的工具 -->`,
  );
}

writeFileSync(FILE, src, 'utf8');
console.log(`已接入 ${TOOLS.length} 个新工具的水合岛屿`);
