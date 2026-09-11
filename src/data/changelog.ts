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
