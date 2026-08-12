import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { parseTime, fmtHms, secondsToHms, hmsToSeconds } from './time';

type Mode = 'sec2hms' | 'hms2units' | 'hmsAdd';

interface Props {
  mode: Mode;
  title?: string;
}

export default function DurationConvert({ mode, title }: Props) {
  const [sec, setSec] = useState('3661');
  const [hms, setHms] = useState('01:01:01');
  const [entry, setEntry] = useState('01:00:00');
  const [total, setTotal] = useState(0);
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  // sec2hms
  const secVal = Number(sec);
  const secValid = Number.isFinite(secVal) && secVal >= 0;
  const secParts = secondsToHms(Math.trunc(secVal));

  // hms2units
  const hmsT = parseTime(hms);
  const hmsTotal = hmsT ? hmsToSeconds(hmsT) : null;

  // hmsAdd
  const entryT = parseTime(entry);
  const apply = (sign: number) => {
    if (entryT) setTotal((prev) => prev + sign * hmsToSeconds(entryT));
  };

  return (
    <div class="space-y-4">
      {title && <p class="text-sm opacity-70">{title}</p>}

      {mode === 'sec2hms' && (
        <>
          <label class="block">
            <span class="text-sm font-medium">输入秒数</span>
            <input
              type="number"
              min="0"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={sec}
              onInput={(e) => setSec((e.target as HTMLInputElement).value)}
            />
          </label>
          {!secValid && <p class="text-sm text-error">请输入有效的非负秒数</p>}
          {secValid && (
            <div class="space-y-3">
              <div class="flex items-center gap-2 rounded-xl bg-base-100 p-3">
                <p class="flex-1 text-lg font-semibold">{fmtHms(Math.trunc(secVal))}</p>
                <button
                  type="button"
                  class={`btn btn-xs shrink-0 ${copied ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => copy(fmtHms(Math.trunc(secVal)))}
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <td class="opacity-60">小时</td>
                      <td class="font-mono">{secParts.h} 小时</td>
                    </tr>
                    <tr>
                      <td class="opacity-60">分钟</td>
                      <td class="font-mono">{secParts.m} 分钟</td>
                    </tr>
                    <tr>
                      <td class="opacity-60">秒</td>
                      <td class="font-mono">{secParts.s} 秒</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'hms2units' && (
        <>
          <label class="block">
            <span class="text-sm font-medium">输入时长（时:分:秒）</span>
            <input
              type="text"
              placeholder="01:30:00"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={hms}
              onInput={(e) => setHms((e.target as HTMLInputElement).value)}
            />
          </label>
          {!hmsT && <p class="text-sm text-error">请输入有效的 时:分:秒（如 01:30:00）</p>}
          {hmsT && hmsTotal !== null && (
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">总小时</td>
                    <td class="font-mono">{(hmsTotal / 3600).toFixed(4)} 小时</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">总分钟</td>
                    <td class="font-mono">{(hmsTotal / 60).toFixed(2)} 分钟</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">总秒数</td>
                    <td class="font-mono">{hmsTotal} 秒</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {mode === 'hmsAdd' && (
        <>
          <label class="block">
            <span class="text-sm font-medium">输入一段时长（时:分:秒）</span>
            <input
              type="text"
              placeholder="01:00:00"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={entry}
              onInput={(e) => setEntry((e.target as HTMLInputElement).value)}
            />
          </label>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn btn-xs btn-primary" onClick={() => apply(1)} disabled={!entryT}>
              ＋ 加上
            </button>
            <button type="button" class="btn btn-xs btn-outline" onClick={() => apply(-1)} disabled={!entryT}>
              － 减去
            </button>
            <button type="button" class="btn btn-xs btn-ghost" onClick={() => setTotal(0)}>
              清零
            </button>
          </div>
          <div class="flex items-center gap-2 rounded-xl bg-base-100 p-3">
            <div class="flex-1">
              <p class="text-xs opacity-60">累计时长</p>
              <p class="text-lg font-semibold">{fmtHms(total)}</p>
              <code class="font-mono text-sm opacity-70">{(total / 3600).toFixed(2)} 小时</code>
            </div>
            <button
              type="button"
              class={`btn btn-xs shrink-0 ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => copy(fmtHms(total))}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        全部在浏览器本地计算，支持负数时长与超过 59 的数值，不上传任何数据。
      </p>
    </div>
  );
}
