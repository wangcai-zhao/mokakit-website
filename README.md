# MokaKit 摩卡工具箱

> AI 时代的工具箱：人用顺手，AI 能调。线上站点 https://www.mokakit.com ，源码目录 `D:\WorkBuddy\website`。

纯静态站点：Astro 7 + Preact 10 + daisyUI 5 + Tailwind v4，无后端。全部工具的计算都在浏览器本地完成、不上传数据；同一套算法通过 MCP 协议暴露给 Claude / Cursor 等 AI 助手直接调用。

## 一、目录约定

| 路径 | 放什么 |
|---|---|
| `src/config/site.ts` | 站点唯一真源：品牌、域名、备案、统计与广告开关。**版本号由 package.json 派生**，不要在页面里硬编码 |
| `src/config/categories.ts` | 工具分类定义，新增分类只改这里 |
| `src/lib/` | **纯计算层**：零浏览器 API，前端页面与 MCP Server 共用同一份算法。金额统一用 decimal.js 四舍五入到分 |
| `src/lib/index.ts` | 纯计算层统一导出入口，只做重导出，方便 `import { calcDeedTax } from '@/lib'` |
| `src/tools/<id>/` | 单个工具，固定三件套：`meta.ts` + `Tool.tsx` + `content.mdx` |
| `src/tools/registry.ts` | 自动注册表，用 `import.meta.glob` 发现全部 `meta.ts`，不需要手动登记 |
| `src/tools/types.ts` | `ToolMeta` 契约与 `defineTool()` 助手 |
| `src/tools/_shared/` | 跨工具复用的组件与小工具（`copy.ts`、`image-utils.ts` 等） |
| `src/components/` | 全局组件，其中 `WidgetHost.astro` 是水合岛屿宿主 |
| `src/data/` | 静态数据（`changelog.ts` 更新日志、`sites.ts` 好站导航） |
| `mcp/` | MCP Server，`server.mjs` 直接 import `src/lib/*.ts` 的纯函数 |
| `scripts/` | 构建、校验与测试脚本 |

命名规则：工具目录用 kebab-case 且优先选高搜索量的英文词（`password-generator` 而不是 `pwd-gen`），id 一旦上线被收录就不要改；`china-*.ts` 表示中国本土政策口径的计算层，`misc-calc.ts` 放通用非财税换算。

## 二、新增一个工具：四件套

注册表会自动发现 meta，但**水合必须静态 import**，所以第四件不能漏：

1. `src/tools/<id>/meta.ts` —— `defineTool({ id, name, tagline, description, keywords, category, tags, icon, status, hydrate, createdAt, updatedAt, priority, faq, related })`。
2. `src/tools/<id>/Tool.tsx` —— Preact 组件，`export default`。算法一律 `import { calcXxx } from '@/lib/...'`，**不要在组件里另写一份公式**。
3. `src/tools/<id>/content.mdx` —— 六段式 SEO 正文：怎么算 / 工具能做什么 / 输入说明 / 算例 / 注意事项 / 相关工具。注意 MDX 里裸的 `<` `{` `}` 会被当 JSX 报错。
4. `src/components/WidgetHost.astro` 补四处：① `import Xxx from '@/tools/<id>/Tool.tsx'`；② `const isXxx = tool.id === '<id>';`；③ 把 `isXxx` 加进 `known` 表达式；④ 渲染区加 `load` / `idle` / `visible` 三行。

> ⚠️ 只做前三件的话，页面照样生成、`npm run build` 照样成功，但产物里一个 `astro-island` 都没有，工具是点不动的死壳。用 `npm run check:widgets` 兜住。

## 三、算法只能有一份

`src/lib/` 是纯函数层，**前端与 MCP 必须共用**。历史上契税的面积分界线（90㎡ / 140㎡）在库和组件里各写一份，改了库没改组件，线上长期按已废止的 90㎡ 多算税——这类事故的通用解法就是：政策常量、税率表、减免窗口只出现在库里，组件只负责收集入参与渲染。

错误处理沿用两套约定，新增函数请按场景选：

- **计算类**（`calc*`）：入参非法时 `return { error: '中文提示' }`，调用方用 `'error' in r` 判断。不抛异常，MCP 直接回传最省事。
- **断言类**（`mortgage.ts` 的 `assertValidInput`、`registry.getTool`、`getCategory`）：查不到或明显越界时 `throw new Error`，要求调用方 try/catch。

新函数请写全 JSDoc：参数、返回值、异常情况、典型用法、以及边界输入行为（null / undefined / 空值 / NaN / 负数 / 政策窗口外）。

## 四、常用命令

```bash
npm run dev            # 本地开发（4321）
npm run build          # astro build → 雪碧图优化 → 生成 sitemap
npm run check          # astro check 类型检查
npm run check:all      # 上线前三件套：水合注册 + 图标可解析 + changelog 登记
npm run workbench      # 生成进度工作台 workbench/workbench.html
npm run mcp:build      # 打包 MCP Server 到 deploy/mcp（改工具后必跑）
```

算法改动后跑对应回归脚本（跑法统一加 `--experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs`）：

```bash
node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs scripts/test-new-calc.mjs
```

## 五、上线前检查清单

1. `npm run check:all` 全绿（水合注册、图标、更新日志登记）。
2. `npm run build` 无报错。
3. 确认新工具真上线：`grep -c astro-island dist/tools/<id>/index.html` 至少为 1。
4. `src/data/changelog.ts` 已登记本批工具 id，`src/config/site.ts` 的 description 工具总数已同步。
5. 若改动影响 `src/lib`，跑 `npm run mcp:build` 并重新部署 MCP。

## 六、部署

腾讯云轻量 58.87.68.151，nginx 托管静态产物，脚本在 `deploy/`：`deploy.sh` 先 build 再上传。MCP Server 走 systemd 服务 `/opt/mokakit-mcp`（仅监听 127.0.0.1:18700，由 nginx 反代）。
