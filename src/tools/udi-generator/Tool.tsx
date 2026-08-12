/** @jsxImportSource preact */
import { useState, useEffect, useRef } from 'preact/hooks';

const SYMBOLOGIES = [
  { group: '二维码', id: 'qrcode', label: 'QR Code', bcid: 'qrcode' },
  { group: '二维码', id: 'gs1qrcode', label: 'GS1 QR Code', bcid: 'gs1qrcode' },
  { group: '二维码', id: 'datamatrix', label: 'Data Matrix', bcid: 'datamatrix' },
  { group: '二维码', id: 'gs1datamatrix', label: 'GS1 Data Matrix', bcid: 'gs1datamatrix' },
  { group: '条形码', id: 'gs1-128', label: 'GS1-128', bcid: 'gs1-128' },
  { group: '条形码', id: 'code128', label: 'Code 128', bcid: 'code128' },
  { group: '条形码', id: 'code39', label: 'Code 39', bcid: 'code39' },
] as const;

const FIELDS = [
  { key: 'gtin', ai: '01', label: '设备标识 DI（GTIN）', placeholder: '14 位数字，如 06901234567892', hint: '全球贸易项目代码，医疗器械“身份号”' },
  { key: 'lot', ai: '10', label: '批号 / 批（Lot）', placeholder: '如 BATCH2026', hint: '生产批号' },
  { key: 'serial', ai: '21', label: '序列号（Serial）', placeholder: '如 SN123456', hint: '单件序列号' },
  { key: 'prodDate', ai: '11', label: '生产日期 (11)', placeholder: 'YYMMDD，如 260401', hint: '生产日期' },
  { key: 'expDate', ai: '17', label: '失效日期 (17)', placeholder: 'YYMMDD，如 271231', hint: '有效期至' },
  { key: 'bestBefore', ai: '15', label: '保质期 (15)', placeholder: 'YYMMDD', hint: '保质期（可选）' },
  { key: 'qty', ai: '30', label: '数量 (30)', placeholder: '如 100', hint: '包装内数量（可选）' },
] as const;

function buildGs1(f: Record<string, string>) {
  return FIELDS.filter((fd) => f[fd.key] && f[fd.key].trim() !== '')
    .map((fd) => `(${fd.ai})${f[fd.key].trim()}`)
    .join('');
}

function BarcodeCanvas({ bcid, label, text }: { bcid: string; label: string; text: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    setErr('');
    if (!text) return;
    (async () => {
      try {
        const mod: any = await import('bwip-js');
        const bwip = mod.default ?? mod;
        if (cancelled || !ref.current) return;
        await bwip.toCanvas(ref.current, {
          bcid,
          text,
          scale: 4,
          height: 14,
          includetext: true,
          textxalign: 'center',
          backgroundcolor: 'FFFFFF',
        });
        if (!cancelled) setErr('');
      } catch (e: any) {
        if (!cancelled) setErr(e?.message?.split('\n')[0] || String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bcid, text]);

  const download = () => {
    const c = ref.current;
    if (!c) return;
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = `${label.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  return (
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body items-center gap-2">
        <div class="font-medium">{label}</div>
        <div class="bg-white rounded p-2">
          <canvas ref={ref} class="max-w-full" />
        </div>
        {err ? (
          <div class="text-xs text-error text-center">{err}</div>
        ) : (
          <div class="text-xs opacity-60">{bcid}</div>
        )}
        <button class="btn btn-sm btn-outline" onClick={download} disabled={!!err}>
          下载 PNG
        </button>
      </div>
    </div>
  );
}

export default function UdiGenerator() {
  const [fields, setFields] = useState<Record<string, string>>({
    gtin: '',
    lot: '',
    serial: '',
    prodDate: '',
    expDate: '',
    bestBefore: '',
    qty: '',
  });
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(SYMBOLOGIES.map((s) => [s.id, true])),
  );

  const updateField = (key: string, val: string) => {
    const nf = { ...fields, [key]: val };
    setFields(nf);
    setText(buildGs1(nf));
  };

  const rebuild = () => setText(buildGs1(fields));

  const toggle = (id: string) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  const active = SYMBOLOGIES.filter((s) => selected[s.id]);

  return (
    <div class="space-y-6">
      <div class="alert alert-info text-sm">
        <span>
          按 GS1 标准填写设备标识 DI 与生产标识 PI，自动组合成 <code>(01)…(17)…</code>{' '}
          元素字符串并生成多种条码。全部本地生成，不上传数据。
        </span>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        {FIELDS.map((fd) => (
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text font-medium">
                {fd.label} <span class="badge badge-ghost badge-sm">({fd.ai})</span>
              </span>
            </label>
            <input
              class="input input-bordered input-sm"
              placeholder={fd.placeholder}
              value={fields[fd.key]}
              onInput={(e: any) => updateField(fd.key, e.currentTarget.value)}
            />
            <label class="label py-0.5">
              <span class="label-text-alt opacity-60">{fd.hint}</span>
            </label>
          </div>
        ))}
      </div>

      <div class="form-control">
        <label class="label py-1">
          <span class="label-text font-medium">GS1 元素字符串（可手动编辑）</span>
        </label>
        <textarea
          class="textarea textarea-bordered font-mono text-sm"
          rows={2}
          value={text}
          placeholder="(01)06901234567892(10)BATCH2026(11)260401(17)271231(21)SN123456"
          onInput={(e: any) => setText(e.currentTarget.value)}
        />
        <label class="label py-0.5">
          <span class="label-text-alt opacity-60">留空则无内容可生成；点右侧按钮用上方字段重新组合。</span>
          <button class="label-text-alt link" onClick={rebuild}>
            用字段重排
          </button>
        </label>
      </div>

      <div class="form-control">
        <label class="label py-1">
          <span class="label-text font-medium">选择生成的码类型</span>
        </label>
        <div class="flex flex-wrap gap-2">
          {SYMBOLOGIES.map((s) => (
            <button
              key={s.id}
              class={`btn btn-sm ${selected[s.id] ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => toggle(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div class="font-medium mb-2">生成结果（{active.length} 个）</div>
        {text.trim() === '' ? (
          <div class="text-sm opacity-60 py-6 text-center">请先填写至少一个字段</div>
        ) : (
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {active.map((s) => (
              <BarcodeCanvas key={s.id} bcid={s.bcid} label={s.label} text={text} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
