import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'license-gen',
  name: '开源协议选择器',
  tagline: '问答推荐 + 一键生成 LICENSE',
  description:
    '免费在线开源协议（License）选择器：回答三个问题即可获得推荐（MIT / Apache-2.0 / GPL / AGPL / BSD / MPL / ISC / Unlicense），也可直接浏览 10 种主流协议全文，自动替换年份与版权所有者，一键复制或下载 LICENSE 文件。纯本地运行，不收集任何数据。',
  keywords: ['开源协议', 'License选择器', '许可证生成', 'MIT', 'GPL', 'Apache', '开源协议怎么选'],
  category: 'dev',
  tags: ['license', '开源', '法律', '协议'],
  icon: 'scale',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 7,
  faq: [
    {
      q: '我该选哪个开源协议？',
      a: '想要最自由、允许闭源商用，选 MIT 或 Apache-2.0（Apache 额外给你专利授权保护）；只是想放弃版权、最大程度开放，选 The Unlicense 或 ISC；希望别人用你的库时也必须开源，选 LGPL / MPL（弱 Copyleft）；希望所有衍生作品都开源，选 GPL / AGPL（强 Copyleft）。本工具的「帮我选」会按你的需求直接推荐。',
    },
    {
      q: 'MIT 和 Apache-2.0 有什么区别？',
      a: '两者都允许闭源商用、修改和再分发。主要区别是 Apache-2.0 明确包含了专利授权条款：贡献者授予你使用其专利的权利，且如果你发起专利诉讼，授权会终止；MIT 没有专门提专利。企业项目常偏好 Apache-2.0 以降低专利风险。',
    },
    {
      q: 'GPL / AGPL 是不是不能商用？',
      a: '能商用，但有条件：基于 GPL 代码的衍生作品必须以 GPL 开源（强 Copyleft）。AGPL 更进一步——哪怕你只通过网页提供服务、不分发二进制，也必须开源。这对纯做 SaaS 的服务端代码影响较大，选之前要评估。',
    },
    {
      q: '生成的 LICENSE 文件怎么用？',
      a: '把年份与版权所有者替换好（工具已自动替换），下载后放到仓库根目录，文件名就是 LICENSE（无扩展名）。建议在 README 顶部也标明协议，例如「Licensed under MIT」。',
    },
  ],
  related: ['github-stars', 'gitignore-gen', 'json-formatter', 'case-converter'],
});
