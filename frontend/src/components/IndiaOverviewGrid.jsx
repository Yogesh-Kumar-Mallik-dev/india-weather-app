import React, { useState } from 'react';
import WeatherIcon from './WeatherIcon';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { formatTemp } from '../utils/formatters';
import { Compass, MapPin } from 'lucide-react';

const REGIONS = ['All', 'North', 'South', 'West', 'East', 'Central', 'Northeast'];

export default function IndiaOverviewGrid({ overview = [], onSelectCity, currentCityName, unit }) {
  const [selectedRegion, setSelectedRegion] = useState('All');

  if (!overview || overview.length === 0) return null;

  const filtered = selectedRegion === 'All'
    ? overview
    : overview.filter((c) => c.region === selectedRegion);

  return (
    <Card className="border-border/80 shadow-2xl bg-card/70 backdrop-blur-xl">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-secondary/80 border border-border text-primary shadow-inner">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg">All-India Regional Synoptic Radar</CardTitle>
            <CardDescription className="text-xs">
              Live weather, temperature, and AQI across key Indian state capitals and metros
            </CardDescription>
          </div>
        </div>

        {/* Region Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {REGIONS.map((region) => (
            <Button
              key={region}
              variant={selectedRegion === region ? 'saffron' : 'ghost'}
              size="sm"
              onClick={() => setSelectedRegion(region)}
              className="h-7 px-3 text-xs rounded-xl"
            >
              {region}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filtered.map((city) => {
            const isSelected = currentCityName?.toLowerCase() === city.name.toLowerCase();
            const aqi = city.aqi || {};

            return (
              <button
                key={city.name}
                onClick={() => onSelectCity(city)}
                className={`text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between h-34 group ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 bg-secondary/90 shadow-lg shadow-amber-500/10'
                    : 'border-border/60 bg-secondary/40 hover:bg-secondary/70 hover:border-border/90'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-foreground text-base flex items-center gap-1.5 group-hover:text-primary transition-colors">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{city.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {city.state} • {city.region}
                    </div>
                  </div>
                  <WeatherIcon code={city.weatherCode} className="w-8 h-8 shrink-0 drop-shadow" />
                </div>

                <div className="flex items-end justify-between mt-3">
                  <div>
                    <div className="text-2xl font-black text-white">
                      {formatTemp(city.temp, unit)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {city.weatherMeta?.label}
                    </div>
                  </div>

                  {/* AQI Badge */}
                  {aqi.aqi != null && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ borderColor: `${aqi.color}60`, color: aqi.color }}
                    >
                      AQI {aqi.aqi} • {aqi.category}
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
