/**
 * 世界时区地图城市标记数据（约 100 城）。
 *
 * 数据来源：sen-ltd/tz-world-map（MIT 许可证）
 * https://github.com/sen-ltd/tz-world-map
 *
 * 仅用于在 SVG 世界地图上标注城市点；与世界时钟的用户自选城市列表解耦。
 */

export interface MapCity {
  name: string;
  country: string;
  tz: string;
  lat: number;
  lon: number;
  kind: 'capital' | 'major' | 'outlier';
}

export const MAP_CITIES: MapCity[] = [
  // UTC -12..-09
  { name: 'Baker Island', country: 'US territory', tz: 'Etc/GMT+12', lat: 0.2, lon: -176.5, kind: 'outlier' },
  { name: 'Pago Pago', country: 'American Samoa', tz: 'Pacific/Pago_Pago', lat: -14.3, lon: -170.7, kind: 'major' },
  { name: 'Honolulu', country: 'United States', tz: 'Pacific/Honolulu', lat: 21.3, lon: -157.9, kind: 'major' },
  { name: 'Anchorage', country: 'United States', tz: 'America/Anchorage', lat: 61.2, lon: -149.9, kind: 'major' },

  // UTC -08
  { name: 'Los Angeles', country: 'United States', tz: 'America/Los_Angeles', lat: 34.0, lon: -118.2, kind: 'major' },
  { name: 'Vancouver', country: 'Canada', tz: 'America/Vancouver', lat: 49.3, lon: -123.1, kind: 'major' },
  { name: 'Tijuana', country: 'Mexico', tz: 'America/Tijuana', lat: 32.5, lon: -117.0, kind: 'major' },

  // UTC -07
  { name: 'Denver', country: 'United States', tz: 'America/Denver', lat: 39.7, lon: -104.9, kind: 'major' },
  { name: 'Phoenix', country: 'United States', tz: 'America/Phoenix', lat: 33.4, lon: -112.1, kind: 'outlier' },

  // UTC -06
  { name: 'Mexico City', country: 'Mexico', tz: 'America/Mexico_City', lat: 19.4, lon: -99.1, kind: 'capital' },
  { name: 'Chicago', country: 'United States', tz: 'America/Chicago', lat: 41.9, lon: -87.6, kind: 'major' },
  { name: 'Winnipeg', country: 'Canada', tz: 'America/Winnipeg', lat: 49.9, lon: -97.1, kind: 'major' },
  { name: 'Guatemala', country: 'Guatemala', tz: 'America/Guatemala', lat: 14.6, lon: -90.5, kind: 'capital' },

  // UTC -05
  { name: 'New York', country: 'United States', tz: 'America/New_York', lat: 40.7, lon: -74.0, kind: 'major' },
  { name: 'Toronto', country: 'Canada', tz: 'America/Toronto', lat: 43.7, lon: -79.4, kind: 'major' },
  { name: 'Bogotá', country: 'Colombia', tz: 'America/Bogota', lat: 4.7, lon: -74.1, kind: 'capital' },
  { name: 'Lima', country: 'Peru', tz: 'America/Lima', lat: -12.0, lon: -77.0, kind: 'capital' },
  { name: 'Havana', country: 'Cuba', tz: 'America/Havana', lat: 23.1, lon: -82.4, kind: 'capital' },

  // UTC -04
  { name: 'Caracas', country: 'Venezuela', tz: 'America/Caracas', lat: 10.5, lon: -66.9, kind: 'capital' },
  { name: 'Santiago', country: 'Chile', tz: 'America/Santiago', lat: -33.4, lon: -70.7, kind: 'capital' },
  { name: 'Halifax', country: 'Canada', tz: 'America/Halifax', lat: 44.6, lon: -63.6, kind: 'major' },
  { name: 'La Paz', country: 'Bolivia', tz: 'America/La_Paz', lat: -16.5, lon: -68.2, kind: 'capital' },

  // UTC -03:30
  { name: "St. John's", country: 'Canada', tz: 'America/St_Johns', lat: 47.6, lon: -52.7, kind: 'outlier' },

  // UTC -03
  { name: 'São Paulo', country: 'Brazil', tz: 'America/Sao_Paulo', lat: -23.5, lon: -46.6, kind: 'major' },
  { name: 'Buenos Aires', country: 'Argentina', tz: 'America/Argentina/Buenos_Aires', lat: -34.6, lon: -58.4, kind: 'capital' },
  { name: 'Montevideo', country: 'Uruguay', tz: 'America/Montevideo', lat: -34.9, lon: -56.2, kind: 'capital' },

  // UTC -02
  { name: 'South Georgia', country: 'UK territory', tz: 'Atlantic/South_Georgia', lat: -54.3, lon: -36.5, kind: 'outlier' },

  // UTC -01
  { name: 'Praia', country: 'Cape Verde', tz: 'Atlantic/Cape_Verde', lat: 15.0, lon: -23.5, kind: 'capital' },

  // UTC 00
  { name: 'London', country: 'United Kingdom', tz: 'Europe/London', lat: 51.5, lon: -0.13, kind: 'capital' },
  { name: 'Lisbon', country: 'Portugal', tz: 'Europe/Lisbon', lat: 38.7, lon: -9.1, kind: 'capital' },
  { name: 'Dublin', country: 'Ireland', tz: 'Europe/Dublin', lat: 53.3, lon: -6.3, kind: 'capital' },
  { name: 'Reykjavík', country: 'Iceland', tz: 'Atlantic/Reykjavik', lat: 64.1, lon: -21.9, kind: 'outlier' },
  { name: 'Accra', country: 'Ghana', tz: 'Africa/Accra', lat: 5.6, lon: -0.2, kind: 'capital' },

  // UTC +01
  { name: 'Paris', country: 'France', tz: 'Europe/Paris', lat: 48.9, lon: 2.4, kind: 'capital' },
  { name: 'Berlin', country: 'Germany', tz: 'Europe/Berlin', lat: 52.5, lon: 13.4, kind: 'capital' },
  { name: 'Madrid', country: 'Spain', tz: 'Europe/Madrid', lat: 40.4, lon: -3.7, kind: 'outlier' },
  { name: 'Rome', country: 'Italy', tz: 'Europe/Rome', lat: 41.9, lon: 12.5, kind: 'capital' },
  { name: 'Lagos', country: 'Nigeria', tz: 'Africa/Lagos', lat: 6.5, lon: 3.4, kind: 'major' },

  // UTC +02
  { name: 'Helsinki', country: 'Finland', tz: 'Europe/Helsinki', lat: 60.2, lon: 24.9, kind: 'capital' },
  { name: 'Athens', country: 'Greece', tz: 'Europe/Athens', lat: 37.9, lon: 23.7, kind: 'capital' },
  { name: 'Cairo', country: 'Egypt', tz: 'Africa/Cairo', lat: 30.0, lon: 31.2, kind: 'capital' },
  { name: 'Johannesburg', country: 'South Africa', tz: 'Africa/Johannesburg', lat: -26.2, lon: 28.0, kind: 'major' },

  // UTC +03
  { name: 'Moscow', country: 'Russia', tz: 'Europe/Moscow', lat: 55.8, lon: 37.6, kind: 'capital' },
  { name: 'Istanbul', country: 'Turkey', tz: 'Europe/Istanbul', lat: 41.0, lon: 28.9, kind: 'major' },
  { name: 'Riyadh', country: 'Saudi Arabia', tz: 'Asia/Riyadh', lat: 24.7, lon: 46.7, kind: 'capital' },
  { name: 'Nairobi', country: 'Kenya', tz: 'Africa/Nairobi', lat: -1.3, lon: 36.8, kind: 'capital' },

  // UTC +03:30
  { name: 'Tehran', country: 'Iran', tz: 'Asia/Tehran', lat: 35.7, lon: 51.4, kind: 'outlier' },

  // UTC +04
  { name: 'Dubai', country: 'UAE', tz: 'Asia/Dubai', lat: 25.2, lon: 55.3, kind: 'major' },
  { name: 'Tbilisi', country: 'Georgia', tz: 'Asia/Tbilisi', lat: 41.7, lon: 44.8, kind: 'capital' },

  // UTC +04:30
  { name: 'Kabul', country: 'Afghanistan', tz: 'Asia/Kabul', lat: 34.5, lon: 69.2, kind: 'outlier' },

  // UTC +05
  { name: 'Karachi', country: 'Pakistan', tz: 'Asia/Karachi', lat: 24.9, lon: 67.0, kind: 'major' },
  { name: 'Tashkent', country: 'Uzbekistan', tz: 'Asia/Tashkent', lat: 41.3, lon: 69.2, kind: 'capital' },

  // UTC +05:30
  { name: 'Delhi', country: 'India', tz: 'Asia/Kolkata', lat: 28.6, lon: 77.2, kind: 'outlier' },
  { name: 'Mumbai', country: 'India', tz: 'Asia/Kolkata', lat: 19.1, lon: 72.9, kind: 'outlier' },

  // UTC +05:45
  { name: 'Kathmandu', country: 'Nepal', tz: 'Asia/Kathmandu', lat: 27.7, lon: 85.3, kind: 'outlier' },

  // UTC +06
  { name: 'Dhaka', country: 'Bangladesh', tz: 'Asia/Dhaka', lat: 23.8, lon: 90.4, kind: 'capital' },

  // UTC +06:30
  { name: 'Yangon', country: 'Myanmar', tz: 'Asia/Yangon', lat: 16.8, lon: 96.2, kind: 'outlier' },

  // UTC +07
  { name: 'Bangkok', country: 'Thailand', tz: 'Asia/Bangkok', lat: 13.8, lon: 100.5, kind: 'capital' },
  { name: 'Jakarta', country: 'Indonesia', tz: 'Asia/Jakarta', lat: -6.2, lon: 106.8, kind: 'capital' },
  { name: 'Hanoi', country: 'Vietnam', tz: 'Asia/Ho_Chi_Minh', lat: 21.0, lon: 105.8, kind: 'capital' },

  // UTC +08
  { name: 'Beijing', country: 'China', tz: 'Asia/Shanghai', lat: 39.9, lon: 116.4, kind: 'capital' },
  { name: 'Shanghai', country: 'China', tz: 'Asia/Shanghai', lat: 31.2, lon: 121.5, kind: 'major' },
  { name: 'Ürümqi', country: 'China', tz: 'Asia/Shanghai', lat: 43.8, lon: 87.6, kind: 'outlier' },
  { name: 'Hong Kong', country: 'Hong Kong', tz: 'Asia/Hong_Kong', lat: 22.3, lon: 114.2, kind: 'major' },
  { name: 'Singapore', country: 'Singapore', tz: 'Asia/Singapore', lat: 1.3, lon: 103.8, kind: 'capital' },
  { name: 'Taipei', country: 'Taiwan', tz: 'Asia/Taipei', lat: 25.0, lon: 121.6, kind: 'capital' },
  { name: 'Manila', country: 'Philippines', tz: 'Asia/Manila', lat: 14.6, lon: 121.0, kind: 'outlier' },
  { name: 'Perth', country: 'Australia', tz: 'Australia/Perth', lat: -31.9, lon: 115.9, kind: 'major' },

  // UTC +09
  { name: 'Tokyo', country: 'Japan', tz: 'Asia/Tokyo', lat: 35.7, lon: 139.7, kind: 'capital' },
  { name: 'Seoul', country: 'South Korea', tz: 'Asia/Seoul', lat: 37.6, lon: 127.0, kind: 'capital' },

  // UTC +09:30
  { name: 'Adelaide', country: 'Australia', tz: 'Australia/Adelaide', lat: -34.9, lon: 138.6, kind: 'outlier' },

  // UTC +10
  { name: 'Sydney', country: 'Australia', tz: 'Australia/Sydney', lat: -33.9, lon: 151.2, kind: 'major' },
  { name: 'Brisbane', country: 'Australia', tz: 'Australia/Brisbane', lat: -27.5, lon: 153.0, kind: 'major' },
  { name: 'Vladivostok', country: 'Russia', tz: 'Asia/Vladivostok', lat: 43.1, lon: 131.9, kind: 'major' },

  // UTC +11
  { name: 'Nouméa', country: 'New Caledonia', tz: 'Pacific/Noumea', lat: -22.3, lon: 166.5, kind: 'capital' },

  // UTC +12
  { name: 'Auckland', country: 'New Zealand', tz: 'Pacific/Auckland', lat: -36.8, lon: 174.8, kind: 'capital' },
  { name: 'Suva', country: 'Fiji', tz: 'Pacific/Fiji', lat: -18.1, lon: 178.4, kind: 'capital' },

  // UTC +12:45
  { name: 'Chatham Islands', country: 'New Zealand', tz: 'Pacific/Chatham', lat: -43.9, lon: -176.5, kind: 'outlier' },

  // UTC +13
  { name: "Nuku'alofa", country: 'Tonga', tz: 'Pacific/Tongatapu', lat: -21.1, lon: -175.2, kind: 'capital' },

  // UTC +14
  { name: 'Kiritimati', country: 'Kiribati', tz: 'Pacific/Kiritimati', lat: 1.9, lon: -157.5, kind: 'outlier' },
];
