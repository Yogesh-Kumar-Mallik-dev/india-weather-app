import axios from 'axios';
import { OPEN_METEO_BASE, AIR_QUALITY_BASE, GEOCODING_BASE } from '../config.js';
import { getWeatherMeta } from '../utils/weatherCodes.js';
import { calculateIndianAQI } from '../utils/aqiCalculator.js';
import { INDIAN_MAJOR_CITIES } from '../data/indianCities.js';
import { scoreCityMatch, cleanSearchQuery } from '../utils/fuzzyMatcher.js';
import { fuzzyFindIndianCities } from './citySearchService.js';
import { lookupIndianPincode } from './pincodeService.js';

// Simple in-memory cache to prevent spamming secretless APIs
const cache = new Map();
const CACHE_TTL = 8 * 60 * 1000; // 8 minutes

function getCached(key) {
  const item = cache.get(key);
  if (item && (Date.now() - item.timestamp) < CACHE_TTL) {
    return item.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { timestamp: Date.now(), data });
}

export async function fetchFullWeather({ lat, lon, cityName, stateName, pincode }) {
  const extractedPin = pincode || (cityName ? String(cityName).match(/\b([1-9][0-9]{5})\b/)?.[1] : undefined);
  const cacheKey = `weather_${Number(lat).toFixed(3)}_${Number(lon).toFixed(3)}_${extractedPin || ''}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const weatherUrl = `${OPEN_METEO_BASE}/forecast`;
  const weatherParams = {
    latitude: lat,
    longitude: lon,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'rain',
      'showers',
      'snowfall',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m'
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'dew_point_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'rain',
      'weather_code',
      'pressure_msl',
      'cloud_cover',
      'visibility',
      'wind_speed_10m',
      'wind_direction_10m',
      'uv_index',
      'is_day'
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'sunrise',
      'sunset',
      'daylight_duration',
      'sunshine_duration',
      'uv_index_max',
      'precipitation_sum',
      'rain_sum',
      'showers_sum',
      'precipitation_hours',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'wind_direction_10m_dominant'
    ].join(','),
    timezone: 'Asia/Kolkata',
    forecast_days: 14
  };

  const aqiUrl = `${AIR_QUALITY_BASE}/air-quality`;
  const aqiParams = {
    latitude: lat,
    longitude: lon,
    current: [
      'european_aqi',
      'us_aqi',
      'pm10',
      'pm2_5',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'ozone',
      'dust',
      'uv_index'
    ].join(','),
    hourly: [
      'pm10',
      'pm2_5',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'ozone',
      'dust',
      'uv_index',
      'us_aqi'
    ].join(','),
    timezone: 'Asia/Kolkata',
    forecast_days: 7
  };

  const [weatherRes, aqiRes] = await Promise.all([
    axios.get(weatherUrl, { params: weatherParams, timeout: 10000 }),
    axios.get(aqiUrl, { params: aqiParams, timeout: 10000 }).catch(err => {
      console.warn('AQI fetch warning:', err.message);
      return { data: { current: {}, hourly: {} } };
    })
  ]);

  const rawWeather = weatherRes.data;
  const rawAqi = aqiRes.data;

  // Process Current Weather
  const cur = rawWeather.current || {};
  const weatherMeta = getWeatherMeta(cur.weather_code);
  const curAqi = rawAqi.current || {};

  const indianAqi = calculateIndianAQI(curAqi.pm2_5, curAqi.pm10);

  // Compute IMD & Extreme Alerts
  const alerts = generateAlerts({
    current: cur,
    weatherMeta,
    daily: rawWeather.daily,
    indianAqi,
    cityName: cityName || 'Location'
  });

  // Format 48-Hour Hourly Data
  const hourlyTimes = rawWeather.hourly?.time || [];
  const hourlyCount = Math.min(hourlyTimes.length, 48);
  const hourlyList = [];
  for (let i = 0; i < hourlyCount; i++) {
    const code = rawWeather.hourly.weather_code?.[i];
    hourlyList.push({
      time: hourlyTimes[i],
      temp: rawWeather.hourly.temperature_2m?.[i],
      apparentTemp: rawWeather.hourly.apparent_temperature?.[i],
      humidity: rawWeather.hourly.relative_humidity_2m?.[i],
      dewPoint: rawWeather.hourly.dew_point_2m?.[i],
      precipProb: rawWeather.hourly.precipitation_probability?.[i] ?? 0,
      precipitation: rawWeather.hourly.precipitation?.[i] ?? 0,
      weatherCode: code,
      weatherMeta: getWeatherMeta(code),
      pressure: rawWeather.hourly.pressure_msl?.[i],
      cloudCover: rawWeather.hourly.cloud_cover?.[i],
      visibility: rawWeather.hourly.visibility?.[i] ? (rawWeather.hourly.visibility[i] / 1000).toFixed(1) : null,
      windSpeed: rawWeather.hourly.wind_speed_10m?.[i],
      windDirection: rawWeather.hourly.wind_direction_10m?.[i],
      uvIndex: rawWeather.hourly.uv_index?.[i],
      isDay: rawWeather.hourly.is_day?.[i] === 1,
      pm2_5: rawAqi.hourly?.pm2_5?.[i] ?? null,
      pm10: rawAqi.hourly?.pm10?.[i] ?? null,
      usAqi: rawAqi.hourly?.us_aqi?.[i] ?? null
    });
  }

  // Format 14-Day Daily Data
  const dailyTimes = rawWeather.daily?.time || [];
  const dailyList = [];
  for (let i = 0; i < dailyTimes.length; i++) {
    const code = rawWeather.daily.weather_code?.[i];
    dailyList.push({
      date: dailyTimes[i],
      weatherCode: code,
      weatherMeta: getWeatherMeta(code),
      tempMax: rawWeather.daily.temperature_2m_max?.[i],
      tempMin: rawWeather.daily.temperature_2m_min?.[i],
      apparentMax: rawWeather.daily.apparent_temperature_max?.[i],
      apparentMin: rawWeather.daily.apparent_temperature_min?.[i],
      sunrise: rawWeather.daily.sunrise?.[i],
      sunset: rawWeather.daily.sunset?.[i],
      daylightHours: rawWeather.daily.daylight_duration?.[i] ? (rawWeather.daily.daylight_duration[i] / 3600).toFixed(1) : null,
      sunshineHours: rawWeather.daily.sunshine_duration?.[i] ? (rawWeather.daily.sunshine_duration[i] / 3600).toFixed(1) : null,
      uvIndexMax: rawWeather.daily.uv_index_max?.[i],
      precipSum: rawWeather.daily.precipitation_sum?.[i] ?? 0,
      precipProbMax: rawWeather.daily.precipitation_probability_max?.[i] ?? 0,
      windSpeedMax: rawWeather.daily.wind_speed_10m_max?.[i],
      windGustsMax: rawWeather.daily.wind_gusts_10m_max?.[i],
      windDirectionDominant: rawWeather.daily.wind_direction_10m_dominant?.[i]
    });
  }

  const payload = {
    location: {
      name: cityName || 'Custom Coordinates',
      state: stateName || '',
      country: 'India',
      pincode: extractedPin || undefined,
      lat: Number(lat),
      lon: Number(lon),
      elevation: rawWeather.elevation,
      timezone: rawWeather.timezone,
      timezoneAbbr: rawWeather.timezone_abbreviation
    },
    current: {
      time: cur.time,
      temp: cur.temperature_2m,
      apparentTemp: cur.apparent_temperature,
      isDay: cur.is_day === 1,
      weatherCode: cur.weather_code,
      weatherMeta,
      humidity: cur.relative_humidity_2m,
      pressureMsl: cur.pressure_msl,
      surfacePressure: cur.surface_pressure,
      cloudCover: cur.cloud_cover,
      precipitation: cur.precipitation,
      rain: cur.rain,
      showers: cur.showers,
      snowfall: cur.snowfall,
      windSpeed: cur.wind_speed_10m,
      windDirection: cur.wind_direction_10m,
      windGusts: cur.wind_gusts_10m,
      // Air quality snapshot
      airQuality: {
        indian: indianAqi,
        usAqi: curAqi.us_aqi,
        europeanAqi: curAqi.european_aqi,
        pm2_5: curAqi.pm2_5,
        pm10: curAqi.pm10,
        nitrogenDioxide: curAqi.nitrogen_dioxide,
        sulphurDioxide: curAqi.sulphur_dioxide,
        carbonMonoxide: curAqi.carbon_monoxide,
        ozone: curAqi.ozone,
        dust: curAqi.dust,
        uvIndex: curAqi.uv_index
      }
    },
    alerts,
    hourly: hourlyList,
    daily: dailyList,
    metadata: {
      source: 'Mausam Bharat National Meteorological Telemetry (CPCB & IMD Protocols)',
      updatedAt: new Date().toISOString()
    }
  };

  setCache(cacheKey, payload);
  return payload;
}

function generateAlerts({ current, weatherMeta, daily, indianAqi, cityName }) {
  const alerts = [];
  const today = daily && daily.temperature_2m_max ? {
    tempMax: daily.temperature_2m_max[0],
    tempMin: daily.temperature_2m_min[0],
    precipSum: daily.precipitation_sum?.[0] ?? 0,
    windGustsMax: daily.wind_gusts_10m_max?.[0] ?? 0
  } : {};

  // 1. Heatwave (IMD Criteria: Max temp >= 40°C in plains, or severe >= 45°C)
  const maxT = today.tempMax || current.temperature_2m;
  if (maxT >= 45) {
    alerts.push({
      level: 'severe',
      badge: 'IMD Red Alert',
      title: 'Severe Heatwave / Loo Conditions',
      message: `Extreme maximum temperatures peaking at ${maxT}°C. High danger of heatstroke and dehydration. Avoid direct afternoon exposure between 12 PM - 4 PM.`,
      icon: 'flame'
    });
  } else if (maxT >= 40) {
    alerts.push({
      level: 'warning',
      badge: 'IMD Orange Alert',
      title: 'Heatwave Alert',
      message: `Temperatures elevated at ${maxT}°C. Stay well hydrated with water, ORS, or traditional nimbu paani / chaas. Wear loose cotton clothes.`,
      icon: 'sun'
    });
  }

  // 2. Heavy Rainfall / Monsoon Downpour (IMD Criteria: >= 64.5 mm)
  if (today.precipSum >= 64.5 || (current.rain && current.rain > 15)) {
    alerts.push({
      level: 'severe',
      badge: 'IMD Heavy Rainfall Warning',
      title: 'Heavy to Very Heavy Monsoon Downpour',
      message: `Forecast precipitation indicates high rainfall accumulation (${today.precipSum} mm). Risk of localized waterlogging and traffic disruptions.`,
      icon: 'cloud-lightning-rain'
    });
  } else if (today.precipSum >= 30) {
    alerts.push({
      level: 'warning',
      badge: 'IMD Yellow Alert',
      title: 'Moderate to Heavy Showers Anticipated',
      message: `Expected accumulation of ~${today.precipSum} mm. Carry an umbrella and plan commutes accordingly.`,
      icon: 'cloud-rain'
    });
  }

  // 3. Air Quality Emergency
  if (indianAqi.category === 'Severe') {
    alerts.push({
      level: 'severe',
      badge: 'Severe AQI Alert',
      title: 'Hazardous Air Quality Level',
      message: `Air Quality Index is Severe (${indianAqi.aqi}). Prolonged outdoor exposure can severely affect healthy respiratory systems. Use certified N95 masks and run HEPA air purifiers indoors.`,
      icon: 'alert-triangle'
    });
  } else if (indianAqi.category === 'Very Poor') {
    alerts.push({
      level: 'warning',
      badge: 'Very Poor AQI',
      title: 'Very Poor Air Quality',
      message: `Air Quality Index is Very Poor (${indianAqi.aqi}). Children, elderly, and those with asthma or cardiac ailments should strictly stay indoors.`,
      icon: 'alert-circle'
    });
  }

  // 4. Squall / High Wind Warning
  const windG = today.windGustsMax || current.wind_gusts_10m || 0;
  if (windG >= 55) {
    alerts.push({
      level: 'warning',
      badge: 'High Wind / Squall Warning',
      title: 'Severe Wind Gusts Detected',
      message: `Wind gusts reaching ${windG} km/h. Watch out for loose hoardings, tree branches, and temporary structures.`,
      icon: 'wind'
    });
  }

  // 5. Fog / Kohra
  if (current.weather_code === 45 || current.weather_code === 48) {
    alerts.push({
      level: 'info',
      badge: 'IMD Dense Fog Advisory',
      title: 'Dense Fog / Kohra Warning',
      message: 'Visibility severely impaired. Drive cautiously with low beam headlights and hazard lamps.',
      icon: 'cloud-fog'
    });
  }

  return alerts;
}

export async function searchCities(query) {
  if (!query || query.trim().length === 0) {
    return fuzzyFindIndianCities('', 10);
  }

  const trimmed = query.trim();

  // 1. Indian PIN Code Detection (e.g. 110001, 560001, or "PIN 110001")
  const pinMatch = trimmed.match(/\b([1-9][0-9]{5})\b/);
  let pincodeResults = [];
  if (pinMatch) {
    const pin = pinMatch[1];
    const pinData = await lookupIndianPincode(pin);
    if (pinData) {
      pincodeResults.push({
        name: `${pinData.locality || pinData.district} (${pin})`,
        city: pinData.locality,
        district: pinData.district,
        state: pinData.state,
        pincode: pin,
        region: 'India',
        lat: pinData.lat,
        lon: pinData.lon,
        tag: `PIN ${pin}`,
        isIndia: true,
        isPincode: true,
        score: 0.05
      });

      // Include up to 3 major sub-post offices if available
      if (Array.isArray(pinData.postOffices)) {
        for (const po of pinData.postOffices.slice(0, 3)) {
          if (po !== pinData.locality) {
            pincodeResults.push({
              name: `${po}, ${pinData.district} (${pin})`,
              city: po,
              district: pinData.district,
              state: pinData.state,
              pincode: pin,
              region: 'India',
              lat: pinData.lat,
              lon: pinData.lon,
              tag: `PIN ${pin}`,
              isIndia: true,
              isPincode: true,
              score: 0.1
            });
          }
        }
      }
    }
  }

  // If user searched exclusively for a 6-digit PIN code and results were found
  if (/^[1-9][0-9]{5}$/.test(trimmed) && pincodeResults.length > 0) {
    return pincodeResults;
  }

  // 2. Search using maintained country-state-city database (4,242 cities) and Fuse.js
  const fuseMatches = fuzzyFindIndianCities(trimmed, 10);

  if (pincodeResults.length > 0) {
    return [...pincodeResults, ...fuseMatches.slice(0, 10 - pincodeResults.length)];
  }

  if (fuseMatches.length >= 3 && fuseMatches[0].score <= 0.3) {
    return fuseMatches;
  }

  // 3. Secondary fallback to Open-Meteo Geocoding API for hyper-local villages / tehsils
  try {
    const geoUrl = `${GEOCODING_BASE}/search`;
    const res = await axios.get(geoUrl, {
      params: {
        name: trimmed,
        count: 10,
        language: 'en',
        format: 'json'
      },
      timeout: 5000
    });

    const results = res.data.results || [];
    const formatted = results.map(r => ({
      name: r.name,
      state: r.admin1 || r.country || '',
      region: r.country_code === 'IN' ? 'India' : (r.country || ''),
      lat: r.latitude,
      lon: r.longitude,
      tag: r.country_code === 'IN' ? (r.admin1 || 'India') : r.country,
      isIndia: r.country_code === 'IN',
      score: r.country_code === 'IN' ? 0.2 : 0.6
    }));

    const combined = [...pincodeResults, ...fuseMatches];
    for (const item of formatted) {
      if (!combined.some(c => Math.abs(c.lat - item.lat) < 0.05 && Math.abs(c.lon - item.lon) < 0.05)) {
        combined.push(item);
      }
    }

    return combined.slice(0, 10);
  } catch (err) {
    return [...pincodeResults, ...fuseMatches].slice(0, 10);
  }
}

export async function getIndiaStatesOverview() {
  const cacheKey = 'india_states_overview';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Key representative cities across Indian zones
  const overviewCities = [
    { name: 'New Delhi', state: 'Delhi', region: 'North', lat: 28.6139, lon: 77.2090 },
    { name: 'Mumbai', state: 'Maharashtra', region: 'West', lat: 19.0760, lon: 72.8777 },
    { name: 'Bengaluru', state: 'Karnataka', region: 'South', lat: 12.9716, lon: 77.5946 },
    { name: 'Kolkata', state: 'West Bengal', region: 'East', lat: 22.5726, lon: 88.3639 },
    { name: 'Chennai', state: 'Tamil Nadu', region: 'South', lat: 13.0827, lon: 80.2707 },
    { name: 'Hyderabad', state: 'Telangana', region: 'South', lat: 17.3850, lon: 78.4867 },
    { name: 'Ahmedabad', state: 'Gujarat', region: 'West', lat: 23.0225, lon: 72.5714 },
    { name: 'Jaipur', state: 'Rajasthan', region: 'North', lat: 26.9124, lon: 75.7873 },
    { name: 'Lucknow', state: 'Uttar Pradesh', region: 'North', lat: 26.8467, lon: 80.9462 },
    { name: 'Guwahati', state: 'Assam', region: 'Northeast', lat: 26.1445, lon: 91.7362 },
    { name: 'Srinagar', state: 'Jammu & Kashmir', region: 'North', lat: 34.0837, lon: 74.7973 },
    { name: 'Bhopal', state: 'Madhya Pradesh', region: 'Central', lat: 23.2599, lon: 77.4126 }
  ];

  // Batch coordinates request to Open-Meteo
  const lats = overviewCities.map(c => c.lat).join(',');
  const lons = overviewCities.map(c => c.lon).join(',');

  try {
    const [wRes, aqiRes] = await Promise.all([
      axios.get(`${OPEN_METEO_BASE}/forecast`, {
        params: {
          latitude: lats,
          longitude: lons,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
          timezone: 'Asia/Kolkata'
        },
        timeout: 10000
      }),
      axios.get(`${AIR_QUALITY_BASE}/air-quality`, {
        params: {
          latitude: lats,
          longitude: lons,
          current: 'pm2_5,pm10,us_aqi',
          timezone: 'Asia/Kolkata'
        },
        timeout: 10000
      }).catch(() => ({ data: [] }))
    ]);

    const weatherList = Array.isArray(wRes.data) ? wRes.data : [wRes.data];
    const aqiList = Array.isArray(aqiRes.data) ? aqiRes.data : [aqiRes.data];

    const result = overviewCities.map((city, idx) => {
      const wData = weatherList[idx]?.current || {};
      const aData = aqiList[idx]?.current || {};
      const weatherMeta = getWeatherMeta(wData.weather_code);
      const aqiMeta = calculateIndianAQI(aData.pm2_5, aData.pm10);

      return {
        ...city,
        temp: wData.temperature_2m,
        apparentTemp: wData.apparent_temperature,
        humidity: wData.relative_humidity_2m,
        windSpeed: wData.wind_speed_10m,
        weatherCode: wData.weather_code,
        weatherMeta,
        aqi: aqiMeta
      };
    });

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Error fetching India states overview:', err.message);
    return [];
  }
}
