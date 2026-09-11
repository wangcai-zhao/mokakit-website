---
title: 部署一条龙：原子切换、占位域名护栏与 IndexNow
date: 2026-09-11
draft: true
---

mokakit 的部署靠 deploy/deploy.sh 一把梭。踩过几次坑之后，现在这套还算顺，关键是三件事：能回滚、不会把占位域名发出去、搜得到。

流程是原子切换。本地 npm run build，把 dist 打成 tar 传服务器上的 .new 目录，先校验里面有 index.html（没有就中止，绝不覆盖线上），再用 mv 整体替换。上一版留 /var/www/mokakit.old，出问题一条命令回滚。不会出现"传到一半崩了留半个站"的情况。

占位域名护栏是上线前最后一道保险。构建完扫 sitemap、canonical、og 标签，只要冒出 example.com 就 exit 1。曾经有个工具的演示值写死 example.com，差点把全站 canonical 带歪成占位域名。现在只校验站点级域名引用，工具内部的 example.com 不误杀——否则 url-parser 这种正常内容会被错杀。

Windows 这边的坑也得处理。本地 Git Bash 跑脚本，文件是 CRLF 换行，传上去 Linux 报 bad interpreter，所以上传后 sed -i 's/\r$//' 统一转掉。还有 .astro 目录偶尔被文件监视器锁住，rm 清不掉——本机"安全删除"策略拦 rm 也不中断，Astro 会自己重建，跳过清理不影响产物。

部署完主动推 IndexNow 给 Bing/Yandex，让它们秒级来爬，不用等被动发现。推失败也不阻断部署，只打警告，搜索引擎自己也能兜底发现。

今早 02:41 又跑了一轮，dist 02:58 落盘。这次没提交 git，真要回滚还是靠 /var/www/mokakit.old。部署这东西，护栏比花活重要。
