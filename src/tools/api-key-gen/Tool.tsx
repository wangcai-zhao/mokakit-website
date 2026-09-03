import { useState } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';

const HEX = '0123456789abcdef';
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const B62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function gen(format: string, len: number): string {
  const alphabet = format === 'hex' ? HEX : format === 'base62' ? B62 : B64;
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

export default function ApiKeyGenTool() {
  const [format, setFormat] = useState<'hex' | 'base64url' | 'base62'>('base64url');
  const [len, setLen] = useState(32);
  const [count, setCount] = useState(5);
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');

  const generate = () => {
    const n = Math.max(1, Math.min(50, count));
    const l = Math.max(8, Math.min(128, len));
    const keys: string[] = [];
    for (let i = 0; i < n; i++) keys.push(gen(format, l));
    setOutput(keys.join('\n'));
  };

  return (
    <DevTool
      input={input}
      setInput={setInput}
      output={output}
      placeholder="（可选）留空即可，点击「生成」产出随机密钥"
      note="使用浏览器 crypto.getRandomValues 生成高强度随机密钥；密钥仅在本地生成，不上传、不存储。"
    >
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label class="block">
          <span class="text-sm font-medium">格式</span>
          <select
            class="select select-bordered select-sm w-full mt-1.5"
            value={format}
            onChange={(e) => setFormat((e.target as HTMLSelectElement).value as typeof format)}
          >
            <option value="base64url">Base64url</option>
            <option value="hex">Hex</option>
            <option value="base62">Base62</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-medium">长度（字符）</span>
          <input
            type="number"
            class="input input-bordered input-sm w-full mt-1.5"
            value={len}
            min={8}
            max={128}
            onInput={(e) => setLen(parseInt((e.target as HTMLInputElement).value, 10) || 32)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">数量</span>
          <input
            type="number"
            class="input input-bordered input-sm w-full mt-1.5"
            value={count}
            min={1}
            max={50}
            onInput={(e) => setCount(parseInt((e.target as HTMLInputElement).value, 10) || 5)}
          />
        </label>
      </div>
      <button type="button" class="btn btn-primary btn-sm" onClick={generate}>
        生成
      </button>
    </DevTool>
  );
}
