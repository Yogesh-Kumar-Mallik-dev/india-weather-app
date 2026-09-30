import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Logo from './Logo';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { Search, MapPin, RefreshCw, Compass, SlidersHorizontal } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

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
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
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
        }
      } catch (err) {
        console.error('Failed to search cities', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSelectCity({
          name: 'Current Location',
          state: 'GPS Detected',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        });
      },
      (err) => {
        alert('Could not access your location: ' + err.message);
      }
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-xl px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand with Logo */}
        <Logo size="md" showText={true} showBadge={true} />

        {/* Search Bar with autocomplete dropdown using shadcn Input */}
        <div className="relative w-full md:w-96" ref={dropdownRef}>
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim() && setIsOpen(true)}
              placeholder="Search Indian city, district, or town..."
              className="pl-10 pr-10 rounded-2xl bg-card/60 border-border/80 focus-visible:ring-primary shadow-inner"
            />
            {searching && (
              <RefreshCw className="absolute right-3.5 w-4 h-4 text-primary animate-spin" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full rounded-2xl border border-border/90 bg-popover/95 backdrop-blur-2xl shadow-2xl py-2 max-h-72 overflow-y-auto z-50">
              <div className="px-3.5 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Matching Locations</span>
                <span className="text-[10px] text-primary">India</span>
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={`${item.name}-${item.lat}-${idx}`}
                  onClick={() => {
                    onSelectCity(item);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-sm text-foreground hover:bg-primary/15 hover:text-white transition flex items-center justify-between border-b border-border/40 last:border-0 group"
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
          )}
        </div>

        {/* Action Controls using shadcn Buttons */}
        <div className="flex items-center gap-2.5">
          {/* GPS Location Button */}
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
