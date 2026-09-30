import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Wind, HeartPulse, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function AqiCard({ airQuality }) {
  if (!airQuality) return null;

  const indian = airQuality.indian || {
    aqi: '--',
    category: 'Unknown',
    color: '#94a3b8',
    textColor: '#ffffff',
    advisory: 'Air quality data updating.',
    healthImpact: 'N/A'
  };

  const aqiValue = indian.aqi ?? 0;
  const gaugePercent = Math.min(100, Math.max(0, (aqiValue / 500) * 100));

  return (
    <Card className="border-border/80 shadow-2xl bg-card/70 backdrop-blur-xl">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-secondary/80 border border-border text-primary shadow-inner">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg">National Air Quality Index (NAQI)</CardTitle>
            <CardDescription className="text-xs">
              Central Pollution Control Board (CPCB) Standard Breakpoints
            </CardDescription>
          </div>
        </div>

        {/* Category Pill */}
        <div
          className="self-start sm:self-auto px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5"
          style={{ backgroundColor: indian.color, color: indian.textColor }}
        >
          <span className="w-2 h-2 rounded-full bg-white/80 animate-ping" />
          <span>{indian.category} ({indian.aqi ?? 'N/A'})</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main AQI Gauge & Value */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-secondary/40 p-5 rounded-2xl border border-border/70 backdrop-blur-md">
          <div className="flex items-baseline gap-3">
            <span
              className="text-6xl font-black tracking-tight drop-shadow-md"
              style={{ color: indian.color }}
            >
              {indian.aqi ?? '--'}
            </span>
            <div className="text-xs text-muted-foreground font-semibold space-y-0.5">
              <div className="text-foreground font-bold">NAQI INDEX</div>
              <div className="text-[11px]">Scale: 0 - 500</div>
            </div>
          </div>

          {/* Gauge bar with marker */}
          <div className="w-full md:w-3/5 space-y-2">
            <div className="h-3.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 relative flex shadow-inner border border-slate-800">
              <div className="h-full w-[10%] bg-emerald-500 rounded-l-full" title="Good (0-50)" />
              <div className="h-full w-[10%] bg-lime-500" title="Satisfactory (51-100)" />
              <div className="h-full w-[20%] bg-amber-500" title="Moderate (101-200)" />
              <div className="h-full w-[20%] bg-orange-500" title="Poor (201-300)" />
              <div className="h-full w-[20%] bg-rose-500" title="Very Poor (301-400)" />
              <div className="h-full w-[20%] bg-red-950 rounded-r-full" title="Severe (401-500)" />

              {/* Marker Indicator */}
              <div
                className="absolute top-0 bottom-0 w-3 bg-white rounded-full shadow-lg border-2 border-slate-950 transform -translate-x-1/2 transition-all duration-700"
                style={{ left: `${gaugePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono font-medium">
              <span>0 Good</span>
              <span>100 Mod</span>
              <span>300 Poor</span>
              <span>500 Severe</span>
            </div>
          </div>
        </div>

        {/* Health Impact & Advisory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/70 flex items-start gap-3">
            <HeartPulse className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-foreground">Health Impact</div>
              <p className="text-muted-foreground leading-relaxed">{indian.healthImpact}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/70 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-foreground">Precautionary Advisory</div>
              <p className="text-muted-foreground leading-relaxed">{indian.advisory}</p>
            </div>
          </div>
        </div>

        {/* Pollutants Breakdown */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Pollutant Concentrations (μg/m³)
            </span>
            <span className="text-[11px] text-muted-foreground">Secretless Open-Meteo Air Sensor</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {[
              { label: 'PM 2.5', val: airQuality.pm2_5, sub: 'Fine Dust', desc: 'Respirable' },
              { label: 'PM 10', val: airQuality.pm10, sub: 'Coarse Dust', desc: 'Inhalable' },
              { label: 'NO₂', val: airQuality.nitrogenDioxide, sub: 'Nitrogen Dioxide', desc: 'Vehicular' },
              { label: 'SO₂', val: airQuality.sulphurDioxide, sub: 'Sulphur Dioxide', desc: 'Industrial' },
              { label: 'O₃ (Ozone)', val: airQuality.ozone, sub: 'Surface Ozone', desc: 'Photochemical' },
              { label: 'CO', val: airQuality.carbonMonoxide, sub: 'Carbon Monoxide', desc: 'Combustion' },
            ].map((p, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-secondary/40 border border-border/70 hover:bg-secondary/60 transition text-center shadow-sm"
              >
                <div className="text-[11px] text-muted-foreground font-semibold">{p.label}</div>
                <div className="text-xl font-black text-white mt-1">
                  {p.val != null ? Math.round(p.val) : '--'}
                </div>
                <div className="text-[10px] text-primary/80 font-medium">{p.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
