import type { BgMode } from './clock-bg';

export type ClockSize = 'sm' | 'md' | 'lg';

export interface ClockSettingsBarProps {
  /** 主题列表（无主题需求的工具传空数组即可） */
  themes: { id: string; name: string }[];
  themeId: string;
  setThemeId: (v: string) => void;

  /** 12/24 小时制 */
  hour12?: boolean;
  setHour12?: (v: boolean) => void;

  /** 全屏 */
  full: boolean;
  toggleFull: () => void;

  /** 背景 */
  bgMode: BgMode;
  setBgMode: (v: BgMode) => void;
  customColor: string;
  setCustomColor: (v: string) => void;

  /** 更多设置 */
  showSeconds: boolean;
  setShowSeconds: (v: boolean) => void;
  showDate: boolean;
  setShowDate: (v: boolean) => void;
  size: ClockSize;
  setSize: (v: ClockSize) => void;

  /** 保持唤醒 */
  wake: boolean;
  setWake: (v: boolean) => void;

  /** 逐项开关，默认全部开启；不需要的能力置 false 即可隐藏 */
  features?: Partial<
    Record<'theme' | 'hour12' | 'full' | 'bg' | 'seconds' | 'date' | 'size' | 'wake', boolean>
  >;
}

const FALLBACK = {
  theme: true,
  hour12: true,
  full: true,
  bg: true,
  seconds: true,
  date: true,
  size: true,
  wake: true,
};

export default function ClockSettingsBar(props: ClockSettingsBarProps) {
  const f = { ...FALLBACK, ...(props.features ?? {}) };

  return (
    <div class="space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        {f.theme && (
          <>
            <label class="text-sm opacity-70">主题</label>
            <select
              class="select select-bordered select-sm"
              value={props.themeId}
              onChange={(e) => props.setThemeId((e.target as HTMLSelectElement).value)}
            >
              {props.themes.map((t) => (
                <option value={t.id}>{t.name}</option>
              ))}
            </select>
          </>
        )}

        {f.hour12 && props.setHour12 && (
          <button
            type="button"
            class="btn btn-sm btn-outline"
            onClick={() => props.setHour12!(!props.hour12!)}
          >
            {props.hour12 ? '12 小时制' : '24 小时制'}
          </button>
        )}

        {f.full && (
          <button type="button" class="btn btn-sm btn-primary" onClick={props.toggleFull}>
            {props.full ? '退出全屏' : '全屏'}
          </button>
        )}

        {f.wake && (
          <button
            type="button"
            class={`btn btn-sm ${props.wake ? 'btn-success' : 'btn-outline'}`}
            onClick={() => props.setWake(!props.wake)}
            title="开启后屏幕保持常亮，适合时钟常驻大屏"
          >
            {props.wake ? '🔆 保持唤醒中' : '保持唤醒'}
          </button>
        )}
      </div>

      {f.bg && (
        <div class="flex flex-wrap items-center gap-2">
          <label class="text-sm opacity-70">背景</label>
          <select
            class="select select-bordered select-sm"
            value={props.bgMode}
            onChange={(e) => props.setBgMode((e.target as HTMLSelectElement).value as BgMode)}
          >
            <option value="theme">主题配色</option>
            <option value="dark">纯黑</option>
            <option value="light">纯白</option>
            <option value="custom">自定义</option>
          </select>
          {props.bgMode === 'custom' && (
            <input
              type="color"
              class="h-9 w-9 cursor-pointer rounded border border-base-300 bg-transparent p-0.5"
              value={props.customColor}
              onInput={(e) => props.setCustomColor((e.target as HTMLInputElement).value)}
              aria-label="自定义背景颜色"
            />
          )}
        </div>
      )}

      {(f.seconds || f.date || f.size) && (
        <details class="rounded-lg border border-base-300 bg-base-100">
          <summary class="flex cursor-pointer select-none list-none items-center gap-1 px-3 py-2 text-sm font-medium">
            更多设置 ⚙
          </summary>
          <div class="space-y-2 border-t border-base-300 px-3 py-3">
            {f.seconds && (
              <label class="flex items-center justify-between gap-3 text-sm">
                <span class="opacity-75">显示秒</span>
                <button
                  type="button"
                  class={`btn btn-xs ${props.showSeconds ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => props.setShowSeconds(!props.showSeconds)}
                >
                  {props.showSeconds ? '开' : '关'}
                </button>
              </label>
            )}
            {f.date && (
              <label class="flex items-center justify-between gap-3 text-sm">
                <span class="opacity-75">显示日期</span>
                <button
                  type="button"
                  class={`btn btn-xs ${props.showDate ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => props.setShowDate(!props.showDate)}
                >
                  {props.showDate ? '开' : '关'}
                </button>
              </label>
            )}
            {f.size && (
              <label class="flex items-center justify-between gap-3 text-sm">
                <span class="opacity-75">字号</span>
                <select
                  class="select select-bordered select-xs"
                  value={props.size}
                  onChange={(e) => props.setSize((e.target as HTMLSelectElement).value as ClockSize)}
                >
                  <option value="sm">紧凑</option>
                  <option value="md">标准</option>
                  <option value="lg">大</option>
                </select>
              </label>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
