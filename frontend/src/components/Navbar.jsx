import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Logo from './Logo';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import {
  Search,
  MapPin,
  RefreshCw,
  Compass,
  History,
  TrendingUp,
  Sparkles,
  X,
  Star
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const POPULAR_METROS = [
  { name: 'New Delhi', state: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
];

export default function Navbar({
  selectedCity,
  onSelectCity,
  unit,
  onToggleUnit,
  onRefresh,
  loading
}) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mausam_recent_cities');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('localStorage error', e);
    }
  }, []);

  const saveRecentSearch = (city) => {
    try {
      const updated = [city, ...recentSearches.filter(c => c.name !== city.name)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('mausam_recent_cities', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const clearRecentSearches = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('mausam_recent_cities');
  };

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search with typo tolerance
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(`${BACKEND_URL}/api/cities/search`, {
          params: { q: query.trim() }
        });
        if (res.data.success) {
          setSearchResults(res.data.data);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error('Failed to search cities', err);
      } finally {
        setSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle keyboard navigation (Arrow Up/Down, Enter, Esc)
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') setIsOpen(true);
      return;
    }

    const listLength = searchResults.length > 0 ? searchResults.length : 0;
    if (listLength === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < listLength - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : listLength - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < listLength) {
        selectCityAndClose(searchResults[selectedIndex]);
      } else if (searchResults.length > 0) {
        selectCityAndClose(searchResults[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectCityAndClose = (city) => {
    onSelectCity(city);
    saveRecentSearch(city);
    setIsOpen(false);
    setQuery('');
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detected = {
          name: 'Current Location',
          state: 'GPS Telemetry',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        };
        onSelectCity(detected);
        saveRecentSearch(detected);
      },
      (err) => {
        alert('Could not access your location: ' + err.message);
      }
    );
  };

  // Typo detection suggestion
  const didYouMean = searchResults.length > 0 && searchResults[0].didYouMean;

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-2xl px-4 lg:px-8 py-3 transition-all shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand with Logo */}
        <Logo size="md" showText={true} showBadge={true} />

        {/* Enhanced City Search Bar */}
        <div className="relative w-full md:w-[420px]" ref={dropdownRef}>
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search any Indian city, district, or PIN (e.g. Dehli, Banglore, Vizag)..."
              className="pl-10 pr-10 rounded-2xl bg-secondary/50 border-border/80 focus-visible:ring-primary shadow-inner text-sm"
            />
            {searching ? (
              <RefreshCw className="absolute right-3.5 w-4 h-4 text-primary animate-spin" />
            ) : query.trim() ? (
              <button
                onClick={() => {
                  setQuery('');
                  setSearchResults([]);
                  inputRef.current?.focus();
                }}
                className="absolute right-3.5 p-0.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Autocomplete Dropdown with Typo Correction & Popular Metros */}
          {isOpen && (
            <div className="absolute top-full mt-2 w-full rounded-2xl border border-border/90 bg-popover/95 backdrop-blur-2xl shadow-2xl py-2 max-h-80 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Typo Correction Banner */}
              {didYouMean && (
                <div className="mx-3 my-1.5 p-2 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-primary font-medium">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Did you mean <strong>{didYouMean}</strong>?</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Auto-corrected</span>
                </div>
              )}

              {/* Active Search Results */}
              {searchResults.length > 0 ? (
                <div className="divide-y divide-border/40">
                  <div className="px-3.5 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Matching Locations</span>
                    <span className="text-[10px] text-primary">Press ↑↓ to navigate</span>
                  </div>
                  {searchResults.map((item, idx) => (
                    <button
                      key={`${item.name}-${item.lat}-${idx}`}
                      onClick={() => selectCityAndClose(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        'w-full text-left px-3.5 py-2.5 text-sm transition flex items-center justify-between group',
                        selectedIndex === idx
                          ? 'bg-primary/20 text-white'
                          : 'text-foreground hover:bg-secondary/70'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded-lg bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                        </div>
                        <div>
                          <span className="font-semibold text-white">{item.name}</span>
                          {item.state && (
                            <span className="text-xs text-muted-foreground ml-1.5">
                              ({item.state})
                            </span>
                          )}
                        </div>
                      </div>
                      {item.tag && (
                        <Badge variant="outline" className="text-[10px] bg-secondary/60">
                          {item.tag}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No exact match for "{query}". Try alternative spellings or district names.
                </div>
              ) : (
                /* When search input is empty: show Recent Searches & Popular Metros */
                <div className="space-y-3 px-3 py-1">
                  {recentSearches.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        <span className="flex items-center gap-1">
                          <History className="w-3 h-3" /> Recent Searches
                        </span>
                        <button
                          onClick={clearRecentSearches}
                          className="text-[10px] text-muted-foreground hover:text-rose-400 transition"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {recentSearches.map((city, i) => (
                          <button
                            key={i}
                            onClick={() => selectCityAndClose(city)}
                            className="px-2.5 py-1 rounded-xl bg-secondary/80 hover:bg-secondary text-xs text-foreground border border-border/60 transition flex items-center gap-1.5"
                          >
                            <MapPin className="w-3 h-3 text-primary" />
                            <span>{city.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Metros Quick Pick */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-primary" /> Key Indian Metros
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      {POPULAR_METROS.map((metro) => (
                        <button
                          key={metro.name}
                          onClick={() => selectCityAndClose(metro)}
                          className="px-3 py-2 rounded-xl bg-secondary/40 hover:bg-primary/15 text-left text-xs text-foreground border border-border/50 transition flex items-center justify-between group"
                        >
                          <span className="font-semibold group-hover:text-primary transition">
                            {metro.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {metro.state}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="glass"
            size="sm"
            onClick={handleDetectLocation}
            title="Detect Current GPS Location"
            className="flex items-center gap-1.5 rounded-xl border-border/70"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">GPS</span>
          </Button>

          {/* Unit Toggle Buttons */}
          <div className="flex rounded-xl bg-secondary/80 border border-border/70 p-0.5 shadow-inner">
            <Button
              variant={unit === 'C' ? 'saffron' : 'ghost'}
              size="sm"
              onClick={() => onToggleUnit('C')}
              className="h-7 px-3 rounded-lg text-xs"
            >
              °C
            </Button>
            <Button
              variant={unit === 'F' ? 'saffron' : 'ghost'}
              size="sm"
              onClick={() => onToggleUnit('F')}
              className="h-7 px-3 rounded-lg text-xs"
            >
              °F
            </Button>
          </div>

          {/* Refresh Button */}
          <Button
            variant="glass"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Live Data"
            className="h-8 w-8 rounded-xl border-border/70"
          >
            <RefreshCw className={cn('w-4 h-4 text-slate-300', loading && 'animate-spin text-primary')} />
          </Button>
        </div>
      </div>
    </header>
  );
}
