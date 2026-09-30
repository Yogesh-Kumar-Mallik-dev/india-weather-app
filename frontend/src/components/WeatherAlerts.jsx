import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, AlertCircle, Flame, CloudLightning, Wind, CloudFog, ShieldAlert } from 'lucide-react';

export default function WeatherAlerts({ alerts = [] }) {
  if (!alerts || alerts.length === 0) return null;

  const getAlertIcon = (iconName) => {
    switch (iconName) {
      case 'flame':
        return <Flame className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />;
      case 'cloud-lightning-rain':
        return <CloudLightning className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />;
      case 'wind':
        return <Wind className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />;
      case 'cloud-fog':
        return <CloudFog className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />;
      case 'alert-triangle':
        return <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />;
      default:
        return <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
    }
  };

  const getBorderColor = (level) => {
    if (level === 'severe') return 'border-rose-500/50 bg-rose-950/40 text-rose-200';
    if (level === 'warning') return 'border-amber-500/50 bg-amber-950/40 text-amber-200';
    return 'border-sky-500/40 bg-sky-950/30 text-sky-200';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
        <ShieldAlert className="w-4 h-4 text-rose-400" />
        <span>IMD & Meteorological Warnings ({alerts.length})</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {alerts.map((alert, idx) => (
          <Card
            key={idx}
            className={`border backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-xl ${getBorderColor(
              alert.level
            )}`}
          >
            <CardContent className="p-4 flex items-start gap-3">
              {getAlertIcon(alert.icon)}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={alert.level === 'severe' ? 'destructive' : alert.level === 'warning' ? 'saffron' : 'outline'}
                    className="text-[10px] uppercase font-bold"
                  >
                    {alert.badge}
                  </Badge>
                  <span className="font-bold text-sm text-white">{alert.title}</span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">{alert.message}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
