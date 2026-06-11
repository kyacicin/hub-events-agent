"use client";

import { Network, Sun, Moon } from 'lucide-react';
import { HubOption, HubRegion } from '../types';
import { HUB_LOCATIONS } from '../data';
import { LANGS, Lang } from '../i18n';

interface GlassmorphicHeaderProps {
  hubs: HubOption[];
  activeRegion: HubRegion;
  onRegionChange: (region: HubRegion) => void;
  isSimulating: boolean;
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  t: Record<string, string>;
}

export default function GlassmorphicHeader({
  hubs,
  activeRegion,
  onRegionChange,
  isSimulating,
  lang,
  onLangChange,
  theme,
  onThemeToggle,
  t,
}: GlassmorphicHeaderProps) {
  const currentHub = HUB_LOCATIONS[activeRegion] ?? HUB_LOCATIONS['astana'];

  return (
    <header id="glass-header" className="sticky top-0 z-50 w-full bg-white/70 dark:bg-neutral-950/60 backdrop-blur-md border-b border-neutral-200 dark:border-white/5 px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors duration-300">
      {/* Brand & Connection State */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-400 p-[1px] flex items-center justify-center shadow-lg shadow-blue-500/10">
          <div className="w-full h-full rounded-[11px] bg-white dark:bg-neutral-950 flex items-center justify-center">
            <Network className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-sans font-bold tracking-tight text-neutral-900 dark:text-white">HubVibe Portal</h1>
            <span className="text-[9px] font-mono tracking-wider font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 px-1.5 py-0.5 rounded uppercase">
              Astana Hub
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSimulating ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulating ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="font-mono">
              {t.connectedTo}{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{currentHub.name}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Controls: hub filter (secondary), language, theme */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Hub Quick Swapper Pill selector (secondary filter) */}
        <div className="flex items-center gap-1.5 bg-neutral-200/60 dark:bg-neutral-900/60 border border-neutral-300/60 dark:border-neutral-800/80 p-1 rounded-2xl">
          <span className="hidden sm:inline text-[10px] font-mono text-neutral-500 px-2 uppercase tracking-tight">{t.activeHub}</span>
          <div className="flex flex-wrap gap-1">
            {hubs.map((hub) => (
              <button
                key={hub.region}
                onClick={() => onRegionChange(hub.region)}
                className={`px-2.5 py-1 text-xs rounded-xl transition-all duration-300 focus:outline-none ${
                  activeRegion === hub.region
                    ? 'bg-emerald-500 text-neutral-950 font-medium shadow-md shadow-emerald-500/10'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {hub.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language switcher */}
        <div className="flex items-center gap-0.5 bg-neutral-200/60 dark:bg-neutral-900/60 border border-neutral-300/60 dark:border-neutral-800/80 p-1 rounded-2xl">
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => onLangChange(code)}
              className={`px-2 py-1 text-[11px] font-mono font-bold rounded-xl transition-all duration-300 focus:outline-none ${
                lang === code
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-2xl bg-neutral-200/60 dark:bg-neutral-900/60 border border-neutral-300/60 dark:border-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-amber-300 transition-all duration-300"
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
