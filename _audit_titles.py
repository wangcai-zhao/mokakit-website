import re, glob, os, statistics

rows = []
for f in glob.glob('src/tools/*/meta.ts'):
    s = open(f, encoding='utf-8').read()
    n = re.search(r"^  name: '(.+?)',", s, re.M)
    t = re.search(r"^  tagline: '(.+?)',", s, re.M)
    if n:
        name = n.group(1)
        tag = t.group(1) if t else ''
        # ToolLayout: title = `${name} - ${tagline}`，BaseLayout 再拼 ' | 摩卡工具箱'
        full = f'{name} - {tag}' if tag else name
        final = f'{full} | 摩卡工具箱'
        rows.append((os.path.basename(os.path.dirname(f)), name, tag, full, len(final)))

rows.sort(key=lambda x: x[4])
lens = [r[4] for r in rows]

print(f'总工具: {len(rows)}')
print(f'最终 <title> 平均: {statistics.mean(lens):.1f} 字符')
print(f'中位数: {statistics.median(lens):.0f}  最短: {min(lens)}  最长: {max(lens)}')

print('\n--- 长度分布（中文 1 字约等于 2 英文字符宽度，Google 显示上限约 600px）---')
for th in (14, 16, 18, 20, 25, 30):
    n = len([r for r in rows if r[4] < th])
    print(f'  < {th} 字符: {n:>3} 个 ({n / len(rows) * 100:.0f}%)')

print('\n--- 最短 12 个（P2 候选）---')
for r in rows[:12]:
    print(f'  {r[4]:>2}ch  {r[3]}  [{r[0]}]')

print('\n--- 最长 5 个（可能被截断）---')
for r in rows[-5:]:
    print(f'  {r[4]:>2}ch  {r[3]}  [{r[0]}]')

missing = [r for r in rows if not r[2]]
print(f'\n缺 tagline 的工具: {len(missing)} 个')
for r in missing[:10]:
    print(f'  {r[1]}  [{r[0]}]')
