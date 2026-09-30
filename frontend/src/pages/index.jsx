'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import WeatherHero from '../components/WeatherHero';
import WeatherAlerts from '../components/WeatherAlerts';
import AqiCard from '../components/AqiCard';
import KeyMetricsGrid from '../components/KeyMetricsGrid';
import HourlyForecast from '../components/HourlyForecast';
import DailyForecast from '../components/DailyForecast';
import RainRadarMap from '../components/RainRadarMap';
import IndiaOverviewGrid from '../components/IndiaOverviewGrid';
import CityComparison from '../components/CityComparison';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import {
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  LayoutDashboard,
  Clock,
  Calendar,
  Layers,
  ArrowLeftRight,
  Star
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function WeatherDashboard() {
  const [selectedCity, setSelectedCity] = useState({
    name: 'New Delhi',
    state: 'Delhi',
    lat: 28.6139,
    lon: 77.2090
  });

  const [weatherData, setWeatherData] = useState(null);
  const [overviewData, setOverviewData] = useState([]);
  const [unit, setUnit] = useState('C');
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mausam_favorite_cities');
      if (stored) {
        setFavorites(JSON.parse(stored));
      } else {
        setFavorites([
          { name: 'New Delhi', state: 'Delhi', lat: 28.6139, lon: 77.2090 },
          { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
          { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
        ]);
      }
    } catch (e) {
      console.warn(e);
    }
  }, [selectedCity]);

  const fetchWeather = useCallback(async (city) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/weather`, {
        params: {
          lat: city.lat,
          lon: city.lon,
          city: city.name,
          state: city.state
        }
      });
      if (res.data.success) {
        setWeatherData(res.data.data);
      } else {
        throw new Error(res.data.error || 'Failed to fetch weather');
      }
    } catch (err) {
      console.error('Weather error:', err);
      setError(
        err.response?.data?.error ||
        err.message ||
        'Unable to connect to the weather backend. Please verify that the backend server is running on port 5000.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/india/overview`);
      if (res.data.success) {
        setOverviewData(res.data.data);
      }
    } catch (err) {
      console.warn('Overview fetch error:', err);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(selectedCity);
  }, [selectedCity, fetchWeather]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleSelectCity = (city) => {
    setSelectedCity(city);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = () => {
    fetchWeather(selectedCity);
    fetchOverview();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      {/* Top Navbar */}
      <Navbar
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
        unit={unit}
        onToggleUnit={setUnit}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-5">
        {/* Pinned Favorites Quick-Bar */}
        {favorites.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-muted-foreground flex items-center gap-1 font-semibold shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Pinned Stations:
            </span>
            {favorites.map((fav, i) => (
              <button
                key={i}
                onClick={() => handleSelectCity(fav)}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-semibold border transition shrink-0 flex items-center gap-1.5",
                  selectedCity.name === fav.name
                    ? "bg-primary text-slate-950 border-primary font-bold shadow-md shadow-amber-500/20"
                    : "bg-secondary/60 hover:bg-secondary text-foreground border-border/70"
                )}
              >
                <span>{fav.name}</span>
                {fav.state && <span className="text-[10px] opacity-75">({fav.state})</span>}
              </button>
            ))}
          </div>
        )}

        {/* Navigation Tabs using shadcn Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-secondary/70 border border-border/70 p-1 rounded-2xl flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="overview" className="gap-1.5 rounded-xl text-xs py-2 px-3.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>National Dashboard</span>
            </TabsTrigger>

            <TabsTrigger value="hourly" className="gap-1.5 rounded-xl text-xs py-2 px-3.5">
              <Clock className="w-3.5 h-3.5" />
              <span>48h Hourly</span>
            </TabsTrigger>

            <TabsTrigger value="daily" className="gap-1.5 rounded-xl text-xs py-2 px-3.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>14-Day Outlook</span>
            </TabsTrigger>

            <TabsTrigger value="radar" className="gap-1.5 rounded-xl text-xs py-2 px-3.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Live Rain Radar</span>
            </TabsTrigger>

            <TabsTrigger value="compare" className="gap-1.5 rounded-xl text-xs py-2 px-3.5">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Metro Comparison</span>
            </TabsTrigger>
          </TabsList>

          {/* Error Banner */}
          {error && (
            <Card className="mt-4 border-rose-500/50 bg-rose-950/60 shadow-xl">
              <CardContent className="p-4 flex items-center justify-between text-rose-200 text-sm">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRefresh}
                  className="rounded-xl font-bold"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading Skeleton */}
          {loading && !weatherData && (
            <div className="space-y-6 animate-pulse mt-6">
              <div className="h-80 rounded-3xl bg-secondary/40 border border-border/70" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 rounded-2xl bg-secondary/40 border border-border/70" />
                ))}
              </div>
              <div className="h-72 rounded-3xl bg-secondary/40 border border-border/70" />
            </div>
          )}

          {/* Active Data Rendering */}
          {weatherData && (
            <>
              {/* 1. Overview Dashboard */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <WeatherHero weather={weatherData} unit={unit} />

                {weatherData.alerts && weatherData.alerts.length > 0 && (
                  <WeatherAlerts alerts={weatherData.alerts} />
                )}

                <KeyMetricsGrid current={weatherData.current} unit={unit} />

                <AqiCard airQuality={weatherData.current.airQuality} />

                <HourlyForecast hourly={weatherData.hourly} unit={unit} />

                <DailyForecast daily={weatherData.daily} unit={unit} />

                <IndiaOverviewGrid
                  overview={overviewData}
                  onSelectCity={handleSelectCity}
                  currentCityName={selectedCity.name}
                  unit={unit}
                />
              </TabsContent>

              {/* 2. Hourly Tab */}
              <TabsContent value="hourly" className="space-y-6 mt-6">
                <HourlyForecast hourly={weatherData.hourly} unit={unit} />
                <KeyMetricsGrid current={weatherData.current} unit={unit} />
              </TabsContent>

              {/* 3. Daily Tab */}
              <TabsContent value="daily" className="space-y-6 mt-6">
                <DailyForecast daily={weatherData.daily} unit={unit} />
              </TabsContent>

              {/* 4. Live Radar Tab */}
              <TabsContent value="radar" className="space-y-6 mt-6">
                <RainRadarMap
                  lat={selectedCity.lat}
                  lon={selectedCity.lon}
                  cityName={selectedCity.name}
                />
                <IndiaOverviewGrid
                  overview={overviewData}
                  onSelectCity={handleSelectCity}
                  currentCityName={selectedCity.name}
                  unit={unit}
                />
              </TabsContent>

              {/* 5. Compare Tab */}
              <TabsContent value="compare" className="space-y-6 mt-6">
                <CityComparison currentCity={weatherData} unit={unit} />
                <IndiaOverviewGrid
                  overview={overviewData}
                  onSelectCity={handleSelectCity}
                  currentCityName={selectedCity.name}
                  unit={unit}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border/80 bg-card/60 backdrop-blur-xl px-4 py-8 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-center sm:text-left">
            <span className="font-bold text-foreground">Mausam Bharat</span>
            <span className="hidden sm:inline">•</span>
            <span>National Atmospheric Telemetry & CPCB Observation Network</span>
            <span className="hidden sm:inline">•</span>
            <span>Coverage across all 28 States & 8 Union Territories</span>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-border/80 bg-secondary/50 text-[11px] gap-1.5 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Doppler Telemetry: Active (OGC & IMD Protocols)
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}
