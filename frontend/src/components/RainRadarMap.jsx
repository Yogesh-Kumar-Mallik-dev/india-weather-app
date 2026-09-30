import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Layers, Play, Pause, RotateCcw } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function RainRadarMap({ lat, lon, cityName }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const radarLayerRef = useRef(null);
  const markerRef = useRef(null);

  const [radarMeta, setRadarMeta] = useState(null);
  const [radarFrames, setRadarFrames] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [radarHost, setRadarHost] = useState('https://tilecache.rainviewer.com');
  const [radarOpacity, setRadarOpacity] = useState(0.7);

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
        }
      } catch (err) {
        console.error('Failed to load radar info', err);
      }
    }
    fetchRadar();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let L;
    import('leaflet').then((leafletModule) => {
      L = leafletModule.default || leafletModule;

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [lat || 20.5937, lon || 78.9629],
          zoom: 6,
          zoomControl: true,
          attributionControl: false
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
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

  useEffect(() => {
    if (!mapInstanceRef.current || lat == null || lon == null) return;
    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default || leafletModule;
      const map = mapInstanceRef.current;

      map.flyTo([lat, lon], 7, { duration: 1.5 });

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
        .bindPopup(`<b>${cityName || 'Location'}</b><br>Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`)
        .openPopup();
    });
  }, [lat, lon, cityName]);

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

      const tileUrl = `${radarHost}${currentFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;
      radarLayerRef.current = L.tileLayer(tileUrl, {
        opacity: radarOpacity,
        zIndex: 500
      }).addTo(map);
    });
  }, [radarFrames, currentFrameIndex, radarHost, radarOpacity]);

  useEffect(() => {
    if (!isPlaying || radarFrames.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % radarFrames.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isPlaying, radarFrames]);

  const frameTime = radarFrames[currentFrameIndex]?.time
    ? new Date(radarFrames[currentFrameIndex].time * 1000).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : 'Live';

  return (
    <Card className="border-border/80 shadow-2xl bg-card/70 backdrop-blur-xl">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-secondary/80 border border-border text-primary shadow-inner">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Live Rain & Cloud Radar (India)</CardTitle>
            <CardDescription className="text-xs">
              Real-time Doppler precipitation radar animation via secretless RainViewer satellite tiles
            </CardDescription>
          </div>
        </div>

        {/* Playback Controls using shadcn Buttons & Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="px-3 py-1 bg-secondary/60 text-xs font-semibold">
            Frame: <span className="text-primary font-bold ml-1">{frameTime}</span>
          </Badge>

          <Button
            variant={isPlaying ? 'destructive' : 'saffron'}
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="gap-1.5 h-8 rounded-xl"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Animate Radar'}</span>
          </Button>

          <Button
            variant="glass"
            size="icon"
            onClick={() => {
              setIsPlaying(false);
              setCurrentFrameIndex(radarFrames.length > 0 ? radarFrames.length - 1 : 0);
            }}
            title="Reset to Latest"
            className="h-8 w-8 rounded-xl"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        <div className="relative w-full h-[440px] rounded-2xl overflow-hidden border border-border/80 shadow-inner">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-10 rounded-xl bg-card/90 backdrop-blur-md px-3 py-2 border border-border text-[11px] text-muted-foreground shadow-2xl flex items-center gap-2">
            <span className="font-bold text-foreground">Rain Intensity:</span>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-2.5 rounded-sm bg-[#00f]" /> Light
              <span className="w-3 h-2.5 rounded-sm bg-[#0f0] ml-1" /> Mod
              <span className="w-3 h-2.5 rounded-sm bg-[#ff0] ml-1" /> Heavy
              <span className="w-3 h-2.5 rounded-sm bg-[#f00] ml-1" /> Extreme
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
