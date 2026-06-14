"use client";

import { useMemo } from 'react';
import {
  MapPinned,
  Calendar,
  Users,
  LocateFixed,
  Loader2,
  AlertCircle,
  Navigation,
  ExternalLink
} from 'lucide-react';
import InstagramIcon from './InstagramIcon';
import { HubLocation } from '../types';
import { Lang, localizeAddress } from '../i18n';
import { syncSpotlightPointer } from './spotlightBorder';

interface HubInfoCardProps {
  selectedHub: HubLocation;
  activeEventsCount: number;
  activeStaffCount: number;
  geoStatus: 'idle' | 'locating' | 'ready' | 'denied' | 'error' | 'unsupported';
  onLocate: () => void;
  userLocation: { lat: number; lng: number } | null;
  t: Record<string, string>;
  lang: Lang;
}

function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const radiusKm = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.min(1, Math.sqrt(a)));
}

function formatDistance(km: number, t: Record<string, string>): string {
  if (km < 1) return `${Math.round(km * 1000)} ${t.meterUnit || 'м'}`;
  if (km < 100) return `${km.toFixed(1)} ${t.kilometerUnit || 'км'}`;
  return `${Math.round(km)} ${t.kilometerUnit || 'км'}`;
}

function buildTwoGisRouteUrl(from: { lat: number; lng: number }, to: { lat: number; lng: number }): string {
  return `https://2gis.kz/routeSearch/rsType/car/from/${from.lng},${from.lat}/to/${to.lng},${to.lat}`;
}

export default function HubInfoCard({
  selectedHub,
  activeEventsCount,
  activeStaffCount,
  geoStatus,
  onLocate,
  userLocation,
  t,
  lang,
}: HubInfoCardProps) {
  const selectedPoint = selectedHub.coordinates;

  const distance = useMemo(() => {
    if (!userLocation) return null;
    return distanceKm(userLocation, selectedPoint);
  }, [selectedPoint, userLocation]);

  const routeUrl = userLocation
    ? buildTwoGisRouteUrl(userLocation, selectedPoint)
    : null;

  const geoMessage =
    geoStatus === 'denied'
      ? t.locationDenied || 'Доступ к геопозиции отклонен'
      : geoStatus === 'unsupported'
        ? t.locationUnsupported || 'Геолокация не поддерживается'
        : geoStatus === 'error'
          ? t.locationError || 'Ошибка определения геопозиции'
          : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Hub Location Details Card */}
      <div
        data-spotlight-card
        onPointerMove={syncSpotlightPointer}
        className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/85 dark:bg-neutral-900/60 backdrop-blur-xl p-4 shadow-md shadow-neutral-200/20 dark:shadow-black/10 transition-all duration-300"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <MapPinned className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono">
                {t.selectedHub || 'Выбранный филиал'}
              </p>
              {selectedHub.instagram && (
                <a
                  href={`https://instagram.com/${selectedHub.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-pink-500 hover:text-pink-400 font-medium transition-colors"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                  <span className="font-mono">{selectedHub.instagram}</span>
                </a>
              )}
            </div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-0.5 truncate">
              {selectedHub.name}
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
              {localizeAddress(selectedHub.fullAddress, lang)}
            </p>
            <p className="mt-1 text-[9px] text-neutral-400 dark:text-neutral-500 font-mono">
              {selectedHub.addressPrecision === 'exact'
                ? t.exactAddress || 'Точный адрес подтвержден'
                : t.cityAddressFallback || 'Приблизительный адрес города'}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-900/60">
            <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-neutral-500 uppercase font-mono">{t.tabEvents || 'События'}</p>
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-200">
                {activeEventsCount} {t.eventsUnit || 'событий'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-900/60">
            <Users className="w-4 h-4 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-neutral-500 uppercase font-mono">{t.tabTeam || 'Команда'}</p>
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-200">
                {activeStaffCount} {t.staffUnit || 'команда'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Geolocation Widget */}
      <div
        data-spotlight-card
        onPointerMove={syncSpotlightPointer}
        className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/85 dark:bg-neutral-900/60 backdrop-blur-xl p-3 shadow-md shadow-neutral-200/20 dark:shadow-black/10 transition-all duration-300"
      >
        {!userLocation && !geoMessage ? (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              {t.geolocationHint || 'Разрешите доступ к геолокации, чтобы узнать расстояние и построить маршрут.'}
            </p>
            <button
              type="button"
              onClick={onLocate}
              disabled={geoStatus === 'locating'}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 px-3 py-2 text-xs font-semibold transition hover:opacity-85 disabled:cursor-wait disabled:opacity-70"
            >
              {geoStatus === 'locating' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5" />
              )}
              {geoStatus === 'locating' ? t.locating || 'Определение...' : t.myLocation || 'Моя локация'}
            </button>
          </div>
        ) : geoMessage ? (
          <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 p-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{geoMessage}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono">
                  {t.routeDistance || 'Расстояние'}
                </p>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {distance ? formatDistance(distance, t) : '—'}
                </p>
              </div>
            </div>

            {routeUrl && (
              <a
                href={routeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-neutral-950 px-3 py-2 text-xs font-bold transition hover:bg-emerald-400"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t.open2gisRoute || 'Маршрут в 2GIS'}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
