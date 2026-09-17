---
title: 接口联调提速：把 curl 直接变成可用的代码
description: 浏览器里复制出来的 cURL 命令，粘贴一下就变成 fetch、Python、Go 的代码。联调时省的不只是敲键盘的时间，还有参数抄错带来的排查成本。
publishDate: 2026-09-12
tags: [开发效率, API, 工具推荐]
---

联调接口这件事，八成的时间不是在写业务代码，而是在跟参数较劲：请求头少了一个、Content-Type 写错了、body 的格式不对。明明浏览器里这个请求是通的，怎么搬到代码里就不行了？

## 一个反复出现的场景

后端同事在群里丢过来一句："这个接口你自己先调一下，我看日志。"你打开页面，F12，找到那个请求，右键"复制为 cURL"，得到这么一坨：

```bash
curl 'https://api.example.com/v1/orders?page=1&size=20' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIs...' \
  -H 'Content-Type: application/json' \
  -H 'Referer: https://admin.example.com/' \
  --data-raw '{"status":"pending","dateFrom":"2026-09-01"}'
```

然后你开始手敲对应的 fetch。这一步就是事故高发区：Bearer 后面那个 token 长得离谱，手动复制容易截断；`--data-raw` 里的 JSON 要手动转成 JS 对象；三个 header 里有一个是浏览器自动加的、其实后端不看，你不知道该不该留。

敲完一跑，401。然后花二十分钟排查，最后发现是 token 复制的时候少了一个字符。

## 换个顺序：先转换，再改

我现在的做法是把这段命令直接丢进 [curl 命令转换](/tools/curl-converter/) ，选目标语言，拿到这段：

```js
const res = await fetch('https://api.example.com/v1/orders?page=1&size=20', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...',
    'Content-Type': 'application/json',
    'Referer': 'https://admin.example.com/',
  },
  body: JSON.stringify({ status: 'pending', dateFrom: '2026-09-01' }),
});
const data = await res.json();
```

参数一个不差，格式也都对。接下来要做的是删掉那个多余的 Referer，而不是从头把 token 敲一遍。**把"容易出错的手工活"换成"不容易出错的删减活"**——这才是提效的关键，省下的不只是敲键盘的时间。

同样一份命令切到 Python：

```python
import requests

resp = requests.request(
    'POST',
    'https://api.example.com/v1/orders?page=1&size=20',
    headers={
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...',
        'Content-Type': 'application/json',
    },
    json={'status': 'pending', 'dateFrom': '2026-09-01'},
    timeout=10,
)
resp.raise_for_status()
print(resp.json())
```

注意到 `json=` 而不是 `data=` 了吗？转换器是看 `Content-Type` 里有没有 `application/json` 来决定用哪个参数的。要是请求体是表单格式，它会换成 `data=` 并把字符串解析成字典。这种细节手动写的时候最容易搞混。

## 拿到响应之后：类型从哪来

接口调通了，接下来要给响应写 TypeScript 类型。两百个字段的接口，手写一遍能写到你怀疑人生。

[JSON 转 TypeScript](/tools/json-to-typescript/) 的思路就是拿真实响应反推：

```ts
export interface OrderItem {
  sku: string;
  qty: number;
  price: number;
}

export interface Root {
  total: number;
  items: OrderItem[];
  hasMore: boolean;
}
```

嵌套对象会被拆成独立的子接口，子接口排在前面、根类型压在最后，读的时候不用上下跳。

但要清醒，反推出来的类型只覆盖这次响应里出现的字段。两个必须人工补的地方：

1. **同一个字段可能返回 null。** 样例里是 `string`，线上偶尔来个 `null`，类型就得改成 `string | null`
2. **空数组推断不出元素类型。** 只能给 `unknown[]`，必须手动改成具体类型

## 接口改版时：先比再改

后端说"我改了个字段，你这边看下"。最怕的是他说的和实际改的不是一个东西。

[JSON 对比](/tools/json-diff/) 把新旧两份响应贴进去，差异会以表格列出来：

| 类型 | 路径 | 左侧 | 右侧 |
| --- | --- | --- | --- |
| 修改 | `version` | `"0.9.11"` | `"0.9.12"` |
| 新增 | `tags[2]` | — | `"mcp"` |
| 删除 | `debug` | `true` | — |

路径用的是 `a.b[0].c` 这种写法，能直接定位到数据里的位置。比人肉扫 JSON 快，也不会漏。

有个要注意的地方：数组是**按下标比对**的。如果在数组中间插了一个元素，后面所有元素都会显示成"修改"，看起来像全变了。这种场景先排个序再比，结果会清爽很多。

## 扁平化的用处

还有个不太起眼但挺顺手的工具。[JSON 扁平化](/tools/json-flatten/) 把嵌套结构展平：

```json
{ "user.name": "张三", "user.age": 30, "tags.0": "a", "tags.1": "b" }
```

两种典型用法：一是把接口数据塞进表格或 CSV 导出，一层键就是一列；二是做 PATCH 请求时只想改 `user.name` 这一个字段，扁平键表达起来最直接。

还原的时候数字键会自动拼回数组，所以 `tags.0` 和 `tags.1` 能变回 `["a", "b"]`。唯一要小心的是键名里如果本身带分隔符，来回转换会有歧义，换个不冲突的符号就行。

## 这套流程省了什么

算一笔账：手工敲一遍请求参数大概 5 分钟，其中出错的概率不低，出错后排查平均 15 分钟。一个接口联调来回三四次，就是一小时上下。

转换工具把"敲"这一步压到 10 秒，而且几乎不会出错。真正的收益不在速度，在于**你不用再把注意力花在复制粘贴上**，可以全部放在业务逻辑上。

顺带说一句，这几个工具都跑在浏览器本地，请求里的 token、响应里的真实数据都不会被上传。涉及生产环境的接口数据时，这点还是挺重要的。
