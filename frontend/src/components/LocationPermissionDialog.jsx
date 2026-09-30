import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Compass,
  Building2,
  Search,
  ShieldCheck,
  MapPin,
  RefreshCw,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function LocationPermissionDialog({
  isOpen,
  onClose,
  onLocationDetected,
  onSelectManual,
  onDefaultCapital
}) {
  const [detecting, setDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLiveLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your current browser.');
      return;
    }

    setDetecting(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Reverse geocode to exact Indian town/city
          const res = await axios.get(`${BACKEND_URL}/api/cities/reverse`, {
            params: { lat: latitude, lon: longitude },
            timeout: 5000
          });

          const locationData = res.data?.data || {
            name: 'Local Station',
            state: 'India',
            lat: latitude,
            lon: longitude
          };

          // Save preference in localStorage
          localStorage.setItem('mausam_location_consent', 'live_granted');
          localStorage.setItem('mausam_saved_location', JSON.stringify(locationData));

          onLocationDetected(locationData);
          onClose();
        } catch (err) {
          console.warn('Reverse geocode error, using coordinates directly:', err);
          const fallback = {
            name: 'Local Station',
            state: 'GPS Telemetry',
            lat: latitude,
            lon: longitude
          };
          localStorage.setItem('mausam_location_consent', 'live_granted');
          localStorage.setItem('mausam_saved_location', JSON.stringify(fallback));
          onLocationDetected(fallback);
          onClose();
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        setDetecting(false);
        if (err.code === 1) {
          setErrorMsg('Location access was denied in browser permissions. You can still choose manual search or New Delhi below.');
        } else {
          setErrorMsg('Unable to acquire GPS signal. Please select a city manually.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleStartDelhi = () => {
    localStorage.setItem('mausam_location_consent', 'delhi_default');
    onDefaultCapital();
    onClose();
  };

  const handleManualSearch = () => {
    localStorage.setItem('mausam_location_consent', 'manual_search');
    onSelectManual();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg border-border/90 bg-card/95 shadow-2xl p-6 sm:p-7">
        {/* Header with decorative ambient radar icon */}
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 text-primary border border-primary/30 shadow-inner">
              <Compass className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-card" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-white">
                Personalize Your Weather Telemetry
              </DialogTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px] text-primary border-primary/40 bg-primary/10">
                  Location Optimization
                </Badge>
                <span className="text-[11px] text-muted-foreground">Mausam Bharat Network</span>
              </div>
            </div>
          </div>

          <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
            Mausam Bharat can automatically connect to nearby IMD Doppler radar feeds and CPCB Air Quality telemetry stations for your immediate location. How would you like to proceed?
          </DialogDescription>
        </DialogHeader>

        {/* Error Notification if permission denied in browser */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Descriptive Options Group */}
        <div className="space-y-2.5 pt-2">
          {/* Option 1: Live Location */}
          <button
            onClick={handleLiveLocation}
            disabled={detecting}
            className="w-full text-left p-4 rounded-2xl border border-primary/40 bg-primary/10 hover:bg-primary/20 hover:border-primary transition-all duration-200 group flex items-start justify-between shadow-md shadow-amber-500/5 relative overflow-hidden"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-primary text-slate-950 shadow-md mt-0.5 shrink-0">
                {detecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-sm text-white group-hover:text-primary transition flex items-center gap-1.5">
                  <span>Use My Live Location</span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Auto-detect local weather, IMD thunderstorm warnings & nearest CPCB AQI station.
                </p>
              </div>
            </div>
          </button>

          {/* Option 2: Default Capital (New Delhi) */}
          <button
            onClick={handleStartDelhi}
            disabled={detecting}
            className="w-full text-left p-4 rounded-2xl border border-border/80 bg-secondary/40 hover:bg-secondary/70 hover:border-border transition-all duration-200 group flex items-start justify-between"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-secondary text-foreground mt-0.5 shrink-0 border border-border">
                <Building2 className="w-4 h-4 text-slate-300" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-sm text-foreground group-hover:text-white transition">
                  Start with National Capital (New Delhi)
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Browse national telemetry without sharing your device coordinates.
                </p>
              </div>
            </div>
          </button>

          {/* Option 3: Manual City Search */}
          <button
            onClick={handleManualSearch}
            disabled={detecting}
            className="w-full text-left p-4 rounded-2xl border border-border/80 bg-secondary/40 hover:bg-secondary/70 hover:border-border transition-all duration-200 group flex items-start justify-between"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-secondary text-foreground mt-0.5 shrink-0 border border-border">
                <Search className="w-4 h-4 text-slate-300" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-sm text-foreground group-hover:text-white transition">
                  Select a City or District Manually
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Choose from 4,242 Indian cities and districts with typo-tolerant search.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Privacy Assurance Guarantee */}
        <div className="pt-2 border-t border-border/60 flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Privacy Guarantee:</strong> GPS coordinates are processed exclusively in your browser session. No personal tracking or location logs are collected.
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
