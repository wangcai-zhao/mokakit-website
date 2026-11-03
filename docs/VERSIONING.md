# MokaKit 版本号规范（Versioning Policy）

> 制定：2026-11-03　｜　适用：MokaKit 全仓库　｜　真源：`package.json` 的 `version`
> 配套脚本：`scripts/bump-version.mjs`、`scripts/check-version.mjs`（已进 `check:all`）

---

## 1. 要解决的问题

改造前项目里存在两套互不相干的"版本"：

| 位置 | 形态 | 作用 | 问题 |
|---|---|---|---|
| `package.json` → `version` | `0.9.12` | 页脚显示 `v0.9.12` | 长期不 bump：11-03 一天内多次部署，版本纹丝不动 |
| `src/data/changelog.ts` → `Release.version` | `2026.11.03` | changelog 时间线圆点 | 是"日期批次号"，不是软件版本，无法回答"线上跑的是哪一个版本" |

结果：**无法用版本号定位线上状态**，回滚时也说不清"回到哪一版"。

本规范确立一条原则：**`package.json` 是唯一真源，日期批次号只负责内容叙事，两者用 `pkgVersion` 建立映射。**

---

## 2. 三个版本坐标

| 坐标 | 位置 | 形态 | 谁来改 | 用在哪 |
|---|---|---|---|---|
| **工程版本** | `package.json` `version` | `0.10.0`（SemVer） | `npm run release:*` | 页脚、进度工作台、发布记录、回滚判断 |
| **内容批次** | `changelog.ts` `Release.version` | `2026.11.03` | 手写 | changelog 页面时间线 |
| **映射字段** | `changelog.ts` `Release.pkgVersion` | `0.10.0` | 手写（新批次必填） | 把"哪批内容"锚到"哪个软件版本" |

页脚不需要手改：`site.ts` 里 `version: \`v${pkg.version}\`` 自动派生。

---

## 3. 语义规则（本项目专属定义）

SemVer 的 `MAJOR.MINOR.PATCH` 放到工具站要重新定义"什么算破坏性"：

### 3.1 MAJOR（X.0.0）—— 对外承诺的破坏性变更

满足任一即升 MAJOR：

| 触发 | 例子 |
|---|---|
| URL 结构变更 | 改工具 `id`、改分类 `slug`（`/tools/c/<slug>/`）、改长尾子页规则 |
| MCP 契约变更 | 改 `mcp/server.mjs` 已有工具名 / 入参 / 返回结构 |
| 数据格式不兼容 | 检索索引格式 v2→v3、catalog.json 结构变更 |
| 里程碑声明 | 从 0.x 进入 1.0.0（首个稳定版，见 §5） |

> 改 `id` / `slug` 等于删页面重建，SEO 上就是破坏性变更，必须 MAJOR，并在 changelog 写明 301 映射。

### 3.2 MINOR（0.X.0）—— 成批能力或基础设施

| 触发 | 例子 |
|---|---|
| 新增 ≥5 个工具 | 一次批量上 20 个换算工具 |
| 新栏目 / 新页面类型 | 时钟栏目、开发者中心、MCP 落地页 |
| 新算法能力 | 场景选模型助手（18 场景 × 11 维） |
| 新基础设施 | 检索单源重构、活动生命周期机制、广告版位治理、闸门扩展 |
| 依赖 minor 升级 | astro 7.3.5 → 7.4.1 |

**判断口诀**：这一版能让用户或 MCP 客户端"多做一件事"，就是 MINOR。

### 3.3 PATCH（0.0.X）—— 修复与小改

| 触发 | 例子 |
|---|---|
| 单工具修 bug / 改算法口径 | 契税面积分界修正 |
| 文案 / SEO 标题 / description 调整 | 改 `seoTitle` |
| 样式微调、图标替换 | UI 修补 |
| 单个工具的日常升级批 | 每日自动化积累 1–3 个工具 |
| 依赖 patch 升级 | daisyui 5.7.47 → 5.7.50 |

### 3.4 预发布（prerelease）

需要灰度或内部验证时用 `0.11.0-beta.1`，**不占正式版本位**，验证通过后 `--set 0.11.0` 转正。
静态站没有灰度环境，本项仅用于"先发一版给旺财看"的场景。

---

## 4. 操作流程

### 4.1 标准发布（推荐）

```bash
# 1) 升版本（按 §3 选类型）
npm run release:patch     # 或 release:minor / release:major
#    等价于 node scripts/bump-version.mjs --patch

# 2) 回填 changelog 顶部批次的 pkgVersion（脚本会提示）
#    编辑 src/data/changelog.ts：pkgVersion: '0.10.1'

# 3) 闸门（含 check:version 一致性校验）
npm run check:all

# 4) 构建 + 部署
npm run build
bash deploy/deploy.sh root@58.87.68.151
```

### 4.2 指定版本

```bash
node scripts/bump-version.mjs --set 1.0.0
node scripts/bump-version.mjs --minor --dry-run   # 只看结果，不写盘
```

### 4.3 脚本行为边界

- 只改 `package.json` 的 `version` 一行，**保留文件其余格式**；
- **不 commit、不 build、不部署** —— 提交时机由人决定（符合项目"发布留人工"的习惯）；
- 若 `src/` 或 `package.json` 有未提交改动，会打印警告但继续（记忆目录 `.workbuddy/` 的改动不阻断）。

---

## 5. 演进路线（当前所处位置）

| 版本 | 含义 | 进入条件 |
|---|---|---|
| `0.10.x` | **当前**：功能可用，但结构仍可能调整 | 已完成（2026-11-03） |
| `0.11.x` – `0.12.x` | 还技术债 | 关闭基准文档 R-01（财金 5 工具抽层）、R-02（闸门覆盖）、R-03（build/deploy 串闸门） |
| **`1.0.0`** | 首个稳定版：对外承诺 URL / MCP 契约稳定 | ① 3 个 P0/P1 债关闭；② `check:all` 全绿且被 build 强制；③ 至少一次完整回滚演练 |
| `1.x` | 常规迭代 | 功能走 MINOR，修复走 PATCH |
| `2.0.0` | 破坏性重构 | URL / 分类 / MCP 契约变更 |

> **为什么现在不跳到 1.0.0**：1.0.0 是对外承诺"API 与 URL 稳定"，而财金算法尚未单源、闸门尚未强制。过早宣布会让后续必要修改变成"破坏性变更"，反噬信任。0.10.x 的语义正好允许修结构。

---

## 6. 校验与红线

`npm run check:version` 会检查：

1. `package.json.version` 是合法 SemVer；
2. 最新批次的 `pkgVersion` 若已填，**必须**等于 `package.json.version`（不一致 → 失败）；
3. 最新批次未填 `pkgVersion` → 警告；
4. 历史批次的 `pkgVersion` 不得高于当前版本（防倒挂）。

### 红线

| 编号 | 禁止 | 原因 |
|---|---|---|
| V-01 | 同一版本号多次部署 | 无法用版本定位线上状态，回滚失去锚点 |
| V-02 | 跳过版本（0.10.0 → 0.10.3） | 丢失变更量级信息 |
| V-03 | 用日期当工程版本（`2026.11.03`） | 无法表达兼容性语义 |
| V-04 | 直接手改 `package.json` 之外的版本号 | 页脚、工作台、changelog 会各说各话 |
| V-05 | 破坏性变更走 MINOR | 下游（MCP 客户端、收藏链接）无预警 |

---

## 7. 常见问题

**Q：一次发布只加了 1 个工具，要不要升版本？**
A：要，走 PATCH。规则是"发布即 bump"，不是"改动够大才 bump"。

**Q：一天发两次怎么办？**
A：两次各 bump 一次（0.10.1、0.10.2）。版本号是发布计数器，不是"内容重要性"刻度。

**Q：changelog 的 `version: '2026.11.03'` 还要不要写？**
A：写，作为内容批次号用于时间线展示；同时必须填 `pkgVersion` 建立映射。同一日期多批时，批次号可写 `2026.11.03`（内容同批），由 `pkgVersion` 区分软件版本。

**Q：改了 `site.ts` 的 `ads` 要不要升版本？**
A：只改开关不升；如果伴随版位结构调整并重新部署，走 PATCH。
