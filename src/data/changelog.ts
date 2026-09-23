/**
 * 更新日志数据源。
 *
 * 设计原则：
 * 1. **不重复登记**：工具条目只写 id，名称 / 用途 / 图标 / 分类一律构建时从
 *    src/tools/registry 取，改工具元数据不会漏同步更新日志。
 * 2. **分层写作**：写了 features 的工具在页面上渲染成"重点卡"（名称 + 用途 +
 *    核心功能逐条列出）；只写 role 或不写的渲染成紧凑条目（用途回落到 tagline）。
 *    换算类同质工具用 group.note 统一说明共性，避免 20 条重复文案。
 * 3. **可校验**：id 写错会在构建时告警；scripts/changelog-check.mjs 反向检查
 *    哪些新工具漏登记。
 *
 * 新增一批工具的流程：在 RELEASES 顶部插一条，date 用当天，tools 里填 id。
 */

/** 更新日志里的单个工具条目 */
export interface ChangelogTool {
  /** 工具 id，对应 src/tools/<id>/，必须真实存在 */
  id: string;
  /** 本批次里它解决什么问题。留空则回落到工具自己的 tagline */
  role?: string;
  /** 核心功能点，2-4 条短句。写了就会渲染成重点卡 */
  features?: string[];
}

export interface ChangelogGroup {
  /** 分组名，如"开发者小工具 ×20" */
  label: string;
  /** 该组共性说明，换算类同质工具靠它省掉重复文案 */
  note?: string;
  tools: ChangelogTool[];
}

export interface Release {
  /** 批次标识，会显示在时间线圆点旁 */
  version: string;
  /** YYYY-MM-DD */
  date: string;
  /** 批次标题 */
  title: string;
  /** 一句话摘要 */
  summary: string;
  groups: ChangelogGroup[];
  /** 同一批次的非新增改动（优化 / 修复 / 基建），区别于新增工具 */
  notes?: string[];
}

export const RELEASES: Release[] = [
  {
    version: '2026.09.23-b',
    date: '2026-09-23',
    title: '让 11 个新工具真正能用 · 性能与合规收尾',
    summary:
      '上一批 11 个工具只完成了一半——页面生成了、看着像上线了，但漏了在 WidgetHost 里注册水合岛屿，结果全是点不动的静态壳子。这次把它们全部接上，并补了一道会自动报警的校验防止复发。同时把全站浏览器的加载策略从「立即水合」改成「空闲水合」，首屏不再被几百个组件的 JS 拖住；四个全屏时钟页此前因为隐藏页脚而没有备案号，也已补齐。',
    groups: [],
    notes: [
      '【修复】秒表、番茄钟、盈亏平衡、ROI、身份证校验、银行卡校验、CIDR、矩阵、SEO 标签生成、字节换算、存钱计划这 11 个工具此前均未注册水合岛屿，页面只有静态 HTML、点击无任何反应。已补上 WidgetHost 的导入、判据、known 表达式与三档渲染分支，11 个工具全部恢复正常交互。',
      '【基建】新增 npm run check:widgets：校验每个工具是否真的接入了水合岛屿、是否存在指向已删工具的幽灵注册、Tool.tsx 是否缺少默认导出。这类缺陷此前不会导致构建失败，只能靠肉眼发现，现在有了自动护栏。npm run check:all 可一次跑完水合、图标、更新日志三项校验。',
      '【性能】230 个工具的水合策略由 client:load 改为 client:idle，浏览器主线程空闲时才接管组件，显著降低首屏阻塞。10 个时间敏感型工具保留立即加载——四个时钟页、倒计时、TOTP 动态口令、时间戳转换、今日信息、秒表与番茄钟，它们晚一秒就会展示过期的服务端渲染值。',
      '【修复】深蓝色沉浸式的四个时钟页此前隐藏了页脚，导致 ICP 与公安备案号缺失。已在沉浸式布局底部补入精简备案条，四个页面现已全部合规。',
      '【视觉】补齐 35 个此前只能靠语义别名顶替的图标，改为真实的 Lucide 路径；另有 5 个工具改用语义正确的真实图标。全站工具的图标不再出现「长得像但不是它」的情况，字典从 106 个增至 141 个真实图标。',
    ],
  },
  {
    version: '2026.09.23',
    date: '2026-09-23',
    title: '效率 / 校验 / 财务计算 · 11 个新工具 + 契税口径纠正',
    summary:
      '这一批补的都是「小而高频」的场景：掐个表、走一轮番茄钟、验一下身份证和银行卡号、算清楚 CIDR 子网与投资回报率。同时把一批工具的图标全都修好了——它们之前引用的图标名并不存在，页面上一律顶着同一个九宫格方块。另外纠正了一个会真金白银算错的问题：契税的面积分界线早在 2024 年 12 月就从 90㎡ 上调到 140㎡ 了。',
    groups: [
      {
        label: '效率计时 ×2',
        note: '都在本地跑，不联网、不上传。秒表用 performance.now 累加，暂停续跑不会漂移。',
        tools: [
          {
            id: 'stopwatch',
            role: '毫秒级秒表，支持计次与分段对比',
            features: [
              '毫秒分辨率显示，开始 / 暂停 / 续跑 / 复位齐全',
              '计次记录多段用时并自动给出每段差值',
              '空格控暂停、L 计次、R 复位，双手不用离开键盘',
            ],
          },
          {
            id: 'pomodoro-timer',
            role: '番茄工作法计时器，专注与休息自动循环',
            features: [
              '25 分钟专注 / 5 分钟短休 / 15 分钟长休，每 4 个番茄进长休',
              '结束时用 Web Audio 生成提示音，不加载任何外部音频文件',
              '自定义时长与循环轮数，统计当天完成番茄数',
            ],
          },
        ],
      },
      {
        label: '校验工具 ×2',
        note: '纯前端校验，输入的号码不发出去。适合在填表前先自查一遍。',
        tools: [
          {
            id: 'id-card-check',
            role: '身份证号真伪校验并解析籍贯、生日与性别',
            features: [
              '18 位按 GB 11643-1999 的 MOD 11-2 算校验码，15 位老证提示可升位',
              '解析发证省份、出生日期、当前周岁、性别',
              '位数错、含非法字符、日期不合法、校验位错都分别指出',
            ],
          },
          {
            id: 'bank-card-validator',
            role: '银行卡号 Luhn 校验并识别卡组织',
            features: [
              '标准 Luhn 算法校验，输入时自动忽略空格与横线',
              '识别银联、Visa、MasterCard、JCB、Amex、Diners 并核对卡号长度',
              '四位一组格式化展示，便于肉眼复核',
            ],
          },
        ],
      },
      {
        label: '开发与 SEO ×2',
        tools: [
          {
            id: 'cidr-calculator',
            role: 'CIDR 子网计算，IP 加掩码也能反算',
            features: [
              '算出网络地址、广播地址、掩码、可用主机范围与数量、通配符掩码',
              '支持斜杠 0 到斜杠 32，斜杠 31 与斜杠 32 按 RFC 3021 特殊说明',
              '支持输入点分十进制掩码反推 CIDR 前缀',
            ],
          },
          {
            id: 'meta-tags-generator',
            role: 'SEO Meta 标签生成器，带实时体检',
            features: [
              '生成可直接粘贴的 title、canonical、og、twitter 与 JSON-LD 片段',
              '实时体检标题长度、描述区间、是否缺 canonical 与 OG 图',
              '一键复制，改完立即可见',
            ],
          },
        ],
      },
      {
        label: '财务与数学计算 ×5',
        tools: [
          {
            id: 'break-even-calculator',
            role: '盈亏平衡点测算，多少销量才开始赚钱',
            features: [
              '固定成本除以单位边际贡献算出保本销量与保本销售额',
              '给出销量 80% / 100% / 120% 三档的利润对照',
              '单价低于单位变动成本时明确报错，不给你负数结论',
            ],
          },
          {
            id: 'roi-calculator',
            role: '投资回报率与年化 ROI 换算',
            features: [
              '按持有天数折算年化收益，持有不足一年也能横向对比',
              '亏损场景正确显示负 ROI，不会给你 false positive',
              '同时给出净利润与回本节奏说明',
            ],
          },
          {
            id: 'savings-goal-calculator',
            role: '存钱计划：多久攒够，或每月得存多少',
            features: [
              '正向算达成月数与预计达成年月，反向算所需月存额',
              '把到期总额拆成累计本金与利息收入，看清复利贡献',
              '内置经典 52 周存钱法全年成果对照',
            ],
          },
          {
            id: 'bytes-size-converter',
            role: '字节单位换算，1024 与 1000 两套口径可切',
            features: [
              'bit / KB / MB / GB / TB / PB 全单位互转',
              '一键切换操作系统口径与硬件厂商口径',
              '按带宽 Mbps 估算理论下载耗时',
            ],
          },
          {
            id: 'matrix-calculator',
            role: '矩阵运算，加减乘、转置、行列式与求逆',
            features: [
              '支持 2 阶与 3 阶矩阵的加减乘、标量乘与转置',
              '计算行列式并对可逆矩阵求逆',
              '奇异矩阵明确提示不可逆，不给伪结果',
            ],
          },
        ],
      },
    ],
    notes: [
      '【修复·影响金额】契税计算的面积分界线由 90㎡ 纠正为 140㎡（财政部、税务总局、住建部 2024 年第 16 号公告，2024-12-01 起执行）。此前 120㎡ 的二套房会被按 2% 计算，正确应为 1%，200 万的房子差额达 2 万元。同时更新了库层与工具层的两处重复实现，避免再次漂移。',
      '【修复】工具使用计数此前请求的是并不存在的 /api/counter 且与服务端协议不符，导致计数长期为 0 且毫无报错。现抽成统一的 CounterScript 组件，工具页与时钟页共用同一份正确实现。',
      '【修复】51 个工具引用的图标名在图标字典中并不存在，页面上一律退化为同一个九宫格方块。已通过语义别名映射全部修正，并加了校验脚本防止新增工具再犯。',
      '【修复】广告位缺少 data-ad-client 与 data-ad-slot 两个必填属性，AdSense 拿不到投放配置导致广告位全部空着。已按 AdSense 要求把这两个属性补到 ins 标签上。',
      '【SEO】sitemap 的 lastmod 改为反映真实更新时间（工具页取自身 updatedAt，内容页取 git 提交日期），不再每次构建全站刷新；priority 改为按工具权重映射，替代原来的页面深度算法。',
      '【性能】新增产物级雪碧图瘦身：原先每页内联 106 个图标 symbol（约 33KB），现在只保留该页实际用到的，平均单页体积下降近一半。',
      '【健壮性】房贷计算库补齐入参校验，负本金、零期数、非法还款方式不再「算出钱却不报错」。',
    ],
  },
  {
    version: '2026.09.18',
    date: '2026-09-18',
    title: '图片 / 文本 / 开发辅助 · 31 个新工具 + 文档脱敏',
    summary:
      '这一批把「图片处理」开成了独立栏目，文本与开发辅助各补十个，最后加了一个文档脱敏工具。共同点是：全部在浏览器本地算完，粘贴进去的数据一步都不离开设备——图片、合同、客户名单这类东西，本来就不该传给别人的服务器。',
    groups: [
      {
        label: '图片处理 ×10（新栏目）',
        note: '统一走 canvas 本地处理：选图 → 调参数 → 实时看体积对比 → 下载，不上传、不留痕。',
        tools: [
          {
            id: 'image-compress',
            role: '压体积不降清晰度，实时显示省了多少',
            features: [
              '拖动质量滑块即时算出压缩后体积与节省百分比',
              '输出 JPEG / WebP / PNG，可同时限制最大宽度',
            ],
          },
          { id: 'image-resize', role: '改宽高，内置头像、小红书、公众号封面等预设尺寸' },
          { id: 'image-convert', role: 'PNG / JPEG / WebP 互转，转 JPEG 可垫白底避免透明变黑' },
          { id: 'image-base64', role: '图片与 Base64 双向转换，可选是否带 data URL 前缀' },
          {
            id: 'image-watermark',
            role: '文字水印，支持满屏斜向平铺防截图外传',
            features: ['九宫格定位或斜向平铺', '字号、颜色、不透明度可调，自带阴影描边'],
          },
          { id: 'image-crop', role: '按六种常用比例裁剪，绝不拉伸变形' },
          { id: 'image-filter', role: '黑白、反色、复古等预设 + 亮度对比度饱和度模糊四档滑块' },
          { id: 'image-info', role: '查看尺寸、体积、宽高比，并可抽样提取画面主色' },
          { id: 'favicon-generator', role: '一次产出 16 到 512 共八种尺寸的站点图标' },
          { id: 'placeholder-image', role: '任意尺寸的渐变占位图，用于骨架屏与设计稿' },
        ],
      },
      {
        label: '文本处理 ×10',
        tools: [
          {
            id: 'text-extract',
            role: '从一段文字里批量捞出手机号、邮箱、网址等',
            features: ['11 种内置类型，支持自定义正则', '按类型分组展示并自动去重，一键复制'],
          },
          {
            id: 'text-replace',
            role: '多条查找替换规则一次跑完',
            features: ['每条规则独立开关正则与大小写敏感', '支持 $1、$2 捕获组引用'],
          },
          { id: 'text-whitespace', role: '清全角空格、Tab、行首尾空白与多余空行' },
          { id: 'text-split-join', role: '按分隔符拆分与合并，可一键加单引号写 SQL' },
          { id: 'text-pad', role: '订单号补零、按列对齐到固定长度' },
          { id: 'unicode-escape', role: '中文与 \\uXXXX / U+ / %XX / HTML 实体互转' },
          { id: 'chinese-number', role: '数字转中文读法与人民币大写，也能反向解析' },
          { id: 'text-similarity', role: '编辑距离、余弦、Jaccard 三个查重指标一起给' },
          { id: 'markdown-toc', role: '提取标题生成带锚点的 Markdown 目录' },
          { id: 'lorem-ipsum', role: '中文与经典 Lorem 占位文本，随机种子可复现' },
        ],
      },
      {
        label: '开发辅助 ×10',
        tools: [
          { id: 'json-diff', role: '两份 JSON 逐字段比对，列出新增 / 删除 / 修改' },
          { id: 'json-to-typescript', role: '接口响应反推 TypeScript interface' },
          { id: 'json-flatten', role: '嵌套 JSON 展平成一层的键值，也能还原回去' },
          {
            id: 'curl-converter',
            role: '浏览器复制的 cURL 转成 fetch / Axios / Python / Go / PHP',
            features: ['自动识别请求方法、请求头与请求体', '按 Content-Type 区分 JSON 与表单'],
          },
          { id: 'chmod-calculator', role: '勾选读写执行得到权限数字与 chmod 命令' },
          { id: 'nginx-config-gen', role: '静态站、单页应用、反代、PHP、跳转五种场景配置' },
          { id: 'dockerfile-gen', role: '五种技术栈的 Dockerfile，支持多阶段与非 root' },
          { id: 'markdown-table-gen', role: 'CSV / JSON 转成对齐的 Markdown 表格' },
          { id: 'security-headers', role: 'HSTS、CSP 等八条安全响应头，六种输出格式' },
          {
            id: 'git-command-gen',
            role: '十四个 Git 常见场景的命令，按风险等级标注',
            features: ['覆盖撤销提交、同步上游、挑拣、发版等场景', '危险命令附带执行前的备份提醒'],
          },
        ],
      },
      {
        label: '文档脱敏 ×1（重点）',
        tools: [
          {
            id: 'doc-desensitize',
            role: '自动识别并打码文档里的敏感信息',
            features: [
              '识别姓名、手机号、身份证、银行卡、邮箱、住址、IP、车牌、统一社会信用代码等 13 类',
              '身份证校验位 + 银行卡 Luhn 双重校验，把误报压到最低',
              '四种打码方式：保留首尾、全部打码、换类型标签、换稳定代号（可关联分析）',
              '支持白名单、姓名识别增强与自定义正则，可导入 txt / csv / json 文件',
              '全部在浏览器本地完成，文档不上传服务器',
            ],
          },
        ],
      },
    ],
    notes: [
      '新增「图片处理」分类，工具分类数扩到 11 个',
      '好站导航细化：新增前端框架、后端与数据库、运维部署、API 调试、开源发现、数据可视化、SEO 站长、文档 PDF 共 8 个分类，收录站点突破 800 个',
      '好站导航首页改为按大类分区展示 + 关键词即时筛选，分类页增加站点搜索、精选标记、标签徽章与上下分类导航',
      '博客新增 3 篇文章，并重排正文排版（代码块、表格、图片在移动端的显示）',
      '新增 14 个 Lucide 图标，补齐图片与开发工具所需',
    ],
  },
  {
    version: '2026.09.11',
    date: '2026-09-11',
    title: '金融账与日常开销 · 12 个计算器',
    summary:
      '这一批全部对准"钱袋子和日常账"：股票交易费用、基金定投、分期真实利率、离职补偿、以及电费油费这类每月都要算的开销。共同点是——参数都取自国内实际规则，不是通用公式套壳。',
    groups: [
      {
        label: '新增工具 ×12',
        tools: [
          {
            id: 'stock-fee-calc',
            role: '算清买卖一次 A 股到底被扣了多少钱',
            features: [
              '佣金（含单笔最低 5 元）、印花税、过户费、规费逐项列明，不做打包估算',
              '买入 / 卖出双向分开测算，并给出保本卖出价参考',
            ],
          },
          {
            id: 'fund-dca-calc',
            role: '每月定投一笔，到期到底能拿到多少',
            features: [
              '按定投金额、频率、期限逐期累积，输出总投入、总收益与收益率',
              '设定预期年化即可做投前估算，适合每月 / 每周定投计划',
            ],
          },
          {
            id: 'installment-apr',
            role: '把"月费率 0.6%"还原成真实年化利率',
            features: [
              '用 IRR 口径把名义手续费率换算成真实年化，看清分期到底多贵',
              '信用卡分期、消费分期、账单分期都能套',
            ],
          },
          {
            id: 'severance-calc',
            role: '离职时到底该拿 N、N+1 还是 2N',
            features: [
              '按工作年限 × 月平均工资算出补偿月数与总额',
              '区分协商解除 / 违法解除等情形，并提示三倍社平工资封顶规则',
            ],
          },
          {
            id: 'fund-yield-convert',
            role: '万份收益和七日年化之间来回换',
            features: ['万份收益 ⇄ 七日年化双向互算', '顺手算出持有份额对应的当日实际收益'],
          },
          {
            id: 'annual-leave',
            role: '按工龄算清楚今年能休几天年假',
            features: [
              '依累计工作年限折算应休天数，满 1 年 / 10 年 / 20 年分档',
              '当年新入职按剩余日历天数比例折算',
            ],
          },
          {
            id: 'electricity-cost',
            role: '空调开一整夜到底花多少电费',
            features: [
              '按功率 × 使用时长 × 电价估算耗电量与电费',
              '日 / 月 / 年三种口径一次给出，方便比较老家电要不要换',
            ],
          },
          {
            id: 'fuel-cost',
            role: '一公里几毛钱，跑一趟要多少油钱',
            features: ['按里程、百公里油耗、油价算单次与每公里油费', '油价可自定义，跟得上调价节奏'],
          },
          {
            id: 'gold-weight-convert',
            role: '克、两、钱、盎司之间快速互换',
            features: [
              '克 / 两 / 钱 / 盎司等市面常用单位互转',
              '区分金衡盎司与常衡盎司，买卖金饰对得上数',
            ],
          },
          {
            id: 'volume-weight',
            role: '快递按抛重还是实重计费，一算就知道',
            features: [
              '按长宽高 ÷ 抛比系数算体积重量',
              '体积重与实重取大者，输出最终计费重量',
            ],
          },
          {
            id: 'running-pace',
            role: '配速、用时、距离，填两个出第三个',
            features: [
              '配速 ⇄ 用时 ⇄ 距离三向互算',
              '附 5K / 10K / 半马 / 全马预测完赛成绩',
            ],
          },
          {
            id: 'sleep-cycle',
            role: '按 90 分钟一个周期，倒推几点睡几点起',
            features: [
              '按入睡时间推起床点，或按起床时间倒推入睡点',
              '计入入睡潜伏期，给出 4 / 5 / 6 个周期的备选时刻',
            ],
          },
        ],
      },
    ],
    notes: [
      '同批次新增 51 条网址推荐，好站导航扩至 36 组 / 675 条，并补齐 {N}+ 条工具网址及 href 字段。',
      'MCP catalog 同步扩至 198 个工具元数据，AI 侧可检索的工具面同步变大。',
    ],
  },
  {
    version: '2026.09.03',
    date: '2026-09-03',
    title: '开发者工具 ×20 + 单位换算扩军 ×21',
    summary:
      '一次补齐开发者日常最常开浏览器搜的那批小工具（JWT、JSONPath、YAML 转换、UA 解析……），同时把单位换算从常用物理量铺到烘焙、尺码、纸张这类生活场景。',
    groups: [
      {
        label: '开发者小工具 ×20',
        note: '共同特点：纯浏览器本地运算，粘贴即用，不请求任何后端。',
        tools: [
          {
            id: 'jwt-generator',
            role: '自定义 Header / Payload 生成并签名 JWT',
            features: ['自由填写 Header 与 Payload，HS256 一键签名', '本地生成不联网，密钥不外传'],
          },
          {
            id: 'jsonpath',
            role: '用 JSONPath 从一坨 JSON 里精确取字段',
            features: ['支持 JSONPath 表达式实时提取', '结果即时预览，调试接口返回特别顺手'],
          },
          {
            id: 'yaml-json',
            role: 'YAML 和 JSON 在线互相转换',
            features: ['双向转换，保留嵌套结构', '支持常用数据类型与缩进格式化'],
          },
          {
            id: 'xml-json',
            role: 'XML 和 JSON 在线互相转换',
            features: ['双向转换并保留元素属性', '适合接口对接时的报文格式转换'],
          },
          {
            id: 'user-agent-parse',
            role: '解析 UA 字符串识别浏览器、系统、设备',
            features: ['输出浏览器与版本、操作系统、渲染引擎', '标注是否移动端 / 爬虫特征'],
          },
          {
            id: 'api-key-gen',
            role: '生成高强度随机密钥与 API Key',
            features: ['字符集与长度可调，支持一次生成多条', '浏览器本地随机源，不经过服务器'],
          },
          {
            id: 'hmac-gen',
            role: 'HMAC 带密钥签名计算',
            features: ['HMAC-SHA256 / 384 / 512 可选', '输出 hex 或 base64，方便对接签名校验'],
          },
          { id: 'base58', role: 'Base58 编码解码，去易混字符' },
          { id: 'csv-to-markdown', role: 'CSV 数据一键转成 Markdown 表格' },
          { id: 'html-to-markdown', role: 'HTML 片段转成 Markdown 文本' },
          { id: 'env-parser', role: '解析 dotenv 配置并校验键值' },
          { id: 'extract-links', role: '从文本或 HTML 里提取所有链接' },
          { id: 'hash-identify', role: '按长度与特征识别 md5 / sha / bcrypt 等哈希类型' },
          { id: 'loc-counter', role: '统计代码总行数、注释、空行与有效代码' },
          { id: 'port-lookup', role: '常见端口号与用途速查' },
          { id: 'punycode', role: '中文域名与 xn-- 编码互转' },
          { id: 'query-params', role: '解析、排序、去重、拼接 URL 查询参数' },
          { id: 'semver-compare', role: '语义化版本号比较与格式校验' },
          { id: 'slug-generator', role: '标题转 URL 友好 slug，中英文都支持' },
          { id: 'wcag-contrast', role: '前景 / 背景色对比度检测，对照 AA / AAA 无障碍标准' },
        ],
      },
      {
        label: '单位换算扩军 ×20',
        note: '全部支持"输入任意一侧、实时给出其余单位结果"，换算系数取自国际标准或行业惯例，单位页另附换算口诀与常见误区。',
        tools: [
          { id: 'fuel-efficiency', role: 'L/100km、km/L、mpg 燃油效率互转（非线性换算）' },
          { id: 'paper-size', role: 'A / B / C 系列、Letter、Legal 纸张尺寸互转' },
          { id: 'ring-size', role: '美码 / 港码 / 欧码 / 日码 / 中码戒指尺寸互转' },
          { id: 'hat-size', role: '各国帽子尺码互转' },
          { id: 'bra-size', role: '下围 + 罩杯，各国文胸尺码互转' },
          { id: 'baking', role: '杯 / 汤匙 / 茶匙 / 毫升 / 克 烘焙单位互转' },
          { id: 'typography', role: 'pt、px、mm、Q、pc 字号单位互转' },
          { id: 'data-binary', role: 'bit / B / KB / KiB / MB / GiB 存储容量互转' },
          { id: 'acceleration', role: 'm/s²、g、ft/s²、Gal 加速度单位互转' },
          { id: 'angular-velocity', role: 'rad/s、rpm、°/s、rps 角速度互转' },
          { id: 'density', role: 'kg/m³、g/cm³、lb/ft³ 密度单位互转' },
          { id: 'flow-rate', role: 'L/s、L/min、m³/h、gpm、cfm 流量单位互转' },
          { id: 'viscosity', role: 'Pa·s、mPa·s、cP 动力粘度互转' },
          { id: 'illuminance', role: 'lux、foot-candle、phot 光照度互转' },
          { id: 'magnetic', role: 'T、mT、μT、nT、G 磁感应强度互转' },
          { id: 'capacitance', role: 'pF、nF、μF、mF、F 电容单位互转' },
          { id: 'inductance', role: 'nH、μH、mH、H 电感单位互转' },
          { id: 'resistance', role: 'Ω、mΩ、kΩ、MΩ、GΩ 电阻单位互转' },
          { id: 'voltage', role: 'μV、mV、V、kV、MV 电压单位互转' },
          { id: 'current', role: 'μA、mA、A、kA 电流单位互转' },
        ],
      },
      {
        label: '联网工具 ×1',
        tools: [
          {
            id: 'weather',
            role: '查任意城市的实时天气与 7 天预报',
            features: ['数据源用 Open-Meteo，免费且无需申请 API Key', '支持按城市名检索，给出温度、降水、风速等要素'],
          },
        ],
      },
    ],
    notes: [
      '接入 IndexNow 主动推送，内容更新后 Bing / Yandex 可秒级感知，不用干等被动爬取。',
      '批量扩写 98 个工具的 meta description，补齐搜索摘要的完整表达。',
    ],
  },
  {
    version: '2026.09.02',
    date: '2026-09-02',
    title: '高频计算器 ×20',
    summary:
      '一次铺开 20 个日常问得最多的计算器，覆盖税务、贷款、健康、数学四块，每个都配了六段式说明文章。',
    groups: [
      {
        label: '新增工具 ×20',
        tools: [
          {
            id: 'annual-tax-settlement',
            role: '个税年度汇算，算清该补税还是退税',
            features: ['汇总综合所得与已预缴税额，试算补退金额', '支持专项附加扣除逐项填写'],
          },
          {
            id: 'car-loan',
            role: '贷款买车，算清每月还多少',
            features: ['等额本息 / 等额本金双方案对比', '输出月供、总利息与还款总额'],
          },
          {
            id: 'card-installment',
            role: '信用卡分期手续费背后藏着多少利息',
            features: ['名义手续费率换算真实年化，看清分期成本', '支持不同期数横向对比'],
          },
          {
            id: 'rental-yield',
            role: '房价和租金摆一起，算算回本要几年',
            features: ['输出租售比与静态回本年限', '可填持有成本，算净租金回报率'],
          },
          {
            id: 'stamp-duty',
            role: '选合同类型填金额，算应缴印花税',
            features: ['覆盖常见合同税目与税率', '按最新印花税法口径计算'],
          },
          {
            id: 'water-intake',
            role: '按体重算每天该喝多少水',
            features: ['按体重与活动强度给出建议饮水量', '折算成常见杯数，好执行'],
          },
          { id: 'annualized-return', role: '把任意期限的收益折算成年化收益率' },
          { id: 'body-fat', role: '美国海军法估算体脂率与分级' },
          { id: 'calorie-burn', role: '体重 × 运动类型 × 时长算热量消耗' },
          { id: 'child-height', role: '用父母身高估算孩子成年身高' },
          { id: 'clothing-size', role: '国际 / 中国 / 美码服装尺码对照' },
          { id: 'due-date', role: '末次月经推算预产期与孕周' },
          { id: 'factorial', role: '阶乘、排列数、组合数一键算' },
          { id: 'ideal-weight', role: '按身高算标准体重区间' },
          { id: 'maternity-benefit', role: '算产假期间能领多少生育津贴' },
          { id: 'medical-insurance', role: '扣掉起付线按比例算医保能报多少' },
          { id: 'profit-margin', role: '成本与售价算毛利率，也能反推定价' },
          { id: 'trigonometry', role: '输入角度，六个三角函数一次全出' },
          { id: 'variance-std', role: '一组数据算均值、方差与标准差' },
          { id: 'workdays-count', role: '起止日期之间有多少个工作日' },
        ],
      },
    ],
  },
  {
    version: '2026.08.25',
    date: '2026-08-25',
    title: '数学与生活计算器 ×21',
    summary:
      '数学基础运算与生活常识类一次补齐，同时上线广告位开关、好站导航与博客频道，站点从"工具集合"转向"有内容有导览的工具箱"。',
    groups: [
      {
        label: '新增工具 ×21',
        tools: [
          {
            id: 'combo-loan-calc',
            role: '公积金 + 商贷组合贷，月供合计多少',
            features: ['公积金与商业贷款分别计息后合并输出月供', '支持两种贷款不同年限与利率'],
          },
          {
            id: 'provident-fund-calc',
            role: '算清每月公积金缴存额',
            features: ['按缴存基数 × 单位 / 个人比例算双边月缴额', '输出年度缴存总额，方便做购房预算'],
          },
          {
            id: 'compound-interest',
            role: '利滚利与定投复利到底差多少',
            features: ['一次性复利与定期追加两种模式', '输出终值、利息总额与增长曲线参照'],
          },
          {
            id: 'inflation-calculator',
            role: '算清钱随时间的购买力变化',
            features: ['按年均通胀率折算未来 / 过去货币购买力', '对比名义金额与实际购买力'],
          },
          {
            id: 'gpa-calculator',
            role: '按学分加权算绩点',
            features: ['支持自定义绩点换算表（4.0 / 5.0 制）', '多门课程加权汇总'],
          },
          {
            id: 'menstrual-cycle',
            role: '推算排卵日与易孕窗口',
            features: ['按周期长度推算下次月经与排卵日', '标出易孕窗口区间'],
          },
          { id: 'average-calculator', role: '均值、中位数与众数一并算出' },
          { id: 'bmr-calculator', role: '算每日基础代谢与最低热量消耗' },
          { id: 'discount-calculator', role: '折扣价与到手价快速换算' },
          { id: 'fraction-calculator', role: '分数加减乘除与约分' },
          { id: 'gcd-lcm', role: '最大公约数与最小公倍数一键求' },
          { id: 'hourly-wage', role: '时薪与月薪互转' },
          { id: 'log-calculator', role: '任意底数的对数计算' },
          { id: 'permutation-combination', role: '排列数 P(n,k) 与组合数 C(n,k)' },
          { id: 'power-root', role: '任意次幂与 n 次方根' },
          { id: 'prime-factor', role: '分解质因数并判定素数' },
          { id: 'ratio-calculator', role: '比例换算与按比例分配' },
          { id: 'roman-numeral', role: '阿拉伯数字与罗马数字互转' },
          { id: 'rounding-calculator', role: '按指定小数位四舍五入' },
          { id: 'scientific-notation', role: '普通数字与科学计数法互转' },
          { id: 'shoe-size', role: '中 / 欧 / 美 / 英鞋码互转' },
        ],
      },
    ],
    notes: [
      '上线好站导航栏目，按分组收录优质站点，第三方链接统一走站内中转。',
      '新增博客频道与看板，站点定位从工具集合升级为"AI 时代的工具箱"。',
      '接入广告位并预留全局开关，站长平台验证文件同步部署。',
    ],
  },
  {
    version: '2026.08.18',
    date: '2026-08-18',
    title: '时钟工具全套 ×4',
    summary: '独立开出时钟栏目，四种形态的时钟一次做全，全部支持全屏沉浸显示，可以直接当屏保用。',
    groups: [
      {
        label: '新增工具 ×4',
        tools: [
          {
            id: 'analog-clock',
            role: '经典指针表盘',
            features: ['矢量指针表盘，走时平滑', '支持全屏沉浸，投屏也不糊'],
          },
          {
            id: 'digital-clock',
            role: '全屏大字时间显示',
            features: ['超大字时间，三米外也看得清', '全屏模式当桌面时钟用'],
          },
          {
            id: 'flip-clock',
            role: '经典翻牌动画时钟',
            features: ['秒级翻页动画，还原老式翻页钟', '适合投屏与桌面摆件场景'],
          },
          {
            id: 'world-clock',
            role: '多时区并列对照',
            features: ['同时显示多个城市当前时间', '一眼看清时差与日期跨越'],
          },
        ],
      },
    ],
    notes: ['新增时间日期模块，配套时间戳、时区、日期推算等一组工具。'],
  },
  {
    version: '2026.08.14',
    date: '2026-08-14',
    title: '中国本土计算器 ×6',
    summary:
      '这一批是差异化主场：个税、社保、年终奖、增值税、房贷、退休年龄这类"只有中国用户会搜"的计算器，海外同类站点基本不碰。',
    groups: [
      {
        label: '新增工具 ×6',
        tools: [
          {
            id: 'after-tax-salary',
            role: '税前税后双向算，到手多少一目了然',
            features: ['税前推税后、税后反推税前都支持', '含五险一金个人缴纳部分'],
          },
          {
            id: 'retirement-age',
            role: '渐进式延迟退休，算算你几岁退',
            features: ['按最新延迟退休规则逐月推算', '输出预计退休年月与需缴年限'],
          },
          {
            id: 'pension-estimate',
            role: '估算退休后每月能领多少养老金',
            features: ['按缴费年限与缴费基数估算基础养老金', '合并个人账户部分给出合计预估'],
          },
          {
            id: 'overtime-pay',
            role: '加班费该怎么算才对',
            features: ['工作日 1.5 倍、休息日 2 倍、法定节假日 3 倍分档计算', '按小时工资基数逐档试算'],
          },
          {
            id: 'deed-tax',
            role: '买房要交多少契税，提前算清楚',
            features: ['按面积与是否首套区分税率', '购房预算一次算全'],
          },
          {
            id: 'deposit-interest',
            role: '定存与大额存单到底能赚多少',
            features: ['支持整存整取与大额存单利率试算', '输出到期利息与年化收益'],
          },
        ],
      },
    ],
  },
  {
    version: '2026.08.12',
    date: '2026-08-12',
    title: '站点公开上线',
    summary:
      'MokaKit 正式公开上线：规范域名加 HTTPS、备案挂上页脚，同时把"新加一个目录就等于上线一个工具"的自动注册链路彻底跑通。',
    groups: [],
    notes: [
      '自动注册表机制确立：新增工具只需新建 src/tools/<id>/ 目录，路由、卡片、搜索索引、sitemap、JSON-LD 全部自动生成，此后每批工具的上线成本大幅下降。',
      '开站前陆续铺好的 68 个基础工具记在更早的批次里，可展开查看。',
    ],
  },
  {
    version: '2026.08.11',
    date: '2026-08-11',
    title: '中国本土计算器（第一批）×6',
    summary:
      '差异化主场的第一批：个税、社保、增值税、房贷、公积金贷、年终奖——只有国内用户会搜的那类计算器，海外同类站点基本不碰。',
    groups: [
      {
        label: '新增工具 ×6',
        tools: [
          {
            id: 'income-tax-cn',
            role: '工资个税按月试算，专项附加扣除一并算进去',
            features: [
              '按累计预扣法逐月计算，跟工资条能对上',
              '子女教育、房贷利息等专项附加扣除逐项填写后自动抵扣',
            ],
          },
          {
            id: 'bonus-tax-cn',
            role: '年终奖单独计税还是并入综合所得，哪个更省',
            features: [
              '两种计税方式并行试算，直接比出到手差额',
              '提示年终奖临界点，避开"多拿一元多缴上千"的坑',
            ],
          },
          { id: 'social-security-cn', role: '五险一金个人与单位缴纳明细' },
          { id: 'vat-calc', role: '增值税一般计税与简易计税试算' },
          { id: 'mortgage-early-repayment', role: '房贷提前还款到底能省多少利息' },
          { id: 'fund-loan-calc', role: '公积金贷款额度与月供试算' },
        ],
      },
    ],
  },
  {
    version: '2026.08.09',
    date: '2026-08-09',
    title: '时间日期工具 ×20',
    summary:
      '一批时间类工具，把日期推算、时长换算、时区转换、倒计时这几件事一次做全，后来独立成了"时间日期"栏目。',
    groups: [
      {
        label: '新增工具 ×20',
        note: '共同特点：起止日期、时长、时区三件套互相打通，跨时区开会、算工期、倒计时都能直接查。',
        tools: [
          { id: 'days-between', role: '两个日期之间差多少天' },
          { id: 'days-ago', role: '从今天倒推某个日期是几号' },
          { id: 'time-duration', role: '两个时间点之间的时长换算' },
          { id: 'hms-add', role: '时分秒加减运算' },
          { id: 'hms-to-units', role: '时分秒折成总分钟、总秒数' },
          { id: 'seconds-to-time', role: '秒数还原成时分秒' },
          { id: 'hours-from-now', role: '从现在起几小时后是几点' },
          { id: '90-day', role: '90 天规则日期推算' },
          { id: 'calendar-quarter', role: '财季与自然季度对照' },
          { id: 'weeks-pregnant', role: '按末次月经算孕周' },
          { id: 'min-age-birth', role: '按生日算最小可入职 / 入学年龄' },
          { id: 'utc-to-cst' },
          { id: 'utc-to-est' },
          { id: 'utc-to-edt' },
          { id: 'utc-to-pst' },
          { id: 'fortnight-to-hours', role: '两周折成工作小时数' },
          { id: 'weekly-hours', role: '按周统计工作时长' },
          { id: 'gov-shutdown-countdown', role: '政府机构停摆倒计时（趣味）' },
          { id: 'video-speed', role: '按倍速换算视频实际播放时长' },
          { id: 'ode-solver', role: '常微分方程数值求解' },
        ],
      },
    ],
  },
  {
    version: '2026.08.04',
    date: '2026-08-04',
    title: 'MokaKit 首发工具集 ×68',
    summary:
      '建站初期一次性铺开的底座：换算转换、文本处理、安全加密、计算工具、开发辅助几条线同时起步，全部免费免注册、在浏览器本地运行。',
    groups: [
      {
        label: '首发工具集 ×68',
        note: '这批是站点的地基，早期只写了基础说明；点进去每个工具页都有完整的六段式使用指南。',
        tools: [
          // 换算与文本
          { id: 'unit-convert' },
          { id: 'temperature-convert' },
          { id: 'currency-convert' },
          { id: 'base-converter' },
          { id: 'color-converter' },
          { id: 'text-counter' },
          { id: 'text-diff' },
          { id: 'text-dedup' },
          { id: 'text-reverse' },
          { id: 'case-converter' },
          { id: 'jian-fan-convert' },
          { id: 'line-sort' },
          { id: 'markdown-preview' },
          { id: 'json-formatter' },
          { id: 'json-to-csv' },
          { id: 'html-escape' },
          { id: 'url-encoder' },
          { id: 'url-parser' },
          { id: 'regex-tester' },
          { id: 'cron-parser' },
          { id: 'sql-formatter' },
          { id: 'http-status' },
          { id: 'timestamp-converter' },
          { id: 'uuid-generator' },
          { id: 'random-number' },
          { id: 'today-info' },
          // 安全加密
          { id: 'password-generator' },
          { id: 'password-strength' },
          { id: 'hash-calculator' },
          { id: 'base64' },
          { id: 'aes-encrypt' },
          { id: 'rsa-keygen' },
          { id: 'jwt-decoder' },
          { id: 'totp-generator' },
          { id: 'isbn-validator' },
          { id: 'udi-generator' },
          { id: 'udi-decoder' },
          // 计算
          { id: 'percentage-calculator' },
          { id: 'loan-calculator' },
          { id: 'bmi-calculator' },
          { id: 'age-calculator' },
          { id: 'date-calculator' },
          { id: 'tip-calculator' },
          { id: 'bill-split' },
          { id: 'countdown-timer' },
          // 开发辅助
          { id: 'gitignore-gen' },
          { id: 'license-gen' },
          { id: 'commit-gen' },
          { id: 'changelog-gen' },
          { id: 'mcp-config-generator' },
          { id: 'skill-generator' },
          { id: 'prompt-template' },
          { id: 'prompt-library' },
          { id: 'token-counter' },
          { id: 'ai-price-compare' },
          { id: 'dev-roadmap' },
          { id: 'build-your-own-x' },
          { id: 'public-apis' },
          { id: 'github-stars' },
          { id: 'system-design' },
          // 趣味
          { id: 'qrcode-generator' },
          { id: 'emoji-search' },
          { id: 'decision-wheel' },
          { id: 'dice-roller' },
          { id: 'lottery-draw' },
          { id: 'rock-paper-scissors' },
          { id: 'name-generator' },
          { id: 'pressure-convert' },
        ],
      },
    ],
  },
];

/** 按日期倒序排列的批次（新→旧），页面直接吃这个 */
export const RELEASES_DESC = [...RELEASES].sort((a, b) => b.date.localeCompare(a.date));

/** 全部登记过的工具 id，供校验脚本比对注册表 */
export const LOGGED_TOOL_IDS = new Set(
  RELEASES.flatMap((r) => r.groups.flatMap((g) => g.tools.map((t) => t.id))),
);

/** 统计：批次 / 工具 / 覆盖分类数由页面结合 registry 计算，这里给前两项 */
export function getChangelogTotals() {
  const toolCount = RELEASES.reduce(
    (sum, r) => sum + r.groups.reduce((s, g) => s + g.tools.length, 0),
    0,
  );
  return { releaseCount: RELEASES.length, toolCount };
}
