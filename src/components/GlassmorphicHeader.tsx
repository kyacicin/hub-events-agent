"use client";

import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { HubOption, HubRegion } from '../types';
import { HUB_LOCATIONS } from '../data';
import { Lang, localizeCity } from '../i18n';

interface GlassmorphicHeaderProps {
  hubs: HubOption[];
  activeRegion: HubRegion;
  onRegionChange: (region: HubRegion) => void;
  lang: Lang;
  t: Record<string, string>;
}

export default function GlassmorphicHeader({
  hubs,
  activeRegion,
  onRegionChange,
  lang,
  t,
}: GlassmorphicHeaderProps) {
  const currentHub = HUB_LOCATIONS[activeRegion] ?? HUB_LOCATIONS['astana'];

  return (
    <header id="glass-header" className="sticky top-0 z-50 w-full bg-white/70 dark:bg-neutral-950/60 backdrop-blur-md border-b border-neutral-200 dark:border-white/5 px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors duration-300">
      {/* Brand & Connection State */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-400 p-[1px] flex items-center justify-center shadow-lg shadow-blue-500/10">
          <div className="relative w-full h-full overflow-hidden rounded-[11px] bg-white dark:bg-neutral-950">
            <Image
              src="/astanahub_logo.png"
              alt="Astana Hub"
              fill
              sizes="40px"
              className="object-contain p-1.5"
              priority
            />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-sans font-bold tracking-tight text-neutral-900 dark:text-white">Astana Hub</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            <span className="font-mono">
              {t.connectedTo}{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{currentHub.name}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Hub filter: all 19 regional hubs in a compact dropdown */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 bg-neutral-200/60 dark:bg-neutral-900/60 border border-neutral-300/60 dark:border-neutral-800/80 p-1 rounded-2xl">
          <span className="hidden sm:inline text-[10px] font-mono text-neutral-500 px-2 uppercase tracking-tight">{t.activeHub}</span>
          <div className="relative">
            <select
              value={activeRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1 text-xs rounded-xl bg-emerald-500 text-neutral-950 font-medium shadow-md shadow-emerald-500/10 cursor-pointer focus:outline-none"
              aria-label={t.activeHub}
            >
              {hubs.map((hub) => (
                <option key={hub.region} value={hub.region}>
                  {hub.label} · {localizeCity(hub.cityName, lang)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-neutral-950 pointer-events-none" />
          </div>
        </div>
      </div>
    </header>
  );
}
