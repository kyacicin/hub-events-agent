"use client";

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Navigation, Compass } from 'lucide-react';
import { HubRegion } from '../types';
import { HUB_LOCATIONS, MAP_BACKBONE, REGION_COORDS, mapNodes } from '../data';

interface MiniMapProps {
  targetRegion: HubRegion;
  eventName: string;
  locationName: string;
  t: Record<string, string>;
}

const HQ_REGION = 'astana';

export default function MiniMap({ targetRegion, eventName, locationName, t }: MiniMapProps) {
  // Track which region's route has finished its draw-in delay; deriving
  // routeAnimated from it replays the animation on target change without
  // setting state synchronously in the effect.
  const [animatedRegion, setAnimatedRegion] = useState<string | null>(null);
  const routeAnimated = animatedRegion === targetRegion;
  const matchedHub = HUB_LOCATIONS[targetRegion] ?? HUB_LOCATIONS[HQ_REGION];

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedRegion(String(targetRegion)), 300);
    return () => clearTimeout(timer);
  }, [targetRegion]);

  const nodes = mapNodes();
  const sourceCoords = REGION_COORDS[HQ_REGION];
  const targetCoords = REGION_COORDS[targetRegion] ?? REGION_COORDS['zhambyl'];
  const routePath = `M ${sourceCoords.x} ${sourceCoords.y} Q ${(sourceCoords.x + targetCoords.x) / 2 + 20} ${(sourceCoords.y + targetCoords.y) / 2 - 30} ${targetCoords.x} ${targetCoords.y}`;

  return (
    <div id="mini-map-container" className="relative p-4 rounded-3xl bg-white/90 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 backdrop-blur-xl overflow-hidden mt-3 shadow-2xl shadow-neutral-300/40 dark:shadow-black/40 transition-colors duration-300">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Map Header */}
      <div className="flex items-start justify-between relative mb-3 gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 uppercase">
            {t.routePlanner}
          </span>
          <h4 className="text-sm font-sans font-medium text-neutral-900 dark:text-neutral-100 mt-1 truncate">{eventName}</h4>
          <p className="text-xs font-sans text-neutral-500 dark:text-neutral-400 leading-tight truncate">{locationName}</p>
        </div>
        <div className="text-right flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
            <Compass className="w-3 animate-spin-slow" />
            <span>HQ Link Active</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5">Astana HQ → {matchedHub.name}</span>
        </div>
      </div>

      {/* Styled Canvas Area */}
      <div className="relative w-full h-44 bg-neutral-950/90 rounded-2xl border border-neutral-800/80 overflow-hidden flex items-center justify-center">
        {/* Vector SVG Canvas */}
        <svg className="w-full h-full absolute inset-0 text-neutral-800" viewBox="0 0 500 320" xmlns="http://www.w3.org/2000/svg">
          {/* Subtle backbone lines from HQ to major regional hubs */}
          {MAP_BACKBONE.map((region) => {
            const coords = REGION_COORDS[region];
            if (!coords) return null;
            return (
              <line
                key={region}
                x1={sourceCoords.x}
                y1={sourceCoords.y}
                x2={coords.x}
                y2={coords.y}
                stroke="#262626"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Animated Route Line from HQ Astana to Target */}
          {routeAnimated && (
            <motion.path
              d={routePath}
              fill="none"
              stroke="url(#route-gradient)"
              strokeWidth="2.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          )}

          {/* Animated dashes travelling along path */}
          {routeAnimated && (
            <path
              d={routePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeDasharray="8 8"
              className="dash-animate"
            />
          )}

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Hub Nodes */}
          {nodes.map((node) => {
            const isTarget = node.region === targetRegion;
            const isHQ = node.region === HQ_REGION;
            const showLabel = isTarget || isHQ || MAP_BACKBONE.includes(node.region);

            return (
              <g key={node.region}>
                {/* Base node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isTarget ? 5.5 : isHQ ? 4.5 : 3}
                  className={`${
                    isTarget ? 'fill-emerald-400' : isHQ ? 'fill-blue-400' : 'fill-neutral-700'
                  }`}
                />

                {/* Region name annotation (target, HQ and backbone hubs only) */}
                {showLabel && (
                  <text
                    x={node.x}
                    y={node.y - (isTarget ? 10 : 8)}
                    textAnchor="middle"
                    className={`font-mono text-[8px] tracking-tight ${
                      isTarget ? 'fill-emerald-400 font-bold' : isHQ ? 'fill-blue-300' : 'fill-neutral-500'
                    }`}
                  >
                    {node.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Custom Controls Floating Labels */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-900/90 border border-neutral-800 text-[9px] font-mono text-neutral-400">
          <Navigation className="w-2.5 text-emerald-400" />
          <span>Hub Coordinates Locked</span>
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-neutral-900/90 border border-neutral-800 text-[9px] font-mono text-emerald-400 font-medium">
          <span>{t.hubNetwork}</span>
        </div>
      </div>

      {/* Route Info Cards */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <div className="p-2 rounded bg-neutral-100 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-900 text-left">
          <p className="text-[10px] font-sans text-neutral-500 uppercase tracking-wider">{t.routeStart}</p>
          <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium truncate">{HUB_LOCATIONS[HQ_REGION].name}</p>
          <p className="text-[9px] text-neutral-500 truncate">{HUB_LOCATIONS[HQ_REGION].fullAddress}</p>
        </div>
        <div className="p-2 rounded bg-emerald-50 dark:bg-neutral-950/50 border border-emerald-200 dark:border-emerald-950/40 text-left">
          <p className="text-[10px] font-sans text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">{t.routeDest}</p>
          <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium truncate">{matchedHub.name}</p>
          <p className="text-[9px] text-neutral-500 truncate">{locationName || matchedHub.fullAddress}</p>
        </div>
      </div>

      {/* Styled animation CSS injected inline safely */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -40;
          }
        }
        .dash-animate {
          animation: dash 1.5s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
