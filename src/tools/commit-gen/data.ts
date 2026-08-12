export interface CommitType {
  v: string;
  desc: string;
  ex: string;
}

export const TYPES: CommitType[] = [
  { v: 'feat', desc: '新功能', ex: 'feat(auth): 支持微信登录' },
  { v: 'fix', desc: '修复缺陷', ex: 'fix(parser): 修复空输入崩溃' },
  { v: 'docs', desc: '文档变更', ex: 'docs: 更新 README 接入说明' },
  { v: 'style', desc: '格式/空格（不影响逻辑）', ex: 'style: 统一缩进为 2 空格' },
  { v: 'refactor', desc: '重构（非新功能/非修 bug）', ex: 'refactor(core): 拆分路由模块' },
  { v: 'perf', desc: '性能优化', ex: 'perf(img): 图片改为懒加载' },
  { v: 'test', desc: '测试相关', ex: 'test: 补充空输入的边界用例' },
  { v: 'build', desc: '构建/依赖变动', ex: 'build: 升级 vite 到 6' },
  { v: 'ci', desc: 'CI 配置', ex: 'ci: 新增 lint 校验步骤' },
  { v: 'chore', desc: '杂项（非 src/测试）', ex: 'chore: 清理调试日志' },
  { v: 'revert', desc: '回滚提交', ex: 'revert: 回滚 feat(auth) 提交' },
];
