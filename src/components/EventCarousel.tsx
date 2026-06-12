"use client";

import { useState, useEffect } from 'react';
import { Heart, ChevronRight, ChevronLeft, Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';
import InstagramIcon from './InstagramIcon';
import { syncSpotlightPointer } from './spotlightBorder';
import { hasMapRoute } from '../data';
import { UiEvent, UiEventFormat } from '../types';
import { Lang, formatDay, localizeCity } from '../i18n';

interface EventCarouselProps {
  events: UiEvent[];
  onShowDirections?: (event: UiEvent) => void;
  onSaveToast?: (message: string) => void;
  lang: Lang;
  t: Record<string, string>;
}

const FORMAT_BADGE: Record<UiEventFormat, { pill: string }> = {
  OFFLINE: { pill: 'bg-red-500 text-white shadow-md shadow-red-500/20' },
  ONLINE: { pill: 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20' },
  HYBRID: { pill: 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20' },
};

export default function EventCarousel({ events, onShowDirections, onSaveToast, lang, t }: EventCarouselProps) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load from local storage after hydration (not in the initializer: the
  // server render has no localStorage and the markup must match on hydrate).
  useEffect(() => {
    try {
      const stored = localStorage.getItem('saved_hub_events');
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSavedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not read localstorage", e);
    }
  }, []);

  // Clamp instead of resetting in an effect so a shorter event list never
  // leaves the carousel pointing past the end.
  const safeIndex = Math.min(currentIndex, events.length - 1);

  const toggleSave = (eventId: string, title: string) => {
    let updated: string[];
    if (savedIds.includes(eventId)) {
      updated = savedIds.filter(id => id !== eventId);
      if (onSaveToast) onSaveToast(`«${title}» ${t.removedToast}`);
    } else {
      updated = [...savedIds, eventId];
      if (onSaveToast) onSaveToast(`«${title}» ${t.savedToast}`);
    }
    setSavedIds(updated);
    try {
      localStorage.setItem('saved_hub_events', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNext = () => {
    if (safeIndex < events.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0); // Loop
    }
  };

  const handlePrev = () => {
    if (safeIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(events.length - 1); // Loop
    }
  };

  if (!events || events.length === 0) {
    return (
      <div
        data-spotlight-card
        onPointerMove={syncSpotlightPointer}
        className="flex flex-col items-center justify-center p-8 bg-white/70 dark:bg-neutral-900/40 rounded-3xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400"
      >
        <Calendar className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-2" />
        <p className="text-sm font-sans">{t.noEvents}</p>
      </div>
    );
  }

  return (
    <div id="event-carousel-component" className="relative w-full select-none">
      {/* Headings & Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold font-sans uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
            {t.regionalEvents} ({events.length})
          </h3>
        </div>

        {/* Navigation Arrows */}
        {events.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
              aria-label="Previous event"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-neutral-500">
              {safeIndex + 1}/{events.length}
            </span>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
              aria-label="Next event"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Swipeable-like Responsive Window */}
      <div className="overflow-hidden p-1 rounded-3xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {events.map((event) => {
            const isSaved = savedIds.includes(event.id);
            return (
              <div
                key={event.id}
                className="w-full shrink-0 px-0.5"
              >
                {/* Premium Glassmorphic Card */}
                <div
                  data-spotlight-card
                  onPointerMove={syncSpotlightPointer}
                  className="relative group rounded-3xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700/80 backdrop-blur-xl p-4 overflow-hidden shadow-xl shadow-neutral-200/50 dark:shadow-black/20 transition-all duration-300 flex flex-col justify-between h-[390px] hover:shadow-2xl"
                >
                  {/* Subtle Top Glow gradient accent */}
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent group-hover:via-emerald-400 transition-all duration-500" />

                  {/* Image Container */}
                  <div className="relative w-full h-[150px] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      referrerPolicy="no-referrer"
                    />

                    {/* Dark gradient shadow inside image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />

                    {/* Format Badge (high contrast ONLINE / OFFLINE / HYBRID) */}
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-wider ${FORMAT_BADGE[event.format].pill}`}>
                        {event.format}
                      </span>
                    </div>

                    {/* Quick Save Bookmark button */}
                    <button
                      onClick={() => toggleSave(event.id, event.title)}
                      className="absolute top-2 right-2 p-2 rounded-xl bg-neutral-950/70 border border-white/5 text-neutral-400 hover:text-red-400 hover:scale-110 active:scale-95 transition-all duration-200 backdrop-blur-md"
                      title={isSaved ? t.removeBookmark : t.saveEvent}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>

                    {/* Float Action Button (Instagram logo) */}
                    <a
                      href={event.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 p-2.5 rounded-xl bg-gradient-to-tr from-pink-500 to-amber-500 text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-md shadow-pink-500/20 backdrop-blur-md"
                      title={t.openPost}
                    >
                      <InstagramIcon className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Body Details */}
                  <div className="mt-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* DateTime Indicators */}
                      <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3" />
                          <span>{formatDay(event.date, lang)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3" />
                          <span>{event.time || '—'}</span>
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-500 text-[10px] bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 px-1 rounded uppercase">
                          {localizeCity(event.cityName, lang)}
                        </span>
                      </div>

                      {/* Event title */}
                      <h4 className="text-base font-sans font-bold leading-tight text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors duration-300">
                        {event.title}
                      </h4>
                      {/* Short Description */}
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2 mt-1.5 font-sans">
                        {event.description}
                      </p>
                    </div>

                    {/* Actions and Locations */}
                    <div className="mt-4">
                      {event.format !== 'ONLINE' && hasMapRoute(event.hub) && onShowDirections ? (
                        <button
                          onClick={() => onShowDirections(event)}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-sans font-medium rounded-xl text-neutral-900 bg-emerald-400 hover:bg-emerald-300 transition-all duration-250 cursor-pointer shadow-lg shadow-emerald-400/10 focus:outline-none"
                        >
                          <MapPin className="w-3.5" />
                          {t.route}
                        </button>
                      ) : event.format === 'ONLINE' ? (
                        <div className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-semibold rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                          <CheckCircle className="w-3.5 shrink-0" />
                          <span className="truncate">{event.locationName}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-semibold rounded-xl text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800">
                          <MapPin className="w-3.5 shrink-0" />
                          <span className="truncate">{event.locationName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
