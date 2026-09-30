export const WMO_WEATHER_MAP = {
  0: { label: 'Clear Sky', icon: 'sun', description: 'Sunny and completely clear', monsoonAlert: false },
  1: { label: 'Mainly Clear', icon: 'sun-cloud', description: 'Mostly clear with minimal clouds', monsoonAlert: false },
  2: { label: 'Partly Cloudy', icon: 'cloud-sun', description: 'Scattered clouds', monsoonAlert: false },
  3: { label: 'Overcast', icon: 'cloud', description: 'Dense cloud cover across sky', monsoonAlert: false },
  45: { label: 'Foggy (Kohra)', icon: 'cloud-fog', description: 'Dense fog reducing visibility', monsoonAlert: false },
  48: { label: 'Depositing Rime Fog', icon: 'cloud-fog', description: 'Freezing fog depositing ice crystals', monsoonAlert: false },
  51: { label: 'Light Drizzle', icon: 'cloud-drizzle', description: 'Gentle light rain drizzle (Boondabaandi)', monsoonAlert: false },
  53: { label: 'Moderate Drizzle', icon: 'cloud-drizzle', description: 'Continuous light drizzle', monsoonAlert: false },
  55: { label: 'Dense Drizzle', icon: 'cloud-drizzle', description: 'Heavy drizzle soaking ground', monsoonAlert: false },
  56: { label: 'Freezing Drizzle (Light)', icon: 'cloud-snow', description: 'Light freezing drizzle', monsoonAlert: false },
  57: { label: 'Freezing Drizzle (Dense)', icon: 'cloud-snow', description: 'Dense freezing drizzle', monsoonAlert: false },
  61: { label: 'Slight Rain', icon: 'cloud-rain', description: 'Light rainfall (Rimjhim Barish)', monsoonAlert: true },
  63: { label: 'Moderate Rain', icon: 'cloud-rain', description: 'Moderate continuous rain', monsoonAlert: true },
  65: { label: 'Heavy Rain', icon: 'cloud-lightning-rain', description: 'Heavy monsoon-grade downpour (Musaladhar Barish)', monsoonAlert: true },
  66: { label: 'Freezing Rain (Light)', icon: 'cloud-snow', description: 'Light freezing rain', monsoonAlert: false },
  67: { label: 'Freezing Rain (Heavy)', icon: 'cloud-snow', description: 'Heavy freezing rain', monsoonAlert: false },
  71: { label: 'Slight Snowfall', icon: 'snowflake', description: 'Light snow flurry (Himalayan regions)', monsoonAlert: false },
  73: { label: 'Moderate Snowfall', icon: 'snowflake', description: 'Steady snowfall', monsoonAlert: false },
  75: { label: 'Heavy Snowfall', icon: 'snowflake', description: 'Heavy blizzard-like snowfall', monsoonAlert: false },
  77: { label: 'Snow Grains', icon: 'snowflake', description: 'Small grains of frozen snow', monsoonAlert: false },
  80: { label: 'Slight Rain Showers', icon: 'cloud-rain', description: 'Passing light showers', monsoonAlert: true },
  81: { label: 'Moderate Rain Showers', icon: 'cloud-rain', description: 'Passing moderate rain showers', monsoonAlert: true },
  82: { label: 'Violent Rain Showers', icon: 'cloud-lightning-rain', description: 'Intense cloudburst-style showers', monsoonAlert: true },
  85: { label: 'Slight Snow Showers', icon: 'snowflake', description: 'Brief snow showers', monsoonAlert: false },
  86: { label: 'Heavy Snow Showers', icon: 'snowflake', description: 'Intense snow showers', monsoonAlert: false },
  95: { label: 'Thunderstorm', icon: 'zap', description: 'Thunderstorm with lightning (Bijli & Garaj)', monsoonAlert: true },
  96: { label: 'Thunderstorm with Slight Hail', icon: 'cloud-hail', description: 'Thunderstorm with small hailstones (Ole)', monsoonAlert: true },
  99: { label: 'Thunderstorm with Heavy Hail', icon: 'cloud-hail', description: 'Severe thunderstorm with damaging hailstones', monsoonAlert: true }
};

export function getWeatherMeta(code) {
  return WMO_WEATHER_MAP[code] || {
    label: 'Unknown Weather',
    icon: 'cloud',
    description: 'Condition data currently updating',
    monsoonAlert: false
  };
}
