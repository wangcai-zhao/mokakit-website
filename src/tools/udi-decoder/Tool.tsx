/** @jsxImportSource preact */
import { useState } from 'preact/hooks';

const GS1_AI: Record<string, string> = {
  '00': 'SSCC 系列货运集装箱代码',
  '01': 'GTIN 全球贸易项目代码（设备标识 DI）',
  '02': '包装 GTIN',
  '10': '批号 / 批（Lot）',
  '11': '生产日期 (YYMMDD)',
  '12': '付款到期日 (YYMMDD)',
  '13': '包装日期 (YYMMDD)',
  '15': '保质期 (YYMMDD)',
  '17': '失效日期 / 有效期 (YYMMDD)',
  '20': '产品变体',
  '21': '序列号（Serial）',
  '22': '次级序列号（医疗器械）',
  '240': '附加产品标识',
  '241': '客户部件号',
  '242': 'Made-to-Order 标识',
  '250': '第三方交易号',
  '251': '溯源序列号',
  '400': '客户订单号',
  '401': '货物托运代码',
  '410': '收货方 GLN',
  '411': '发运方 GLN',
  '412': '供方 GLN',
  '413': '最终收货方 GLN',
  '414': '物理位置 GLN',
  '420': '寄送邮政编码',
  '421': '寄送邮编 + 国家代码',
  '7001': '废旧资产编号',
  '8003': 'GS1 标识的资产编号',
  '8004': 'GS1 标识的 GIAI',
  '8006': 'GS1 标识的 ITIP',
  '8018': '认证产品标识',
  '8020': '编号认证标识',
  '90': '内部自定义数据',
};

const DATE_AIS = new Set(['11', '12', '13', '15', '17']);

function expandYear(yy: string): string {
  const y = parseInt(yy, 10);
  return y >= 50 ? `19${yy}` : `20${yy}`;
}

function parseDate(val: string): string | null {
  const m = /^(\d{2})(\d{2})(\d{2})$/.exec(val.trim());
  if (!m) return null;
  const [, yy, mm, dd] = m;
  const year = expandYear(yy);
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${mm}-${dd}`;
}

interface Row {
  ai: string;
  name: string;
  raw: string;
  display: string;
}

function toRows(pairs: [string, string][]): Row[] {
  return pairs.map(([ai, val]) => {
    let display = val;
    if (DATE_AIS.has(ai)) {
      const d = parseDate(val);
      if (d) display = `${d}（原始 ${val}）`;
    }
    return { ai, name: GS1_AI[ai] || '未知应用标识符', raw: val, display };
  });
}

function parseUdi(
  raw: string,
): { format: string; rows: Row[]; error?: string } {
  const text = raw.trim();
  if (!text) return { format: '', rows: [] };

  // 1. 括号格式 (AI)value
  const parenRe = /\((\d{2,4})\)([^()]*)/g;
  let m: any = null;
  const paren: [string, string][] = [];
  while ((m = parenRe.exec(text))) paren.push([m[1], m[2]]);
  if (paren.length) {
    return { format: 'GS1 括号格式（AI 元素字符串）', rows: toRows(paren) };
  }

  // 2. GS1 Digital Link URI
  if (
    /^https?:\/\//.test(text) ||
    text.includes('/01/') ||
    text.includes('?01=') ||
    text.includes('&01=')
  ) {
    const dl: [string, string][] = [];
    const re1 = /\/?(\d{2,4})\/([^/?#\s]+)/g;
    while ((m = re1.exec(text))) dl.push([m[1], decodeURIComponent(m[2])]);
    const re2 = /[?&](\d{2,4})=([^&#\s]+)/g;
    while ((m = re2.exec(text))) dl.push([m[1], decodeURIComponent(m[2])]);
    if (dl.length) return { format: 'GS1 Digital Link URI', rows: toRows(dl) };
  }

  // 3. 行式键值
  const linePairs: [string, string][] = [];
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const lm = /^\(?(\d{2,4})\)?\s*[=:：]?\s*(.+)$/.exec(t);
    if (lm) linePairs.push([lm[1], lm[2].trim()]);
  }
  if (linePairs.length) return { format: '行式 AI 键值格式', rows: toRows(linePairs) };

  return {
    format: '',
    rows: [],
    error: '未能识别为有效的 UDI 文本，请检查格式（括号格式 / Digital Link / 行式键值）。',
  };
}

export default function UdiDecoder() {
  const [input, setInput] = useState('');

  const result = parseUdi(input);
  const gs1String = result.rows.map((r) => `(${r.ai})${r.raw}`).join('');

  const loadSample = () =>
    setInput('(01)06901234567892(11)260401(17)271231(10)BATCH2026(21)SN123456');
  const copy = (s: string) => navigator.clipboard?.writeText(s);

  return (
    <div class="space-y-6">
      <div class="alert alert-info text-sm">
        <span>
          粘贴 UDI 文本即可自动识别格式并解析。支持 GS1 括号格式、GS1 Digital Link URI、行式键值三种。全程本地解析，不出本机。
        </span>
      </div>

      <div class="form-control">
        <label class="label py-1">
          <span class="label-text font-medium">UDI 文本</span>
          <button class="label-text-alt link" onClick={loadSample}>
            载入示例
          </button>
        </label>
        <textarea
          class="textarea textarea-bordered font-mono text-sm"
          rows={4}
          placeholder="(01)06901234567892(11)260401(17)271231(10)BATCH2026(21)SN123456"
          value={input}
          onInput={(e: any) => setInput(e.currentTarget.value)}
        />
        <label class="label py-0.5">
          <span class="label-text-alt opacity-60">
            可直接粘贴扫码枪输出的括号字符串，或 GS1 Digital Link 链接，或每行一个 AI 键值。
          </span>
        </label>
      </div>

      {input.trim() !== '' && (
        <div class="space-y-3">
          {result.error ? (
            <div class="alert alert-warning text-sm">{result.error}</div>
          ) : (
            <>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="badge badge-success">已识别：{result.format}</span>
                <span class="badge badge-ghost">{result.rows.length} 个字段</span>
                <button class="btn btn-xs btn-outline" onClick={() => copy(gs1String)}>
                  复制 GS1 字符串
                </button>
              </div>
              <div class="overflow-x-auto">
                <table class="table table-zebra table-sm">
                  <thead>
                    <tr>
                      <th>AI</th>
                      <th>含义</th>
                      <th>原始值</th>
                      <th>解析</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((r, i) => (
                      <tr key={i}>
                        <td class="font-mono whitespace-nowrap">({r.ai})</td>
                        <td>{r.name}</td>
                        <td class="font-mono break-all">{r.raw}</td>
                        <td class="break-all">{r.display}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
