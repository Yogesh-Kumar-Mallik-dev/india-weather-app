import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Layers,
  Play,
  Pause,
  RotateCcw,
  Compass,
  MapPin,
  Sliders,
  Radio,
  Eye
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const BASEMAP_TILES = {
  dark: {
    name: 'Meteorological Dark',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri — Meteorological Base Canvas',
    maxNativeZoom: 16,
    maxZoom: 19
  },
  satellite: {
    name: 'High-Res Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri Earth Imagery',
    maxNativeZoom: 19,
    maxZoom: 19
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxNativeZoom: 19,
    maxZoom: 19
  }
};

const RADAR_PALETTES = [
  { id: 2, name: 'Universal Blue' },
  { id: 1, name: 'Classic Green/Amber' },
  { id: 4, name: 'TITAN Doppler' },
  { id: 6, name: 'Rainbow Spectrum' }
];

export default function RainRadarMap({ lat, lon, cityName }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const baseTileLayerRef = useRef(null);
  const radarLayerRef = useRef(null);
  const markerRef = useRef(null);

  const [radarMeta, setRadarMeta] = useState(null);
  const [radarFrames, setRadarFrames] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [radarHost, setRadarHost] = useState('https://tilecache.rainviewer.com');
  const [radarOpacity, setRadarOpacity] = useState(0.75);
  const [activeBasemap, setActiveBasemap] = useState('dark');
  const [activePalette, setActivePalette] = useState(2);
  const [radarStatus, setRadarStatus] = useState('Online');

  // Restore basemap and palette preference on mount
  useEffect(() => {
    try {
      const savedBasemap = localStorage.getItem('mausam_radar_basemap');
      if (savedBasemap && BASEMAP_TILES[savedBasemap]) {
        setActiveBasemap(savedBasemap);
      }
      const savedPalette = localStorage.getItem('mausam_radar_palette');
      if (savedPalette) {
        setActivePalette(Number(savedPalette));
      }
    } catch (e) {}
  }, []);

  const handleSelectBasemap = (bm) => {
    setActiveBasemap(bm);
    try {
      localStorage.setItem('mausam_radar_basemap', bm);
    } catch (e) {}
  };

  const handleSelectPalette = (pal) => {
    setActivePalette(pal);
    try {
      localStorage.setItem('mausam_radar_palette', String(pal));
    } catch (e) {}
  };

  // Fetch Radar metadata
  useEffect(() => {
    let isMounted = true;
    async function fetchRadar() {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/radar`);
        if (res.data.success && isMounted) {
          const data = res.data.data;
          setRadarHost(data.host || 'https://tilecache.rainviewer.com');
          const pastFrames = data.past || [];
          const nowcastFrames = data.nowcast || [];
          const combined = [...pastFrames, ...nowcastFrames];
          setRadarFrames(combined);
          if (combined.length > 0) {
            setCurrentFrameIndex(pastFrames.length > 0 ? pastFrames.length - 1 : 0);
          }
          setRadarMeta(data);
          setRadarStatus('Operational');
        }
      } catch (err) {
        console.error('Failed to load radar info', err);
        setRadarStatus('Offline');
      }
    }
    fetchRadar();
    return () => { isMounted = false; };
  }, []);

  // Initialize Leaflet Map with ESRI Dark Canvas (No API key required)
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let L;
    import('leaflet').then((leafletModule) => {
      L = leafletModule.default || leafletModule;

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const currentCfg = BASEMAP_TILES[activeBasemap] || BASEMAP_TILES.dark;
        const map = L.map(mapContainerRef.current, {
          center: [lat || 20.5937, lon || 78.9629],
          zoom: 6,
          minZoom: 3,
          maxZoom: 19,
          zoomControl: true,
          attributionControl: false
        });

        // Prevent Esri "Zoom level not supported" warning tile by enforcing maxNativeZoom
        baseTileLayerRef.current = L.tileLayer(currentCfg.url, {
          maxNativeZoom: currentCfg.maxNativeZoom || 16,
          maxZoom: currentCfg.maxZoom || 19,
          subdomains: ['a', 'b', 'c']
        }).addTo(map);

        mapInstanceRef.current = map;
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Basemap Layer when user toggles
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default || leafletModule;
      const map = mapInstanceRef.current;

      if (baseTileLayerRef.current) {
        map.removeLayer(baseTileLayerRef.current);
      }

      const currentCfg = BASEMAP_TILES[activeBasemap] || BASEMAP_TILES.dark;
      baseTileLayerRef.current = L.tileLayer(currentCfg.url, {
        maxNativeZoom: currentCfg.maxNativeZoom || 16,
        maxZoom: currentCfg.maxZoom || 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      // Re-add radar layer on top
      if (radarLayerRef.current) {
        radarLayerRef.current.bringToFront();
      }
    });
  }, [activeBasemap]);

  // Update Map Center & Marker
  useEffect(() => {
    if (!mapInstanceRef.current || lat == null || lon == null) return;
    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default || leafletModule;
      const map = mapInstanceRef.current;

      map.flyTo([lat, lon], 7, { duration: 1.2 });

      if (markerRef.current) {
        markerRef.current.remove();
      }

      markerRef.current = L.circleMarker([lat, lon], {
        radius: 8,
        fillColor: '#FF9933',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95
      })
        .addTo(map)
        .bindPopup(`<b>${cityName || 'Station'}</b><br>Lat: ${lat.toFixed(2)}°N, Lon: ${lon.toFixed(2)}°E`)
        .openPopup();
    });
  }, [lat, lon, cityName]);

  // Update Radar Layer when frame, palette, or opacity changes
  useEffect(() => {
    if (!mapInstanceRef.current || radarFrames.length === 0) return;
    const currentFrame = radarFrames[currentFrameIndex];
    if (!currentFrame) return;

    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default || leafletModule;
      const map = mapInstanceRef.current;

      if (radarLayerRef.current) {
        map.removeLayer(radarLayerRef.current);
      }

      // RainViewer tile format: {host}{path}/256/{z}/{x}/{y}/{colorScheme}/1_1.png
      const tileUrl = `${radarHost}${currentFrame.path}/256/{z}/{x}/{y}/${activePalette}/1_1.png`;

      radarLayerRef.current = L.tileLayer(tileUrl, {
        opacity: radarOpacity,
        zIndex: 500,
        tileSize: 256,
        maxNativeZoom: 12,
        maxZoom: 19
      }).addTo(map);
    });
  }, [radarFrames, currentFrameIndex, radarHost, radarOpacity, activePalette]);

  // Radar Animation Loop
  useEffect(() => {
    if (!isPlaying || radarFrames.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % radarFrames.length);
    }, 750);
    return () => clearInterval(interval);
  }, [isPlaying, radarFrames]);

  const frameTime = radarFrames[currentFrameIndex]?.time
    ? new Date(radarFrames[currentFrameIndex].time * 1000).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : 'Live Sweep';

  const recenterIndia = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([20.5937, 78.9629], 5, { duration: 1 });
    }
  };

  const recenterCity = () => {
    if (mapInstanceRef.current && lat && lon) {
      mapInstanceRef.current.flyTo([lat, lon], 7, { duration: 1 });
    }
  };

  return (
    <Card className="border-border/80 shadow-2xl bg-card/75 backdrop-blur-xl">
      <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-secondary/80 border border-border text-primary shadow-inner">
            <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">National Doppler Radar Network</CardTitle>
              <Badge variant="green" className="text-[10px] px-2 py-0.5">
                ● {radarStatus}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Continuous precipitation reflectivity sweeps across the Indian Subcontinent
            </CardDescription>
          </div>
        </div>

        {/* Controls: Basemap & Palette Pickers */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Basemap Switcher */}
          <div className="flex rounded-xl bg-secondary/80 border border-border p-0.5 text-xs">
            <button
              onClick={() => handleSelectBasemap('dark')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                activeBasemap === 'dark' ? 'bg-primary text-slate-950 font-bold' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => handleSelectBasemap('satellite')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                activeBasemap === 'satellite' ? 'bg-primary text-slate-950 font-bold' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => handleSelectBasemap('osm')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                activeBasemap === 'osm' ? 'bg-primary text-slate-950 font-bold' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Topo
            </button>
          </div>

          {/* Palette Selector */}
          <select
            value={activePalette}
            onChange={(e) => handleSelectPalette(Number(e.target.value))}
            className="h-8 px-2.5 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {RADAR_PALETTES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Quick Recenter Buttons */}
          <Button
            variant="glass"
            size="sm"
            onClick={recenterCity}
            title="Focus Current City"
            className="h-8 px-2.5 text-xs rounded-xl gap-1"
          >
            <MapPin className="w-3 h-3 text-primary" />
            <span>City</span>
          </Button>

          <Button
            variant="glass"
            size="sm"
            onClick={recenterIndia}
            title="Recenter All India"
            className="h-8 px-2.5 text-xs rounded-xl gap-1"
          >
            <Compass className="w-3 h-3 text-emerald-400" />
            <span>India</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {/* Playback Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/50 border border-border/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button
              variant={isPlaying ? 'destructive' : 'saffron'}
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="gap-1.5 h-8 px-3 rounded-xl font-bold"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause Loop' : 'Play Loop'}</span>
            </Button>

            <Button
              variant="glass"
              size="icon"
              onClick={() => {
                setIsPlaying(false);
                setCurrentFrameIndex(radarFrames.length > 0 ? radarFrames.length - 1 : 0);
              }}
              title="Reset to Latest Sweep"
              className="h-8 w-8 rounded-xl"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>

            <div className="text-xs font-mono font-bold text-foreground flex items-center gap-1.5">
              <span className="text-muted-foreground font-normal">Sweep Time:</span>
              <span className="text-primary">{frameTime} IST</span>
            </div>
          </div>

          {/* Timeline Scrubber */}
          {radarFrames.length > 0 && (
            <div className="w-full sm:w-64 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-mono">Past</span>
              <input
                type="range"
                min={0}
                max={radarFrames.length - 1}
                value={currentFrameIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentFrameIndex(Number(e.target.value));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-[10px] text-primary font-mono font-bold">Now</span>
            </div>
          )}
        </div>

        {/* Map Canvas */}
        <div className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-border/80 shadow-2xl">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Radar Intensity Legend */}
          <div className="absolute bottom-3 left-3 z-10 rounded-xl bg-card/90 backdrop-blur-md px-3.5 py-2.5 border border-border text-[11px] text-muted-foreground shadow-2xl flex items-center gap-2.5">
            <span className="font-bold text-foreground">Rainfall Intensity (dBZ):</span>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-2.5 rounded-sm bg-[#38bdf8]" /> Light
              <span className="w-3 h-2.5 rounded-sm bg-[#22c55e] ml-1" /> Moderate
              <span className="w-3 h-2.5 rounded-sm bg-[#eab308] ml-1" /> Heavy
              <span className="w-3 h-2.5 rounded-sm bg-[#ef4444] ml-1" /> Cloudburst
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
