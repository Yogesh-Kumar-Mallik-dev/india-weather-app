import axios from 'axios';
import { City } from 'country-state-city';

// In-memory cache for PIN code lookups (24-hour TTL)
const pincodeCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Lazy-loaded Indian cities index from country-state-city
let indianCitiesMap = null;
function getIndianCitiesMap() {
  if (!indianCitiesMap) {
    indianCitiesMap = new Map();
    const cities = City.getCitiesOfCountry('IN') || [];
    for (const c of cities) {
      const key = c.name.toLowerCase().trim();
      if (!indianCitiesMap.has(key)) {
        indianCitiesMap.set(key, {
          name: c.name,
          state: c.stateCode,
          lat: parseFloat(c.latitude),
          lon: parseFloat(c.longitude)
        });
      }
    }
  }
  return indianCitiesMap;
}

/**
 * Resolve an Indian PIN code to location, district, state, and coordinates
 * @param {string} pincode - 6-digit Indian Postal Code
 */
export async function lookupIndianPincode(pincode) {
  const pin = String(pincode).trim();
  if (!/^[1-9][0-9]{5}$/.test(pin)) {
    return null;
  }

  // Check cache
  const cached = pincodeCache.get(pin);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    // Query both Nominatim (for precise lat/lon) and India Post API (for official post office and district details)
    const [nomRes, postRes] = await Promise.allSettled([
      axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          postalcode: pin,
          country: 'India',
          format: 'json'
        },
        headers: {
          'User-Agent': 'MausamBharat/2.0 (National Weather Portal)'
        },
        timeout: 4500
      }),
      axios.get(`https://api.postalpincode.in/pincode/${pin}`, {
        timeout: 4500
      })
    ]);

    let lat = null;
    let lon = null;
    let displayName = '';

    if (nomRes.status === 'fulfilled' && Array.isArray(nomRes.value.data) && nomRes.value.data.length > 0) {
      const topMatch = nomRes.value.data[0];
      lat = parseFloat(topMatch.lat);
      lon = parseFloat(topMatch.lon);
      displayName = topMatch.display_name || '';
    }

    let district = '';
    let state = '';
    let postOffices = [];

    if (postRes.status === 'fulfilled' && Array.isArray(postRes.value.data) && postRes.value.data[0]?.Status === 'Success') {
      const offices = postRes.value.data[0].PostOffice || [];
      district = offices[0]?.District || offices[0]?.Division || '';
      state = offices[0]?.State || '';
      postOffices = offices.map(o => ({
        name: o.Name,
        branchType: o.BranchType,
        deliveryStatus: o.DeliveryStatus,
        district: o.District || district,
        state: o.State || state
      }));
    }

    // Fallback: If Nominatim didn't return coordinates, find nearest district/city in local database
    if ((lat == null || lon == null) && district) {
      const citiesMap = getIndianCitiesMap();
      const match = citiesMap.get(district.toLowerCase().trim());
      if (match) {
        lat = match.lat;
        lon = match.lon;
      }
    }

    // If still missing coordinates, default to standard Delhi coordinates or return null
    if (lat == null || lon == null) {
      return null;
    }

    const primaryArea = postOffices[0]?.name || district || `PIN ${pin}`;

    const result = {
      pincode: pin,
      name: `${primaryArea} (${pin})`,
      locality: primaryArea,
      district: district || primaryArea,
      state: state || 'India',
      region: 'India',
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4)),
      tag: `PIN ${pin}`,
      isIndia: true,
      isPincode: true,
      score: 1.0,
      postOffices: postOffices.slice(0, 10).map(p => p.name)
    };

    // Cache the result
    pincodeCache.set(pin, { timestamp: Date.now(), data: result });
    return result;
  } catch (err) {
    console.error(`Pincode lookup error for ${pin}:`, err.message);
    return null;
  }
}
