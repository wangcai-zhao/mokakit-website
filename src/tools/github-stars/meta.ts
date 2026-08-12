import { defineTool } from '@/tools/types';
import { DIMS, reposOfDim, CAPTURED_AT } from './data';
import { LANG_DIMS, langSlug } from './extend';

export default defineTool({
  id: 'github-stars',
  name: 'GitHub 高星项目榜',
  tagline: '按 star 排行的开源项目速查',
  description:
    '免费在线 GitHub 高星开源项目榜单，收录 500+ 个 star 数领先的仓库，覆盖 AI 大模型、智能体 Agent、RAG 知识库、AI 绘画、机器学习、自托管服务、开发者工具、Awesome 清单、前端框架、命令行神器等 15 个方向，支持按 star 数、活跃度、编程语言筛选与关键词搜索，可收藏对比，数据本地渲染、打开即用。',
  keywords: ['GitHub高星项目', 'GitHub排行榜', '开源项目推荐', 'star排行', 'AI开源项目'],
  category: 'dev',
  tags: ['github', '开源', '排行榜', 'ai', '开发', '导航'],
  icon: 'star',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 9,
  faq: [
    {
      q: '榜单数据是实时的吗？',
      a: `不是实时。数据通过 GitHub 官方 Search API 按 star 降序批量采集，当前快照采集于 ${CAPTURED_AT}。star 数每天都在变化，页面展示的是采集时刻的数值，精确数字请以 GitHub 仓库页为准。`,
    },
    {
      q: '为什么有些知名项目没在榜上？',
      a: '榜单按 15 个主题维度分别采集，每个维度有 star 门槛与条数上限，且已自动排除标记为「已归档（archived）」的仓库。若某项目没打上对应的 topic 标签，就可能不在采集范围内。这是精选榜而非全量索引。',
    },
    {
      q: 'star 数高就代表项目好用吗？',
      a: '不完全是。star 更接近「知名度」而非「质量」，教程类、清单类仓库天然容易攒 star。建议同时看「最后更新时间」——本工具提供活跃度筛选，可以只看近半年或近一年有更新的项目，避免踩到已停止维护的坑。',
    },
    {
      q: '收藏的项目会上传到服务器吗？',
      a: '不会。收藏只保存在你自己浏览器的 localStorage 里，不经过任何服务器，换设备或清理浏览器数据后会丢失。需要长期保存请用导出功能生成 Markdown 清单。',
    },
  ],
  related: ['ai-price-compare', 'skill-generator', 'mcp-config-generator', 'json-formatter'],

  /**
   * 长尾子页：每个采集维度一页，如 /tools/github-stars/ai-llm/
   * 目标词是「AI 大模型开源项目排行」这类竞争低、意图明确的组合。
   */
  subpages: () => {
    const dimPages = DIMS.map((d) => {
      const top = reposOfDim(d.id, 3)
        .map((r) => r.n)
        .join('、');
      const count = reposOfDim(d.id).length;
      return {
        slug: d.id,
        title: `${d.name}开源项目排行`,
        description: `${d.name}方向 star 数最高的 ${count} 个 GitHub 开源项目排行榜，包含 ${top} 等热门仓库。${d.intro}，支持按 star 数、活跃度与编程语言筛选，数据采集于 ${CAPTURED_AT}。`,
        data: { dimId: d.id, dimName: d.name, dimIntro: d.intro },
        faq: [
          {
            q: `${d.name}方向最值得关注的项目是哪个？`,
            a: `按 star 数排序，当前榜首是 ${reposOfDim(d.id, 1)[0]?.n || '—'}。不过 star 高低只代表知名度，选型时建议结合项目的最后更新时间、issue 响应速度和自己的技术栈综合判断。`,
          },
          {
            q: '这个榜单多久更新一次？',
            a: `榜单为人工触发的快照式采集，当前数据采集于 ${CAPTURED_AT}。开源项目的 star 数每日变动，排名可能与你访问 GitHub 时略有出入。`,
          },
        ],
      };
    });

    // ── 第②波延伸：计算型维度（不依赖采集脚本，复用同一份 526 仓数据）──
    const extra = (() => {
      const trending = {
        slug: 'trending',
        title: 'GitHub 近期活跃开源项目榜',
        description: `还在持续维护的 GitHub 开源项目排行榜：按最后提交时间筛选近一年有更新的仓库，按 star 数从高到低排列。避开已停止维护的「僵尸项目」，找到真正值得长期关注的技术栈，数据采集于 ${CAPTURED_AT}。`,
        data: { kind: 'trending', dimName: '近期活跃', dimIntro: '筛选近一年仍有提交的开源项目，按最后更新时间排序' },
        faq: [
          {
            q: '为什么要看「近期活跃」而不是单纯按 star 排？',
            a: 'star 高的项目可能早已停止维护（例如一些经典但冻结的教程库）。按最后提交时间筛选，能帮你避开接进去才发现作者已跑路的坑，尤其适合选基础依赖。',
          },
          {
            q: '这个榜单多久更新一次？',
            a: `榜单为人工触发的快照式采集，当前数据采集于 ${CAPTURED_AT}。项目活跃度每天都在变，最新状态请以 GitHub 仓库页的提交记录为准。`,
          },
        ],
      };
      const langs = LANG_DIMS.map((ld) => ({
        slug: langSlug(ld.lang),
        title: `${ld.name} 开源项目排行`,
        description: `GitHub 上 ${ld.name} 语言 star 数最高的开源项目排行榜，共收录 ${ld.count} 个 ${ld.name} 仓库，按 star 从高到低排列。无论是想学 ${ld.name}、找 ${ld.name} 轮子，还是评估 ${ld.name} 生态，这份榜单都能快速定位头部项目，数据采集于 ${CAPTURED_AT}。`,
        data: { kind: 'lang', lang: ld.lang, dimName: ld.name, dimIntro: `按主语言筛选出的 ${ld.name} 开源项目` },
        faq: [
          {
            q: `${ld.name} 方向最值得关注的项目是哪个？`,
            a: `按 star 数排序，${ld.name} 榜首项目可以在上方列表中查看。选型时除了 star，也建议看最后更新时间和 issue 响应速度。`,
          },
          {
            q: '这个榜单多久更新一次？',
            a: `榜单为人工触发的快照式采集，当前数据采集于 ${CAPTURED_AT}。开源项目的 star 数每日变动，排名可能略有出入。`,
          },
        ],
      }));
      return [trending, ...langs];
    })();

    return dimPages.concat(extra);
  },
});
