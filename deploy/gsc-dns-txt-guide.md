# MokaKit 站长平台验证 + sitemap 提交指南

> 目的：让 Google / Bing 抓取 mokakit.com 全部 533 页（含 12 篇 tips + 51 条新增网址），提升收录与流量。
> 当前状态（2026-09-11）：站点 dist 已就绪（533 页 / sitemap 528 URL），只差两步控制台操作 + 一条 DNS 记录。

---

## 一、Google Search Console（GSC）验证

### 1. 加 DNS TXT 记录（在 DNSPod 控制台）

记录值（已确定，直接复制）：

```
google-site-verification=Jdq425qhDTUKyXMl00HefI7AYGuyQX2Ce821cTkMtcg
```

DNSPod 操作步骤（5 步）：

1. 打开 https://www.dnspod.cn/ 并登录（mokakit.com 的 NS 是 `eleanor` / `word.dnspod.net`，域名解析在 DNSPod 管理，不在腾讯云域名注册台）。
2. 左侧「域名解析」→ 点击 `mokakit.com` 进入解析记录列表。
3. 点「添加记录」：
   - 主机记录：`@`（或留空，表示根域名）
   - 记录类型：`TXT`
   - 线路类型：默认
   - 记录值：粘贴上面那串 `google-site-verification=...`
   - TTL：默认（600 秒）
4. 保存。
5. 等 5~30 分钟（TXT 全球生效），可用 `nslookup -type=TXT mokakit.com` 或 https://dnschecker.org 验证是否出现该记录。

### 2. 在 GSC 完成验证

1. 打开 https://search.google.com/search-console → 「添加资源」→ 选「网域」(Domain) → 填 `mokakit.com`。
2. GSC 会要求你粘贴上面那条 TXT 记录（我们已经加了，直接点「验证」）。
3. 显示「所有权已验证」即成功。

### 3. 提交 sitemap

1. 左侧「站点地图 (Sitemaps)」→ 输入 `sitemap-index.xml` → 提交。
2. 线上地址：https://www.mokakit.com/sitemap-index.xml （已上线，可通过 301/HTTPS 访问）。
3. 通常 1~3 天开始抓取，GSC 里能看到「已发现的网址」数量增长。

---

## 二、Bing Webmaster Tools 验证

Bing 用文件验证，文件**已部署到生产根目录**，线上可访问：

```
https://www.mokakit.com/F0f48757FB174b5b9b5c87940b29d6CF.txt
```

操作步骤：

1. 打开 https://www.bing.com/webmasters → 添加 `mokakit.com`。
2. 验证方式选「XML 文件」→ 因文件已在站点根目录，点「验证」会通过。
3. 验证后在「站点地图」里提交 `https://www.mokakit.com/sitemap-index.xml`。
4. Bing 通常 1~7 天开始抓取。

---

## 三、验证清单（上线后自查）

- [ ] `nslookup -type=TXT mokakit.com` 能看到 `google-site-verification=Jdq425qh...`
- [ ] GSC 显示 mokakit.com「所有权已验证」
- [ ] GSC 已提交 `sitemap-index.xml`，状态「成功」
- [ ] Bing 文件验证通过，已提交 sitemap
- [ ] 浏览器访问 https://www.mokakit.com/F0f48757FB174b5b9b5c87940b29d6CF.txt 返回 200

---

## 四、注意

- 不要删 `public/F0f48757FB174b5b9b5c87940b29d6CF.txt`，否则 Bing 验证失效。
- GSC「网域」级验证对 www / 裸域 / http(s) 全生效，一次搞定。
- 站点若换服务器 / 重签证书，不影响 DNS TXT 与 sitemap 验证。
