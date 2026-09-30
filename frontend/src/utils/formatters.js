export function formatTemp(celsius, unit = 'C') {
  if (celsius == null || isNaN(celsius)) return '--';
  if (unit === 'F') {
    return `${Math.round((celsius * 9) / 5 + 32)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

export function formatWind(kmh, unit = 'km/h') {
  if (kmh == null || isNaN(kmh)) return '--';
  if (unit === 'm/s') {
    return `${(kmh / 3.6).toFixed(1)} m/s`;
  }
  if (unit === 'mph') {
    return `${(kmh * 0.621371).toFixed(1)} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

export function formatTime(isoString, includeDate = false) {
  if (!isoString) return '--';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;

  if (includeDate) {
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatDay(isoString) {
  if (!isoString) return '--';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

export function getWindDirection(deg) {
  if (deg == null) return 'N/A';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

export function getUvCategory(uv) {
  if (uv == null) return { level: 'Unknown', color: '#9ca3af' };
  if (uv <= 2) return { level: 'Low', color: '#22c55e', text: 'Minimal sun protection required.' };
  if (uv <= 5) return { level: 'Moderate', color: '#eab308', text: 'Wear sunglasses, apply SPF 30+ sunscreen.' };
  if (uv <= 7) return { level: 'High', color: '#f97316', text: 'Seek shade during midday. Wear protective clothing.' };
  if (uv <= 10) return { level: 'Very High', color: '#ef4444', text: 'Extra precaution needed. Minimize midday sun.' };
  return { level: 'Extreme', color: '#7c3aed', text: 'Avoid outdoor sun exposure around solar noon.' };
}

// Lunar Phase Calculator based on date
export function getMoonPhase(date = new Date()) {
  const d = new Date(date);
  let year = d.getFullYear();
  let month = d.getMonth() + 1;
  const day = d.getDate();

  if (month < 3) {
    year--;
    month += 12;
  }

  const a = Math.floor(year / 100);
  const b = Math.floor(a / 4);
  const c = 2 - a + b;
  const e = Math.floor(365.25 * (year + 4716));
  const f = Math.floor(30.6001 * (month + 1));
  const jd = c + day + e + f - 1524.5;
  const daysSinceNew = (jd - 2451549.5) % 29.53058867;
  const phase = daysSinceNew < 0 ? daysSinceNew + 29.53058867 : daysSinceNew;

  if (phase < 1.84566) return { name: 'New Moon', icon: '🌑' };
  if (phase < 5.53699) return { name: 'Waxing Crescent', icon: '🌒' };
  if (phase < 9.22831) return { name: 'First Quarter', icon: '🌓' };
  if (phase < 12.91963) return { name: 'Waxing Gibbous', icon: '🌔' };
  if (phase < 16.61096) return { name: 'Full Moon', icon: '🌕' };
  if (phase < 20.30228) return { name: 'Waning Gibbous', icon: '🌖' };
  if (phase < 23.99361) return { name: 'Last Quarter', icon: '🌗' };
  if (phase < 27.68493) return { name: 'Waning Crescent', icon: '🌘' };
  return { name: 'New Moon', icon: '🌑' };
}

export function getPressureTendency(pressure) {
  if (pressure == null) return 'Steady';
  if (pressure >= 1014) return 'High Pressure • Clear';
  if (pressure <= 1005) return 'Low Pressure • Rain Risk';
  return 'Normal • Steady';
}
