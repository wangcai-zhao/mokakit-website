import { useState } from 'preact/hooks';

// WMO 天气代码 → 中文描述 + emoji 图标
const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: '晴', icon: '☀️' },
  1: { label: '大致晴朗', icon: '🌤️' },
  2: { label: '局部多云', icon: '⛅' },
  3: { label: '阴', icon: '☁️' },
  45: { label: '雾', icon: '🌫️' },
  48: { label: '雾凇', icon: '🌫️' },
  51: { label: '小毛毛雨', icon: '🌦️' },
  53: { label: '毛毛雨', icon: '🌦️' },
  55: { label: '大毛毛雨', icon: '🌧️' },
  56: { label: '冻毛毛雨', icon: '🌧️' },
  57: { label: '冻毛毛雨', icon: '🌧️' },
  61: { label: '小雨', icon: '🌦️' },
  63: { label: '中雨', icon: '🌧️' },
  65: { label: '大雨', icon: '🌧️' },
  66: { label: '冻雨', icon: '🌧️' },
  67: { label: '冻雨', icon: '🌧️' },
  71: { label: '小雪', icon: '🌨️' },
  73: { label: '中雪', icon: '🌨️' },
  75: { label: '大雪', icon: '❄️' },
  77: { label: '米雪', icon: '🌨️' },
  80: { label: '小阵雨', icon: '🌦️' },
  81: { label: '阵雨', icon: '🌧️' },
  82: { label: '强阵雨', icon: '🌧️' },
  85: { label: '小阵雪', icon: '🌨️' },
  86: { label: '阵雪', icon: '❄️' },
  95: { label: '雷暴', icon: '⛈️' },
  96: { label: '雷暴伴冰雹', icon: '⛈️' },
  99: { label: '强雷暴伴冰雹', icon: '⛈️' },
};

interface Geo {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}
interface Current {
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  weather_code: number;
  wind_speed_10m: number;
}
interface Daily {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max?: number[];
}

export default function Weather() {
  const [city, setCity] = useState('北京');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [place, setPlace] = useState('');
  const [current, setCurrent] = useState<Current | null>(null);
  const [daily, setDaily] = useState<Daily | null>(null);

  async function query(q: string) {
    const name = q.trim();
    if (!name) return;
    setLoading(true);
    setError('');
    setCurrent(null);
    setDaily(null);
    try {
      const g = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=zh&format=json`,
      );
      if (!g.ok) throw new Error('地理编码请求失败');
      const gj = await g.json();
      const geo: Geo | undefined = gj.results?.[0];
      if (!geo) throw new Error(`找不到城市「${name}」，换个写法试试`);
      const f = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}` +
          `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
          `&timezone=auto&forecast_days=7&wind_speed_unit=kmh`,
      );
      if (!f.ok) throw new Error('天气请求失败');
      const fj = await f.json();
      setPlace(`${geo.name}${geo.admin1 ? '·' + geo.admin1 : ''}${geo.country ? ' ' + geo.country : ''}`);
      setCurrent(fj.current as Current);
      setDaily(fj.daily as Daily);
    } catch (e) {
      setError(e instanceof Error ? e.message : '查询失败');
    } finally {
      setLoading(false);
    }
  }

  const wmo = (code: number) => WMO[code] ?? { label: '未知', icon: '🌡️' };

  return (
    <div class="space-y-4">
      <form
        class="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          query(city);
        }}
      >
        <input
          type="text"
          class="input input-bordered input-sm flex-1"
          placeholder="输入城市名，如 北京 / Shanghai"
          value={city}
          onInput={(e) => setCity((e.target as HTMLInputElement).value)}
        />
        <button type="submit" class="btn btn-primary btn-sm" disabled={loading}>
          {loading ? '查询中…' : '查询'}
        </button>
      </form>

      {error && <p class="text-xs text-error">{error}</p>}

      {current && (
        <div class="rounded-xl bg-base-200 p-4">
          <div class="text-sm opacity-60">{place}</div>
          <div class="flex items-center gap-3 mt-1">
            <span class="text-5xl">{wmo(current.weather_code).icon}</span>
            <div>
              <div class="text-3xl font-bold font-mono">{current.temperature_2m.toFixed(1)}°C</div>
              <div class="text-sm opacity-70">{wmo(current.weather_code).label}</div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 mt-3 text-center">
            <Mini label="体感" value={`${current.apparent_temperature.toFixed(0)}°`} />
            <Mini label="湿度" value={`${current.relative_humidity_2m}%`} />
            <Mini label="风速" value={`${current.wind_speed_10m.toFixed(0)} km/h`} />
          </div>
        </div>
      )}

      {daily && (
        <div class="grid grid-cols-7 gap-1">
          {daily.time.map((t, i) => {
            const d = new Date(t + 'T00:00');
            const wd = wmo(daily.weather_code[i]);
            const pop = daily.precipitation_probability_max?.[i];
            return (
              <div class="rounded-lg bg-base-100 p-2 text-center">
                <div class="text-[11px] opacity-60">{i === 0 ? '今天' : `${d.getMonth() + 1}/${d.getDate()}`}</div>
                <div class="text-xl my-1">{wd.icon}</div>
                <div class="text-xs font-mono">{daily.temperature_2m_max[i].toFixed(0)}°</div>
                <div class="text-xs font-mono opacity-60">{daily.temperature_2m_min[i].toFixed(0)}°</div>
                {pop != null && <div class="text-[10px] opacity-50 mt-0.5">{pop}%</div>}
              </div>
            );
          })}
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        数据来自 Open-Meteo 开放天气接口，免费、免注册、免 API Key，直接在浏览器端获取，不上传你的查询内容。当前天气约每 15
        分钟更新，7 天预报每日刷新。
      </p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div class="rounded-lg bg-base-100 p-2">
      <div class="text-[11px] opacity-60">{label}</div>
      <div class="text-sm font-bold font-mono">{value}</div>
    </div>
  );
}
