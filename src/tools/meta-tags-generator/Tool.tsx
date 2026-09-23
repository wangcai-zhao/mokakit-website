import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const TWITTER_CARDS = ['summary', 'summary_large_image', 'app', 'player'];

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

interface Check {
  name: string;
  ok: boolean;
  hint: string;
}

function buildCode(f: {
  title: string;
  desc: string;
  keywords: string;
  canonical: string;
  ogTitle: string;
  ogDesc: string;
  ogImage: string;
  twitter: string;
  pageType: string;
}): string {
  const title = f.title.trim();
  const desc = f.desc.trim();
  const keywords = f.keywords.trim();
  const canonical = f.canonical.trim();
  const ogTitle = f.ogTitle.trim() || title;
  const ogDesc = f.ogDesc.trim() || desc;
  const ogImage = f.ogImage.trim();
  const ogUrl = canonical;

  const lines: string[] = [];
  lines.push(`<title>${esc(title)}</title>`);
  if (desc) lines.push(`<meta name="description" content="${esc(desc)}" />`);
  if (keywords) lines.push(`<meta name="keywords" content="${esc(keywords)}" />`);
  if (canonical) lines.push(`<link rel="canonical" href="${esc(canonical)}" />`);
  lines.push(`<meta property="og:type" content="${f.pageType === 'article' ? 'article' : 'website'}" />`);
  if (ogTitle) lines.push(`<meta property="og:title" content="${esc(ogTitle)}" />`);
  if (ogDesc) lines.push(`<meta property="og:description" content="${esc(ogDesc)}" />`);
  if (ogImage) lines.push(`<meta property="og:image" content="${esc(ogImage)}" />`);
  if (ogUrl) lines.push(`<meta property="og:url" content="${esc(ogUrl)}" />`);
  lines.push(`<meta name="twitter:card" content="${esc(f.twitter)}" />`);
  if (ogTitle) lines.push(`<meta name="twitter:title" content="${esc(ogTitle)}" />`);
  if (ogDesc) lines.push(`<meta name="twitter:description" content="${esc(ogDesc)}" />`);
  if (ogImage) lines.push(`<meta name="twitter:image" content="${esc(ogImage)}" />`);

  const jsonLd =
    f.pageType === 'article'
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description: desc,
          keywords,
          image: ogImage,
          url: canonical,
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: title,
          description: desc,
          url: canonical,
        };
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(jsonLd)) {
    if (typeof v === 'string' && v !== '') cleaned[k] = v;
    if (typeof v !== 'string') cleaned[k] = v;
  }

  lines.push(`<script type="application/ld+json">`);
  lines.push(JSON.stringify(cleaned, null, 2));
  lines.push(`</script>`);

  return lines.join('\n');
}

export default function MetaTagsGenerator() {
  const [title, setTitle] = useState('MokaKit 摩卡工具箱 · 在线小工具集合');
  const [desc, setDesc] = useState(
    'MokaKit 摩卡工具箱提供身份证校验、银行卡校验、CIDR 计算、矩阵计算等上百个在线小工具，全部在浏览器本地完成计算，不上传数据，打开即用。',
  );
  const [keywords, setKeywords] = useState('在线工具,摩卡工具箱,MokaKit,实用工具');
  const [canonical, setCanonical] = useState('https://mokakit.com/');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDesc, setOgDesc] = useState('');
  const [ogImage, setOgImage] = useState('https://mokakit.com/og.png');
  const [twitter, setTwitter] = useState('summary_large_image');
  const [pageType, setPageType] = useState('website');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const code = useMemo(
    () =>
      buildCode({
        title,
        desc,
        keywords,
        canonical,
        ogTitle,
        ogDesc,
        ogImage,
        twitter,
        pageType,
      }),
    [title, desc, keywords, canonical, ogTitle, ogDesc, ogImage, twitter, pageType],
  );

  const checks = useMemo<Check[]>(() => {
    const t = title.trim();
    const d = desc.trim();
    const c = canonical.trim();
    const img = ogImage.trim();
    const out: Check[] = [];

    if (!t) {
      out.push({ name: '页面标题', ok: false, hint: '标题为空，搜索引擎结果里将没有可点击的主标题' });
    } else if (t.length > 60) {
      out.push({ name: '页面标题', ok: false, hint: `标题 ${t.length} 个字符，超过 60 字符会在搜索结果中被截断` });
    } else {
      out.push({ name: '页面标题', ok: true, hint: `标题 ${t.length} 个字符，长度合适` });
    }

    if (!d) {
      out.push({ name: '页面描述', ok: false, hint: '描述为空，建议补一段 80 到 160 字符的摘要' });
    } else if (d.length < 80) {
      out.push({ name: '页面描述', ok: false, hint: `描述仅 ${d.length} 个字符，偏短，建议补到 80 到 160 字符` });
    } else if (d.length > 160) {
      out.push({ name: '页面描述', ok: false, hint: `描述 ${d.length} 个字符，超过 160 字符会被截断` });
    } else {
      out.push({ name: '页面描述', ok: true, hint: `描述 ${d.length} 个字符，落在 80 到 160 的最佳区间` });
    }

    if (!c) {
      out.push({ name: 'canonical', ok: false, hint: '缺失 canonical，重复内容可能分散权重' });
    } else if (!/^https?:\/\//i.test(c)) {
      out.push({ name: 'canonical', ok: false, hint: 'canonical 应使用带 https 开头的完整绝对地址' });
    } else {
      out.push({ name: 'canonical', ok: true, hint: '已设置规范链接' });
    }

    if (!img) {
      out.push({ name: 'OG 图片', ok: false, hint: '缺失 OG 图，分享到社交平台时不会显示缩略图' });
    } else if (!/^https?:\/\//i.test(img)) {
      out.push({ name: 'OG 图片', ok: false, hint: 'OG 图应使用带 https 开头的完整绝对地址，相对路径抓取会失败' });
    } else {
      out.push({ name: 'OG 图片', ok: true, hint: '已设置分享缩略图' });
    }

    if (!keywords.trim()) {
      out.push({ name: '关键词', ok: false, hint: '未填关键词，可补充 3 到 5 个中文关键词' });
    } else {
      out.push({ name: '关键词', ok: true, hint: `已填 ${keywords.split(',').filter((x) => x.trim()).length} 个关键词` });
    }

    return out;
  }, [title, desc, canonical, ogImage, keywords]);

  const copy = async () => {
    await copyText(code);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const warnCount = checks.filter((c) => !c.ok).length;

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">页面标题 title</span>
            <input
              type="text"
              autocomplete="off"
              class="input input-bordered input-sm mt-1.5 w-full"
              placeholder="建议 60 字符以内"
              value={title}
              onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">规范链接 canonical</span>
            <input
              type="text"
              inputmode="url"
              autocomplete="off"
              spellcheck={false}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="https://example.com/page"
              value={canonical}
              onInput={(e) => setCanonical((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        <label class="mt-3 block">
          <span class="text-sm font-medium">页面描述 description</span>
          <textarea
            class="textarea textarea-bordered mt-1.5 w-full text-sm"
            rows={2}
            placeholder="建议 80 到 160 个字符"
            value={desc}
            onInput={(e) => setDesc((e.target as HTMLTextAreaElement).value)}
          />
        </label>

        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">关键词 keywords（逗号分隔）</span>
            <input
              type="text"
              autocomplete="off"
              class="input input-bordered input-sm mt-1.5 w-full"
              placeholder="工具,在线工具,实用工具"
              value={keywords}
              onInput={(e) => setKeywords((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">OG 图片 URL</span>
            <input
              type="text"
              inputmode="url"
              autocomplete="off"
              spellcheck={false}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="https://example.com/og.png"
              value={ogImage}
              onInput={(e) => setOgImage((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">OG 标题（留空则用页面标题）</span>
            <input
              type="text"
              autocomplete="off"
              class="input input-bordered input-sm mt-1.5 w-full"
              placeholder="分享时显示的标题"
              value={ogTitle}
              onInput={(e) => setOgTitle((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">OG 描述（留空则用页面描述）</span>
            <input
              type="text"
              autocomplete="off"
              class="input input-bordered input-sm mt-1.5 w-full"
              placeholder="分享时显示的摘要"
              value={ogDesc}
              onInput={(e) => setOgDesc((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">twitter card 类型</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={twitter}
              onChange={(e) => setTwitter((e.target as HTMLSelectElement).value)}
            >
              {TWITTER_CARDS.map((c) => (
                <option value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium">JSON-LD 结构化数据类型</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={pageType}
              onChange={(e) => setPageType((e.target as HTMLSelectElement).value)}
            >
              <option value="website">WebSite（站点首页）</option>
              <option value="article">Article（文章页）</option>
            </select>
          </label>
        </div>
      </div>

      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-medium">SEO 体检</span>
          {warnCount === 0 ? (
            <span class="badge badge-success">全部通过</span>
          ) : (
            <span class="badge badge-warning">{warnCount} 项待优化</span>
          )}
        </div>

        <div class="mt-3 overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>检查项</th>
                <th>状态</th>
                <th class="text-right">说明</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr>
                  <td class="font-medium">{c.name}</td>
                  <td>
                    <span class={`badge badge-sm ${c.ok ? 'badge-success' : 'badge-warning'}`}>
                      {c.ok ? '通过' : '警告'}
                    </span>
                  </td>
                  <td class="text-right">{c.hint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-medium">生成的 HTML 代码片段</span>
          <span class="badge badge-outline">{code.split('\n').length} 行</span>
          <button
            type="button"
            class={`btn btn-xs ml-auto ${copied ? 'btn-success' : 'btn-primary'}`}
            onClick={copy}
          >
            {copied ? '已复制' : '复制代码'}
          </button>
        </div>

        <textarea
          class="textarea textarea-bordered mt-3 w-full font-mono text-xs"
          rows={14}
          readonly
          value={code}
        />

        <p class="mt-2 text-xs opacity-70">
          把这段代码放进页面的 head 区域即可生效，OG 标题与描述留空时会自动回退使用页面标题与描述。
        </p>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        所有标签的 content 属性都会做 HTML 实体转义，避免引号提前闭合导致标签破损；JSON-LD 用标准 JSON
        序列化生成，不会出现语法错误。整个生成过程在浏览器本地完成，填写的内容不会上传到任何服务器。
      </p>
    </div>
  );
}
