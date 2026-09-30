import React from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Wind
} from 'lucide-react';

export default function WeatherIcon({ code, isDay = true, className = "w-8 h-8", style = {} }) {
  if (code === 0) {
    return <Sun className={`${className} text-amber-400`} style={style} />;
  }
  if (code === 1 || code === 2) {
    return <CloudSun className={`${className} text-yellow-300`} style={style} />;
  }
  if (code === 3) {
    return <Cloud className={`${className} text-slate-300`} style={style} />;
  }
  if (code === 45 || code === 48) {
    return <CloudFog className={`${className} text-slate-400`} style={style} />;
  }
  if ([51, 53, 55, 56, 57].includes(code)) {
    return <CloudDrizzle className={`${className} text-cyan-400`} style={style} />;
  }
  if ([61, 63, 65, 80, 81, 82].includes(code)) {
    return <CloudRain className={`${className} text-blue-400`} style={style} />;
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return <CloudSnow className={`${className} text-indigo-200`} style={style} />;
  }
  if ([95, 96, 99].includes(code)) {
    return <CloudLightning className={`${className} text-yellow-400 animate-pulse`} style={style} />;
  }

  return <Sun className={`${className} text-amber-400`} style={style} />;
}
