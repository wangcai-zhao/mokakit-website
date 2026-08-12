import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

// 常用简繁差异字对照表（简|繁，用 | 分隔），覆盖绝大多数日常用字。
// 注意：个别一简对多繁的字按最常见用法处理（如 干→幹、发→發）。
const PAIRS =
  '国國|图圖|书書|东東|车車|马馬|鸟鳥|鱼魚|龙龍|来來|类類|历歷|处處|务務|动動|执執|报報|变變|实實|审審|学學|觉覺|门門|问問|间間|闻聞|闭閉|开開|关關|见見|观觀|视視|话話|说說|读讀|课課|谁誰|谈談|谢謝|应應|对對|导導|寻尋|寿壽|将將|尔爾|当當|录錄|梦夢|尽盡|责責|备備|复復|够夠|杀殺|杂雜|机機|权權|杨楊|头頭|买買|卖賣|红紅|纸紙|终終|线線|练練|经經|统統|继繼|续續|维維|织織|绿綠|乡鄉|县縣|里裡|体體|宝寶|写寫|长長|远遠|进進|过過|运運|还還|这這|那那|个個|们們|从從|众眾|护護|欢歡|环環|现現|认認|识識|让讓|议議|许許|论論|设設|访訪|译譯|词詞|诗詩|诚誠|试試|语語|误誤|调調|财財|贤賢|质質|购購|贸貿|费費|贺賀|贼賊|赚賺|软軟|轻輕|转轉|轮輪|辞辭|辩辯|边邊|达達|迁遷|选選|适適|遗遺|邮郵|郑鄭|闪閃|闲閒|闷悶|闸閘|闹鬧|阅閱|阵陣|陈陳|陆陸|阳陽|阴陰|阶階|际際|难難|虽雖|离離|云雲|电電|页頁|项項|顺順|须須|顾顧|顿頓|领領|题題|颜顏|风風|飞飛|饥飢|饭飯|饮飲|饰飾|养養|饿餓|馆館|驰馳|驱驅|驳駁|驴驢|驻駐|骗騙|惊驚|验驗|骤驟|鲁魯|鲜鮮|鸡雞|鸭鴨|鹅鵝|鸣鳴|鹊鵲|鹰鷹|麦麥|黄黃|齐齊|齿齒|龟龜|点點|热熱|爱愛|亲親|厅廳|师師|归歸|币幣|参參|双雙|发發|发髮|干幹|乾干|肃肅|蚕蠶|蛮蠻|虫蟲|虾蝦|蚁蟻|蝇蠅|钟鐘|钟鍾|钢鋼|铁鐵|铜銅|银銀|锡錫|铅鉛|铝鋁|针針|钉釘|钓釣|钩鈎|钱錢|钞鈔|钻鑽|锦錦|镇鎮|镜鏡|闰閏|润潤|阔闊|阁閣|网網|罗羅|罚罰|罢罷|伞傘|伤傷|价價|伦倫|伪偽|伟偉|传傳|优優|佣傭|侦偵|债債|偿償|储儲|凤鳳|鸦鴉|鸳鴦|鸽鴿|鸿鴻|鹏鵬|鹤鶴|鹂鸝|脏髒|脏臟|脑腦|胶膠|脚腳|腊臘|脉脈|肤膚|胜勝|叶葉|号號|亏虧|医醫|网網|盐鹽|稳穩|猪豬|献獻|劝勸|办辦|帮幫|围圍|园園|团團|回迴|图圖|坏壞|块塊|声聲|壳殼|处境|够夠';

const j2f: Record<string, string> = {};
for (const p of PAIRS.split('|')) {
  if (p.length >= 2) j2f[p[0]] = p.slice(1, 2);
}
const f2j: Record<string, string> = {};
for (const k in j2f) f2j[j2f[k]] = k;

function convert(text: string, toFan: boolean): string {
  const map = toFan ? j2f : f2j;
  let out = '';
  for (const ch of text) out += map[ch] ?? ch;
  return out;
}

export default function JianFanConvert() {
  const [direction, setDirection] = useState<'j2f' | 'f2j'>('j2f');
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const output = useMemo(
    () => convert(input, direction === 'j2f'),
    [input, direction],
  );

  const copy = async (text: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class={`btn btn-sm ${direction === 'j2f' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setDirection('j2f')}
        >
          简 → 繁
        </button>
        <button
          type="button"
          class={`btn btn-sm ${direction === 'f2j' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setDirection('f2j')}
        >
          繁 → 简
        </button>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <div>
          <label class="text-sm font-medium" for="jf-input">
            输入
          </label>
          <textarea
            id="jf-input"
            class="textarea textarea-bordered mt-2 w-full h-44 font-mono text-sm"
            placeholder="在此粘贴需要转换的中文文本…"
            value={input}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          />
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium">输出</label>
            <button
              type="button"
              class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => copy(output)}
              disabled={!output}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <textarea
            class="textarea textarea-bordered w-full h-44 font-mono text-sm bg-base-200"
            readonly
            value={output}
          />
        </div>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        转换完全在本地浏览器进行，文本不会上传。内置常用简繁差异字对照表，覆盖绝大多数日常用字；生僻字或一简对多繁的特殊语境建议人工复核。
      </p>
    </div>
  );
}
