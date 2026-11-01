/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import { GS1_AI, DATE_AIS, parseGs1Date, gtinStructure } from '@/lib/gs1';

interface GtinInfo {
  prefix: string;
  region: string;
  checkOk: boolean;
  expected: string;
}

interface Row {
  ai: string;
  name: string;
  raw: string;
  display: string;
  gtin?: GtinInfo | null;
}

function toRows(pairs: [string, string][]): Row[] {
  return pairs.map(([ai, val]) => {
    let display = val;
    if (DATE_AIS.has(ai)) {
      const d = parseGs1Date(val);
      if (d) display = `${d}（原始 ${val}）`;
    }
    // 识别到 AI 01（GTIN）时附带校验位与发码机构信息（纯函数层 src/lib/gs1.ts）
    const gtin = ai === '01' ? gtinStructure(val) : undefined;
    return { ai, name: GS1_AI[ai] || '未知应用标识符', raw: val, display, gtin };
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
  const gtinRow = result.rows.find((r) => r.ai === '01' && r.gtin);

  const loadSample = () =>
    setInput('(01)06901234567892(11)260401(17)271231(10)BATCH2026(21)SN123456');
  const copy = (s: string) => navigator.clipboard?.writeText(s);

  return (
    <div class="space-y-6">
      <div class="alert alert-info text-sm">
        <span>
          粘贴 UDI 文本即可自动识别格式并解析。支持 GS1 括号格式、GS1 Digital Link URI、行式键值三种。识别到 GTIN 时会按 GS1 模 10
          校验校验位并识别发码机构，全程本地解析，不出本机。
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
                {gtinRow?.gtin && (
                  <span
                    class={`badge ${gtinRow.gtin.checkOk ? 'badge-success' : 'badge-error'}`}
                  >
                    {gtinRow.gtin.checkOk
                      ? `GTIN 校验位通过 · 发码机构：${gtinRow.gtin.region}`
                      : `GTIN 校验位不通过（应为 ${gtinRow.gtin.expected}）`}
                  </span>
                )}
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
                        <td class="break-all">
                          {r.display}
                          {r.gtin && (
                            <div class="text-xs mt-1 space-y-0.5">
                              <div class={r.gtin.checkOk ? 'text-success' : 'text-error'}>
                                {r.gtin.checkOk
                                  ? 'GTIN 校验位：✅ 通过'
                                  : `GTIN 校验位：❌ 不通过（应为 ${r.gtin.expected}）`}
                              </div>
                              <div class="opacity-60">
                                发码机构：前缀 {r.gtin.prefix} → {r.gtin.region}
                              </div>
                            </div>
                          )}
                        </td>
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
