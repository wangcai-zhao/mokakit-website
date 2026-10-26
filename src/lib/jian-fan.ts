/**
 * 简繁转换纯函数层（与财金 lib 同规范：无 DOM 依赖，可被 MCP 侧复用）。
 *
 * 数据修复记录（2026-10-25，相对组件内旧版 PAIRS）：
 * - 删除末尾脏项「处境」（曾把「处」的映射覆盖为「境」，导致「处理」→「境理」）
 * - 删除重复项：图/网/够 各出现两次
 * - 一简对多繁默认映射修正：发→發（原被发髮覆盖为髮）、干→幹（原被乾干覆盖为乾）、
 *   删除 回迴（回本就能映射回自身）、脏→髒（原被脏臟覆盖为臟，配合词组表处理骯髒/脏乱）
 * - f2j 反向表改为「先到先得」（按 PAIRS 出现序，跳过已占位繁体字），杜绝后项覆盖前项
 *
 * 转换策略参考 opencc-js（nk2028/opencc-js，MIT；捆绑词典数据 Apache-2.0）：
 * ① 词组最长匹配优先于字级；② 地区档位划分（通用/台湾/香港）。
 * 本文件为自建精简词库，非 OpenCC 词典全集。
 */

export type Region = 'generic' | 'tw' | 'hk';
export type Direction = 'j2f' | 'f2j';

/** 单字对照表（简|繁）。一简对多繁的字只保留默认映射，歧义交由词组表处理 */
const PAIRS =
  '国國|图圖|书書|东東|车車|马馬|鸟鳥|鱼魚|龙龍|来來|类類|历歷|处處|务務|动動|执執|报報|变變|实實|审審|学學|觉覺|门門|问問|间間|闻聞|闭閉|开開|关關|见見|观觀|视視|话話|说說|读讀|课課|谁誰|谈談|谢謝|应應|对對|导導|寻尋|寿壽|将將|尔爾|当當|录錄|梦夢|尽盡|责責|备備|复復|够夠|杀殺|杂雜|机機|权權|杨楊|头頭|买買|卖賣|红紅|纸紙|终終|线線|练練|经經|统統|继繼|续續|维維|织織|绿綠|乡鄉|县縣|里裡|体體|宝寶|写寫|长長|远遠|进進|过過|运運|还還|这這|那那|个個|们們|从從|众眾|护護|欢歡|环環|现現|认認|识識|让讓|议議|许許|论論|设設|访訪|译譯|词詞|诗詩|诚誠|试試|语語|误誤|调調|财財|贤賢|质質|购購|贸貿|费費|贺賀|贼賊|赚賺|软軟|轻輕|转轉|轮輪|辞辭|辩辯|边邊|达達|迁遷|选選|适適|遗遺|邮郵|郑鄭|与與|络絡|闪閃|闲閒|闷悶|闸閘|闹鬧|阅閱|阵陣|陈陳|陆陸|阳陽|阴陰|阶階|际際|难難|虽雖|离離|云雲|电電|页頁|项項|顺順|须須|顾顧|顿頓|领領|题題|颜顏|风風|飞飛|饥飢|饭飯|饮飲|饰飾|养養|饿餓|馆館|驰馳|驱驅|驳駁|驴驢|驻駐|骗騙|惊驚|验驗|骤驟|鲁魯|鲜鮮|鸡雞|鸭鴨|鹅鵝|鸣鳴|鹊鵲|鹰鷹|麦麥|黄黃|齐齊|齿齒|龟龜|点點|热熱|爱愛|亲親|厅廳|师師|归歸|币幣|参參|双雙|发發|干幹|肃肅|蚕蠶|蛮蠻|虫蟲|虾蝦|蚁蟻|蝇蠅|钟鐘|钢鋼|铁鐵|铜銅|银銀|锡錫|铅鉛|铝鋁|针針|钉釘|钓釣|钩鈎|钱錢|钞鈔|钻鑽|锦錦|镇鎮|镜鏡|闰閏|润潤|阔闊|阁閣|网網|罗羅|罚罰|罢罷|伞傘|伤傷|价價|伦倫|伪偽|伟偉|传傳|优優|佣傭|侦偵|债債|偿償|储儲|凤鳳|鸦鴉|鸳鴦|鸽鴿|鸿鴻|鹏鵬|鹤鶴|鹂鸝|脏髒|脑腦|胶膠|脚腳|腊臘|脉脈|肤膚|胜勝|叶葉|号號|亏虧|医醫|盐鹽|稳穩|猪豬|献獻|劝勸|办辦|帮幫|围圍|园園|团團|坏壞|块塊|声聲|壳殼';

/** 通用档词组表（简|繁）：歧义字与地区词的兜底 */
const PHRASES_GENERIC =
  '干净|乾淨|干燥|乾燥|干杯|乾杯|发展|發展|头发|頭髮|软件|軟件|回复|回覆|计算机|計算機|公里|公里|肮脏|骯髒|脏乱|髒亂|里面|裡面|心里|心裡|之后|之後';

/** 台湾档词组表（在通用档之上叠加） */
const PHRASES_TW =
  '软件|軟體|信息|資訊|鼠标|滑鼠|计算机|電腦|网络|網路|数据|資料|质量|品質|程序|程式|网站|網站|打印机|印表機|硬盘|硬碟';

/** 香港档词组表（在通用档之上叠加） */
const PHRASES_HK =
  '软件|軟件|鼠标|滑鼠|计算机|電腦|网络|網絡|数据|數據|质量|質量';

function buildCharMap(): { j2f: Record<string, string>; f2j: Record<string, string> } {
  const j2f: Record<string, string> = {};
  for (const p of PAIRS.split('|')) {
    if (p.length >= 2) j2f[p[0]!] = p.slice(1, 2);
  }
  // f2j 先到先得：按 PAIRS 出现序，繁体字被占位后不再覆盖
  const f2j: Record<string, string> = {};
  for (const p of PAIRS.split('|')) {
    if (p.length < 2) continue;
    const target = p.slice(1, 2);
    if (!(target in f2j)) f2j[target] = p[0]!;
  }
  return { j2f, f2j };
}

const { j2f: J2F, f2j: F2J } = buildCharMap();

function buildPhraseMap(region: Region): { j2f: Map<string, string>; f2j: Map<string, string> } {
  const raw = region === 'tw' ? `${PHRASES_GENERIC}|${PHRASES_TW}` : region === 'hk' ? `${PHRASES_GENERIC}|${PHRASES_HK}` : PHRASES_GENERIC;
  const parts = raw.split('|');
  const j2f = new Map<string, string>();
  const f2j = new Map<string, string>();
  // parts 为 [源, 目标, 源, 目标, ...] 交替排列；后面的档位（地区）优先，覆盖通用词
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const s = parts[i]!;
    const t = parts[i + 1]!;
    j2f.set(s, t);
    if (!f2j.has(t)) f2j.set(t, s);
  }
  return { j2f, f2j };
}

const PHRASE_MAPS: Record<Region, { j2f: Map<string, string>; f2j: Map<string, string> }> = {
  generic: buildPhraseMap('generic'),
  tw: buildPhraseMap('tw'),
  hk: buildPhraseMap('hk'),
};

/** 词组表按长度降序的键，供最长匹配 */
const PHRASE_KEYS: Record<Region, string[]> = {
  generic: [...PHRASE_MAPS.generic.j2f.keys()].sort((a, b) => b.length - a.length),
  tw: [...PHRASE_MAPS.tw.j2f.keys()].sort((a, b) => b.length - a.length),
  hk: [...PHRASE_MAPS.hk.j2f.keys()].sort((a, b) => b.length - a.length),
};

/** 单方向转换：词组最长匹配优先，剩余走字级表 */
function convertOneWay(text: string, toFan: boolean, region: Region): string {
  const charMap = toFan ? J2F : F2J;
  const phrases = PHRASE_MAPS[region][toFan ? 'j2f' : 'f2j'];
  const keys = toFan ? PHRASE_KEYS[region] : [...phrases.keys()].sort((a, b) => b.length - a.length);
  let out = '';
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (const key of keys) {
      if (text.startsWith(key, i)) {
        out += phrases.get(key)!;
        i += key.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const ch = text[i]!;
      out += charMap[ch] ?? ch;
      i += 1;
    }
  }
  return out;
}

export interface ConvertOptions {
  direction: Direction;
  region?: Region;
}

/** 简繁转换入口 */
export function convert(text: string, options: ConvertOptions): string {
  const { direction, region = 'generic' } = options;
  return convertOneWay(text, direction === 'j2f', region);
}

export const REGIONS: { id: Region; label: string }[] = [
  { id: 'generic', label: '通用' },
  { id: 'tw', label: '台湾' },
  { id: 'hk', label: '香港' },
];
