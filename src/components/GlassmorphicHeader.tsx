"use client";

import Image from 'next/image';
import { ChevronDown, Languages, Moon, Sun } from 'lucide-react';
import { HubOption, HubRegion } from '../types';
import { HUB_LOCATIONS } from '../data';
import { Lang, LANGS, localizeCity } from '../i18n';

interface GlassmorphicHeaderProps {
  hubs: HubOption[];
  activeRegion: HubRegion;
  onRegionChange: (region: HubRegion) => void;
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
  lang,
  onLangChange,
  theme,
  onThemeToggle,
  t,
}: GlassmorphicHeaderProps) {
  const currentHub = HUB_LOCATIONS[activeRegion] ?? HUB_LOCATIONS['astana'];

  return (
    <header
      id="glass-header"
      className="sticky top-0 z-50 w-full bg-white/70 dark:bg-neutral-950/60 backdrop-blur-md border-b border-neutral-200 dark:border-white/5 px-4 sm:px-6 py-3 transition-colors duration-300"
    >
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">

        {/* Brand & Connection State */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-400 p-[1.5px] flex items-center justify-center shadow-lg shadow-blue-500/10">
            <div className="relative w-full h-full overflow-hidden rounded-[10px] bg-white dark:bg-neutral-950">
              <Image
                src="/astanahub_logo.png"
                alt="Astana Hub"
                fill
                sizes="36px"
                className="object-contain p-1"
                priority
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-sans font-bold tracking-tight text-neutral-955 dark:text-white">
                Astana Hub
              </h1>
              <span className="hidden md:inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20 animate-pulse">
                PORTAL LIVE
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              <span className="font-mono">
                {t.connectedTo}{' '}
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{currentHub.name}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls: Lang, Theme, and Hub Select */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">

          {/* Language Switcher */}
          <div className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/40 p-0.5">
            <Languages className="ml-1.5 h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => onLangChange(code)}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                  lang === code
                    ? 'bg-emerald-500 text-neutral-950 font-semibold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onThemeToggle}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/40 text-neutral-600 dark:text-neutral-400 transition hover:text-neutral-955 dark:hover:text-white"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Hub filter dropdown */}
          <div className="flex items-center gap-1.5 bg-neutral-200/60 dark:bg-neutral-900/40 border border-neutral-300/60 dark:border-neutral-800/80 p-0.5 rounded-xl">
            <div className="relative">
              <select
                value={activeRegion}
                onChange={(e) => onRegionChange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-[11px] rounded-lg bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/10 cursor-pointer focus:outline-none"
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

      </div>
    </header>
  );
}
