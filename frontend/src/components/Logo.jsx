import React from 'react';
import { cn } from '../lib/utils';

export default function Logo({
  size = 'md',
  showText = true,
  showBadge = true,
  className = ''
}) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-3xl',
  };

  return (
    <div className={cn('flex items-center gap-3 select-none group', className)}>
      {/* Emblem SVG Icon */}
      <div className={cn('relative shrink-0 flex items-center justify-center', iconSizes[size])}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#FF9933]/25 via-white/5 to-[#138808]/25 blur-md group-hover:blur-lg transition-all duration-300" />

        {/* Master Emblem SVG */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full drop-shadow-xl"
        >
          <defs>
            <linearGradient id="saffronGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFA43B" />
              <stop offset="100%" stopColor="#FF7700" />
            </linearGradient>

            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1EB010" />
              <stop offset="100%" stopColor="#0E6B05" />
            </linearGradient>

            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            <linearGradient id="rainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Rounded Squircle Base */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="24"
            fill="#090D16"
            stroke="url(#saffronGradient)"
            strokeWidth="2"
            strokeOpacity="0.8"
          />

          {/* Inner Geometric Chakra / Solar Rings */}
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="#1E293B"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <circle
            cx="50"
            cy="50"
            r="34"
            stroke="url(#greenGradient)"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />

          {/* Surya / Solar Spoke Rays (Sunburst) */}
          <g className="origin-center transition-transform duration-1000 group-hover:rotate-45" style={{ transformOrigin: '50px 38px' }}>
            {[...Array(12)].map((_, i) => (
              <line
                key={i}
                x1="50"
                y1="16"
                x2="50"
                y2="22"
                stroke="#FBBF24"
                strokeWidth="2.5"
                strokeLinecap="round"
                transform={`rotate(${i * 30} 50 38)`}
              />
            ))}
            {/* Golden Sun Core */}
            <circle
              cx="50"
              cy="38"
              r="9"
              fill="url(#saffronGradient)"
              filter="url(#glow)"
            />
          </g>

          {/* Stylized Monsoon Cloud Body */}
          <path
            d="M32 64 C25 64 20 59 20 52 C20 45.5 25 40.5 31.5 40.2 C33.5 33 39.5 28 47 28 C56 28 63 35 63.5 44 C69 44.5 73.5 49 73.5 54.5 C73.5 60 69 64 63.5 64 Z"
            fill="url(#cloudGrad)"
            filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
          />

          {/* Chakra Center Accent (Navy Wheel Point) */}
          <circle cx="48" cy="46" r="3.5" fill="#000080" />
          <circle cx="48" cy="46" r="1.5" fill="#FFFFFF" />

          {/* Monsoon Raindrops with Tricolor Hints */}
          <path
            d="M32 71 C32 71 30 75 30 76.5 C30 78 31 79 32.5 79 C34 79 35 78 35 76.5 C35 75 32 71 32 71 Z"
            fill="#FF9933"
          />
          <path
            d="M48 73 C48 73 46 77 46 78.5 C46 80 47 81 48.5 81 C50 81 51 80 51 78.5 C51 77 48 73 48 73 Z"
            fill="url(#rainGrad)"
          />
          <path
            d="M64 71 C64 71 62 75 62 76.5 C62 78 63 79 64.5 79 C66 79 67 78 67 76.5 C67 75 64 71 64 71 Z"
            fill="#138808"
          />
        </svg>
      </div>

      {/* Typography & Branding */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-extrabold tracking-tight text-white flex items-center gap-1.5',
                textSizes[size]
              )}
            >
              <span>Mausam</span>
              <span className="bg-gradient-to-r from-[#FF9933] via-amber-200 to-[#22C55E] bg-clip-text text-transparent">
                Bharat
              </span>
            </span>

            {showBadge && (
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hidden sm:inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Network
              </span>
            )}
          </div>

          <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
            <span>National Meteorological Network</span>
          </div>
        </div>
      )}
    </div>
  );
}
