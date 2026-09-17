import { useState } from 'preact/hooks';
import ImageDropzone from '@/tools/_shared/ImageDropzone';
import { useImageSource } from '@/tools/_shared/use-image';
import { copyText } from '@/tools/_shared/copy';
import { formatBytes, drawToCanvas, canvasToDataUrl, loadImageFromSrc, downloadBlob, extOfMime, type ImageMime } from '@/tools/_shared/image-utils';

type Tab = 'encode' | 'decode';

export default function ImageBase64Tool() {
  const { file, img, error, baseName, pick, clear } = useImageSource();
  const [tab, setTab] = useState<Tab>('encode');
  const [withPrefix, setWithPrefix] = useState(true);
  const [dataUrl, setDataUrl] = useState('');
  const [mime, setMime] = useState<ImageMime>('image/png');
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState('');
  const [decodeError, setDecodeError] = useState('');
  const [copied, setCopied] = useState(false);

  const encodeNow = () => {
    if (!img) return;
    const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight);
    setDataUrl(canvasToDataUrl(canvas, mime, 0.92));
  };

  const output = dataUrl
    ? withPrefix
      ? dataUrl
      : dataUrl.replace(/^data:[^,]+,/, '')
    : '';

  const decodeNow = () => {
    setDecodeError('');
    setDecoded('');
    const raw = input.trim().replace(/\s+/g, '');
    if (!raw) return;
    const url = raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
    loadImageFromSrc(url)
      .then(() => setDecoded(url))
      .catch(() => setDecodeError('这段 Base64 解析不出图片，请检查是否复制完整'));
  };

  return (
    <div class="space-y-4">
      <div class="tabs tabs-box w-full">
        <button
          type="button"
          class={`tab flex-1 ${tab === 'encode' ? 'tab-active' : ''}`}
          onClick={() => setTab('encode')}
        >
          图片 → Base64
        </button>
        <button
          type="button"
          class={`tab flex-1 ${tab === 'decode' ? 'tab-active' : ''}`}
          onClick={() => setTab('decode')}
        >
          Base64 → 图片
        </button>
      </div>

      {tab === 'encode' ? (
        <>
          {error && <p class="text-sm text-error">{error}</p>}
          <ImageDropzone onPick={pick} hasImage={Boolean(img)} />

          {img && (
            <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-base-200 px-4 py-3 text-sm">
              <span>
                {file?.name} · {img.naturalWidth}×{img.naturalHeight}
              </span>
              <button type="button" class="btn btn-xs btn-ghost" onClick={clear}>
                移除
              </button>
            </div>
          )}

          {img && (
            <>
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="block">
                  <span class="text-sm font-medium">编码格式</span>
                  <select
                    class="select select-bordered mt-1.5 w-full"
                    value={mime}
                    onChange={(e) => setMime((e.target as HTMLSelectElement).value as ImageMime)}
                  >
                    <option value="image/png">PNG</option>
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/webp">WebP</option>
                  </select>
                </label>
                <label class="flex items-end gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    checked={withPrefix}
                    onChange={(e) => setWithPrefix((e.target as HTMLInputElement).checked)}
                  />
                  带 data:image/…;base64, 前缀
                </label>
              </div>

              <button type="button" class="btn btn-primary btn-sm" onClick={encodeNow}>
                开始转换
              </button>

              {output && (
                <>
                  <div class="flex flex-wrap gap-2">
                    <span class="badge badge-ghost">
                      Base64 长度 {output.length.toLocaleString()} 字符
                    </span>
                    <span class="badge badge-outline">
                      约 {formatBytes(Math.round((output.length * 3) / 4))}
                    </span>
                  </div>
                  <label class="block">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium">Base64 结果</span>
                      <button
                        type="button"
                        class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
                        onClick={async () => {
                          await copyText(output);
                          setCopied(true);
                          window.setTimeout(() => setCopied(false), 1800);
                        }}
                      >
                        {copied ? '已复制' : '复制'}
                      </button>
                    </div>
                    <textarea
                      class="textarea textarea-bordered mt-1.5 w-full font-mono text-xs"
                      rows={6}
                      readOnly
                      value={output.slice(0, 2000) + (output.length > 2000 ? '\n…（已截断显示，复制按钮给的是完整内容）' : '')}
                    />
                  </label>
                </>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <label class="block">
            <span class="text-sm font-medium">粘贴 Base64 字符串</span>
            <textarea
              class="textarea textarea-bordered mt-1.5 w-full font-mono text-xs"
              rows={6}
              placeholder="data:image/png;base64,iVBORw0KGgo…（也可以只粘纯 Base64 部分）"
              value={input}
              onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            />
          </label>

          <button
            type="button"
            class="btn btn-primary btn-sm"
            disabled={!input.trim()}
            onClick={decodeNow}
          >
            解析成图片
          </button>

          {decodeError && <p class="text-sm text-error">{decodeError}</p>}

          {decoded && (
            <figure class="space-y-3 rounded-xl border border-base-300 bg-base-200/50 p-4">
              <img src={decoded} alt="解码结果" class="mx-auto max-h-72 rounded-lg object-contain" />
              <button
                type="button"
                class="btn btn-sm btn-outline w-full sm:w-auto"
                onClick={async () => {
                  const res = await fetch(decoded);
                  downloadBlob(await res.blob(), `${baseName === 'image' ? 'decoded' : baseName}.${extOfMime(mime)}`);
                }}
              >
                下载这张图片
              </button>
            </figure>
          )}
        </>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        Base64 把二进制图片编码成纯文本，方便塞进 HTML / CSS / JSON
        里直接引用，代价是体积比原文件大约三分之一。超过几十 KB
        的图片不建议内联，会让页面变大且无法走浏览器缓存。
      </p>
    </div>
  );
}
