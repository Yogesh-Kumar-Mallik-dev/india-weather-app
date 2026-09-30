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
  Hash,
  CornerDownLeft,
  SlidersHorizontal
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const POPULAR_METROS = [
  { name: 'New Delhi', state: 'Delhi', region: 'North', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai', state: 'Maharashtra', region: 'West', lat: 19.0760, lon: 72.8777 },
  { name: 'Bengaluru', state: 'Karnataka', region: 'South', lat: 12.9716, lon: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', region: 'South', lat: 17.3850, lon: 78.4867 },
  { name: 'Kolkata', state: 'West Bengal', region: 'East', lat: 22.5726, lon: 88.3639 },
  { name: 'Chennai', state: 'Tamil Nadu', region: 'South', lat: 13.0827, lon: 80.2707 },
  { name: 'Ahmedabad', state: 'Gujarat', region: 'West', lat: 23.0225, lon: 72.5714 },
  { name: 'Jaipur', state: 'Rajasthan', region: 'North', lat: 26.9124, lon: 75.7873 },
];

export default function Navbar({
  selectedCity,
  onSelectCity,
  unit,
  onToggleUnit,
  onRefresh,
  loading,
  onOpenLocationDialog
}) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'cities' | 'pincodes'
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
      const updated = [city, ...recentSearches.filter(c => c.name !== city.name)].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem('mausam_recent_cities', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const removeRecentSearch = (e, cityName) => {
    e.stopPropagation();
    const updated = recentSearches.filter(c => c.name !== cityName);
    setRecentSearches(updated);
    try {
      localStorage.setItem('mausam_recent_cities', JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }
  };

  const clearRecentSearches = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('mausam_recent_cities');
    } catch (err) {
      console.warn(err);
    }
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

  // Global keyboard shortcut: Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Debounced search with typo tolerance & PIN code awareness
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
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter results based on selected tab
  const displayedResults = searchResults.filter((item) => {
    if (filterType === 'cities') return !item.isPincode;
    if (filterType === 'pincodes') return item.isPincode;
    return true;
  });

  // Handle keyboard navigation (Arrow Up/Down, Enter, Esc)
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    const listLength = displayedResults.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < listLength - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : listLength - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < listLength) {
        selectCityAndClose(displayedResults[selectedIndex]);
      } else if (displayedResults.length > 0) {
        selectCityAndClose(displayedResults[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
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
  const pinCount = searchResults.filter((r) => r.isPincode).length;
  const cityCount = searchResults.filter((r) => !r.isPincode).length;

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-2xl px-4 lg:px-8 py-3 transition-all shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand with Logo */}
        <Logo size="md" showText={true} showBadge={true} />

        {/* Enhanced City Search Bar */}
        <div className="relative w-full md:w-[460px] lg:w-[540px]" ref={dropdownRef}>
          <div className="relative flex items-center group">
            <Search className="absolute left-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search 4,242+ Indian cities, districts or 6-digit PIN..."
              className="pl-10 pr-20 h-10 rounded-2xl bg-secondary/40 border-border/80 group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20 shadow-inner text-sm transition-all"
            />
            
            {/* Quick action badges & spinner inside input */}
            <div className="absolute right-3 flex items-center gap-1.5">
              {searching ? (
                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
              ) : query.trim() ? (
                <button
                  onClick={() => {
                    setQuery('');
                    setSearchResults([]);
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-white transition"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground/80 bg-secondary/80 rounded border border-border/60 pointer-events-none shadow-sm">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>

          {/* Autocomplete Dropdown with Typo Correction & Popular Metros */}
          {isOpen && (
            <div className="absolute top-full mt-2 w-full rounded-2xl border border-border/90 bg-popover/98 backdrop-blur-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Category Filter Chips (shown when search results exist) */}
              {searchResults.length > 0 && (
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-secondary/30 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilterType('all')}
                      className={cn(
                        'px-2 py-0.5 rounded-lg font-medium transition text-[11px]',
                        filterType === 'all'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                      )}
                    >
                      All ({searchResults.length})
                    </button>
                    {cityCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterType('cities')}
                        className={cn(
                          'px-2 py-0.5 rounded-lg font-medium transition text-[11px]',
                          filterType === 'cities'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                        )}
                      >
                        Cities ({cityCount})
                      </button>
                    )}
                    {pinCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterType('pincodes')}
                        className={cn(
                          'px-2 py-0.5 rounded-lg font-medium transition text-[11px] flex items-center gap-1',
                          filterType === 'pincodes'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                            : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                        )}
                      >
                        <Hash className="w-2.5 h-2.5" />
                        PIN Codes ({pinCount})
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    ↑↓ Navigate
                  </span>
                </div>
              )}

              {/* Typo Correction Banner */}
              {didYouMean && (
                <div className="mx-3 my-2 p-2 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-primary font-medium">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Did you mean <strong>{didYouMean}</strong>?</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                    Auto-corrected
                  </span>
                </div>
              )}

              {/* Scrollable Content Container */}
              <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
                {displayedResults.length > 0 ? (
                  <div>
                    {displayedResults.map((item, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <button
                          key={`${item.name}-${item.lat}-${idx}`}
                          onClick={() => selectCityAndClose(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            'w-full text-left px-3.5 py-2.5 text-sm transition flex items-center justify-between group',
                            isSelected
                              ? 'bg-primary/20 text-white'
                              : 'text-foreground hover:bg-secondary/60'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div
                              className={cn(
                                'p-1.5 rounded-xl transition shrink-0',
                                item.isPincode
                                  ? 'bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950'
                                  : 'bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                              )}
                            >
                              {item.isPincode ? (
                                <Hash className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white truncate">{item.name}</span>
                                {item.isPincode && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-mono shrink-0">
                                    Postal Index
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                                {item.state && (
                                  <span>
                                    {item.district && item.district !== item.name ? `${item.district}, ` : ''}{item.state}
                                  </span>
                                )}
                                {item.lat && item.lon && (
                                  <span className="text-[10px] text-muted-foreground/60 font-mono hidden sm:inline">
                                    ({Number(item.lat).toFixed(2)}°N, {Number(item.lon).toFixed(2)}°E)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-primary text-primary-foreground shadow-sm">
                                Select <CornerDownLeft className="w-2.5 h-2.5" />
                              </span>
                            ) : item.tag ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] hidden sm:inline-flex',
                                  item.isPincode
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 font-mono font-bold'
                                    : 'bg-secondary/60'
                                )}
                              >
                                {item.tag}
                              </Badge>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : query.trim() ? (
                  <div className="px-4 py-8 text-center">
                    <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground">
                      <Search className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-semibold text-foreground">No matches found for "{query}"</div>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                      Try typing a district name, regional hub, or a valid 6-digit Indian PIN code (e.g. 110001, 560001).
                    </p>
                  </div>
                ) : (
                  /* Empty state: Recent searches, top metros & PIN code guide */
                  <div className="p-3 space-y-3.5">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                          <span className="flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-primary" /> Recent Searches
                          </span>
                          <button
                            onClick={clearRecentSearches}
                            className="text-[10px] font-medium text-muted-foreground hover:text-rose-400 transition"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {recentSearches.map((city, i) => (
                            <div
                              key={i}
                              onClick={() => selectCityAndClose(city)}
                              className="group px-2.5 py-1 rounded-xl bg-secondary/70 hover:bg-secondary text-xs text-foreground border border-border/60 hover:border-primary/40 transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <MapPin className="w-3 h-3 text-primary shrink-0" />
                              <span className="font-medium">{city.name}</span>
                              <button
                                onClick={(e) => removeRecentSearch(e, city.name)}
                                className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition p-0.5"
                                title="Remove from recent"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Indian Metros (8 major regional hubs) */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Key Indian Metros
                        </span>
                        <span className="text-[10px] text-muted-foreground font-normal">8 Major Hubs</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        {POPULAR_METROS.map((metro) => (
                          <button
                            key={metro.name}
                            onClick={() => selectCityAndClose(metro)}
                            className="px-3 py-2 rounded-xl bg-secondary/40 hover:bg-primary/15 text-left text-xs text-foreground border border-border/50 hover:border-primary/40 transition flex items-center justify-between group"
                          >
                            <div>
                              <span className="font-semibold group-hover:text-primary transition block">
                                {metro.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {metro.state}
                              </span>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground border border-border/60 uppercase font-mono">
                              {metro.region}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick PIN Code Tip */}
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2">
                      <Hash className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        <strong className="text-amber-300">Indian Postal Code Search:</strong> Enter any 6-digit PIN (e.g.{' '}
                        <span
                          onClick={() => {
                            setQuery('110001');
                            inputRef.current?.focus();
                          }}
                          className="underline cursor-pointer hover:text-white"
                        >
                          110001
                        </span>
                        ,{' '}
                        <span
                          onClick={() => {
                            setQuery('560001');
                            inputRef.current?.focus();
                          }}
                          className="underline cursor-pointer hover:text-white"
                        >
                          560001
                        </span>
                        ,{' '}
                        <span
                          onClick={() => {
                            setQuery('400001');
                            inputRef.current?.focus();
                          }}
                          className="underline cursor-pointer hover:text-white"
                        >
                          400001
                        </span>
                        ) for hyper-local neighborhood weather.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown Footer Toolbar */}
              <div className="px-3.5 py-2 border-t border-border/50 bg-secondary/20 flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.2 rounded bg-secondary border border-border/60 font-mono text-[9px]">↑↓</kbd> Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.2 rounded bg-secondary border border-border/60 font-mono text-[9px]">↵</kbd> Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.2 rounded bg-secondary border border-border/60 font-mono text-[9px]">Esc</kbd> Close
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground/80 hidden sm:inline">
                  4,242+ Indian Cities & PIN Codes
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="glass"
            size="sm"
            onClick={onOpenLocationDialog || handleDetectLocation}
            title="Set Live Telemetry / GPS Location"
            className="flex items-center gap-1.5 rounded-xl border-border/70"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">GPS Telemetry</span>
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
