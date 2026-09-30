import React from 'react';
import WeatherIcon from './WeatherIcon';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { formatTemp, formatDay, formatTime, getUvCategory } from '../utils/formatters';
import { Calendar, CloudRain, Sun, Sunrise, Sunset } from 'lucide-react';

export default function DailyForecast({ daily = [], unit }) {
  if (!daily || daily.length === 0) return null;

  const allMins = daily.map((d) => d.tempMin).filter((x) => x != null);
  const allMaxs = daily.map((d) => d.tempMax).filter((x) => x != null);
  const globalMin = Math.min(...allMins);
  const globalMax = Math.max(...allMaxs);
  const tempSpan = Math.max(1, globalMax - globalMin);

  return (
    <Card className="border-border/80 shadow-2xl bg-card/70 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="p-2.5 rounded-2xl bg-secondary/80 border border-border text-primary shadow-inner">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <CardTitle className="text-lg">14-Day Extended Outlook</CardTitle>
          <CardDescription className="text-xs">
            Long-range synoptic outlook and monsoon precipitation expectations
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="divide-y divide-border/60 pt-2">
        {daily.map((day, idx) => {
          const leftPercent = Math.max(0, ((day.tempMin - globalMin) / tempSpan) * 100);
          const rightPercent = Math.min(100, ((day.tempMax - globalMin) / tempSpan) * 100);
          const barWidth = Math.max(8, rightPercent - leftPercent);
          const uvInfo = getUvCategory(day.uvIndexMax);

          return (
            <div
              key={idx}
              className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm hover:bg-secondary/40 px-3 rounded-2xl transition duration-150"
            >
              {/* Day & Date */}
              <div className="w-36 shrink-0 flex items-center gap-2">
                <span className="font-bold text-foreground">
                  {idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : formatDay(day.date)}
                </span>
                {idx === 0 && (
                  <Badge variant="saffron" className="text-[10px] px-2 py-0">
                    Live
                  </Badge>
                )}
              </div>

              {/* Condition & Rain Chance */}
              <div className="flex items-center gap-3 w-52 shrink-0">
                <WeatherIcon code={day.weatherCode} className="w-6 h-6 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {day.weatherMeta?.label}
                  </div>
                  {day.precipProbMax > 0 && (
                    <div className="text-[11px] text-sky-400 font-medium flex items-center gap-1">
                      <CloudRain className="w-3 h-3" />
                      <span>{day.precipProbMax}% ({day.precipSum} mm)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Proportional Temperature Range Bar */}
              <div className="flex-1 flex items-center gap-3 max-w-sm">
                <span className="text-xs font-semibold text-cyan-400 w-12 text-right">
                  {formatTemp(day.tempMin, unit)}
                </span>
                <div className="flex-1 h-2 bg-slate-900 rounded-full relative overflow-hidden shadow-inner border border-slate-800">
                  <div
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-400 rounded-full"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${barWidth}%`
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-rose-400 w-12">
                  {formatTemp(day.tempMax, unit)}
                </span>
              </div>

              {/* UV & Sun Times */}
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground justify-end">
                <div className="flex items-center gap-1.5" title="Peak UV Index">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span style={{ color: uvInfo.color }} className="font-bold">
                    UV {day.uvIndexMax ?? '--'}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5" title="Sun times">
                  <Sunrise className="w-3 h-3 text-amber-300" />
                  <span>{formatTime(day.sunrise)}</span>
                  <Sunset className="w-3 h-3 text-orange-300 ml-1.5" />
                  <span>{formatTime(day.sunset)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
