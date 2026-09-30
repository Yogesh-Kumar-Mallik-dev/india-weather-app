/**
 * India CPCB (Central Pollution Control Board) NAQI Breakpoints
 * PM2.5 (ug/m3):
 * 0 - 30      -> Good (0 - 50)
 * 31 - 60     -> Satisfactory (51 - 100)
 * 61 - 90     -> Moderate (101 - 200)
 * 91 - 120    -> Poor (201 - 300)
 * 121 - 250   -> Very Poor (301 - 400)
 * 250+        -> Severe (401 - 500)
 *
 * PM10 (ug/m3):
 * 0 - 50      -> Good (0 - 50)
 * 51 - 100    -> Satisfactory (51 - 100)
 * 101 - 250   -> Moderate (101 - 200)
 * 251 - 350   -> Poor (201 - 300)
 * 351 - 430   -> Very Poor (301 - 400)
 * 430+        -> Severe (401 - 500)
 */

function calculateSubIndex(conc, breakpoints) {
  if (conc == null || isNaN(conc) || conc < 0) return null;
  for (const bp of breakpoints) {
    if (conc <= bp.cHigh) {
      const idx = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (conc - bp.cLow) + bp.iLow;
      return Math.round(idx);
    }
  }
  // Above highest breakpoint
  return 500;
}

const PM25_BREAKPOINTS = [
  { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
  { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
  { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
  { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
  { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
  { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 }
];

const PM10_BREAKPOINTS = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
  { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
  { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
  { cLow: 431, cHigh: 600, iLow: 401, iHigh: 500 }
];

export function calculateIndianAQI(pm2_5, pm10) {
  const pm25Sub = calculateSubIndex(pm2_5, PM25_BREAKPOINTS);
  const pm10Sub = calculateSubIndex(pm10, PM10_BREAKPOINTS);

  const subIndices = [pm25Sub, pm10Sub].filter((x) => x !== null);
  const aqi = subIndices.length > 0 ? Math.max(...subIndices) : null;

  return getIndianAQICategory(aqi);
}

export function getIndianAQICategory(aqi) {
  if (aqi == null) {
    return {
      aqi: null,
      category: 'Unknown',
      color: '#9ca3af',
      textColor: '#ffffff',
      advisory: 'Air quality data is currently pending measurement.',
      healthImpact: 'No data'
    };
  }

  if (aqi <= 50) {
    return {
      aqi,
      category: 'Good',
      color: '#22c55e', // Green
      textColor: '#ffffff',
      advisory: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
      healthImpact: 'Minimal impact. Ideal for outdoor exercises and walks.'
    };
  } else if (aqi <= 100) {
    return {
      aqi,
      category: 'Satisfactory',
      color: '#84cc16', // Lime
      textColor: '#ffffff',
      advisory: 'Acceptable air quality; minor breathing discomfort to sensitive people.',
      healthImpact: 'Minor breathing discomfort to sensitive people.'
    };
  } else if (aqi <= 200) {
    return {
      aqi,
      category: 'Moderate',
      color: '#eab308', // Yellow
      textColor: '#000000',
      advisory: 'Breathing discomfort to people with lungs, asthma, and heart diseases.',
      healthImpact: 'Sensitive individuals should limit prolonged outdoor exertion.'
    };
  } else if (aqi <= 300) {
    return {
      aqi,
      category: 'Poor',
      color: '#f97316', // Orange
      textColor: '#ffffff',
      advisory: 'Breathing discomfort to most people on prolonged exposure.',
      healthImpact: 'Wear an N95 mask outside. Avoid early morning / evening jogs.'
    };
  } else if (aqi <= 400) {
    return {
      aqi,
      category: 'Very Poor',
      color: '#ef4444', // Red
      textColor: '#ffffff',
      advisory: 'Respiratory illness to the people on prolonged exposure. Significant hazard.',
      healthImpact: 'Avoid outdoor activities. Keep windows closed and run air purifiers.'
    };
  } else {
    return {
      aqi,
      category: 'Severe',
      color: '#7f1d1d', // Dark Maroon
      textColor: '#ffffff',
      advisory: 'Affects healthy people and seriously impacts those with existing diseases.',
      healthImpact: 'Health emergency conditions. Extreme vulnerability. Stay indoors strictly.'
    };
  }
}
