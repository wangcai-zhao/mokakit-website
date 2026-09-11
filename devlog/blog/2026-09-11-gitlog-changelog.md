---
title: 让开发日志自己写自己：从 git log 生成 changelog 的笨办法
date: 2026-09-11
draft: true
---

MokaKit 每周得出一份"开发日志"——这周新增了啥、优化了啥、修了啥。一开始老老实实手写，后来实在懒，写了个 gen-changelog.mjs，直接从 git log 抽。

数据源就是 git log。取最近 30 天窗口，把 commit 整理成 Astro content collection 的 md 草稿，个人站首页「MokaKit 周更」那 4 列卡直接吃这份数据。实测 30 天里 27 条提交正常生成，链路是通的：MokaKit 仓库提交 → 个人站 changelog 草稿 → 首页展示，一处提交两处可见。

为什么不用现成的 changelog 生成器？网上一堆，但我的提交信息不规范，有时候就写个 "fix"，现成工具分不出"新增/优化/修复"。所以干脆只抽原始 commit 加日期，归类的活以后再说——至少数据不丢，不会哪周漏记。

踩了两个坑。一是生成的 md 默认 draft: true，忘了改就一直不发布，现在还堆着没上线。二是占位域名护栏：构建完扫 sitemap / canonical / og，只要出现 example.com 就中止部署。但 url-parser 那个工具的演示值里本来就写着 example.com，属于正常内容，不能误杀，所以只校验站点级域名，工具内部的 example.com 放过去。

笨办法胜在稳。提交记录不会骗人，懒人只要保证 commit message 别太水，周更就有得写。真要精致分类，那是下一步的事。
