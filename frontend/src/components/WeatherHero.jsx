import React, { useState, useEffect } from 'react';
import WeatherIcon from './WeatherIcon';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import {
  formatTemp,
  formatTime,
  formatWind,
  getWindDirection,
  getMoonPhase,
  getPressureTendency
} from '../utils/formatters';
import {
  MapPin,
  Sunrise,
  Sunset,
  ArrowUp,
  ArrowDown,
  CloudRain,
  Wind,
  Droplets,
  Calendar,
  Clock,
  Sparkles,
  Star,
  Share2,
  Check,
  Moon,
  Gauge
} from 'lucide-react';

export default function WeatherHero({ weather, unit }) {
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!weather) return null;

  const { location, current, daily, hourly } = weather;
  const todayDaily = daily?.[0] || {};
  const currentHourly = hourly?.[0] || {};

  // Check if current city is in favorites
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mausam_favorite_cities');
      if (stored) {
        const favs = JSON.parse(stored);
        setIsFavorite(favs.some((c) => c.name === location.name));
      }
    } catch (e) {
      console.warn(e);
    }
  }, [location.name]);

  const toggleFavorite = () => {
    try {
      const stored = localStorage.getItem('mausam_favorite_cities');
      let favs = stored ? JSON.parse(stored) : [];
      if (isFavorite) {
        favs = favs.filter((c) => c.name !== location.name);
        setIsFavorite(false);
      } else {
        favs.push({
          name: location.name,
          state: location.state,
          lat: location.lat,
          lon: location.lon
        });
        setIsFavorite(true);
      }
      localStorage.setItem('mausam_favorite_cities', JSON.stringify(favs));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleShare = () => {
    const text = `🌤️ Weather Report for ${location.name}, ${location.state}:\n` +
      `Temperature: ${formatTemp(current.temp, unit)} (Feels like ${formatTemp(current.apparentTemp, unit)})\n` +
      `Condition: ${current.weatherMeta?.label}\n` +
      `Rain Chance: ${todayDaily.precipProbMax ?? 0}%\n` +
      `CPCB AQI: ${current.airQuality?.indian?.aqi ?? 'N/A'} (${current.airQuality?.indian?.category})\n` +
      `Wind: ${formatWind(current.windSpeed)} ${getWindDirection(current.windDirection)}\n` +
      `Tracked via Mausam Bharat`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  // Daylight progress calculation
  let sunProgress = 50;
  if (todayDaily.sunrise && todayDaily.sunset) {
    const now = new Date().getTime();
    const sr = new Date(todayDaily.sunrise).getTime();
    const ss = new Date(todayDaily.sunset).getTime();
    if (now <= sr) sunProgress = 0;
    else if (now >= ss) sunProgress = 100;
    else sunProgress = Math.round(((now - sr) / (ss - sr)) * 100);
  }

  const indianAqi = current.airQuality?.indian;
  const moon = getMoonPhase();
  const dewPoint = currentHourly.dewPoint != null ? formatTemp(currentHourly.dewPoint, unit) : null;
  const pressureTendency = getPressureTendency(current.pressureMsl);

  return (
    <Card className="relative overflow-hidden border-border/80 shadow-2xl bg-gradient-to-br from-card/95 via-slate-900/90 to-indigo-950/80">
      {/* Decorative ambient radial glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulseGlow" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <CardContent className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Left Column: Location & Primary Temperature */}
          <div className="space-y-4 max-w-xl">
            {/* Location & Tags */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="saffron" className="flex items-center gap-1.5 px-3 py-1 font-bold">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{location.state ? `${location.state}, India` : 'India'}</span>
                </Badge>

                <Badge variant="outline" className="text-[11px] font-mono bg-secondary/40">
                  {location.lat.toFixed(2)}°N, {location.lon.toFixed(2)}°E
                </Badge>

                {indianAqi?.aqi != null && (
                  <Badge
                    variant="outline"
                    className="font-bold text-[11px]"
                    style={{ borderColor: `${indianAqi.color}50`, color: indianAqi.color }}
                  >
                    CPCB AQI {indianAqi.aqi} • {indianAqi.category}
                  </Badge>
                )}

                {/* Favorite & Share Buttons */}
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={toggleFavorite}
                    title={isFavorite ? 'Remove from Pinned' : 'Pin to Favorites'}
                    className={`p-1.5 rounded-xl border transition ${
                      isFavorite
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-secondary/60 border-border/70 text-muted-foreground hover:text-white'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
                  </button>

                  <button
                    onClick={handleShare}
                    title="Copy Meteorological Summary"
                    className="p-1.5 rounded-xl bg-secondary/60 border border-border/70 text-muted-foreground hover:text-white transition flex items-center gap-1 text-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    {copied && <span className="text-[10px] text-emerald-400 font-bold">Copied</span>}
                  </button>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-sm">
                {location.name}
              </h1>

              <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium pt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Observation Time: {formatTime(current.time, true)} IST
                </span>
                <span>•</span>
                <span>Elevation: {location.elevation ?? '--'} m MSL</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Radar Active
                </span>
              </div>
            </div>

            {/* Main Temperature & High/Low Pills */}
            <div className="flex items-baseline gap-5 pt-1">
              <div className="text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter drop-shadow-lg">
                {formatTemp(current.temp, unit)}
              </div>

              <div className="space-y-2">
                <div className="text-slate-300 font-medium text-sm flex items-center gap-1.5">
                  Heat Index (Feels like){' '}
                  <span className="font-extrabold text-primary text-base">
                    {formatTemp(current.apparentTemp, unit)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-300 px-2.5 py-1">
                    <ArrowUp className="w-3 h-3 mr-1 text-rose-400" />
                    High {formatTemp(todayDaily.tempMax, unit)}
                  </Badge>
                  <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 px-2.5 py-1">
                    <ArrowDown className="w-3 h-3 mr-1 text-cyan-400" />
                    Low {formatTemp(todayDaily.tempMin, unit)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Weather Condition Banner */}
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-secondary/70 border border-border/80 shadow-md backdrop-blur-md">
              <WeatherIcon code={current.weatherCode} isDay={current.isDay} className="w-8 h-8" />
              <div>
                <div className="text-sm font-bold text-white leading-tight">
                  {current.weatherMeta?.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {current.weatherMeta?.description}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Telemetry Cards Grid */}
          <div className="w-full lg:w-auto flex-1 max-w-xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Rain Probability */}
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/70 backdrop-blur-md hover:bg-secondary/70 transition flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                  <span>Rain Probability</span>
                  <CloudRain className="w-4 h-4 text-sky-400" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white">
                    {todayDaily.precipProbMax ?? 0}%
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Expected: {todayDaily.precipSum ?? 0} mm
                  </div>
                </div>
              </div>

              {/* Relative Humidity */}
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/70 backdrop-blur-md hover:bg-secondary/70 transition flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                  <span>Relative Humidity</span>
                  <Droplets className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white">
                    {current.humidity}%
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {dewPoint ? `Dew point ${dewPoint}` : current.humidity > 70 ? 'Muggy' : 'Comfortable'}
                  </div>
                </div>
              </div>

              {/* Wind Speed & Bearing */}
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/70 backdrop-blur-md hover:bg-secondary/70 transition flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                  <span>Surface Wind</span>
                  <Wind className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white">
                    {formatWind(current.windSpeed)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {current.windDirection ?? 0}° {getWindDirection(current.windDirection)} • Gusts {formatWind(current.windGusts)}
                  </div>
                </div>
              </div>

              {/* Barometer */}
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/70 backdrop-blur-md hover:bg-secondary/70 transition flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                  <span>Barometer</span>
                  <Gauge className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="mt-3">
                  <div className="text-xl font-bold text-white">
                    {current.pressureMsl ? `${Math.round(current.pressureMsl)} hPa` : '--'}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {pressureTendency}
                  </div>
                </div>
              </div>

              {/* Moon Phase */}
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/70 backdrop-blur-md hover:bg-secondary/70 transition flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                  <span>Lunar Phase</span>
                  <span className="text-base">{moon.icon}</span>
                </div>
                <div className="mt-3">
                  <div className="text-base font-bold text-white leading-tight">
                    {moon.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Tonight IST</div>
                </div>
              </div>

              {/* Daylight Progress */}
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/70 backdrop-blur-md hover:bg-secondary/70 transition flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                  <span>Daylight Span</span>
                  <Calendar className="w-4 h-4 text-purple-400" />
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="text-base font-bold text-white">
                    {todayDaily.daylightHours ?? '--'} hrs
                  </div>
                  <Progress value={sunProgress} className="h-1.5 bg-slate-800" indicatorClassName="bg-amber-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
