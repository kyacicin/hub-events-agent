"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, MapPin, Sparkles, Filter, ExternalLink } from 'lucide-react';
import { getSchedule, hasMapRoute } from '../data';
import { HubOption, HubRegion, TimeSlot, UiEvent, Weekday } from '../types';

interface ScheduleGridProps {
  events: UiEvent[];
  hubs: HubOption[];
  initialRegion: HubRegion;
  onShowDirections?: (event: UiEvent) => void;
}

export default function ScheduleGrid({ events, hubs, initialRegion, onShowDirections }: ScheduleGridProps) {
  const [selectedRegion, setSelectedRegion] = useState<HubRegion>(initialRegion);
  const [activePreview, setActivePreview] = useState<TimeSlot | null>(null);

  const fullSchedule = getSchedule(selectedRegion, events);

  // Group by days
  const days: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const fullDayName: Record<Weekday, string> = {
    Mon: 'Понедельник',
    Tue: 'Вторник',
    Wed: 'Среда',
    Thu: 'Четверг',
    Fri: 'Пятница',
    Sat: 'Суббота',
    Sun: 'Воскресенье'
  };

  return (
    <div id="schedule-grid-component" className="w-full bg-neutral-900/40 p-4 sm:p-5 rounded-3xl border border-neutral-800 backdrop-blur-xl relative select-none">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header and City Pill Switcher */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold font-sans uppercase tracking-wider text-neutral-300">
              Weekly Timetable
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Calendar
          </span>
        </div>

        {/* City Switcher Pill bar (Tennis inspired) */}
        <div className="flex flex-wrap gap-1.5 bg-neutral-950/80 p-1.5 rounded-2xl border border-neutral-800">
          {hubs.map((hub) => (
            <button
              key={hub.region}
              onClick={() => {
                setSelectedRegion(hub.region);
                setActivePreview(null);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-xl transition-all duration-300 ${
                selectedRegion === hub.region
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              {hub.label} Hub
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Container */}
      <div className="space-y-4 text-left font-sans">
        {days.map((day) => {
          const slotsForDay = fullSchedule.filter(s => s.day === day);
          const hasEvents = slotsForDay.some(s => s.event);

          return (
            <div key={day} className="border-b border-white/5 pb-3 last:border-0">
              {/* Day title */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-neutral-200 tracking-wide uppercase px-2 py-0.5 rounded bg-neutral-950">
                  {fullDayName[day]} ({day})
                </span>
                {!hasEvents && (
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">
                    Нет событий
                  </span>
                )}
              </div>

              {/* Grid of Slots */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                {slotsForDay.map((slot, index) => {
                  const isScheduled = !!slot.event;
                  const isCurPreview = activePreview && activePreview.day === slot.day && activePreview.time === slot.time;

                  return (
                    <button
                      key={index}
                      onClick={() => isScheduled ? setActivePreview(slot) : setActivePreview(null)}
                      className={`relative py-2.5 px-2 text-xs font-mono rounded-xl border text-center transition-all duration-300 focus:outline-none ${
                        isScheduled
                          ? 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold shadow-md shadow-emerald-500/5 cursor-pointer ring-1 ring-emerald-500/20'
                          : slot.available
                          ? 'border-neutral-800 bg-neutral-900/20 hover:bg-neutral-800/20 hover:text-neutral-200 text-neutral-500 cursor-default'
                          : 'border-transparent bg-neutral-950/40 text-neutral-700/80 cursor-not-allowed line-through'
                      } ${isCurPreview ? 'ring-2 ring-emerald-400 scale-[1.02] border-emerald-400' : ''}`}
                    >
                      <span>{slot.time}</span>

                      {/* Interactive block dot */}
                      {isScheduled && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tapping/Detail Floating Overlay banner */}
      <AnimatePresence>
        {activePreview && activePreview.event && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute bottom-4 left-4 right-4 bg-neutral-950/95 border border-emerald-500/40 p-4 rounded-2xl shadow-2xl backdrop-blur-2xl text-left z-20"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950 text-[9px] text-emerald-400 tracking-wider font-mono font-semibold uppercase mb-1">
                  ⭐ Active Booking
                </span>
                <h4 className="text-sm font-sans font-bold text-neutral-100 mt-0.5">
                  {activePreview.event.title}
                </h4>
                <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                  {activePreview.event.description}
                </p>
              </div>
              <button
                onClick={() => setActivePreview(null)}
                className="text-neutral-500 hover:text-white text-xs px-2 py-1 rounded bg-neutral-900 border border-neutral-800"
              >
                Закрыть
              </button>
            </div>

            {/* Time / Hub coordinates */}
            <div className="flex flex-wrap items-center gap-4 mt-3 pt-2.5 border-t border-neutral-900 text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 text-emerald-400" />
                <span>{activePreview.event.day}, {activePreview.event.time || 'время уточняется'}</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Sparkles className="w-3" />
                <span>{activePreview.event.format}</span>
              </span>
              <span className="flex items-center gap-1 text-neutral-500">
                <MapPin className="w-3" />
                <span className="truncate">{activePreview.event.locationName.split(',')[0]}</span>
              </span>
            </div>

            {/* Expanded Direct actions */}
            <div className="mt-3 flex gap-2">
              {activePreview.event.format !== 'ONLINE' && hasMapRoute(activePreview.event.hub) && onShowDirections && (
                <button
                  onClick={() => {
                    if (onShowDirections && activePreview.event) onShowDirections(activePreview.event);
                  }}
                  className="flex-1 text-center py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-sans font-medium text-xs transition-all cursor-pointer"
                >
                  Показать маршрут на карте
                </button>
              )}
              <a
                href={activePreview.event.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center justify-center text-xs gap-1 transition-all"
              >
                <ExternalLink className="w-3" />
                Открыть пост
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
