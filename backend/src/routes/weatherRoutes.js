import { Router } from 'express';
import { fetchFullWeather, searchCities, getIndiaStatesOverview } from '../services/weatherService.js';
import { getRainViewerRadar } from '../services/rainViewerService.js';
import { reverseGeocodeIndianCity } from '../services/citySearchService.js';
import { INDIAN_MAJOR_CITIES } from '../data/indianCities.js';

const router = Router();

// Full Weather + AQI + IMD Alerts + Hourly + Daily
router.get('/weather', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 28.6139; // Default New Delhi
    const lon = parseFloat(req.query.lon) || 77.2090;
    const cityName = req.query.city || 'New Delhi';
    const stateName = req.query.state || 'Delhi';

    const data = await fetchFullWeather({ lat, lon, cityName, stateName });
    res.json({ success: true, data });
  } catch (err) {
    console.error('Weather route error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch weather data' });
  }
});

// Search Indian cities
router.get('/cities/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const results = await searchCities(query);
    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    console.error('City search error:', err);
    res.status(500).json({ success: false, error: 'Failed to search cities' });
  }
});

// Reverse Geocode coordinates to Indian city/town
router.get('/cities/reverse', async (req, res) => {
  try {
    const lat = req.query.lat;
    const lon = req.query.lon;
    if (!lat || !lon) {
      return res.status(400).json({ success: false, error: 'lat and lon parameters are required' });
    }
    const data = await reverseGeocodeIndianCity(lat, lon);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    res.status(500).json({ success: false, error: 'Failed to reverse geocode location' });
  }
});

// All Indian Major Cities List
router.get('/cities/popular', (req, res) => {
  res.json({ success: true, count: INDIAN_MAJOR_CITIES.length, data: INDIAN_MAJOR_CITIES });
});

// All-India Regional Overview (Metros & Capitals)
router.get('/india/overview', async (req, res) => {
  try {
    const overview = await getIndiaStatesOverview();
    res.json({ success: true, count: overview.length, data: overview });
  } catch (err) {
    console.error('India overview error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch India overview' });
  }
});

// RainViewer Radar Tiles Info
router.get('/radar', async (req, res) => {
  try {
    const radar = await getRainViewerRadar();
    res.json({ success: true, data: radar });
  } catch (err) {
    console.error('Radar route error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch radar feed' });
  }
});

export default router;
