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
