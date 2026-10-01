import React, { useState } from 'react';
import WeatherIcon from './WeatherIcon';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { formatTemp, formatTime } from '../utils/formatters';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Clock, Thermometer, CloudRain, Wind } from 'lucide-react';

export default function HourlyForecast({ hourly = [], unit }) {
  const [viewMode, setViewMode] = useState('temp'); // 'temp' | 'rain' | 'wind'

  if (!hourly || hourly.length === 0) return null;

  const chartData = hourly.slice(0, 24).map((item) => ({
    time: formatTime(item.time),
    temp: unit === 'F' ? Math.round((item.temp * 9) / 5 + 32) : Math.round(item.temp),
    rainProb: item.precipProb,
    precipitation: item.precipitation,
    wind: Math.round(item.windSpeed),
    condition: item.weatherMeta?.label
  }));

  return (
    <Card className="border-border/80 shadow-2xl bg-card/70 backdrop-blur-xl">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-secondary/80 border border-border text-primary shadow-inner">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg">48-Hour Hourly Trajectory</CardTitle>
            <CardDescription className="text-xs">
              Diurnal temperature fluctuation, rain probability, and gust dynamics
            </CardDescription>
          </div>
        </div>

        {/* View Mode Switcher with shadcn Buttons */}
        <div className="flex items-center bg-secondary/80 p-0.5 rounded-xl border border-border/80 overflow-x-auto no-scrollbar max-w-full">
          <Button
            variant={viewMode === 'temp' ? 'saffron' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('temp')}
            className="h-7 px-2.5 sm:px-3 text-xs gap-1 sm:gap-1.5 shrink-0"
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Temperature</span>
            <span className="sm:hidden">Temp</span>
          </Button>

          <Button
            variant={viewMode === 'rain' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('rain')}
            className={`h-7 px-2.5 sm:px-3 text-xs gap-1 sm:gap-1.5 shrink-0 ${viewMode === 'rain' ? 'bg-sky-500 hover:bg-sky-600 text-white' : ''}`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rain Probability</span>
            <span className="sm:hidden">Rain</span>
          </Button>

          <Button
            variant={viewMode === 'wind' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('wind')}
            className={`h-7 px-2.5 sm:px-3 text-xs gap-1 sm:gap-1.5 shrink-0 ${viewMode === 'wind' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-5 pt-2 sm:pt-3">
        {/* Interactive Chart for Next 24 Hours */}
        <div className="h-48 sm:h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'temp' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit={`°${unit}`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-2xl border border-border/90 bg-popover/90 p-3 shadow-2xl backdrop-blur-md text-xs">
                          <div className="font-bold text-foreground">{data.time}</div>
                          <div className="text-primary font-black text-sm mt-0.5">
                            {data.temp}°{unit}
                          </div>
                          <div className="text-muted-foreground text-[11px]">{data.condition}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="temp"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#tempGradient)"
                />
              </AreaChart>
            ) : viewMode === 'rain' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-2xl border border-border/90 bg-popover/90 p-3 shadow-2xl backdrop-blur-md text-xs">
                          <div className="font-bold text-foreground">{data.time}</div>
                          <div className="text-sky-400 font-bold text-sm mt-0.5">
                            Precipitation Chance: {data.rainProb}%
                          </div>
                          <div className="text-muted-foreground text-[11px]">
                            Accumulation: {data.precipitation} mm
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="rainProb" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" km/h" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-2xl border border-border/90 bg-popover/90 p-3 shadow-2xl backdrop-blur-md text-xs">
                          <div className="font-bold text-foreground">{data.time}</div>
                          <div className="text-emerald-400 font-bold text-sm mt-0.5">
                            Wind Speed: {data.wind} km/h
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="wind"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#windGradient)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Scrollable Hourly Strip */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {hourly.map((item, idx) => (
            <div
              key={idx}
              className="shrink-0 w-24 p-3 rounded-2xl bg-secondary/40 border border-border/70 flex flex-col items-center justify-between text-center transition hover:bg-secondary/70 hover:border-primary/40 shadow-sm"
            >
              <div className="text-[11px] font-semibold text-muted-foreground">
                {formatTime(item.time)}
              </div>
              <div className="my-2">
                <WeatherIcon code={item.weatherCode} isDay={item.isDay} className="w-6 h-6" />
              </div>
              <div className="text-sm font-extrabold text-foreground">
                {formatTemp(item.temp, unit)}
              </div>
              {item.precipProb > 0 ? (
                <div className="text-[10px] font-bold text-sky-400 mt-1 flex items-center gap-0.5">
                  <CloudRain className="w-2.5 h-2.5" />
                  <span>{item.precipProb}%</span>
                </div>
              ) : (
                <div className="text-[10px] text-muted-foreground mt-1">0%</div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
