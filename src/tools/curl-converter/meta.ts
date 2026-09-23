import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'curl-converter',
  name: 'curl 命令转换',
  tagline: 'curl 转各语言代码',
  description:
    '免费在线 curl 命令转换工具，把浏览器「复制为 cURL」得到的命令一键转成 JavaScript fetch、Axios、Python requests、Go、PHP cURL 五种代码，自动识别请求方法、请求头与请求体。本地解析不上传。',
  keywords: ['curl 转代码', 'cURL 转换', 'curl to fetch', 'curl 转 Python', '接口调试'],
  category: 'dev',
  tags: ['curl', 'HTTP', '代码生成'],
  icon: 'terminal',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 8,
  faq: [
    {
      q: '支持哪些 curl 参数？',
      a: '支持 -X / -H / -d / --data-raw / -u / -A / -F 等常见参数。不支持 cookie jar、证书指定等复杂用法，遇到解析不对的地方手动改一下即可。',
    },
    {
      q: '请求体是 JSON 还是表单怎么判断？',
      a: '看 Content-Type 请求头：带 application/json 就按 JSON 处理，带 x-www-form-urlencoded 就解析成表单键值对。',
    },
    {
      q: '复制的命令带反斜杠换行能识别吗？',
      a: '能。工具会先把命令里的续行符和引号处理好再解析，浏览器复制出来的多行命令可以直接粘。',
    },
  ],
  related: ['http-status', 'json-formatter'],
});
