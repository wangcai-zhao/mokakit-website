# MokaKit 代码审查报告 —— 组件与布局层

审查范围：`src/layouts/*`（3 个）、`src/components/*`（13 个）、`src/utils/*`（4 个）、`src/config/*`（2 个）、`src/tools/registry.ts` 与 `types.ts`、`astro.config.mjs`、`tsconfig.json`、`src/content.config.ts`。
审查方式：全量逐文件阅读 + 对 `dist/` 构建产物做实测校验（HTML/CSS/JS 反查），所有结论均已用产物验证过。
本次为**只读审查**，未修改任何源码文件。

---

## 结论摘要

共发现 **27 个问题**：**P0 3 个、P1 11 个、P2 13 个**。

- **P0 全部集中在「线上已失效但静默」的被动故障**：工具使用计数器（476 个页面）打到了不存在的 `/api/counter`，且请求/响应协议与 `deploy/counter/server.mjs` 完全不匹配；时钟页 `toolId` 是没被替换的模板占位符，恒为空串；广告位 `<ins>` 缺 `data-ad-client` / `data-ad-slot`，476 个广告位全部空跑。
- **P1 主要是 SEO / 性能 / 合规**：46 个工具引用了 `icons.ts` 里不存在的图标并静默降级；每页内联 33 KB 图标雪碧图（占典型工具页 HTML 的 42%）；229 个工具全部 `hydrate: 'load'` 导致 458 条 `idle`/`visible` 分支成死代码；4 个时钟页因 `immersive` 隐藏 Footer 而没有 ICP / 公安备案号；`noindex` 与 `robots.txt` 的 `Disallow` 冲突导致 noindex 指令可能失效。
- **P2 为冗余、死代码与细节体验**：`SearchIsland.tsx` 是无人引用的死组件、`counter.ts` 有 3 个未使用的导出、`site.ts` 硬编码「229 个」、两个布局重复了约 90 行计数脚本等。

---

## 问题清单表格

| 严重度 | 文件:行号 | 问题 | 影响 |
|---|---|---|---|
| P0 | `src/layouts/ToolLayout.astro:178`、`src/layouts/ClockImmersiveLayout.astro:202` | 计数接口硬编码为 `'/api/counter'`，而 `src/config/site.ts:81` 与 `deploy/counter/server.mjs:129` 只认 `/api/count` | 全部工具页（dist 实测 476 个）的「已被使用 N 次」永远拿不到数据，恒为隐藏态 |
| P0 | `src/layouts/ToolLayout.astro:181-190` | 请求/响应协议与服务端不匹配：GET 用 `action=get&key=`（服务端只读 `keys`/`key`），读 `d?.count`（服务端返回 `{counts:{}}`）；POST body 为 `{action:'bump',key}`（服务端要 `{keys:[],delta}`），回读 `b?.[key]` | 即使把路径改对，读数与累加仍然全错；服务端对 POST 直接返回 400 `no keys` |
| P0 | `src/layouts/ClockImmersiveLayout.astro:197` | `const toolId = /* @json {toolId} */ '';` 是从模板遗留的占位注释，Astro 不做替换；该布局也没有任何 `data-tool-id` 元素 | dist 实测 `dist/tools/digital-clock/index.html` 里 key 恒为 `use:`（空 id），4 个时钟页共用一个计数 key，统计数据被污染 |
| P0 | `src/components/AdSlot.astro:40-44` | `<ins class="adsbygoogle">` 只有 `data-ad-format` / `data-full-width-responsive`，**缺少 `data-ad-client` 与 `data-ad-slot`** | AdSense 无发布商 ID、无广告单元 ID，476 个 `tool-below` 广告位全部无法填充：线上只留 100 px 空白，收益为 0 |
| P1 | `src/components/Icon.astro:17` + `src/components/icons.ts`（ICONS 共 106 项） | 图标名不存在时静默回退 `'grid'`，不做任何告警；实测 46 个 `src/tools/*/meta.ts` 的 `icon` 不在 ICONS 中（rocket / rotate-cw / trending-up / key-round / sigma / shirt / battery-charging / tag / baby / file-cog / divide / fuel / school / lightbulb / waves / trending-down / badge-check / list-ordered / function / magnet / calendar-heart / printer / shuffle / network / factor / wallet / link-2 / gem / target / function-square / footprints / droplets / contrast / cloud-sun / file-json / memory-stick / cash / file-code-2 / trending-down 等） | 46 个工具页（约 20%）在工具卡、面包屑图标位、h1 左侧图标位显示成通用九宫格图标，且无人能发现 |
| P1 | `src/components/IconSprite.astro:10-16`、`src/layouts/BaseLayout.astro:178` | 106 个 `<symbol>` 全量内联进**每一个**页面（含沉浸式的 4 个时钟页） | 实测 `dist/tools/base64/index.html`：雪碧图 32,911 B，占整页 78,578 B 的 **41.9%**；首屏 HTML 体积与解析成本、抓取成本同步放大 |
| P1 | `src/tools/*/meta.ts`（229/229 全为 `hydrate: 'load'`）、`src/components/WidgetHost.astro:257` | 229 个工具全部 `client:load` 立即水合；`WidgetHost` 里 687 条渲染表达式中有 458 条 `idle`/`visible` 分支永远进不去 | 所有工具页首屏即拉取并执行岛屿 JS；`src/tools/types.ts:70-74` 注释宣称「idle 默认推荐、visible 用于体积大的工具」，与实际完全相反 |
| P1 | `src/layouts/ClockImmersiveLayout.astro:71` + `src/layouts/BaseLayout.astro:183` | `immersive={true}` 隐藏 Footer，而 ICP / 公安备案号只写在 Footer 里 | 实测 `dist/tools/{digital,flip,analog,world}-clock/index.html` 中「京ICP备」出现 **0 次**，4 个已上线页面无备案号展示，存在工信部合规风险 |
| P1 | `src/layouts/BaseLayout.astro:94` + `public/robots.txt`（`Disallow: /search/`、`/go/`） | `noindex` 页面同时被 `robots.txt` `Disallow`：爬虫因 Disallow 不抓取，就永远看不到 `<meta name="robots" content="noindex">` | noindex 指令可能失效，这些 URL 可能被「无内容索引」；这是 noindex 与 Disallow 的经典冲突 |
| P1 | `src/components/TipCard.astro:30` | `datetime={publishDate.toISOString().slice(0,10)}`：`toISOString()` 转 UTC，东八区 `2026-09-01 00:00` 会变成 `2026-08-31` | 机器可读日期与页面上显示的中文日期差 1 天，`<time>` 语义错误（且 `content.config.ts:10` 用 `z.coerce.date()` 解析成本地零点，必然命中） |
| P1 | `src/layouts/BaseLayout.astro:64-70` | `Organization` 节点只有 `name` / `alternateName` / `url`，**缺 `logo`** | Google 结构化数据校验对 Organization 缺 logo 会告警，影响站点知识面板与富结果 |
| P1 | `src/layouts/BaseLayout.astro:117` | `<link rel="sitemap" href="/sitemap-index.xml" />`：`sitemap` 不是 HTML 规范注册的 `rel` 值，且缺 `type` | 浏览器与主流爬虫均忽略该标签，等于死代码；`robots.txt` 里已正确声明 `Sitemap:` |
| P1 | `src/components/Header.astro:154-155` + `src/components/Header.astro:226-237` | `:global([data-theme='toolbox']) .dark-show` 只把第一段全局化，`.dark-show` 仍被加上 Header 的 scope。实测编译产物为 `[data-theme=toolbox] .dark-show[data-astro-cid-nen7h5rs]`，而 `<svg>` 由子组件 `Icon.astro` 渲染、**不带该 cid** | 规则永不匹配：太阳图标被 Tailwind 的 `hidden` 永久隐藏，月亮图标永远显示，主题切换按钮没有状态反馈 |
| P1 | `src/components/SearchIsland.tsx:41-48` | `<input type="search">` 只有 `placeholder`，无 `aria-label` / 无 `<label for>`；同时带 `autofocus` | 屏幕阅读器无法获知该输入框用途（placeholder 不构成可访问名称）；移动端进入页面即弹键盘。（注：该组件当前无人引用，见 P2-16） |
| P1 | `src/layouts/ClockImmersiveLayout.astro:76` | 舞台写死 `height:100vh` | iOS Safari / Chrome 地址栏收放时 100vh 不等于可视高度，时钟被裁切、出现双重滚动；这是沉浸式时钟页的头号移动端体验问题 |
| P2 | `src/components/ChangelogRelease.astro:166-168` | `details[open] .chev` 同样被 scope 化，实测编译为 `details[cid][open] .chev[cid]`；`.chev` 由 `Icon.astro` 渲染不带 cid | 折叠箭头展开时不旋转（与 P1-12 同源的 Astro scope 问题） |
| P2 | `src/components/SearchIsland.tsx`（整个文件）+ `src/tools/registry.ts:78` | `SearchIsland` 只出现在自身定义里，**无任何页面 import**（`/search/` 用的是自带的内联脚本）；`registry.ts:78` 注释写「客户端用 Fuse.js 消费」，但 `package.json` 里没有 fuse.js，实际是 `includes()` 子串匹配 | 死代码 + 注释与现实不符，误导后续维护者 |
| P2 | `src/utils/counter.ts:74`（`bumpCount`）、`:79`（`getCounts`）、`:84`（`getCount`） | 三个导出全站零引用（布局里是各自内联实现的同名本地函数） | 死代码；且让「内联实现 vs 模块实现」的分裂更难被发现 |
| P2 | `src/config/site.ts:35` | description 里硬编码「229 个免费工具」，与 `TOOLS.length` 两份数据 | 新增/下架工具后首页 meta description 会与事实不符（当前恰好一致，属于定时炸弹） |
| P2 | `src/layouts/ToolLayout.astro:168-256`、`src/layouts/ClockImmersiveLayout.astro:194-280` | 约 90 行计数 + 分享脚本在两个布局里逐字复制，仅在 `toolId` 获取方式上不同 | 正是这次 P0-1/P0-2 双份翻车的直接原因：改一处漏一处 |
| P2 | `src/components/SocialLinks.astro:25` | `const githubLabel = \`MokaKit 源码仓库（GitHub，在新标签页打开）\`;` 用模板字符串但无任何插值 | 风格噪音；此外 `aria-label` 与 `title` 并存（`:34-35`、`:61-62`）会导致部分读屏重复播报 |
| P2 | `src/components/Header.astro:158-166`、`:288-298` | 移动端菜单按钮缺 `aria-controls="mobile-menu"`；Esc 监听无条件 `more.open = false`（已关闭的面板也会被写）；展开后 `aria-label` 仍为「打开菜单」 | 键盘/读屏用户的状态反馈不完整 |
| P2 | `src/components/Footer.astro:13`、`:82` | 整块页脚是 `<div>`，没有 `<nav>` 语义，也没有 `aria-label` | 读屏无法把「页脚导航」作为独立地标跳转 |
| P2 | `tsconfig.json:3-4` | `include: ["**/*"]`、`exclude: ["dist"]`，未排除 `dist_bak_*`、`_astro_bak_*`、`outputs/`、`workbench/`、`public/` | `npm run check`（`astro check`）会把历史备份构建产物也纳入类型检查，耗时且产生无关报错 |
| P2 | `src/components/AdSlot.astro:36` | `aria-hidden={!show}` 在 `show === true` 时输出 `aria-hidden="false"` | 冗余属性；且广告开启后若广告未加载，该容器仍恒定占据 `min-h-[100px]`（`:25`），无广告时是纯空白 |
| P2 | `src/layouts/BaseLayout.astro:103`、`:110` + `public/og.png` | 全站 OG 图固定指向 `/og.png`，该图实测 **959 KB** | 社交/IM 抓取方每次拉一张近 1 MB 的图；OG 图建议 ≤ 300 KB（Google 上限 5 MB，但体积直接影响抓取成功率） |
| P2 | `src/components/ChangelogRelease.astro:71` | `class="mt-4 first:mt-4"`：`mt-4` 与 `first:mt-4` 值相同 | 冗余类名 |
| P2 | `src/layouts/BaseLayout.astro:139`、`:146` | 每个页面都重新 `JSON.stringify()` 同一份 `siteJsonLd` | 476+ 次重复序列化（构建期开销，量级不大但可一行消除） |

---

## 修复方案

下面每条都给出**可直接落地的改法**。所有改动都在本次审查范围内；涉及 `src/config/site.ts` 的新增字段已注明。

### P0-1｜计数器接口路径与协议全错（ToolLayout / ClockImmersiveLayout）

**根因**：两个布局没有复用 `src/utils/counter.ts`（那才是与 `deploy/counter/server.mjs` 对齐的客户端），而是各自内联实现了一套不同协议的代码。

**改法**：把 `src/layouts/ToolLayout.astro:168-256` 里计数器相关的部分（`169-225` 行）整体替换为复用模块：

```astro
  <script>
    import { bump, keys, fmtCount } from '@/utils/counter';

    const section = document.querySelector('[data-tool-id]');
    const toolId = section?.dataset.toolId;
    const useEl = document.getElementById('tool-use-count');

    if (toolId) {
      const useKey = keys.use(toolId);          // 'use:<toolId>'
      const paint = (n) => {
        if (n == null || !useEl) return;
        const span = useEl.querySelector('span');
        if (span) span.textContent = fmtCount(n);
        useEl.hidden = false;
      };

      // 读数：GET /api/count?keys=use:<id> → { counts: { 'use:<id>': n } }
      bump([useKey], 0).then((c) => paint(c?.[useKey]));

      let used = false;
      const onFirstUse = () => {
        if (used) return;
        used = true;
        bump([useKey], 1).then((c) => paint(c?.[useKey]));
        document.removeEventListener('click', onFirstUse, true);
        document.removeEventListener('input', onFirstUse, true);
        document.removeEventListener('change', onFirstUse, true);
      };
      document.addEventListener('click', onFirstUse, true);
      document.addEventListener('input', onFirstUse, true);
      document.addEventListener('change', onFirstUse, true);
    }
    /* ---- 分享按钮：保留现有 227-254 行代码不动 ---- */
  </script>
```

配套两点：

1. `src/utils/counter.ts:69-71` 的 `bump(ks, delta = 1)` 已支持 `delta`，上面用 `delta = 0` 做纯读数（服务端 `server.mjs:164` 只要求 `Number.isFinite(parsed.delta)`，0 合法）。若不想用 0，改用现成的 `getCounts([useKey])` 也行：
   ```ts
   import { bump, getCounts, keys, fmtCount } from '@/utils/counter';
   getCounts([useKey]).then((c) => paint(c?.[useKey]));
   ```
2. 删除 `src/utils/counter.ts` 里的死导出判断顾虑：`bump` / `getCounts` 都要保留使用（见 P2-17 只删 `bumpCount` / `getCount`）。

> 顺带修掉「点一下导航链接也算使用」的误计数：`onFirstUse` 挂在 `document` 捕获阶段，点页脚链接也会触发。把监听范围收敛到工具区：
> `const root = document.querySelector('[data-tool-id]'); root?.addEventListener('input', onFirstUse, true);`

### P0-2｜ClockImmersiveLayout 的 `toolId` 恒为空

**改法**：删掉 `src/layouts/ClockImmersiveLayout.astro:197` 的占位符，改成与 ToolLayout 一致的 DOM 取数。

1. 第 `76` 行舞台 div 加 `data-tool-id`（顺带把 `100vh` 一并修掉，见 P1-14）：
```astro
  <div id="ck-immersive-stage" data-tool-id={tool.id}
       style="position:relative;width:100%;height:100vh;height:100dvh;overflow:hidden;background:#0b0b16;isolation:isolate">
```
2. 第 `197` 行改为：
```js
      const section = document.querySelector('[data-tool-id]');
      const toolId = section?.dataset.toolId;
      if (!toolId) return; // 不是工具页，静默退出
```
3. 第 `199-249` 行的计数器实现，同样替换为 P0-1 里那段复用 `counter.ts` 的代码。

### P0-3｜广告位缺 `data-ad-client` / `data-ad-slot`

**改法**：先把广告单元 ID 变成配置，再让组件读配置；没有配置到 ID 的槽位就不渲染 `<ins>`（避免 `adsbygoogle.push()` 报错）。

1. `src/config/site.ts` 的 `ads` 增加 `slots` 映射（`68-73` 行区域）：
```ts
  ads: {
    enabled: true,
    adsenseClient: 'ca-pub-0218164655974877',
    /** AdSense 广告单元 ID（后台「广告单元」里的 data-ad-slot 值），按位名登记 */
    slots: {
      'home-mid': '',        // 填入首页中部广告单元 ID
      'tool-below': '',      // 填入工具页下方广告单元 ID
    } as Record<string, string>,
  },
```
2. `src/components/AdSlot.astro` 第 `2` 行与 `30`、`40-45` 行改为：
```astro
import { SITE } from '@/config/site';
...
const show = SITE.ads.enabled && SITE.ads.adsenseClient;
const adSlotId = SITE.ads.slots[slot] ?? '';
// 有 client 但没登记广告单元 ID 时，宁可不渲染，也不要推一个不合规的 ins
const renderIns = Boolean(show && adSlotId);
```
```astro
  {
    renderIns ? (
      <ins
        class="adsbygoogle block w-full"
        style="display:block"
        data-ad-client={SITE.ads.adsenseClient}
        data-ad-slot={adSlotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    ) : null
  }
  {
    renderIns && (
      <script is:inline>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    )
  }
```
> 注意：`data-ad-slot` 必须是 AdSense 后台生成的**数字广告单元 ID**，不是 `tool-below` 这种业务名；后者只用于本站 `data-ad-slot` 属性做埋点区分（现名 `data-ad-slot` 与 AdSense 保留属性撞名，建议把外层 div 的自定义属性改名为 `data-ad-position`，避免混淆）。

### P1-4｜46 个工具图标静默降级

**改法（两条都要做）**：

1. 补齐 `src/components/icons.ts` 的 `ICONS`（当前 106 项，缺 38 项）。按下列名字补 Lucide path（ISC 协议，可直接从 lucide.dev 取 `<path>` 串，保持现有「字符串片段」格式）：
   `rocket`、`rotate-cw`、`trending-up`、`trending-down`、`key-round`、`sigma`、`shirt`、`battery-charging`、`tag`、`baby`、`file-cog`、`file-code-2`、`file-json`、`divide`、`fuel`、`school`、`lightbulb`、`waves`、`badge-check`、`list-ordered`、`function`、`function-square`、`magnet`、`calendar-heart`、`printer`、`shuffle`、`network`、`factor`、`wallet`、`link-2`、`gem`、`target`、`footprints`、`droplets`、`contrast`、`cloud-sun`、`memory-stick`、`cash`、`mail`（`src/pages/developers/index.astro` 用到）。
2. 让静默失败变成可见失败。`src/components/Icon.astro:17` 改为：
```ts
const safeName = name in ICONS ? name : 'grid';
if (safeName !== name && import.meta.env.DEV) {
  console.warn(`[Icon] icons.ts 中未定义图标「${name}」，已回退为 grid`);
}
```
并在 `scripts/` 下加一个可挂进 CI 的校验（比 dev 告警更可靠，能在构建前拦住）：
```js
// scripts/check-icons.mjs —— 输出到非零退出码即中断构建
import { readFileSync, readdirSync, existsSync } from 'node:fs';
const src = readFileSync('src/components/icons.ts', 'utf8');
const body = src.split('export const ICONS')[1];
const keys = new Set([...body.matchAll(/^\s*('([^']+)'|"([^"]+)"|([A-Za-z0-9_-]+))\s*:\s*['"]/gm)]
  .map((m) => m[2] ?? m[3] ?? m[4]));
const bad = [];
for (const id of readdirSync('src/tools')) {
  const f = `src/tools/${id}/meta.ts`;
  if (!existsSync(f)) continue;
  for (const m of readFileSync(f, 'utf8').matchAll(/\bicon:\s*['"]([^'"]+)['"]/g)) {
    if (!keys.has(m[1])) bad.push(`${id} → ${m[1]}`);
  }
}
if (bad.length) { console.error('未知图标：\n' + bad.join('\n')); process.exit(1); }
```

### P1-5｜每页内联 33 KB 图标雪碧图

**改法**：把雪碧图变成独立可缓存文件，页面里只留 `<use href>` 引用。

1. 新增 `scripts/gen-icons-svg.mjs`（在 `astro build` 前执行，或 `prebuild` 钩子）：
```js
import { writeFileSync } from 'node:fs';
import { ICONS } from '../src/components/icons.ts';   // 用现有的 ts-resolve.mjs 加载器
const symbols = Object.entries(ICONS)
  .map(([n, d]) => `<symbol id="icon-${n}" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</g></symbol>`)
  .join('');
writeFileSync('public/icons.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${symbols}</svg>`);
```
2. `src/components/Icon.astro:36` 改为外链引用：
```astro
  <use href={`/icons.svg#icon-${safeName}`} />
```
3. 删除 `src/layouts/BaseLayout.astro:5`（`import IconSprite ...`）与 `:178`（`<IconSprite />`），并删除 `src/components/IconSprite.astro`。

> 收益：典型工具页 HTML 从 78.6 KB 降到约 45.7 KB（−42%），且 `icons.svg` 被浏览器跨页缓存一次。
> 兼容性兜底：若必须支持 IE/极老 WebView（不支持跨文档 `<use>`），退而求其次的方案是保留内联，但只注入该页实际用到的图标——需要 `Icon.astro` 把用到的名字写进模块级 `Set`，由 `BaseLayout` 在 `</body>` 前按 Set 生成 `<symbol>`（Astro 单页渲染顺序下可行）。

### P1-6｜229 个工具全部 `client:load`

**改法**：

1. `src/tools/types.ts:70-74` 的注释是正确意图，按它执行：只保留**首屏必须立刻可交互**的工具用 `load`（如 `password-generator`、`digital-clock`、`flip-clock`、`analog-clock`、`world-clock`、`countdown-timer`、`today-info`），其余批量改 `idle`；图片处理 / 大依赖（`image-compress`、`image-convert`、`image-watermark`、`ode-solver`、`qrcode-generator`、`markdown-preview`、`json-diff`、`rsa-keygen`）改 `visible`。
   批量替换命令（改完再手工挑出保留 load 的那几个）：
   ```bash
   # Git Bash
   grep -rl "hydrate: 'load'" src/tools/*/meta.ts | xargs sed -i "s/hydrate: 'load'/hydrate: 'idle'/"
   ```
2. `src/components/WidgetHost.astro:257` 的兜底值从 `'load'` 改成与注释一致的 `'idle'`：
   ```ts
   const mode = tool.hydrate ?? 'idle';
   ```
3. 长期方案：`WidgetHost.astro` 的 229×3 = 687 条布尔分支改成一张静态映射表，消除「新增工具必须手改这个文件」的隐患：
   ```astro
   const REGISTRY = { 'password-generator': PasswordGenerator, 'unit-convert': UnitConvert, ... } as const;
   const Cmp = REGISTRY[tool.id];
   ```
   再配合 `client:only="preact"` + 统一 `client:idle`（Astro 的 `client:*` 仍必须是字面量，可保留三组 `load/idle/visible` 的 `<Cmp client:... />` 分发，只需 3 处而非 687 处）。

### P1-7｜时钟页没有备案号

**改法**：`immersive` 隐藏 Footer 时，把合规信息以精简条形式补回来。`src/layouts/ClockImmersiveLayout.astro:189-191` 之后（`#ck-seo` 容器闭合前）追加：

```astro
    <div class="mt-6 pt-4 border-t border-base-300 text-center text-xs opacity-70 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
      {SITE.icp && (
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="nofollow noopener">{SITE.icp}</a>
      )}
      {SITE.police && (
        <a href={`https://beian.mps.gov.cn/#/query/webSearch?code=${SITE.police.replace(/\D/g, '')}`}
           target="_blank" rel="noreferrer noopener">{SITE.police}</a>
      )}
      <a href="/privacy/">隐私政策</a>
      <a href="/tools/">全部工具</a>
    </div>
```
（文件顶部已 `import { SITE }`，无需新增 import。）

### P1-8｜`noindex` 与 `robots.txt` Disallow 冲突

**改法**（二选一，推荐第 1 种，纯前端可完成）：

1. 从 `robots.txt` 里**删掉**需要靠 `noindex` 生效的路径，让爬虫能抓到页面并读到 `<meta robots>`。即 `src/pages/robots.txt.ts`（输出到 `public/robots.txt`）里去掉 `Disallow: /go/`（`/go/` 已在 BaseLayout 走 `noindex`）。`/search/`、`/api/`、`/mcp/`、`/workbench.html` 的 `Disallow` 保留——它们本来就不该被抓。
2. 若必须保留 `Disallow`（例如想省抓取配额），则改用响应头：Nginx 对 `/go/` 加
   ```nginx
   location /go/ { add_header X-Robots-Tag "noindex, nofollow" always; ... }
   ```
   响应头不受 Disallow 影响，爬虫在抓取被拒前就能读到。

同时建议 `BaseLayout.astro:94` 的 noindex 文案补 `nofollow`，避免无意义外链权重传递：
```astro
{noindex && <meta name="robots" content="noindex, nofollow" />}
```

### P1-9｜`<time datetime>` 时区偏移一天

**改法**：`src/components/TipCard.astro:16-20` 区域改为按本地时间拼 `YYYY-MM-DD`：

```ts
const pad = (n: number) => String(n).padStart(2, '0');
const dateStr = publishDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
const dateAttr = `${publishDate.getFullYear()}-${pad(publishDate.getMonth() + 1)}-${pad(publishDate.getDate())}`;
```
并把 `:30` 行改为：
```astro
      <time datetime={dateAttr}>{dateStr}</time>
```

### P1-10｜`Organization` 缺 `logo`

**改法**：`src/layouts/BaseLayout.astro:64-70` 改为：

```ts
    {
      '@type': 'Organization',
      '@id': absUrl('/#organization'),
      name: SITE.nameCn,
      alternateName: SITE.name,
      url: absUrl('/'),
      logo: {
        '@type': 'ImageObject',
        url: absUrl('/og.png'),
        width: 1200,
        height: 630,
      },
      sameAs: [SOCIAL.github],
    },
```
并在文件顶部 `import { SITE, absUrl }` 处补 `SOCIAL`：`import { SITE, SOCIAL, absUrl } from '@/config/site';`

### P1-11｜`rel="sitemap"` 非标准

**改法**：`src/layouts/BaseLayout.astro:116-117` 删掉这一行 `<link rel="sitemap" ...>`。`robots.txt` 末行的 `Sitemap: https://www.mokakit.com/sitemap-index.xml` 已经是唯一权威声明；若要保留，必须写成规范形式：
```astro
<link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap-index.xml" />
```

### P1-12｜主题图标 CSS 作用域失效

**根因**：`:global(X) Y` 只把 `X` 全局化，`Y` 仍会被加上 Header 的 `data-astro-cid`。子组件的 DOM 不带父组件 cid，所以永远匹配不上。

**改法**：把 `src/components/Header.astro:224-260` 的 `<style>` 拆成两块，图标显隐规则用 `is:global`，其余保持 scoped：

```astro
<style is:global>
  /* 图标由子组件 Icon.astro 渲染，不带本组件 scope，必须整块全局 */
  [data-theme='toolbox'] .dark-show { display: none; }
  [data-theme='toolbox'] .dark-hide { display: block !important; }
  [data-theme='toolboxdark'] .dark-show { display: block; }
  [data-theme='toolboxdark'] .dark-hide { display: none !important; }
</style>

<style>
  .nav-scroll { overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -ms-overflow-style: none; }
  .nav-scroll::-webkit-scrollbar { display: none; }
  #more-menu > summary { list-style: none; }
  #more-menu > summary::-webkit-details-marker { display: none; }
</style>
```
同时 `src/components/Header.astro:154` 的 `class="hidden dark-hide"` 里 `hidden` 与 `dark-hide` 语义打架，建议改为 `class="dark-hide"`（由 CSS 全权控制显隐），避免 SSR 首帧永远隐藏太阳图标。

### P1-13｜搜索输入框无可访问名称

**改法**：`src/components/SearchIsland.tsx:41-48` 增加标签并去掉移动端 `autofocus`：

```tsx
        <label for="search-q" class="sr-only">搜索工具</label>
        <input
          id="search-q"
          type="search"
          value={q}
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
          placeholder="搜索工具，如：密码、换算、JSON…"
          aria-label="搜索工具"
          class="input input-bordered w-full pl-10 bg-base-100"
        />
```
（若该组件继续不用，见 P2-16 直接删除；若启用，`autofocus` 建议改为仅桌面端：删除 `autofocus` 属性即可。）

### P1-14｜沉浸式舞台写死 `100vh`

**改法**：`src/layouts/ClockImmersiveLayout.astro:76` 加 `dvh` 兜底（前一个值是老浏览器 fallback，后者覆盖现代浏览器）：

```html
style="position:relative;width:100%;height:100vh;height:100dvh;overflow:hidden;background:#0b0b16;isolation:isolate"
```
另外把向下滚动提示（`:79-86`）的定位从 `bottom:1.1rem` 改为 `bottom:calc(1.1rem + env(safe-area-inset-bottom))`，避免 iPhone 底部小黑条遮挡。

### P2-15｜`ChangelogRelease` 箭头不旋转

**改法**：`src/components/ChangelogRelease.astro:165-169` 改成对子组件的 class 用 `:global()`：

```astro
<style>
  details[open] :global(.chev) {
    transform: rotate(90deg);
  }
</style>
```

### P2-16｜`SearchIsland` 死组件 + 注释与实现不符

**改法**（两条）：
1. 删除 `src/components/SearchIsland.tsx`——`/search/` 已有 `src/pages/search/index.astro` 的自研实现，两套实现并存只会再次漂移。若确实想启用 Preact 版本，就在 `src/pages/search/index.astro` 里替换，并把 `:54` 的 `JSON.stringify(index)` 内联索引去掉（索引会随页面重复下发）。
2. `src/tools/registry.ts:78` 的注释改为事实：
   ```ts
   /** 站内搜索索引。构建时序列化，客户端做 includes() 子串匹配（未引入 Fuse.js，省 ~15 KB 体积） */
   ```

### P2-17｜`counter.ts` 三个未使用导出

**改法**：删除 `src/utils/counter.ts:73-87` 的 `bumpCount`、`getCounts`（若 P0-1 采用 `getCounts` 读数则保留 `getCounts`）、`getCount`。删除前确认：`src/components/Footer.astro:128` 只 import 了 `bump, keys, fmtCount`；布局里的同名函数是本地定义，不是 import。

> 提示：把「布局内联实现」全部替换为 `counter.ts` 之后，`getCounts` 会被用到，建议保留 `bump / getCounts / keys / fmtCount`，只删 `bumpCount` 与 `getCount`。

### P2-18｜`site.ts` 硬编码「229 个免费工具」

**改法**：`site.ts` 不能直接 import `registry.ts`（`astro.config.mjs:8` 也在 import `site.ts`，而 `registry.ts:11` 用了 Vite 专属的 `import.meta.glob`，在 Node 侧会炸）。因此用**构建前校验**代替运行时派生。新增 `scripts/check-site-desc.mjs`：

```js
import { readFileSync, readdirSync, existsSync } from 'node:fs';
const n = readdirSync('src/tools').filter((d) => existsSync(`src/tools/${d}/meta.ts`)).length;
const site = readFileSync('src/config/site.ts', 'utf8');
const m = site.match(/(\d+)\s*个免费工具/);
if (!m || Number(m[1]) !== n) {
  console.error(`site.ts 描述里的工具数 ${m?.[1]} 与实际 ${n} 不一致`);
  process.exit(1);
}
```
并在 `package.json` 的 `build` 前挂上：`"prebuild": "node scripts/check-site-desc.mjs"`。

### P2-19｜两个布局重复约 90 行计数/分享脚本

**改法**：抽成单一模块 `src/utils/tool-page.client.ts`，由两个布局各自 import（Astro 会打包去重）：

```ts
// src/utils/tool-page.client.ts
import { bump, getCounts, keys, fmtCount } from '@/utils/counter';

export function initToolCounter(toolId: string | undefined) {
  const useEl = document.getElementById('tool-use-count');
  if (!toolId) return;
  const useKey = keys.use(toolId);
  const paint = (n?: number) => {
    if (n == null || !useEl) return;
    const span = useEl.querySelector('span');
    if (span) span.textContent = fmtCount(n);
    useEl.hidden = false;
  };
  getCounts([useKey]).then((c) => paint(c?.[useKey]));
  let used = false;
  const onFirstUse = () => {
    if (used) return;
    used = true;
    bump([useKey]).then((c) => paint(c?.[useKey]));
    document.removeEventListener('click', onFirstUse, true);
    document.removeEventListener('input', onFirstUse, true);
    document.removeEventListener('change', onFirstUse, true);
  };
  document.addEventListener('click', onFirstUse, true);
  document.addEventListener('input', onFirstUse, true);
  document.addEventListener('change', onFirstUse, true);
}

export function initShareButton() { /* 把 ToolLayout.astro:227-254 原样搬进来 */ }
```
两个布局的 `<script>` 只剩 3 行：
```astro
  <script>
    import { initToolCounter, initShareButton } from '@/utils/tool-page.client';
    initToolCounter(document.querySelector('[data-tool-id]')?.dataset.toolId);
    initShareButton();
  </script>
```

### P2-20｜`SocialLinks` 无插值模板串 / aria-label 与 title 重复

**改法**：`src/components/SocialLinks.astro:25-26` 改为普通字符串，并去掉与 `aria-label` 重复的 `title`（保留能提供额外信息的那个）：

```ts
const githubLabel = 'MokaKit 源码仓库（GitHub，在新标签页打开）';
const mailLabel = `给 MokaKit 作者发邮件（${SOCIAL.email}）`;
```
```astro
  aria-label={githubLabel}
  title="GitHub"      {/* 缩短，避免与 aria-label 大段重复 */}
```

### P2-21｜移动端菜单无障碍细节

**改法**：`src/components/Header.astro:158-166` 补 `aria-controls`；`:276-283` 的点击回调里同步更新 `aria-label`；`:291-293` 的 Esc 监听加条件：

```astro
      <button
        id="mobile-menu-btn"
        class="btn btn-ghost btn-sm btn-square md:hidden shrink-0"
        aria-label="打开菜单"
        aria-controls="mobile-menu"
        aria-expanded="false"
        type="button"
      >
```
```js
      mBtn.addEventListener('click', function () {
        var open = mMenu.classList.toggle('hidden');
        mBtn.setAttribute('aria-expanded', String(!open));
        mBtn.setAttribute('aria-label', open ? '打开菜单' : '关闭菜单');
      });
...
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && more.open) more.open = false;
      });
```
> 注意现有 `:280` 的命名反了：`classList.toggle('hidden')` 返回 `true` 表示**加上了 hidden（即关闭）**，变量却叫 `open`。`aria-expanded = !open` 结果正确，但可读性极差，建议改成 `var nowHidden = mMenu.classList.toggle('hidden'); mBtn.setAttribute('aria-expanded', String(!nowHidden));`。

### P2-22｜页脚缺 `nav` 语义

**改法**：`src/components/Footer.astro:55`（合规链接行所在容器）改为 `<nav aria-label="页脚导航" class="...">...</nav>`；`:13` 的 `<footer>` 保留即可。

### P2-23｜`tsconfig.json` exclude 不全

**改法**：`tsconfig.json:3-4` 改为：

```json
  "include": [".astro/types.d.ts", "src/**/*", "scripts/**/*", "astro.config.mjs"],
  "exclude": ["dist", "dist_*", "dist_bak_*", "_astro_bak_*", "outputs", "workbench", "public", "node_modules", "mcp"],
```

### P2-24｜`AdSlot` 冗余 `aria-hidden` 与恒定占位

**改法**：`src/components/AdSlot.astro:33-37`：

```astro
<div
  class:list={['w-full', !show && 'hidden', show && SIZES[format], className]}
  data-ad-position={slot}
>
```
即：广告未开启时容器直接 `hidden`（不留空白，也不必 `aria-hidden="false"`）；开启时才按位预留高度防 CLS。同时把 `data-ad-slot` 改名为 `data-ad-position`（与 AdSense 保留属性 `data-ad-slot` 区分）。

### P2-25｜959 KB 的 OG 图

**改法**：把 `public/og.png` 重新导出为 1200×630、质量 80 的 JPEG 或 WebP（目标 ≤ 200 KB），并同步 `src/layouts/BaseLayout.astro:103/110` 的引用：
```astro
    <meta property="og:image" content={absUrl('/og.jpg')} />
    ...
    <meta name="twitter:image" content={absUrl('/og.jpg')} />
```
（`src/utils/jsonld.ts` 里若引用了 `/og.png`，P1-10 的 logo 也一并改。）

### P2-26｜`ChangelogRelease` 冗余类名

**改法**：`src/components/ChangelogRelease.astro:71` 的 `class="mt-4 first:mt-4"` 改为 `class="mt-4"`。

### P2-27｜每页重复 `JSON.stringify(siteJsonLd)`

**改法**：`src/layouts/BaseLayout.astro:136-149` 直接复用同一份字符串（组件顶层求值一次即可，Astro 每页实例化时可再省一次）：

```astro
    <script type="application/ld+json" is:inline set:html={SITE_JSONLD} />
    {
      pageJsonLd.map((item) => (
        <script type="application/ld+json" is:inline set:html={JSON.stringify(item)} />
      ))
    }
```
其中 `SITE_JSONLD` 提到 `src/config/site.ts` 之外的一个模块常量里（如 `src/utils/jsonld.ts` 顶部）只序列化一次。

---

## 修复优先级建议

1. **先修 3 个 P0**：都是「静默失效」，越晚发现损失越大（计数数据无法补采、广告收益按天流失）。P0-1/P0-2/P0-3 都是配置或几行代码级别的改动，风险极低。
2. **再修 P1-4 / P1-5 / P1-6 / P1-7**：分别对应「46 个页面图标错误」「全站 HTML 体积 −42%」「全站首屏水合体积」「4 个页面备案合规」。
3. **P1-8 ~ P1-14 与全部 P2** 建议排进下一个迭代，其中 P1-8（noindex 冲突）与 P1-12（主题图标）建议本迭代一并处理，前者影响收录、后者是用户每天可见的界面缺陷。
