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
import LocationPermissionDialog from '../components/LocationPermissionDialog';
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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const STORAGE_KEYS = {
  ACTIVE_CITY: 'mausam_active_city',
  SAVED_LOCATION: 'mausam_saved_location',
  LOCATION_CONSENT: 'mausam_location_consent',
  UNIT: 'mausam_unit',
  ACTIVE_TAB: 'mausam_active_tab',
  FAVORITES: 'mausam_favorite_cities',
  CACHED_WEATHER_PREFIX: 'mausam_cached_weather_'
};

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
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  // Restore persisted session & telemetry data on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // 1. Restore Unit ('C' or 'F')
      const savedUnit = localStorage.getItem(STORAGE_KEYS.UNIT);
      if (savedUnit === 'C' || savedUnit === 'F') {
        setUnit(savedUnit);
      }

      // 2. Restore Active Tab
      const savedTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      if (savedTab) {
        setActiveTab(savedTab);
      }

      // 3. Restore Pinned Stations / Favorites
      const savedFavs = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (savedFavs) {
        try {
          const parsedFavs = JSON.parse(savedFavs);
          if (Array.isArray(parsedFavs) && parsedFavs.length > 0) {
            setFavorites(parsedFavs);
          }
        } catch (e) {}
      } else {
        const defaultFavs = [
          { name: 'New Delhi', state: 'Delhi', lat: 28.6139, lon: 77.2090 },
          { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
          { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
        ];
        setFavorites(defaultFavs);
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(defaultFavs));
      }

      // 4. Restore Currently Opened City & Hydrate Cached Weather
      const consent = localStorage.getItem(STORAGE_KEYS.LOCATION_CONSENT);
      const savedActiveCity = localStorage.getItem(STORAGE_KEYS.ACTIVE_CITY);
      const savedLoc = localStorage.getItem(STORAGE_KEYS.SAVED_LOCATION);

      let targetCity = null;

      if (savedActiveCity) {
        try {
          const parsed = JSON.parse(savedActiveCity);
          if (parsed?.name && parsed?.lat && parsed?.lon) {
            targetCity = parsed;
          }
        } catch (e) {}
      }

      if (!targetCity && savedLoc) {
        try {
          const parsed = JSON.parse(savedLoc);
          if (parsed?.name && parsed?.lat && parsed?.lon) {
            targetCity = parsed;
          }
        } catch (e) {}
      }

      if (targetCity) {
        setSelectedCity(targetCity);

        // Immediate cache hydration to avoid blank loading screen on page refresh
        const cachedRaw = localStorage.getItem(`${STORAGE_KEYS.CACHED_WEATHER_PREFIX}${targetCity.name}`);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw);
            if (cached?.data) {
              setWeatherData(cached.data);
              setLoading(false);
            }
          } catch (e) {}
        }
      } else if (!consent) {
        // First visit with no saved city: show descriptive location dialog
        setShowLocationDialog(true);
      }

      // 5. If user consented to live location and hadn't picked an explicit custom city, sync in background
      if (consent === 'live_granted' && !savedActiveCity && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const res = await axios.get(`${BACKEND_URL}/api/cities/reverse`, {
                params: { lat: pos.coords.latitude, lon: pos.coords.longitude },
                timeout: 4000
              });
              if (res.data?.data) {
                const liveCity = res.data.data;
                setSelectedCity(liveCity);
                localStorage.setItem(STORAGE_KEYS.SAVED_LOCATION, JSON.stringify(liveCity));
                localStorage.setItem(STORAGE_KEYS.ACTIVE_CITY, JSON.stringify(liveCity));
              }
            } catch (e) {
              console.warn('Background location sync warning:', e);
            }
          },
          () => {},
          { timeout: 8000, maximumAge: 120000 }
        );
      }
    } catch (e) {
      console.warn('State restoration warning:', e);
    } finally {
      setIsRestored(true);
    }
  }, []);

  const fetchWeather = useCallback(async (city) => {
    if (!city || !city.lat || !city.lon) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/weather`, {
        params: {
          lat: city.lat,
          lon: city.lon,
          city: city.name,
          state: city.state,
          country: city.country,
          ...(city.pincode ? { pincode: city.pincode } : {})
        }
      });
      if (res.data.success) {
        setWeatherData(res.data.data);
        // Persist weather data cache for this city
        try {
          localStorage.setItem(
            `${STORAGE_KEYS.CACHED_WEATHER_PREFIX}${city.name}`,
            JSON.stringify({ data: res.data.data, timestamp: Date.now() })
          );
        } catch (e) {}
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
    if (!isRestored) return;
    fetchWeather(selectedCity);
  }, [selectedCity, isRestored, fetchWeather]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleSelectCity = (city) => {
    setSelectedCity(city);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CITY, JSON.stringify(city));
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    try {
      localStorage.setItem(STORAGE_KEYS.UNIT, newUnit);
    } catch (e) {}
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, newTab);
    } catch (e) {}
  };

  const handleFavoritesChange = (newFavs) => {
    setFavorites(newFavs);
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavs));
    } catch (e) {}
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
        onToggleUnit={handleUnitChange}
        onRefresh={handleRefresh}
        loading={loading}
        onOpenLocationDialog={() => setShowLocationDialog(true)}
      />

      {/* Location Permission & Telemetry Dialog */}
      <LocationPermissionDialog
        isOpen={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        onLocationDetected={(loc) => {
          handleSelectCity(loc);
        }}
        onSelectManual={() => {
          // Dismiss dialog to allow manual searching
        }}
        onDefaultCapital={() => {
          handleSelectCity({
            name: 'New Delhi',
            state: 'Delhi',
            lat: 28.6139,
            lon: 77.2090
          });
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-8 py-3.5 sm:py-6 space-y-4 sm:space-y-5">
        {/* Pinned Favorites Quick-Bar */}
        {favorites.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs w-full">
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

        {/* Navigation Tabs using shadcn Tabs with mobile horizontal scroll */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-secondary/70 border border-border/70 p-1 rounded-2xl flex items-center overflow-x-auto no-scrollbar gap-1 w-full sm:flex-wrap h-auto">
            <TabsTrigger value="overview" className="gap-1.5 rounded-xl text-xs py-2 px-3 sm:px-3.5 shrink-0">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">National Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </TabsTrigger>

            <TabsTrigger value="hourly" className="gap-1.5 rounded-xl text-xs py-2 px-3 sm:px-3.5 shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">48h Hourly</span>
              <span className="sm:hidden">Hourly</span>
            </TabsTrigger>

            <TabsTrigger value="daily" className="gap-1.5 rounded-xl text-xs py-2 px-3 sm:px-3.5 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">14-Day Outlook</span>
              <span className="sm:hidden">14-Day</span>
            </TabsTrigger>

            <TabsTrigger value="radar" className="gap-1.5 rounded-xl text-xs py-2 px-3 sm:px-3.5 shrink-0">
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Rain Radar</span>
              <span className="sm:hidden">Radar</span>
            </TabsTrigger>

            <TabsTrigger value="compare" className="gap-1.5 rounded-xl text-xs py-2 px-3 sm:px-3.5 shrink-0">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Metro Comparison</span>
              <span className="sm:hidden">Compare</span>
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
                <WeatherHero weather={weatherData} unit={unit} onFavoritesChange={handleFavoritesChange} />

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
