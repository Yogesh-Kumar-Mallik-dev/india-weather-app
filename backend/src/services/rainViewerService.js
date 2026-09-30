import axios from 'axios';
import { RAINVIEWER_BASE } from '../config.js';

let cachedRadar = null;
let lastFetchTime = 0;
const RADAR_CACHE_DURATION = 5 * 60 * 1000; // 5 mins

export async function getRainViewerRadar() {
  const now = Date.now();
  if (cachedRadar && (now - lastFetchTime) < RADAR_CACHE_DURATION) {
    return cachedRadar;
  }

  try {
    const res = await axios.get(`${RAINVIEWER_BASE}/weather-maps.json`, { timeout: 8000 });
    const data = res.data;
    const host = data.host || 'https://tilecache.rainviewer.com';
    const past = data.radar?.past || [];
    const nowcast = data.radar?.nowcast || [];

    // Most recent radar frame
    const latestFrame = past.length > 0 ? past[past.length - 1] : null;

    cachedRadar = {
      host,
      latestFrame,
      past,
      nowcast,
      tilePattern: latestFrame ? `${host}${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png` : null,
      generated: data.generated
    };
    lastFetchTime = now;
    return cachedRadar;
  } catch (err) {
    console.error('Error fetching RainViewer data:', err.message);
    return cachedRadar || {
      host: 'https://tilecache.rainviewer.com',
      latestFrame: null,
      past: [],
      nowcast: [],
      tilePattern: null,
      error: 'Radar feed temporarily unavailable'
    };
  }
}
