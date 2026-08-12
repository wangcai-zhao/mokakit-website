import type { ResourceItem, ResourceCat } from '@/tools/_shared/ResourceList';

export const CATS: ResourceCat[] = [
  { id: 'dev', name: '开发 / 测试' },
  { id: 'data', name: '数据 / 知识' },
  { id: 'ai', name: 'AI / 趣味' },
  { id: 'finance', name: '金融 / 加密' },
  { id: 'weather', name: '天气 / 地理' },
  { id: 'media', name: '影视 / 图像' },
  { id: 'space', name: '太空 / 科学' },
  { id: 'gov', name: '开放政府' },
];

export const ITEMS: ResourceItem[] = [
  // 开发 / 测试
  { name: 'JSONPlaceholder', desc: '免费假数据接口，做前端原型、联调最省事的 REST 测试源。', cat: 'dev', url: 'https://jsonplaceholder.typicode.com', tag: '测试' },
  { name: 'GitHub REST API', desc: '操作仓库、Issue、PR、用户，几乎所有开发者工具的后端。', cat: 'dev', url: 'https://docs.github.com/rest', tag: '必用' },
  { name: 'ipify', desc: '一行返回你的公网 IP，支持 JSON/IPv4/IPv6，无需 key。', cat: 'dev', url: 'https://www.ipify.org' },
  { name: 'HTTP Status Cats', desc: '用猫图解释 HTTP 状态码，调试时很解压。', cat: 'dev', url: 'https://http.cat' },

  // 数据 / 知识
  { name: 'REST Countries', desc: '国家信息全集：国旗、货币、语言、经纬度，做国际化必备。', cat: 'data', url: 'https://restcountries.com', tag: '必用' },
  { name: 'Wikipedia REST API', desc: '取维基百科词条摘要、图片、链接，知识类应用首选。', cat: 'data', url: 'https://www.mediawiki.org/wiki/API:REST_API' },
  { name: 'Wikidata', desc: '结构化知识图谱，关联人物、地点、事件，做知识图谱的起点。', cat: 'data', url: 'https://www.wikidata.org/wiki/Wikidata:Data_access' },
  { name: 'Open Library', desc: '图书元数据（ISBN、作者、封面），做书单/读书工具可用。', cat: 'data', url: 'https://openlibrary.org/developers/api' },
  { name: 'Dictionary API', desc: '英文单词释义、音标、发音，做词典/背单词 App 免费源。', cat: 'data', url: 'https://dictionaryapi.dev' },
  { name: 'Public Holidays', desc: '全球各国公共节假日，做日历/排期功能直接调。', cat: 'data', url: 'https://date.nager.at/Api' },

  // AI / 趣味
  { name: 'Agify / Genderize / Nationalize', desc: '根据名字预测年龄、性别、国籍，做用户画像 demo 很有趣。', cat: 'ai', url: 'https://agify.io' },
  { name: 'JokeAPI', desc: '分类笑话接口，做聊天机器人、彩蛋页轻松加。', cat: 'ai', url: 'https://v2.jokeapi.dev' },
  { name: 'The Cat API', desc: '随机猫图 + 品种信息，萌系项目标配。', cat: 'ai', url: 'https://thecatapi.com' },
  { name: 'Dog CEO', desc: '随机狗狗图，纯公益、零限制，做加载占位图很合适。', cat: 'ai', url: 'https://dog.ceo/dog-api' },
  { name: 'Advice Slip', desc: '随机人生建议，做每日一句小部件很合适。', cat: 'ai', url: 'https://api.adviceslip.com' },
  { name: 'Bored API', desc: '「无聊做什么」随机活动推荐，做灵感类小工具。', cat: 'ai', url: 'https://www.boredapi.com' },
  { name: 'Numbers API', desc: '数字背后的冷知识（数学/年份/日期），极客向。', cat: 'ai', url: 'http://numbersapi.com' },

  // 金融 / 加密
  { name: 'CoinGecko', desc: '加密货币价格、市值、历史，做行情看板免费额度友好。', cat: 'finance', url: 'https://www.coingecko.com/en/api', tag: '必用' },
  { name: 'ExchangeRate', desc: '实时汇率换算，做货币工具/跨境电商可用。', cat: 'finance', url: 'https://www.exchangerate-api.com' },

  // 天气 / 地理
  { name: 'Open-Meteo', desc: '免 key 的天气预报 API，温度/降水/风速一应俱全。', cat: 'weather', url: 'https://open-meteo.com', tag: '必用' },
  { name: 'OpenWeatherMap', desc: '老牌天气接口，免费档够个人项目用，文档完善。', cat: 'weather', url: 'https://openweathermap.org/api' },
  { name: 'IPinfo', desc: '根据 IP 返回地理位置、运营商、ASN，做风控/本地化。', cat: 'weather', url: 'https://ipinfo.io/developers' },

  // 影视 / 图像
  { name: 'TMDB', desc: '电影电视元数据、海报、演职员，做影视库首选（需 key）。', cat: 'media', url: 'https://developer.themoviedb.org' },
  { name: 'TVMaze', desc: '电视节目单、剧集信息，做追剧提醒可用。', cat: 'media', url: 'https://www.tvmaze.com/api' },
  { name: 'Unsplash', desc: '高质量免费图库 API，做配图/壁纸应用。', cat: 'media', url: 'https://unsplash.com/developers' },
  { name: 'Pexels', desc: '免费图片与视频素材 API，商用友好。', cat: 'media', url: 'https://www.pexels.com/api' },
  { name: 'Pokemon API', desc: '宝可梦全图鉴数据，做游戏/怀旧项目超好用。', cat: 'media', url: 'https://pokeapi.co' },

  // 太空 / 科学
  { name: 'NASA API', desc: '每日天文图、火星照片、近地天体，做科普页很惊艳（需 key）。', cat: 'space', url: 'https://api.nasa.gov' },
  { name: 'Open Notify', desc: '国际空间站实时位置、宇航员人数，做实时地图 demo。', cat: 'space', url: 'http://open-notify.org' },
  { name: 'SpaceX API', desc: '火箭发射、龙飞船数据，航天爱好者项目数据源。', cat: 'space', url: 'https://github.com/r-spacex/SpaceX-API' },

  // 开放政府
  { name: 'data.gov', desc: '美国政府开放数据门户，气候、交通、人口等海量数据集。', cat: 'gov', url: 'https://www.data.gov' },
  { name: 'World Bank Open Data', desc: '全球发展指标（GDP、贫困率等），做数据可视化。', cat: 'gov', url: 'https://data.worldbank.org' },
];
