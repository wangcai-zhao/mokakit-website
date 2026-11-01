# MokaKit · TS 错误基线（Phase 0 Re-baseline · 2026-11-01）

> 目的：在 Phase 0「现状冻结与基线」阶段，精确量化 TypeScript 类型错误，作为 Phase 3 治理的对照锚点。

## 实测结果（astro check）
- **全量扫描**（tsconfig `include` 含实验/产物目录）：`122 errors` / 0 warnings / 198 hints
- **排除垃圾目录后（干净基线）**：`60 errors` / 0 warnings / 198 hints
- **污染来源**：`_kms_src`（未跟踪的 Vue 实验子项目，缺 `@astrojs/vue` 等依赖，贡献约 62 个 "Couldn't find package" 误报）、`_genui_apps` / `_genui_dl` / `_cprof` / `_eprof` / `outputs` / `_reports` 等实验/产物目录。
- **已修复**：在 `tsconfig.json` 的 `exclude` 增加上述目录，astro check 不再扫入，基线降至 **60**。

## 复现命令
```bash
cd D:/WorkBuddy/website
export NODE_OPTIONS="--require=D:/WorkBuddy/website/noop-shim.cjs"
npm run check        # 全程输出见 _ts_check_clean.log
```

## 历史参考分布（2026-10 记忆，Phase 3 逐文件核验时以 astro check 实际为准）
> 以下为治理前的记忆数据，可能与当前 60 略有出入。
- vat-calculator：17
- bonus-tax-cn：11
- ratio-calculator：5
- timestamp-converter：4
- 其余分散于约 33 个文件

## Phase 3 治理要求
1. 逐文件修复，优先高频工具（vat-calc / bonus-tax-cn）。
2. 新代码零新增类型错误（纳入 `check:all` 复核，后续接入定时回归）。
3. 修复后 `npm run check` 错误数应单调递减，目标 0 或团队约定上限。
4. 注意：astro check 会把出错文件源码一并打印，逐行 grep 不可行，以工具结尾汇总数字为准。
