import os, re

BASE = "src/tools"
# 20 个生成批：第2段原为「## 什么是...」，归一成标准六段式「## 这个工具能做什么」
IDS = [
  "90-day", "calendar-quarter", "days-ago", "days-between", "fortnight-to-hours",
  "gov-shutdown-countdown", "hms-add", "hms-to-units", "hours-from-now",
  "min-age-birth", "seconds-to-time", "time-duration", "utc-to-cst", "utc-to-edt",
  "utc-to-est", "utc-to-pst", "video-speed", "weekly-hours", "weeks-pregnant",
  "pressure-convert",
]

ok, skip = [], []
for tid in IDS:
    p = os.path.join(BASE, tid, "content.mdx")
    if not os.path.isfile(p):
        skip.append((tid, "no file"))
        continue
    with open(p, encoding="utf-8") as f:
        lines = f.readlines()
    out, done = [], False
    for line in lines:
        if not done and line.startswith("## 什么是"):
            out.append("## 这个工具能做什么\n")
            done = True
        else:
            out.append(line)
    if done:
        with open(p, "w", encoding="utf-8") as f:
            f.writelines(out)
        ok.append(tid)
    else:
        skip.append((tid, "no ## 什么是"))

print(f"已归一化 {len(ok)} 个：")
for t in ok:
    print("  +", t)
if skip:
    print(f"跳过 {len(skip)} 个：")
    for t, r in skip:
        print("  -", t, r)
