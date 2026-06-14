"use client";

import { useState } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import InstagramIcon from './InstagramIcon';
import { syncSpotlightPointer } from './spotlightBorder';
import { hasMapRoute, HUB_LOCATIONS } from '../data';
import { UiEvent, HubRegion } from '../types';
import { Lang, formatDay, localizeCity } from '../i18n';

interface EventCarouselProps {
  events: UiEvent[];
  activeRegion: HubRegion;
  onShowDirections?: (event: UiEvent) => void;
  lang: Lang;
  t: Record<string, string>;
}

export default function EventCarousel({
  events,
  activeRegion,
  onShowDirections,
  lang,
  t,
}: EventCarouselProps) {
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');

  const currentHub = HUB_LOCATIONS[activeRegion];
  const localizedCity = currentHub ? localizeCity(currentHub.cityName, lang) : '';

  const filteredEvents = events.filter(event => {
    if (formatFilter === 'ONLINE') return event.format === 'ONLINE';
    if (formatFilter === 'OFFLINE') return event.format === 'OFFLINE';
    return true;
  });

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {/* Header Title */}
        <div className="border-b border-neutral-800 pb-3">
          <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
            {localizedCity || 'АСТАНА'} · {t.tabEvents || 'СОБЫТИЯ'}
          </p>
          <h2 className="text-lg font-bold text-neutral-100 font-sans tracking-tight">
            {t.regionalEvents || 'События региона'}
          </h2>
        </div>

        <div
          data-spotlight-card
          onPointerMove={syncSpotlightPointer}
          className="flex flex-col items-center justify-center p-12 bg-neutral-900/40 rounded-3xl border border-neutral-800 text-neutral-500 text-center font-mono"
        >
          <Calendar className="w-8 h-8 text-neutral-700 mb-3" />
          <p className="text-sm">{t.noEvents || 'Событий не найдено'}</p>
          <p className="text-xs text-neutral-600 mt-1">Следите за обновлениями</p>
        </div>
      </div>
    );
  }

  return (
    <div id="event-carousel-component" className="flex flex-col gap-4 select-none">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800 pb-3">
        <div>
          <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
            {localizedCity || 'АСТАНА'} · {t.tabEvents || 'СОБЫТИЯ'}
          </p>
          <h2 className="text-lg font-bold text-neutral-100 font-sans tracking-tight">
            {t.regionalEvents || 'События региона'}
          </h2>
        </div>
        <span className="self-start sm:self-center inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
          {events.length} {t.eventsUnit || 'событий'}
        </span>
      </div>

      {/* Format Filters */}
      <div className="flex gap-2 p-1 bg-neutral-900/80 border border-neutral-800 rounded-xl self-start">
        {(['ALL', 'ONLINE', 'OFFLINE'] as const).map((fmt) => (
          <button
            key={fmt}
            onClick={() => setFormatFilter(fmt)}
            className={`px-3 py-1 text-xs font-mono font-medium rounded-lg transition-all ${
              formatFilter === fmt
                ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {fmt === 'ALL' ? (t.filterAll || 'Все') : fmt === 'ONLINE' ? (t.filterOnline || 'Онлайн') : (t.filterOffline || 'Офлайн')}
          </button>
        ))}
      </div>

      {/* Vertical scrollable event list */}
      <div className="flex flex-col gap-4 events-scroll overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
        {filteredEvents.map((event) => {
          const isOnline = event.format === 'ONLINE';
          const isHybrid = event.format === 'HYBRID';
          const formatBadge = isOnline ? '🟢 ОНЛАЙН' : isHybrid ? '🟡 ГИБРИД' : '🔴 ОФЛАЙН';

          return (
            <div
              key={event.id}
              data-spotlight-card
              onPointerMove={syncSpotlightPointer}
              className={`group relative rounded-3xl bg-neutral-900/70 border border-neutral-800 overflow-hidden shadow-lg shadow-black/25 transition-all duration-300 hover:border-neutral-700/80`}
            >
              {/* Top accent line based on format */}
              <div
                className={`absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-neutral-700 to-transparent transition-all duration-500 ${
                  isOnline
                    ? 'group-hover:via-emerald-500'
                    : 'group-hover:via-purple-500'
                }`}
              />

              {/* Image Section */}
              <div className="relative w-full h-[180px] overflow-hidden bg-neutral-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />

                {/* Format Badge with Colored Dot */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-mono font-bold tracking-wider bg-neutral-950/80 border border-neutral-800 ${
                    isOnline ? 'text-emerald-400' : isHybrid ? 'text-amber-300' : 'text-red-300'
                  }`}>
                    {formatBadge}
                  </span>
                </div>

                {/* Instagram FAB */}
                <a
                  href={event.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-gradient-to-tr from-pink-500 to-amber-500 text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-md shadow-pink-500/20 backdrop-blur-md"
                  title={t.openPost}
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Content Section */}
              <div className="p-4 flex flex-col gap-3">
                {/* Meta: date · clock · city */}
                <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3" />
                    <span>{formatDay(event.date, lang)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3" />
                    <span>{event.time || '—'}</span>
                  </span>
                  <span className="text-emerald-400 text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-semibold">
                    {localizeCity(event.cityName, lang)}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-base font-sans font-bold leading-tight text-neutral-100 group-hover:text-emerald-400 transition-colors duration-300">
                  {event.title}
                </h4>

                {/* Description - Un-truncated full text */}
                <p className="text-xs text-neutral-400 leading-relaxed font-sans whitespace-pre-wrap">
                  {event.description}
                </p>

                {/* Footer: route or location */}
                <div className="flex items-center gap-3 pt-3 border-t border-neutral-900 mt-2">
                  {event.format !== 'ONLINE' && hasMapRoute(event.hub) && onShowDirections ? (
                    <button
                      onClick={() => onShowDirections(event)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-sans font-semibold rounded-xl text-neutral-950 bg-emerald-400 hover:bg-emerald-300 transition-all duration-250 cursor-pointer shadow-lg shadow-emerald-400/10 focus:outline-none"
                    >
                      <MapPin className="w-3.5" />
                      {t.route || 'Маршрут'}
                    </button>
                  ) : (
                    <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-semibold rounded-xl text-neutral-400 bg-neutral-950/60 border border-neutral-800">
                      <MapPin className="w-3.5 shrink-0 text-neutral-500" />
                      <span className="truncate">{event.locationName}</span>
                    </div>
                  )}
                </div>

                {/* Hub name footer */}
                <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500">
                  <span>{event.hubName}</span>
                  <span>@{event.hubName.toLowerCase().replace(/\s+/g, '_')}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="text-center py-6 text-neutral-500 font-mono text-xs">
            {t.noEventsForFilter || 'Нет событий для выбранного формата'}
          </div>
        )}
      </div>
    </div>
  );
}
