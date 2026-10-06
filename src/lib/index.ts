/**
 * src/lib/index.ts —— 纯计算层统一导出入口
 * ----------------------------------------------------------------------------
 * 为什么要有它：
 *   src/lib/ 下的纯函数此前只能按文件路径单独 import（'@/lib/china-tax'），
 *   页面组件与 MCP Server 各自写路径，新增/拆分文件时调用方要跟着改。
 *   这里做一层 barrel，让调用方统一 `import { calcDeedTax } from '@/lib'`。
 *
 * 设计约束（重要）：
 *   1. **纯新增，零破坏**：本文件只做重导出，不改名、不移除、不改写任何既有导出。
 *      所有既有 `import { x } from '@/lib/china-tax'` 写法继续有效，不受影响。
 *   2. **不引入副作用**：lib 各文件都是零浏览器 API 的纯函数层，打包进 MCP（node18）也安全。
 *   3. 有同名导出时按文件单独 import，不要在本文件里做重命名。
 */

export * from './china-tax';
export * from './china-social-security';
export * from './china-vat';
export * from './china-calc-extra';
export * from './mortgage';
export * from './misc-calc';
