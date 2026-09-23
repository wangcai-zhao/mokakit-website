import { useState, useMemo } from 'preact/hooks';

type Result =
  | { ok: false; error: string }
  | {
      ok: true;
      prefix: number;
      network: string;
      broadcast: string;
      mask: string;
      wildcard: string;
      maskBinary: string;
      cidr: string;
      total: number;
      usable: number;
      firstUsable: string;
      lastUsable: string;
      rangeText: string;
      note: string;
    };

function ipToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (!Number.isFinite(n) || n < 0 || n > 255) return null;
    value = (value << 8) | n;
  }
  return value >>> 0;
}

function intToIp(n: number): string {
  const v = n >>> 0;
  return `${(v >>> 24) & 255}.${(v >>> 16) & 255}.${(v >>> 8) & 255}.${v & 255}`;
}

function maskOf(prefix: number): number {
  if (prefix <= 0) return 0;
  if (prefix >= 32) return 0xffffffff;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

function prefixOfMask(mask: number): number | null {
  const m = mask >>> 0;
  const inv = ~m >>> 0;
  // 合法掩码取反后必然是 2 的幂减一，即 inv 加一后与 inv 没有重合的 1 位
  if (((inv + 1) & inv) !== 0) return null;
  let bits = 0;
  let rest = inv;
  while (rest > 0) {
    bits += rest & 1;
    rest = rest >>> 1;
  }
  return 32 - bits;
}

function binaryOf(mask: number): string {
  const m = mask >>> 0;
  return [(m >>> 24) & 255, (m >>> 16) & 255, (m >>> 8) & 255, m & 255]
    .map((n) => n.toString(2).padStart(8, '0'))
    .join('.');
}

function parse(raw: string, maskRaw: string): Result | null {
  const text = raw.trim();
  const maskText = maskRaw.trim();
  if (!text && !maskText) return null;
  if (!text) return { ok: false, error: '请填写 IP 地址或 CIDR 网段，例如 192.168.1.0/24' };

  let prefix: number | null = null;
  let ipText = text;
  const slash = text.indexOf('/');
  if (slash >= 0) {
    ipText = text.slice(0, slash);
    const p = text.slice(slash + 1).trim();
    if (!/^\d{1,2}$/.test(p)) {
      return { ok: false, error: '前缀长度不合法：斜杠后面必须是 0 到 32 之间的整数' };
    }
    prefix = Number(p);
    if (prefix < 0 || prefix > 32) {
      return { ok: false, error: '前缀长度越界：CIDR 前缀只能是 0 到 32 之间的整数' };
    }
  }

  const ip = ipToInt(ipText.trim());
  if (ip === null) {
    return { ok: false, error: 'IP 地址格式错误：应为四段点分十进制，每段 0 到 255，例如 192.168.1.0' };
  }

  if (maskText) {
    if (prefix !== null) {
      return { ok: false, error: '请勿同时填写斜杠前缀和子网掩码，二选一即可' };
    }
    const mask = ipToInt(maskText);
    if (mask === null) {
      return { ok: false, error: '子网掩码格式错误：应为四段点分十进制，每段 0 到 255，例如 255.255.255.0' };
    }
    const p = prefixOfMask(mask);
    if (p === null) {
      return { ok: false, error: '子网掩码不合法：掩码中连续的 1 必须排在前、0 排在后，例如 255.255.255.0 合法而 255.0.255.0 不合法' };
    }
    prefix = p;
  }

  if (prefix === null) {
    return { ok: false, error: '缺少前缀长度：请写成 192.168.1.0/24，或在下方填写子网掩码如 255.255.255.0' };
  }

  const m = maskOf(prefix);
  const network = (ip & m) >>> 0;
  const broadcast = (network | (~m >>> 0)) >>> 0;
  const total = prefix >= 32 ? 1 : 2 ** (32 - prefix);
  const usable = prefix >= 31 ? total : total - 2;

  let firstUsable = intToIp((network + 1) >>> 0);
  let lastUsable = intToIp((broadcast - 1) >>> 0);
  let rangeText = `${firstUsable} - ${lastUsable}`;
  let note = '标准子网：网络地址与广播地址不可分配给主机，因此可用主机数为总地址数减 2。';

  if (prefix === 32) {
    firstUsable = intToIp(network);
    lastUsable = intToIp(network);
    rangeText = intToIp(network);
    note = '/32 是单主机路由：网段内只有一个地址，没有广播地址，常用于回环地址、主机路由或安全组精确匹配。';
  } else if (prefix === 31) {
    firstUsable = intToIp(network);
    lastUsable = intToIp(broadcast);
    rangeText = `${firstUsable} - ${lastUsable}`;
    note = '/31 按 RFC 3021 用于点对点链路：两个地址都分配给链路两端，可用主机数为 2，不再保留网络地址与广播地址。';
  } else if (prefix === 0) {
    note = '/0 覆盖整个 IPv4 地址空间，可用主机数为 2 的 32 次方减 2，实际网络中一般只出现在默认路由里。';
  }

  return {
    ok: true,
    prefix,
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    mask: intToIp(m),
    wildcard: intToIp(~m >>> 0),
    maskBinary: binaryOf(m),
    cidr: `${intToIp(network)}/${prefix}`,
    total,
    usable,
    firstUsable,
    lastUsable,
    rangeText,
    note,
  };
}

function count(n: number): string {
  return n.toLocaleString('en-US');
}

export default function CidrCalculator() {
  const [value, setValue] = useState('192.168.1.0/24');
  const [mask, setMask] = useState('');

  const result = useMemo<Result | null>(() => parse(value, mask), [value, mask]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">IP 地址 / CIDR 网段</span>
            <input
              type="text"
              inputmode="text"
              autocomplete="off"
              spellcheck={false}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 192.168.1.0/24 或 10.0.0.1"
              value={value}
              onInput={(e) => setValue((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">子网掩码（选填，用于反算 CIDR）</span>
            <input
              type="text"
              inputmode="text"
              autocomplete="off"
              spellcheck={false}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              placeholder="例如 255.255.255.0"
              value={mask}
              onInput={(e) => setMask((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <span class="text-xs opacity-60">快捷示例</span>
          {['192.168.1.0/24', '10.0.0.0/8', '172.16.0.0/12', '192.168.1.1/32'].map((v) => (
            <button
              type="button"
              class={`btn btn-xs ${value === v && !mask ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setValue(v);
                setMask('');
              }}
            >
              {v}
            </button>
          ))}
          <button
            type="button"
            class="btn btn-xs btn-outline"
            onClick={() => {
              setValue('192.168.1.0');
              setMask('255.255.255.0');
            }}
          >
            IP + 掩码
          </button>
        </div>

        {!result && <p class="mt-3 text-sm opacity-60">请输入网段，结果会实时更新</p>}

        {result && !result.ok && (
          <div class="alert alert-error mt-3">
            <span class="text-sm">{result.error}</span>
          </div>
        )}

        {result && result.ok && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge badge-primary">/{result.prefix}</span>
              <span class="badge badge-outline">{result.cidr}</span>
              <span class="badge badge-outline">可用主机 {count(result.usable)}</span>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">网络地址</td>
                    <td class="text-right font-mono">{result.network}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">广播地址</td>
                    <td class="text-right font-mono">{result.broadcast}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">子网掩码</td>
                    <td class="text-right font-mono">{result.mask}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">通配符掩码</td>
                    <td class="text-right font-mono">{result.wildcard}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">二进制掩码</td>
                    <td class="text-right font-mono">{result.maskBinary}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">可用主机范围</td>
                    <td class="text-right font-mono">{result.rangeText}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">可用主机数</td>
                    <td class="text-right font-mono">{count(result.usable)}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">总地址数</td>
                    <td class="text-right font-mono">{count(result.total)}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">CIDR 表示</td>
                    <td class="text-right font-mono">{result.cidr}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {result.prefix >= 31 || result.prefix === 0 ? (
              <div class="alert alert-warning">
                <span class="text-sm">{result.note}</span>
              </div>
            ) : (
              <p class="text-xs opacity-70">{result.note}</p>
            )}
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        网络地址 = IP 与子网掩码按位与，广播地址 = 网络地址或上通配符掩码。IPv4 地址在 JavaScript
        中按无符号 32 位处理（位运算后统一取无符号右移 0），避免出现负数结果。可用主机数在 /0 到 /30
        之间为总地址数减 2，/31 按 RFC 3021 为 2，/32 为 1。所有计算在浏览器本地完成。
      </p>
    </div>
  );
}
