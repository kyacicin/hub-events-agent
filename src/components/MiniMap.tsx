"use client";

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Navigation, Compass } from 'lucide-react';
import { HubCity } from '../types';
import { HUB_LOCATIONS } from '../data';

interface MiniMapProps {
  targetCity: HubCity | string;
  eventName: string;
  locationName: string;
}

export default function MiniMap({ targetCity, eventName, locationName }: MiniMapProps) {
  // Track which city's route has finished its draw-in delay; deriving
  // routeAnimated from it replays the animation on target change without
  // setting state synchronously in the effect.
  const [animatedCity, setAnimatedCity] = useState<string | null>(null);
  const routeAnimated = animatedCity === targetCity;
  const matchedHub = HUB_LOCATIONS[targetCity as HubCity] || HUB_LOCATIONS['Zhambyl'];

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedCity(String(targetCity)), 300);
    return () => clearTimeout(timer);
  }, [targetCity]);

  // Abstract geography coordinates for Kazakhstan Hub Networks
  const hubs = [
    { id: 'Astana', x: 320, y: 120, label: 'Astana Hub (HQ)' },
    { id: 'Pavlodar', x: 420, y: 80, label: 'Pavlodar IT Hub' },
    { id: 'Kyzylorda', x: 180, y: 220, label: 'Kyzylorda IT Hub' },
    { id: 'Zhambyl', x: 260, y: 260, label: 'Zhambyl IT Hub' },
    { id: 'Taraz', x: 250, y: 280, label: 'Taraz Innovation Hub' },
  ];

  const targetCoords = hubs.find(h => h.id === targetCity) || hubs[3]; // Fallback Zhambyl
  const sourceCoords = hubs[0]; // Astana HQ is always starting/reference point for pathways!

  return (
    <div id="mini-map-container" className="relative p-4 rounded-3xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl overflow-hidden mt-3 shadow-2xl">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Decorative Rings overlay */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Map Header */}
      <div className="flex items-start justify-between relative mb-3">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 uppercase">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            Internal Route Planner
          </span>
          <h4 className="text-sm font-sans font-medium text-neutral-100 mt-1">{eventName}</h4>
          <p className="text-xs font-sans text-neutral-400 leading-tight">{locationName}</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono">
            <Compass className="w-3 animate-spin-slow" />
            <span>HQ Link Active</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5">Route: Astana Headquarters → {matchedHub.name}</span>
        </div>
      </div>

      {/* Styled Canvas Area */}
      <div className="relative w-full h-44 bg-neutral-950/90 rounded-2xl border border-neutral-800/80 overflow-hidden flex items-center justify-center">
        {/* Vector SVG Canvas */}
        <svg className="w-full h-full absolute inset-0 text-neutral-800" viewBox="0 0 500 320" xmlns="http://www.w3.org/2000/svg">
          {/* Subtle connecting lines backbones between hubs */}
          <line x1="320" y1="120" x2="420" y2="80" stroke="#262626" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="320" y1="120" x2="180" y2="220" stroke="#262626" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="320" y1="120" x2="260" y2="260" stroke="#262626" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="180" y1="220" x2="260" y2="260" stroke="#262626" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="260" y1="260" x2="250" y2="280" stroke="#262626" strokeWidth="1" />

          {/* Animated Route Line from HQ Astana to Target */}
          {routeAnimated && (
            <motion.path
              d={`M ${sourceCoords.x} ${sourceCoords.y} Q ${(sourceCoords.x + targetCoords.x)/2 + 20} ${(sourceCoords.y + targetCoords.y)/2 - 30} ${targetCoords.x} ${targetCoords.y}`}
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
              d={`M ${sourceCoords.x} ${sourceCoords.y} Q ${(sourceCoords.x + targetCoords.x)/2 + 20} ${(sourceCoords.y + targetCoords.y)/2 - 30} ${targetCoords.x} ${targetCoords.y}`}
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

          {/* Background Hub Nodes */}
          {hubs.map((hub) => {
            const isTarget = hub.id === targetCity;
            const isHQ = hub.id === 'Astana';

            return (
              <g key={hub.id}>
                {/* Pulse ring for target or HQ */}
                {(isTarget || isHQ) && (
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r={isTarget ? 15 : 11}
                    className={`fill-none ${isTarget ? 'stroke-emerald-400' : 'stroke-blue-400'} opacity-35`}
                  >
                    <animate attributeName="r" values="3;18;3" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Base node circle */}
                <circle
                  cx={hub.x}
                  cy={hub.y}
                  r={isTarget ? 5.5 : isHQ ? 4.5 : 3.5}
                  className={`${
                    isTarget ? 'fill-emerald-400' : isHQ ? 'fill-blue-400' : 'fill-neutral-700'
                  }`}
                />

                {/* City name text annotation */}
                <text
                  x={hub.x}
                  y={hub.y - (isTarget ? 10 : 8)}
                  textAnchor="middle"
                  className={`font-mono text-[8px] tracking-tight ${
                    isTarget ? 'fill-emerald-400 font-bold' : isHQ ? 'fill-blue-300' : 'fill-neutral-500'
                  }`}
                >
                  {hub.id}
                </text>
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
          <span>Est: ~1.2 hrs travel time</span>
        </div>
      </div>

      {/* Route Info Cards */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-neutral-800">
        <div className="p-2 rounded bg-neutral-950/50 border border-neutral-900 text-left">
          <p className="text-[10px] font-sans text-neutral-500 uppercase tracking-wider">Start Location</p>
          <p className="text-xs text-neutral-300 font-medium truncate">Astana Hub HQ</p>
          <p className="text-[9px] text-neutral-500">Mangilik El Ave, Astana</p>
        </div>
        <div className="p-2 rounded bg-neutral-950/50 border border-emerald-950/40 text-left">
          <p className="text-[10px] font-sans text-emerald-500 uppercase tracking-wider">Terminal Ingress</p>
          <p className="text-xs text-neutral-300 font-medium truncate">{matchedHub.name}</p>
          <p className="text-[9px] text-neutral-500 truncate">{matchedHub.fullAddress.split(',')[0]}</p>
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
