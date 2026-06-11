"use client";

import { Network } from 'lucide-react';
import { HubCity } from '../types';
import { HUB_LOCATIONS } from '../data';

interface GlassmorphicHeaderProps {
  activeCity: HubCity;
  onCityChange: (city: HubCity) => void;
  isSimulating: boolean;
}

export default function GlassmorphicHeader({ activeCity, onCityChange, isSimulating }: GlassmorphicHeaderProps) {
  const currentHub = HUB_LOCATIONS[activeCity];
  const cities: HubCity[] = ['Astana', 'Zhambyl', 'Pavlodar', 'Taraz', 'Kyzylorda'];

  return (
    <header id="glass-header" className="sticky top-0 z-50 w-full bg-neutral-950/60 backdrop-blur-md border-b border-white/5 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300">
      {/* Brand & Connection State */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-400 p-[1px] flex items-center justify-center shadow-lg shadow-blue-500/10">
          <div className="w-full h-full rounded-[11px] bg-neutral-950 flex items-center justify-center">
            <Network className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-sans font-bold tracking-tight text-white">HubVibe Portal</h1>
            <span className="text-[9px] font-mono tracking-wider font-semibold text-blue-400 bg-blue-950/30 border border-blue-900/40 px-1.5 py-0.5 rounded uppercase">
              v2.6
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSimulating ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulating ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="font-mono">
              Connected to:{' '}
              <span className="text-emerald-400 font-semibold">{currentHub.name}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Controller / Selector & Stats */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Hub Quick Swapper Pill selector */}
        <div className="flex items-center gap-1.5 bg-neutral-900/60 border border-neutral-800/80 p-1 rounded-2xl">
          <span className="text-[10px] font-mono text-neutral-500 px-2 uppercase tracking-tight">Active Hub</span>
          <div className="flex flex-wrap gap-1">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => onCityChange(city)}
                className={`px-3 py-1 text-xs rounded-xl transition-all duration-300 focus:outline-none ${
                  activeCity === city
                    ? 'bg-emerald-500 text-neutral-950 font-medium shadow-md shadow-emerald-500/10'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic Stats Panel */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono border-l border-neutral-800/60 pl-4 py-1 text-neutral-400">
          <div className="flex flex-col">
            <span className="text-[9px] text-neutral-500 uppercase">Latency</span>
            <span className="text-neutral-200 text-right">14 ms</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-neutral-500 uppercase">Core DB</span>
            <span className="text-emerald-400 text-right">Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
}
