/**
 * 全站配置中心。
 * 站名 / 域名 / 备案号 / 统计 ID 都只在这里改一次，全站跟着变。
 */

export const SITE = {
  /**
   * 正式域名（含协议，结尾不加斜杠）。
   * 规范域名走 www.mokakit.com；裸 mokakit.com 与 mokakit.cn 仅做 301 跳转、不出内容。
   * mokakit.cn 已备案（京ICP备2026051111号，与 mokakit.com 同主体），DNS 已解析、证书已加 SAN，整站 301 到 www。
   */
  url: 'https://www.mokakit.com',

  /**
   * 备用域名。做 301 跳转用，不参与 canonical / sitemap。
   * 部署时在服务器上把它整站 301 到 SITE.url（www）即可。
   * 裸 mokakit.com（无 www 形态）与 mokakit.cn（同主体备用域名）都列入，
   * 出站链接判断才不会把它们当第三方走 /go/。
   */
  altDomains: ['https://mokakit.com', 'https://mokakit.cn'],

  /** 站点名称（英文品牌）。备案时填的网站名称建议用中文名 */
  name: 'MokaKit',

  /** 中文品牌名。备案填写的「网站名称」用这个 */
  nameCn: '摩卡工具箱',

  /** 首页大标题下方的一句话定位 */
  slogan: 'AI 时代的工具箱，人用顺手，AI 能调',

  /** 首页 meta description，80-120 汉字为宜 */
  description:
    '摩卡工具箱（MokaKit）是 AI 时代的在线工具箱：104 个免费工具，涵盖个税社保、房贷契税、单位换算、开发辅助等，打开即用、本地计算不上传数据；同时通过 MCP 协议供 Claude、Cursor 等 AI 助手直接调用。',

  /** ICP 备案号，备案通过后填入，页脚会自动显示并链接工信部 */
  icp: '京ICP备2026051111号',

  /** 公安备案号（审核通过后填入。页脚会自动显示并链接全国互联网安全管理服务平台核验页） */
  police: '京公网安备11010502062390号',

  /** 站点上线年份，用于页脚版权 */
  since: 2026,

  /** 当前版本号，显示在页脚版权行末尾。正式版上线后改填正式版本号 */
  version: 'v0.9.0',

  /**
   * 是否已正式上线。
   * - false（默认，开发/预览期）：页脚版本号会链接到「进度工作台」(/workbench.html)，方便随时查看进度。
   * - true（正式版上线后）：页脚仅显示版本号文本，不再链接工作台。
   * 正式发布时把本项改为 true 即可。
   */
  launched: true,

  /** 统计与广告开关：拿到 ID 前保持空字符串，相关脚本不会被注入 */
  analytics: {
    /** 百度统计 hm.js 的 ID */
    baiduId: 'c1ce047dfb4bbcfe58cba2418b56332a',
    /** Google Analytics 衡量 ID，形如 G-XXXXXXX */
    gaId: '',
  },
  ads: {
    /** 全局广告开关。变现落地：已开启，但需先填入 adsenseClient 真实发布商 ID 广告才会真正请求 */
    enabled: true,
    /** AdSense 发布商 ID，形如 ca-pub-0000000000000000。留空时即使 enabled=true 也不会渲染广告 */
    adsenseClient: 'ca-pub-0218164655974877',
  },

  /** 匿名访问量统计：仅聚合计数，不写追踪 Cookie、不记录 IP/设备指纹 */
  counter: {
    /** 总开关。false（默认）：前端零请求零外联，不破隐私承诺也不破构建；
     *  服务器反代跑通后改成 true 重新发布即生效 */
    enabled: true,
    /** 计数接口路径（同源，由 Nginx 反代到本机计数服务 127.0.0.1:18800） */
    apiBase: '/api/count',
  },
  /** 分享功能：原生系统分享面板 + 复制链接兜底 */
  share: {
    enabled: true,
  },
  /** 投稿通道：/submit/ 页用 GitHub Issue 引导。owner/repo 配齐后走 GitHub，否则降级 mailto。 */
  github: {
    owner: 'wangcai-zhao',
    repo: 'mokakit-website',
  },

  /**
   * WorkBuddy 官方邀请（/tips/ 技巧专栏 + WorkBuddy 生态工具页内嵌）。
   * 全站唯一维护点：只改这里的 inviteCode / inviteActive，InviteCta 组件自动跟着变。
   */
  workbuddy: {
    /** 官方邀请活动页，规则以该页为准。域名已迁至 workbuddy.cn（原 codebuddy.cn；WorkBuddy 与 CodeBuddy 同属腾讯） */
    activityUrl: 'https://www.workbuddy.cn/events/invite',
    /** 专属邀请码 */
    inviteCode: '7a17nrwwpe',
    /** 规则文案最后核对日期。活动规则会变（如活动期延长、域名迁移），每月复核一次 */
    rulesCheckedAt: '2026-09-01',
    /** 活动总开关。活动结束或规则大改时置 false，全站邀请位一键下线，不用删代码 */
    inviteActive: true,

    /**
     * 教师普惠福利（2026 教师节活动，限在职教师）。
     * 与邀请裂变是两套机制：本活动无邀请码、MokaKit 不因此得积分，纯用户福利；
     * 且需「中国教师」平台实名认证，受众仅限教师。故独立成块、文案通用化、标以官方为准。
     */
    teacherBenefit: {
      /** 官方活动页，规则以该页为准（域名 workbuddy.cn，同为腾讯官方） */
      activityUrl: 'https://www.workbuddy.cn/events/teacher-benefit/',
      /** 活动总开关。活动结束（2026-09-30）或规则大改时置 false，教师位一键下线 */
      active: true,
      /** 规则文案最后核对日期。教师节活动期短，每月复核一次 */
      rulesCheckedAt: '2026-09-01',
    },
  },
} as const;

/**
 * 派生对象：邀请链接与开关统一从这里取，组件不要直接读 SITE.workbuddy。
 *
 * ⚠️ inviteActive 必须显式断言成 boolean —— SITE 是 as const，
 * `inviteActive: true` 会被推导成字面量类型 `true`，
 * 组件里写 if (!SITE.workbuddy.inviteActive) 会被 TS 判定为「条件恒为 false」而告警。
 */
export const WORKBUDDY = {
  ...SITE.workbuddy,
  inviteActive: SITE.workbuddy.inviteActive as boolean,
  teacherBenefit: {
    ...SITE.workbuddy.teacherBenefit,
    /** 同样需断言 boolean，避免 as const 把 true 推成字面量导致条件恒为真告警 */
    active: SITE.workbuddy.teacherBenefit.active as boolean,
  },
  get inviteUrl() {
    return `${SITE.workbuddy.activityUrl}?inviteCode=${SITE.workbuddy.inviteCode}`;
  },
} as const;

/** 供 JSON-LD 与 og 使用的绝对 URL 拼接 */
export function absUrl(path: string): string {
  const base = SITE.url.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
