import { useState, useEffect, useRef } from 'preact/hooks';
import {
  CLOCK_THEMES,
  getTheme,
  readableFg,
  presetUrl,
  PRESET_BACKGROUNDS,
  DEFAULT_CLOCK_SETTINGS,
  type ClockSettings,
  type BgMode,
} from '@/tools/_shared/clock-themes';

/* ----------------------------- 设置持久化 ----------------------------- */

export function useClockSettings(
  key: string,
  overrides?: Partial<ClockSettings>,
): [ClockSettings, (p: Partial<ClockSettings>) => void] {
  const initial: ClockSettings = { ...DEFAULT_CLOCK_SETTINGS, ...overrides };
  // ⚠️ 关键修复：首帧统一用 default（theme 模式）渲染，不读 localStorage。
  // 否则 SSR（无 localStorage → default）与客户端首帧（读到用户存的 image 背景）DOM 不一致，
  // 触发 Preact hydration mismatch，整块时钟 island 在 hydration 时被丢弃/重渲染异常，
  // 表现为「打开空白、需点设置才恢复」。用户持久化设置改到挂载后的 effect 异步应用，
  // 首屏永远先正常显示（默认主题），随后无缝切到用户设置。
  const [s, setS] = useState<ClockSettings>(initial);
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try {
      // 背景/外观设置所有时钟共享，避免切换时钟时各类型 localStorage 状态不一致导致「有时显示有时不显示」
      const raw = localStorage.getItem('mokakit-clock');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // 防御性校验：关键字段缺失或类型异常时丢弃脏数据
      const hasValidBg = parsed && typeof parsed.bgMode === 'string' && ['theme','solid','image'].includes(parsed.bgMode);
      const hasValidTheme = parsed && typeof parsed.theme === 'string' && parsed.theme.length > 0;
      if (!hasValidBg || !hasValidTheme) {
        console.warn('[mokakit-clock] 清理异常 localStorage 数据', parsed);
        localStorage.removeItem('mokakit-clock');
        return;
      }
      const val = { ...initial, ...parsed };
      // 清理早期按类型分 key 的脏数据（已并入全局键）
      for (const t of ['digital', 'flip', 'analog', 'world']) {
        localStorage.removeItem('mokakit-clock-' + t);
      }
      setS(val);
    } catch (e) {
      console.warn('[mokakit-clock] localStorage 读取失败', e);
    }
    // 仅在挂载时读一次，避免与 SSR 首帧不一致
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('mokakit-clock', JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s]);
  const setPartial = (p: Partial<ClockSettings>) => setS((prev) => ({ ...prev, ...p }));

  // 自动切换背景：开启后每隔 bgAutoInterval 秒在预设背景间轮播
  const sRef = useRef(s);
  sRef.current = s;
  useEffect(() => {
    if (!s.bgAuto || s.bgMode !== 'image' || !s.bgPresetId) return;
    const ms = Math.max(3, s.bgAutoInterval || 12) * 1000;
    const id = window.setInterval(() => {
      const arr = PRESET_BACKGROUNDS;
      const idx = arr.findIndex((p) => p.id === sRef.current.bgPresetId);
      const next = arr[(idx + 1) % arr.length];
      setS((prev) => ({ ...prev, bgMode: 'image', bgPresetId: next.id, bgUploadId: '', bgImage: '' }));
    }, ms);
    return () => window.clearInterval(id);
  }, [s.bgAuto, s.bgMode, s.bgAutoInterval]);

  return [s, setPartial];
}

/* ----------------------------- 上传背景（IndexedDB） ----------------------------- */

interface UploadedBg {
  id: string;
  name: string;
  dataUrl: string;
  ts: number;
}
const DB_NAME = 'mokakit-clock';
const DB_VER = 1;
const STORE = 'bg';

function idbSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function putUploadedBg(item: UploadedBg): Promise<void> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
async function getUploadedBg(id: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((res) => {
    const tx = db.transaction(STORE, 'readonly');
    const r = tx.objectStore(STORE).get(id);
    r.onsuccess = () => res((r.result as UploadedBg | undefined)?.dataUrl ?? null);
    r.onerror = () => res(null);
  });
}
async function listUploadedBg(): Promise<UploadedBg[]> {
  const db = await openDb();
  return new Promise((res) => {
    const tx = db.transaction(STORE, 'readonly');
    const r = tx.objectStore(STORE).getAll();
    r.onsuccess = () => {
      const arr = (r.result as UploadedBg[]) || [];
      res(arr.sort((a, b) => b.ts - a.ts));
    };
    r.onerror = () => res([]);
  });
}
async function delUploadedBg(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((res) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => res();
  });
}
/** 读取图片文件 → 压缩到最大边 1600px 的 JPEG dataURL */
function compressImageFile(file: File, max = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width || max, img.height || max));
        const w = Math.round((img.width || max) * scale);
        const h = Math.round((img.height || max) * scale);
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext('2d');
        if (!ctx) { reject(new Error('no canvas ctx')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(cv.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** 解析最终背景图 URL：预设 > 上传 > 自定义 URL */
export function useResolvedBg(settings: ClockSettings): string {
  const [uploadUrl, setUploadUrl] = useState('');
  useEffect(() => {
    let active = true;
    if (settings.bgUploadId) {
      getUploadedBg(settings.bgUploadId)
        .then((u) => { if (active) setUploadUrl(u ?? ''); })
        .catch(() => {});
    } else {
      setUploadUrl('');
    }
    return () => { active = false; };
  }, [settings.bgUploadId]);
  if (settings.bgMode !== 'image') return '';
  if (settings.bgPresetId) return presetUrl(settings.bgPresetId);
  if (settings.bgUploadId) return uploadUrl;
  if (settings.bgImage) return settings.bgImage;
  return '';
}

/** 已上传背景列表（内部维护 IndexedDB） */
export function useUploadedList() {
  const [list, setList] = useState<UploadedBg[]>([]);
  const refresh = () => {
    if (idbSupported()) listUploadedBg().then(setList).catch(() => setList([]));
  };
  useEffect(refresh, []);
  const remove = async (id: string) => { await delUploadedBg(id); refresh(); };
  return { list, refresh, remove };
}

/* ----------------------------- 全屏背景层（fixed 覆盖视口） ----------------------------- */

/**
 * 图片背景模式下的强制深色兜底色。
 * ⚠️ 不能用 theme.bg —— 浅色主题（如「极简白」）或偏亮预设图会让白字隐形。
 * 这层永远在最底，保证「白字 + 任何图片/未加载」都可读。
 */
const DARK_FALLBACK = '#0b0b16';

export function ClockBackdrop({
  settings,
  theme,
}: {
  settings: ClockSettings;
  theme: ReturnType<typeof getTheme>;
}) {
  const url = useResolvedBg(settings);
  // 背景图柔和切换：旧图停留、新图 0.9s 淡入，形成交叉淡出，避免硬切
  const [shown, setShown] = useState<string>(url);
  useEffect(() => {
    if (!url) {
      setShown('');
      return;
    }
    if (url !== shown) {
      const t = window.setTimeout(() => setShown(url), 900);
      return () => window.clearTimeout(t);
    }
  }, [url, shown]);

  /* 有图片背景：absolute 锁在舞台内（舞台 overflow:hidden 会裁掉溢出，滚动后让位正文） */
  if (url) {
    const imgLayer = (src: string, fade: boolean) => (
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          backgroundImage: `url("${src}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: `blur(${settings.bgBlur}px)`,
          transform: 'scale(1.08)',
          opacity: fade ? 0 : 1,
          animation: fade ? 'ck-clockFade .9s ease forwards' : undefined,
        }}
      />
    );
    return (
      <>
        <style>{`@keyframes ck-clockFade{from{opacity:0}to{opacity:1}}`}</style>
        {/* 固定深色兜底：不依赖主题亮度，图片未加载/失败/透明时露出，白字永可读 */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, background: DARK_FALLBACK }} />
        {/* 旧图（淡出层中作为底，新图淡入覆盖其上） */}
        {shown && shown !== url && imgLayer(shown, false)}
        {/* 新图：淡入 */}
        {imgLayer(url, shown !== url)}
        {/* 暗化遮罩：下限 0.5，确保亮图也压到白字可读；用户可调高但不可调到隐形 */}
        <div
          aria-hidden
          style={{ position: 'absolute', inset: 0, zIndex: 2, background: `rgba(0,0,0,${Math.max(settings.bgScrim, 0.5)})` }}
        />
        {settings.vignette && (
          <div
            aria-hidden
            style={{
              position: 'absolute', inset: 0, zIndex: 3,
              background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.58) 100%)',
            }}
          />
        )}
      </>
    );
  }

  /* 纯色模式：fixed 全屏 */
  if (settings.bgMode === 'solid') {
    return (
      <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, background: settings.bgSolid }} />
    );
  }

  /* 主题模式（默认）：用主题背景铺满全视口，确保文字可读 */
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, background: theme.bg }} />
  );
}

/** 是否处于有图背景模式（用于前景色判断） */
export function hasImageBg(settings: ClockSettings): boolean {
  return settings.bgMode === 'image' && !!(settings.bgPresetId || settings.bgUploadId || settings.bgImage);
}

/** 舞台外壳颜色（前景可读性） */
export function stageColor(settings: ClockSettings, theme: ReturnType<typeof getTheme>): string {
  if (settings.bgMode === 'solid') return readableFg(settings.bgSolid);
  if (hasImageBg(settings)) return '#ffffff';
  return theme.fg;
}

/* ----------------------------- clockhub 风格顶部控制栏 ----------------------------- */

export interface ClockBarFeatures {
  theme?: boolean;
  bg?: boolean;
  hour12?: boolean;
  fullscreen?: boolean;
  more?: boolean;
  glow?: boolean;
  wake?: boolean;
}

const ALL_FEATURES: Required<ClockBarFeatures> = {
  theme: true, bg: true, hour12: true,
  fullscreen: true, more: true, glow: true, wake: true,
};

/** 时钟类型选项（用于控制栏左侧切换） */
export const CLOCK_TYPES = [
  { id: 'digital', label: '数字时钟', url: '/tools/digital-clock/' },
  { id: 'flip', label: '翻页时钟', url: '/tools/flip-clock/' },
  { id: 'analog', label: '模拟时钟', url: '/tools/analog-clock/' },
  { id: 'world', label: '世界时钟', url: '/tools/world-clock/' },
];

export function ClockSettingsBar({
  settings,
  onChange,
  onFullscreen,
  features,
  currentTypeId,
  title,
}: {
  settings: ClockSettings;
  onChange: (p: Partial<ClockSettings>) => void;
  onFullscreen: () => void;
  features?: ClockBarFeatures;
  currentTypeId?: string;
  title?: string;
}) {
  const f = { ...ALL_FEATURES, ...features };
  const [showPanel, setShowPanel] = useState(false);

  /* ---- 公共样式 ---- */
  const bar: Record<string, string> = {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    zIndex: '50',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 1rem',
    background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 80%, transparent 100%)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    color: '#fff',
    fontSize: '0.82rem',
  };
  const btn: Record<string, string> = {
    borderRadius: '0.5rem',
    padding: '0.3rem 0.6rem',
    fontSize: '0.78rem',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s',
  };
  const activeBtn: Record<string, string> = {
    ...btn,
    background: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.35)',
  };

  /* ---- 缩略图 ---- */
  const thumb = (active: boolean): Record<string, string> => ({
    width: '1.8rem',
    height: '1.15rem',
    borderRadius: '0.3rem',
    cursor: 'pointer',
    border: active ? '2px solid #fff' : '1.5px solid rgba(255,255,255,0.3)',
    boxShadow: active ? '0 0 6px rgba(255,255,255,0.6)' : 'none',
    flexShrink: '0',
  });

  /* ---- 上传 ---- */
  const uploads = useUploadedList();
  const handleFile = (file?: File) => {
    if (!file) return;
    compressImageFile(file)
      .then((dataUrl) => {
        const id = 'u' + Date.now();
        return putUploadedBg({ id, name: file.name, dataUrl, ts: Date.now() }).then(() => {
          onChange({ bgMode: 'image', bgUploadId: id, bgPresetId: '', bgImage: '' });
          uploads.refresh();
        });
      })
      .catch(() => {});
  };

  const hasBg = !!(settings.bgPresetId || settings.bgUploadId || settings.bgImage);

  return (
    <div style={bar}>
      {/* ====== 左侧：标题/品牌 + 时钟类型切换 + 12/24h ====== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* 页面标题或品牌名 */}
        {title ? (
          <span style={{ fontWeight: 700, fontSize: '0.92rem', letterSpacing: '0.03em', opacity: 0.95 }}>
            {title}
          </span>
        ) : (
          <span style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.02em', opacity: 0.9 }}>
            摩卡时钟
          </span>
        )}

        {/* 时钟类型下拉 */}
        <div style={{ position: 'relative' }}>
          <select
            value={currentTypeId || 'digital'}
            onChange={(e) => {
              const target = CLOCK_TYPES.find((t) => t.id === (e.currentTarget as HTMLSelectElement).value);
              if (target) location.href = target.url;
            }}
            style={{
              borderRadius: '0.5rem',
              padding: '0.28rem 0.5rem',
              fontSize: '0.78rem',
              color: '#fff',
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.18)',
              cursor: 'pointer',
            }}
          >
            {CLOCK_TYPES.map((t) => (
              <option key={t.id} value={t.id} style={{ color: '#111' }}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* 分隔线 */}
        <div style={{ width: '1px', height: '1rem', background: 'rgba(255,255,255,0.18)' }} />

        {/* 12/24h */}
        {f.hour12 && (
          <button
            style={settings.hour12 ? activeBtn : btn}
            onClick={() => onChange({ hour12: !settings.hour12 })}
          >
            {settings.hour12 ? '12h' : '24h'}
          </button>
        )}
      </div>

      {/* ====== 右侧：功能按钮组 ====== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {/* 全屏 */}
        {f.fullscreen && (
          <button style={btn} onClick={onFullscreen} title="全屏显示">⛶ 全屏</button>
        )}

        {/* 保持唤醒 */}
        {f.wake && (
          <label
            style={{ ...btn, display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: settings.wake ? 1 : 0.65 }}
            title="保持屏幕常亮"
          >
            <input
              type="checkbox"
              checked={settings.wake}
              onChange={(e) => onChange({ wake: (e.currentTarget as HTMLInputElement).checked })}
              style={{ accentColor: '#fff', transform: 'scale(0.85)' }}
            />
            唤醒
          </label>
        )}

        {/* 辉光 */}
        {f.glow && (
          <label
            style={{ ...btn, display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: settings.glow ? 1 : 0.65 }}
            title="文字辉光效果"
          >
            <input
              type="checkbox"
              checked={settings.glow}
              onChange={(e) => onChange({ glow: (e.currentTarget as HTMLInputElement).checked })}
              style={{ accentColor: '#fff', transform: 'scale(0.85)' }}
            />
            辉光
          </label>
        )}

        {/* 分隔 */}
        <div style={{ width: '1px', height: '1rem', background: 'rgba(255,255,255,0.18)' }} />

        {/* ⚙ 设置面板（展开/收起） */}
        {f.more && (
          <>
            <button
              style={{ ...btn, opacity: showPanel ? 1 : 0.8 }}
              onClick={() => setShowPanel(!showPanel)}
              title="更多设置"
            >
              ⚙ 设置
            </button>

            {/* 展开的设置面板 */}
            {showPanel && (
              <div
                style={{
                  position: 'absolute',
                  top: '2.8rem',
                  right: '1rem',
                  background: 'rgba(10,10,20,0.92)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: '0.75rem',
                  padding: '0.7rem',
                  minWidth: '18rem',
                  maxWidth: '26rem',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  zIndex: '60',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                  color: '#fff',
                  fontSize: '0.8rem',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* 关闭按钮 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>设置</span>
                  <button
                    onClick={() => setShowPanel(false)}
                    style={{ ...btn, padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                  >✕</button>
                </div>

                {/* --- 主题选择 --- */}
                {f.theme && (
                  <div style={{ marginBottom: '0.6rem' }}>
                    <div style={{ fontSize: '0.72rem', opacity: 0.6, marginBottom: '0.3rem' }}>主题</div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {CLOCK_THEMES.map((t) => (
                        <button
                          key={t.id}
                          title={t.name}
                          onClick={() => onChange({ theme: t.id })}
                          style={{
                            width: '1.4rem',
                            height: '1.4rem',
                            borderRadius: '50%',
                            background: t.accent,
                            cursor: 'pointer',
                            border: settings.theme === t.id ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.2)',
                            boxShadow: settings.theme === t.id ? `0 0 10px ${t.glow}` : 'none',
                            transition: 'all 0.15s',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* --- 背景设置 --- */}
                {f.bg && (
                  <div style={{ marginBottom: '0.6rem' }}>
                    <div style={{ fontSize: '0.72rem', opacity: 0.6, marginBottom: '0.3rem' }}>背景</div>

                    {/* 预设缩略图 */}
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                      {PRESET_BACKGROUNDS.map((p) => (
                        <button
                          key={p.id}
                          title={p.name}
                          onClick={() => onChange({ bgMode: 'image', bgPresetId: p.id, bgUploadId: '', bgImage: '' })}
                          style={{
                            ...thumb(settings.bgPresetId === p.id),
                            backgroundImage: `url("${p.url}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                      ))}
                    </div>

                    {/* 上传 */}
                    <label style={{ ...btn, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                      ⬆ 上传照片
                      <input
                        type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={(e) => {
                          handleFile((e.currentTarget as HTMLInputElement).files?.[0]);
                          (e.currentTarget as HTMLInputElement).value = '';
                        }}
                      />
                    </label>

                    {/* 已上传列表 */}
                    {uploads.list.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                        {uploads.list.slice(0, 4).map((u) => (
                          <span key={u.id} style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              title={u.name}
                              onClick={() => onChange({ bgMode: 'image', bgUploadId: u.id, bgPresetId: '', bgImage: '' })}
                              style={{
                                ...thumb(settings.bgUploadId === u.id),
                                backgroundImage: `url("${u.dataUrl}")`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }}
                            />
                            <button
                              onClick={() => {
                                const wasSel = settings.bgUploadId === u.id;
                                uploads.remove(u.id);
                                if (wasSel) onChange({ bgUploadId: '' });
                              }}
                              style={{
                                position: 'absolute', top: '-0.3rem', right: '-0.3rem',
                                width: '0.8rem', height: '0.8rem', borderRadius: '50%',
                                background: 'rgba(220,40,40,0.95)', color: '#fff',
                                border: 'none', cursor: 'pointer', fontSize: '0.5rem',
                                lineHeight: '0.8rem', padding: 0,
                              }}
                            >×</button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 背景微调（有背景时才显示） */}
                    {hasBg && (
                      <div style={{ marginTop: '0.45rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <label style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap' }}>
                            模糊
                            <input type="range" min="0" max="20" value={settings.bgBlur}
                              onInput={(e) => onChange({ bgBlur: +(e.currentTarget as HTMLInputElement).value })}
                              style={{ width: '5rem', accentColor: '#fff' }} />
                          </label>
                          <label style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap' }}>
                            暗化
                            <input type="range" min="0" max="0.8" step="0.05" value={settings.bgScrim}
                              onInput={(e) => onChange({ bgScrim: +(e.currentTarget as HTMLInputElement).value })}
                              style={{ width: '5rem', accentColor: '#fff' }} />
                          </label>
                          <label style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                            <input type="checkbox" checked={settings.vignette}
                              onChange={(e) => onChange({ vignette: (e.currentTarget as HTMLInputElement).checked })}
                              style={{ accentColor: '#fff' }} />暗角
                          </label>
                          <label style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap' }}>
                            <input type="checkbox" checked={settings.bgAuto}
                              onChange={(e) => onChange({ bgAuto: (e.currentTarget as HTMLInputElement).checked })}
                              style={{ accentColor: '#fff' }} />自动切换
                          </label>
                          {settings.bgAuto && (
                            <label style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap' }}>
                              间隔
                              <input type="range" min="3" max="60" step="1" value={settings.bgAutoInterval}
                                onInput={(e) => onChange({ bgAutoInterval: +(e.currentTarget as HTMLInputElement).value })}
                                style={{ width: '4rem', accentColor: '#fff' }} />
                              <span>{settings.bgAutoInterval}s</span>
                            </label>
                          )}
                          <button
                            style={{ ...btn, fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                            onClick={() => onChange({ bgMode: 'theme', bgPresetId: '', bgUploadId: '', bgImage: '' })}
                          >✕ 清除</button>
                        </div>
                        <div style={{ marginTop: '0.3rem' }}>
                          <details>
                            <summary style={{ ...btn, fontSize: '0.7rem', padding: '0.2rem 0.4rem', listStyle: 'none' }}>自定义 URL</summary>
                            <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.3rem' }}>
                              <input
                                type="text" placeholder="粘贴图片 URL" value={settings.bgImage}
                                onInput={(e) =>
                                  onChange({ bgMode: 'image', bgImage: (e.currentTarget as HTMLInputElement).value, bgPresetId: '', bgUploadId: '' })
                                }
                                style={{ ...btn, flex: 1, minWidth: 0, background: 'rgba(0,0,0,0.3)' }}
                              />
                            </div>
                          </details>
                        </div>
                      </div>
                    )}

                    {/* 纯色取色器 */}
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>纯色底</span>
                      <input
                        type="color" value={settings.bgSolid}
                        onInput={(e) => onChange({ bgMode: 'solid', bgSolid: (e.currentTarget as HTMLInputElement).value, bgPresetId: '', bgUploadId: '', bgImage: '' })}
                        style={{ width: '1.8rem', height: '1.3rem', border: 'none', cursor: 'pointer', borderRadius: '0.3rem' }}
                      />
                      <button
                        style={{ ...btn, fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                        onClick={() => onChange({ bgMode: 'theme', bgPresetId: '', bgUploadId: '', bgImage: '' })}
                      >用主题</button>
                    </div>
                  </div>
                )}

                {/* --- 显示选项 --- */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <label style={{ fontSize: '0.78rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input type="checkbox" checked={settings.showSeconds}
                      onChange={(e) => onChange({ showSeconds: (e.currentTarget as HTMLInputElement).checked })}
                      style={{ accentColor: '#fff' }} />秒
                  </label>
                  <label style={{ fontSize: '0.78rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input type="checkbox" checked={settings.showDate}
                      onChange={(e) => onChange({ showDate: (e.currentTarget as HTMLInputElement).checked })}
                      style={{ accentColor: '#fff' }} />日期
                  </label>
                  <div style={{ fontSize: '0.78rem', display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                    字号
                    {(['sm', 'md', 'lg'] as const).map((s) => (
                      <button key={s} onClick={() => onChange({ fontScale: s })}
                        style={settings.fontScale === s ? activeBtn : btn}>
                        {s === 'sm' ? '小' : s === 'md' ? '中' : '大'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- URL 哈希自动选背景 ----------------------------- */

/**
 * 读取 location.hash 中的 #bg=<presetId>，首次加载时自动应用背景预设。
 * 用于专题页点击缩略图跳转时自动选中对应背景。
 * 用法：useApplyBgHash(settings, onChange);
 */
export function useApplyBgHash(
  settings: ClockSettings,
  onChange: (p: Partial<ClockSettings>) => void,
) {
  useEffect(() => {
    const h = typeof location !== 'undefined' ? location.hash : '';
    if (!h.startsWith('#bg=')) return;
    const id = h.slice(4).trim();
    if (!id || settings.bgPresetId === id) return;
    const valid = PRESET_BACKGROUNDS.some((p) => p.id === id);
    if (valid) {
      onChange({ bgMode: 'image', bgPresetId: id, bgUploadId: '', bgImage: '' });
      try { history.replaceState(null, '', location.pathname); } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
