"use client";

import { useMemo } from 'react';
import { MapIcon } from 'lucide-react';
import { REGION_COORDS, MAP_BACKBONE, mapNodes, HUB_LOCATIONS } from '../data';
import type { HubOption, HubRegion } from '../types';
import type { Lang } from '../i18n';
import HubInfoCard from './HubInfoCard';

interface KazakhstanHubMapProps {
  activeRegion: HubRegion;
  hubs: HubOption[];
  onRegionChange: (region: HubRegion) => void;
  userLocation: { lat: number; lng: number } | null;
  geoStatus: 'idle' | 'locating' | 'ready' | 'denied' | 'error' | 'unsupported';
  onLocate: () => void;
  activeEventsCount: number;
  activeStaffCount: number;
  t: Record<string, string>;
  lang: Lang;
}

export default function KazakhstanHubMap({
  activeRegion,
  hubs,
  onRegionChange,
  userLocation,
  geoStatus,
  onLocate,
  activeEventsCount,
  activeStaffCount,
  t,
  lang,
}: KazakhstanHubMapProps) {
  const selectedHub = HUB_LOCATIONS[activeRegion] ?? HUB_LOCATIONS.astana;
  const nodes = useMemo(() => mapNodes(), []);

  // Generate background grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    // Vertical grid lines
    for (let x = 20; x < 500; x += 25) {
      lines.push(<line key={`v-${x}`} x1={x} y1={0} x2={x} y2={320} stroke="rgba(16, 185, 129, 0.03)" strokeWidth="0.5" />);
    }
    // Horizontal grid lines
    for (let y = 20; y < 320; y += 25) {
      lines.push(<line key={`h-${y}`} x1={0} y1={y} x2={500} y2={y} stroke="rgba(16, 185, 129, 0.03)" strokeWidth="0.5" />);
    }
    return lines;
  }, []);

  const activeNodeCoords = REGION_COORDS[activeRegion] ?? REGION_COORDS.astana;

  return (
    <div className="flex flex-col gap-4">
      {/* SVG Map Widget */}
      <section
        className="rounded-3xl bg-neutral-950 border border-neutral-800 p-4 shadow-lg shadow-black/40 overflow-hidden relative"
      >
        {/* Map Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <MapIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-neutral-300">
                {t.hubMapTitle || 'КАРТА ХАБОВ КАЗАХСТАНА'}
              </h3>
            </div>
            <p className="mt-0.5 text-[9px] text-neutral-500 font-mono">
              {t.hubsOnMap || 'СЕТЬ ФИЛИАЛОВ'}: {hubs.length} {t.hubsCountUnit || 'ХАБОВ'}
            </p>
          </div>
          <span className="inline-flex items-center rounded bg-emerald-400/5 px-1.5 py-0.5 text-[9px] font-mono font-medium text-emerald-400 ring-1 ring-inset ring-emerald-400/20">
            ONLINE VIEW
          </span>
        </div>

        {/* SVG Viewport */}
        <div className="relative border border-neutral-900 rounded-2xl overflow-hidden bg-[#03070c]">
          <svg
            viewBox="0 0 500 320"
            className="w-full h-auto select-none"
          >
            {/* Grid Overlay */}
            {gridLines}

            {/* Backbone connections from Astana */}
            {MAP_BACKBONE.map((reg) => {
              const coords = REGION_COORDS[reg];
              if (!coords) return null;
              return (
                <line
                  key={`backbone-${reg}`}
                  x1={REGION_COORDS.astana.x}
                  y1={REGION_COORDS.astana.y}
                  x2={coords.x}
                  y2={coords.y}
                  stroke="rgba(16, 185, 129, 0.15)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
              );
            })}

            {/* Dynamic Active Route Connection */}
            {activeRegion !== 'astana' && activeNodeCoords && (
              <path
                d={`M ${REGION_COORDS.astana.x} ${REGION_COORDS.astana.y} Q ${(REGION_COORDS.astana.x + activeNodeCoords.x) / 2 + 15} ${(REGION_COORDS.astana.y + activeNodeCoords.y) / 2 - 25} ${activeNodeCoords.x} ${activeNodeCoords.y}`}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.2"
                strokeDasharray="5 5"
                className="animate-dash-flow"
              />
            )}

            {/* Hub Nodes & Labels */}
            {nodes.map((node) => {
              const isActive = node.region === activeRegion;
              const isAstana = node.region === 'astana';
              const isBackbone = MAP_BACKBONE.includes(node.region);

              // Position label above/below dot based on vertical position to avoid edge clipping
              const labelOffsetY = node.y < 40 ? 12 : -8;

              // Determine label visibility
              const showLabel = isActive || isAstana || isBackbone;

              return (
                <g key={node.region} className="group">
                  {/* Clicking areas (larger invisible circle for easier mobile tap) */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="12"
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={() => onRegionChange(node.region)}
                  />

                  {/* Pulsing Outer Circle for Active Hub */}
                  {isActive && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="12"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1"
                      className="animate-pulse-dot"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isActive ? 6 : isAstana ? 4.5 : 3}
                    fill={isActive ? '#10b981' : isAstana ? '#3b82f6' : '#4b5563'}
                    className={`cursor-pointer transition-colors duration-200 ${
                      isActive ? 'stroke-neutral-950 stroke-1' : 'group-hover:fill-neutral-300'
                    }`}
                    onClick={() => onRegionChange(node.region)}
                  />

                  {/* Label */}
                  {showLabel && (
                    <text
                      x={node.x}
                      y={node.y + labelOffsetY}
                      textAnchor="middle"
                      onClick={() => onRegionChange(node.region)}
                      className={`cursor-pointer font-mono font-bold select-none transition-colors duration-200 ${
                        isActive
                          ? 'fill-emerald-400 text-[9px]'
                          : isAstana
                            ? 'fill-blue-400 text-[8px]'
                            : 'fill-neutral-500 group-hover:fill-neutral-300 text-[7px]'
                      }`}
                    >
                      {node.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Bottom network indicator overlay */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-neutral-950/80 px-2 py-0.5 rounded border border-neutral-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[8px] font-mono uppercase tracking-wider text-emerald-400">
              {lang === 'kk' ? 'ХАБ ЖЕЛІСІ · БЕЛСЕНДІ' : lang === 'en' ? 'HUB NETWORK · ACTIVE' : 'СЕТЬ ХАБОВ · АКТИВНА'}
            </span>
          </div>
        </div>
      </section>

      {/* Selected Hub Details Widget */}
      <HubInfoCard
        selectedHub={selectedHub}
        activeEventsCount={activeEventsCount}
        activeStaffCount={activeStaffCount}
        geoStatus={geoStatus}
        onLocate={onLocate}
        userLocation={userLocation}
        t={t}
        lang={lang}
      />
    </div>
  );
}
