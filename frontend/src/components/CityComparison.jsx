import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WeatherIcon from './WeatherIcon';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { formatTemp } from '../utils/formatters';
import { ArrowLeftRight, Search, RefreshCw, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function CityComparison({ currentCity, unit }) {
  const [targetCityName, setTargetCityName] = useState('Mumbai');
  const [targetData, setTargetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompare = async (cityQuery) => {
    if (!cityQuery) return;
    setLoading(true);
    setError(null);
    try {
      const sRes = await axios.get(`${BACKEND_URL}/api/cities/search?q=${encodeURIComponent(cityQuery)}`);
      if (!sRes.data.data || sRes.data.data.length === 0) {
        setError('City not found');
        return;
      }
      const match = sRes.data.data[0];

      const wRes = await axios.get(`${BACKEND_URL}/api/weather`, {
        params: {
          lat: match.lat,
          lon: match.lon,
          city: match.name,
          state: match.state
        }
      });
      setTargetData(wRes.data.data);
      try {
        localStorage.setItem('mausam_compare_target_city', match.name);
      } catch (e) {}
    } catch (err) {
      console.error(err);
      setError('Failed to fetch comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mausam_compare_target_city');
      const target = saved || 'Mumbai';
      setTargetCityName(target);
      handleCompare(target);
    } catch (e) {
      handleCompare('Mumbai');
    }
  }, []);

  const c1 = currentCity?.current;
  const c2 = targetData?.current;

  return (
    <Card className="border-border/80 shadow-2xl bg-card/70 backdrop-blur-xl">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-secondary/80 border border-border text-purple-400 shadow-inner">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Indian Metros Dual Comparative Matrix</CardTitle>
            <CardDescription className="text-xs">
              Direct side-by-side contrast of temperature, CPCB AQI, and monsoon conditions
            </CardDescription>
          </div>
        </div>

        {/* Input & Compare Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            type="text"
            value={targetCityName}
            onChange={(e) => setTargetCityName(e.target.value)}
            placeholder="e.g. Mumbai, Bengaluru..."
            className="flex-1 sm:w-48 h-9 rounded-xl bg-secondary/70 border-border/80 text-xs focus-visible:ring-purple-400"
          />
          <Button
            variant="saffron"
            size="sm"
            onClick={() => handleCompare(targetCityName)}
            disabled={loading}
            className="h-9 px-3.5 sm:px-4 gap-1.5 rounded-xl shrink-0"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Compare</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {error && <div className="text-xs text-rose-400 font-semibold">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City 1 (Active) */}
          <div className="p-5 rounded-2xl bg-secondary/40 border border-border/70 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="saffron" className="text-[10px] uppercase font-bold tracking-wider mb-1">
                  Active Location
                </Badge>
                <h4 className="text-2xl font-black text-white">{currentCity?.location?.name || '--'}</h4>
                <p className="text-xs text-muted-foreground">
                  {currentCity?.location?.state && currentCity?.location?.country && currentCity.location.state !== currentCity.location.name
                    ? `${currentCity.location.state}, ${currentCity.location.country}`
                    : (currentCity?.location?.country || currentCity?.location?.state || '')}
                </p>
              </div>
              {c1 && <WeatherIcon code={c1.weatherCode} className="w-12 h-12 drop-shadow" />}
            </div>

            {c1 && (
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-secondary/60 p-3 rounded-xl border border-border/50">
                  <span className="text-muted-foreground block text-[11px]">Temperature</span>
                  <span className="text-2xl font-black text-white mt-0.5 block">{formatTemp(c1.temp, unit)}</span>
                </div>
                <div className="bg-secondary/60 p-3 rounded-xl border border-border/50">
                  <span className="text-muted-foreground block text-[11px]">Feels Like</span>
                  <span className="text-2xl font-black text-primary mt-0.5 block">{formatTemp(c1.apparentTemp, unit)}</span>
                </div>
                <div className="bg-secondary/60 p-3 rounded-xl border border-border/50">
                  <span className="text-muted-foreground block text-[11px]">Air Quality (AQI)</span>
                  <span
                    className="text-base font-black block mt-0.5"
                    style={{ color: c1.airQuality?.indian?.color || '#fff' }}
                  >
                    {c1.airQuality?.indian?.aqi ?? '--'} ({c1.airQuality?.indian?.category})
                  </span>
                </div>
                <div className="bg-secondary/60 p-3 rounded-xl border border-border/50">
                  <span className="text-muted-foreground block text-[11px]">Humidity</span>
                  <span className="text-2xl font-black text-cyan-400 mt-0.5 block">{c1.humidity}%</span>
                </div>
              </div>
            )}
          </div>

          {/* City 2 (Compared) */}
          <div className="p-5 rounded-2xl bg-secondary/40 border border-border/70 space-y-4 backdrop-blur-md">
            {targetData ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="outline" className="border-purple-400/40 bg-purple-500/10 text-purple-300 text-[10px] uppercase font-bold tracking-wider mb-1">
                      Target Location
                    </Badge>
                    <h4 className="text-2xl font-black text-white">{targetData.location.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {targetData.location.state && targetData.location.country && targetData.location.state !== targetData.location.name
                        ? `${targetData.location.state}, ${targetData.location.country}`
                        : (targetData.location.country || targetData.location.state || '')}
                    </p>
                  </div>
                  {c2 && <WeatherIcon code={c2.weatherCode} className="w-12 h-12 drop-shadow" />}
                </div>

                {c2 && (
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-secondary/60 p-3 rounded-xl border border-border/50">
                      <span className="text-muted-foreground block text-[11px]">Temperature</span>
                      <span className="text-2xl font-black text-white mt-0.5 block">{formatTemp(c2.temp, unit)}</span>
                    </div>
                    <div className="bg-secondary/60 p-3 rounded-xl border border-border/50">
                      <span className="text-muted-foreground block text-[11px]">Feels Like</span>
                      <span className="text-2xl font-black text-primary mt-0.5 block">{formatTemp(c2.apparentTemp, unit)}</span>
                    </div>
                    <div className="bg-secondary/60 p-3 rounded-xl border border-border/50">
                      <span className="text-muted-foreground block text-[11px]">Air Quality (AQI)</span>
                      <span
                        className="text-base font-black block mt-0.5"
                        style={{ color: c2.airQuality?.indian?.color || '#fff' }}
                      >
                        {c2.airQuality?.indian?.aqi ?? '--'} ({c2.airQuality?.indian?.category})
                      </span>
                    </div>
                    <div className="bg-secondary/60 p-3 rounded-xl border border-border/50">
                      <span className="text-muted-foreground block text-[11px]">Humidity</span>
                      <span className="text-2xl font-black text-cyan-400 mt-0.5 block">{c2.humidity}%</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center py-8 text-center text-muted-foreground space-y-2.5">
                <ArrowLeftRight className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-xs max-w-xs">
                  Enter any city name above (e.g. Mumbai, New York, London, Bengaluru) to see real-time side-by-side metrics.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
