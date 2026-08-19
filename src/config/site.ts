/**
 * 全站配置中心。
 * 站名 / 域名 / 备案号 / 统计 ID 都只在这里改一次，全站跟着变。
 */

export const SITE = {
  /**
   * 正式域名（含协议，结尾不加斜杠）。
   * 规范域名走 www.mokakit.com；裸 mokakit.com 与 mokakit.cn 仅做 301 跳转、不出内容。
   * mokakit.cn 已注册但备案待批，暂不做跳转也不出内容，避免备案未过就暴露二级域名；
   * 备案成功后把 altDomains 里的裸 mokakit.com 换成 ['https://mokakit.cn'] 即可。
   */
  url: 'https://www.mokakit.com',

  /**
   * 备用域名。做 301 跳转用，不参与 canonical / sitemap。
   * 部署时在服务器上把它整站 301 到 SITE.url（www）即可。
   * 当前裸 mokakit.com 是规范域名的无 www 形态，列入后出站链接判断不会把它当第三方走 /go/。
   */
  altDomains: ['https://mokakit.com'],

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
    /** 全局广告开关。上线初期流量不足时保持 false，只保留占位不请求广告 */
    enabled: false,
    /** AdSense 发布商 ID，形如 ca-pub-0000000000000000 */
    adsenseClient: '',
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
} as const;

/** 供 JSON-LD 与 og 使用的绝对 URL 拼接 */
export function absUrl(path: string): string {
  const base = SITE.url.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
