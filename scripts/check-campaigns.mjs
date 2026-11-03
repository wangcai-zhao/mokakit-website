/**
 * 活动时间窗校验（闸门）
 * ----------------------------------------------------------------------------
 * 为什么需要它：
 *   纯静态站没有运行时。src/config/campaigns.ts 的 resolveCampaign() 只能在
 *   **构建那一刻**判定活动是否有效；一旦构建完成就不再变化。如果活动在两次
 *   构建之间到期，页面会继续挂着过期的活动文案与链接。
 *
 *   本脚本在发布前把"到期但还没处理"的活动喊出来：
 *     - 结构性错误（日期反了 / 格式错 / id 重复）→ exit 1，阻断发布；
 *     - 业务提醒（已过期仍 active、临期、未开始）→ 仅警告，不阻断。
 *
 *   为什么业务提醒不阻断：过期活动在构建期已经自动下线（不会渲染），
 *   此时阻断发布没有意义，只需要人把 active 置 false 或续期 endAt。
 *
 * 用法：
 *   node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs scripts/check-campaigns.mjs
 *   CAMPAIGN_TODAY=2026-10-01 node ... （模拟某一天，验证到期行为）
 */
import { CAMPAIGNS, resolveCampaign, daysLeft, campaignToday } from '../src/config/campaigns.ts';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const today = campaignToday();

const errors = [];
const warnings = [];
const seen = new Set();

for (const c of CAMPAIGNS) {
  if (!c.id || !/^[a-z0-9-]+$/.test(c.id)) errors.push(`id 不合法（需 kebab-case）：${c.id}`);
  if (seen.has(c.id)) errors.push(`id 重复：${c.id}`);
  seen.add(c.id);
  if (!c.name) errors.push(`${c.id}：缺少 name`);

  for (const [k, v] of [
    ['startAt', c.startAt],
    ['endAt', c.endAt],
  ]) {
    if (v != null && v !== '' && !DATE_RE.test(String(v))) {
      errors.push(`${c.id}.${k} 不是 YYYY-MM-DD：${v}`);
    }
  }
  if (c.startAt && c.endAt && c.startAt > c.endAt) {
    errors.push(`${c.id}：startAt ${c.startAt} 晚于 endAt ${c.endAt}`);
  }

  const state = resolveCampaign(c, today);
  const left = daysLeft(c, today);
  const warnDays = c.warnDays ?? 14;

  if (state.reason === 'expired' && c.active) {
    warnings.push(
      `${c.id}「${c.name}」已于 ${c.endAt} 结束，但 active 仍为 true —— ` +
        `页面已自动下线，建议把 active 置 false，或改 endAt 续期。`,
    );
  } else if (state.live && left !== null && left <= warnDays) {
    warnings.push(`${c.id}「${c.name}」还有 ${left} 天结束（${c.endAt}），请提前确认是否续期。`);
  } else if (state.reason === 'not-started') {
    warnings.push(`${c.id}「${c.name}」将于 ${c.startAt} 开始，当前不展示（属正常）。`);
  }
}

console.log(`活动登记：${CAMPAIGNS.length} 个　判定基准日：${today}`);
for (const c of CAMPAIGNS) {
  const s = resolveCampaign(c, today);
  const left = daysLeft(c, today);
  const leftText =
    left === null ? '长期' : left < 0 ? `已过期 ${-left} 天` : `剩 ${left} 天`;
  console.log(
    `  ${s.live ? '✓' : '·'} ${c.id.padEnd(20)} ${s.reason.padEnd(12)} ${leftText}　${s.detail}`,
  );
}

if (warnings.length) {
  console.log(`\n⚠ 需要关注的提醒（${warnings.length}）：`);
  warnings.forEach((w) => console.log(`  - ${w}`));
}

if (errors.length) {
  console.log(`\n✗ 结构性错误（${errors.length}）：`);
  errors.forEach((e) => console.log(`  - ${e}`));
  process.exit(1);
}

console.log('\n✓ 活动时间窗校验通过（无结构性错误）');
