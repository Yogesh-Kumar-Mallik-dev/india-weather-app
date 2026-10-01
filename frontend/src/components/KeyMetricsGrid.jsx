import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Gauge, Cloud, Sun, Umbrella, Eye, Wind, Compass } from 'lucide-react';
import { getUvCategory } from '../utils/formatters';

export default function KeyMetricsGrid({ current, unit }) {
  if (!current) return null;

  const uvInfo = getUvCategory(current.airQuality?.uvIndex ?? current.uv_index ?? 0);
  const uvValue = current.airQuality?.uvIndex ?? 0;
  const uvPercent = Math.min(100, (uvValue / 12) * 100);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* UV Index */}
      <Card className="border-border/70 bg-card/60 backdrop-blur-xl hover:border-primary/40 transition-all duration-300">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">UV Radiation</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">{uvValue}</span>
              <Badge
                variant="outline"
                className="text-[10px] font-bold uppercase"
                style={{ borderColor: `${uvInfo.color}60`, color: uvInfo.color }}
              >
                {uvInfo.level}
              </Badge>
            </div>
            <Progress value={uvPercent} className="h-1.5" indicatorClassName="bg-amber-400" />
          </div>

          <div className="text-[11px] text-muted-foreground leading-tight">
            {uvInfo.text || 'Standard daytime precaution'}
          </div>
        </CardContent>
      </Card>

      {/* Atmospheric Pressure */}
      <Card className="border-border/70 bg-card/60 backdrop-blur-xl hover:border-primary/40 transition-all duration-300">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Barometric Pressure</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>

          <div>
            <div className="text-3xl font-black text-white">
              {current.pressureMsl ? `${Math.round(current.pressureMsl)}` : '--'}
              <span className="text-sm font-normal text-muted-foreground ml-1">hPa</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Surface: {current.surfacePressure ? `${Math.round(current.surfacePressure)} hPa` : '--'}
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground">
            Mean sea-level atmospheric force
          </div>
        </CardContent>
      </Card>

      {/* Cloud Cover */}
      <Card className="border-border/70 bg-card/60 backdrop-blur-xl hover:border-primary/40 transition-all duration-300">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Cloud Cover</span>
            <Cloud className="w-4 h-4 text-slate-300" />
          </div>

          <div className="space-y-2">
            <div className="text-3xl font-black text-white">
              {current.cloudCover ?? 0}%
            </div>
            <Progress value={current.cloudCover ?? 0} className="h-1.5" indicatorClassName="bg-slate-300" />
          </div>

          <div className="text-[11px] text-muted-foreground">
            {current.cloudCover > 80 ? 'Dense Overcast' : current.cloudCover > 40 ? 'Scattered Clouds' : 'Clear Skies'}
          </div>
        </CardContent>
      </Card>

      {/* Monsoon Precipitation */}
      <Card className="border-border/70 bg-card/60 backdrop-blur-xl hover:border-primary/40 transition-all duration-300">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Precipitation Rate</span>
            <Umbrella className="w-4 h-4 text-blue-400" />
          </div>

          <div>
            <div className="text-3xl font-black text-white">
              {current.precipitation ?? 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">mm/h</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Rain: {current.rain ?? 0} mm • Showers: {current.showers ?? 0} mm
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground">
            {current.precipitation > 5 ? 'Active monsoon showers' : 'No active rainfall'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
