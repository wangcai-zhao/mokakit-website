// noop-shim：用于绕过沙箱注入的 genie-safe-delete.cjs（NODE_OPTIONS --require）。
// 该 shim 会拦截 Astro 构建时的临时目录清理，导致 build exit 1 / dist 空 / 收尾挂死。
// 用本文件替换原 shim：require 时什么都不做，即中性化文件操作拦截。
// 用法：export NODE_OPTIONS="--require=D:/WorkBuddy/website/noop-shim.cjs --use-system-ca"
module.exports = function () {};
