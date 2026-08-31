---
title: "个税社保算不明白，我让 AI 直接调计算器"
description: "换工作算不清每月到手？我用 WorkBuddy 直接调 MokaKit 的个税、社保、年终奖计算器，30 秒出数，还顺手排了两个报税坑。"
publishDate: 2026-09-01
tags: ["个税计算", "社保公积金", "WorkBuddy MCP", "AI 调工具"]
draft: true
series: "WorkBuddy 使用技巧"
order: 5
difficulty: 入门
relatedTools:
  - income-tax-cn
  - social-security-cn
  - bonus-tax-cn
author: 旺财先生
featured: false
showInvite: true
---

## 我遇到的具体问题

上上个月换工作谈薪，hr 丢给我一串数字：「税前 28k，13 薪，公积金按 12% 顶格交」。我愣是算不出每月到手多少。网上的个税计算器要么要注册，要么专项附加扣除那堆选项看得我头大。我拿手机计算器按了一晚上，个税、社保、公积金三项来回减，最后得出三个不同的结果，越算越心虚——怕 hr 说的「到手两万出头」是我自己算错了，谈薪时不敢还价。

## 为什么这事值得自动化

工资变动不是一次性的。每年调薪、发年终奖、公积金基数七月重算，一年少说要算三四回。手动算一次保守 40 分钟还容易错，一年就是两个多小时，更糟的是错的结果会直接影响你谈薪和做预算的底气。让 AI 直接调计算器，30 秒出数，比赌自己手算靠谱。

## 我是怎么用 WorkBuddy 做的

我直接跟 WorkBuddy 说：「按北京，税前月薪 28000，13 薪，公积金 12%，有房贷利息和赡养 60 岁父母两项专项附加扣除，算我每月到手和全年个税。」WorkBuddy 接的是 MokaKit 的计算器（走 MCP），它分三步调了三个工具：

- [/tools/income-tax-cn/](/tools/income-tax-cn/) 算综合所得个税
- [/tools/social-security-cn/](/tools/social-security-cn/) 算社保 + 公积金个人部分
- [/tools/bonus-tax-cn/](/tools/bonus-tax-cn/) 单独把第 13 薪那个月拆出来，按年终奖逻辑核算

最后它把「税前 − 社保公积金 − 个税」一减，给我一个月到手数和一张全年拆解表。我第一次看到数字时确认了：到手确实在 hr 说的区间里，心里一下踏实了。

## 中间卡在哪 & 怎么绕过去

第一回跑直接报了错：`tool mokakit_income_tax_cn not found`。我把聊天记录翻出来才反应过来——MokaKit 的 MCP Server 我压根没在 WorkBuddy 里启用。去连接面板把 mokakit 那个 MCP 打开、信任一次，再问就通了。

第二个坑是参数：我开头只扔了「月薪 28000」，AI 调 income-tax-cn 返了个几乎为 0 的个税。我以为是工具坏了，后来才看懂——个税是累计预扣，单看某个月没意义，得告诉它「全年工资 + 专项附加扣除总额」。把年度口径补全后，数字立刻合理了。这也提醒我：AI 调计算器不是甩个数就行，口径得说清。

## 顺带的几个发现

本来只想算到手，结果顺手把两件一直拖着的事办了：

- 用 [/tools/bonus-tax-cn/](/tools/bonus-tax-cn/) 把 13 薪按「年终奖单独计税」和「并入综合所得」两种方式各算一遍，发现这档收入单独计税更省，明年报税能少交一笔。
- 用 [/tools/social-security-cn/](/tools/social-security-cn/) 看了公积金按 12% 顶格交后的个人 + 公司总缴存额，才发现公司那部分每月比我想的多，等于一笔隐性涨薪。

## 你也可以这样用

把这句话存成自己的模板，改数字就能用：「按 <城市>，税前月薪 <X>，<N> 薪，公积金 <比例>%，专项附加扣除有 <项目>，算每月到手和全年个税，分别调 income-tax-cn / social-security-cn / bonus-tax-cn。」年底报税前跑一遍，比临时搜计算器稳。

## 常见问题

**Q：AI 调出来的数和个税 App 对不上怎么办？**
多半是口径差。个税 App 是累计预扣的实时数，MokaKit 是按你给的年度参数静态算的，两者在年中会差一点，年底汇算清缴时才完全对齐。

**Q：MokaKit 计算器需要联网吗？**
工具本身跑在 mokakit.com，WorkBuddy 通过 MCP 调用，所以 AI 侧需要能连上 MokaKit 的 MCP Server。

**Q：自由职业 / 劳务报酬也能算吗？**
这套工具主要覆盖工资薪金和年终奖。劳务报酬税率结构不同，目前 income-tax-cn 没有单独建模，别硬套。

**Q：算错了谁负责？**
计算器给的是估算，报税以税务系统为准。涉及金额大的决策，拿结果去 App 复核一遍再动。
