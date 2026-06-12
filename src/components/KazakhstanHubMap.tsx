"use client";

import dynamic from 'next/dynamic';
import type { PointerEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { AlertCircle, ExternalLink, Loader2, LocateFixed, MapIcon, MapPinned, Maximize2, Minimize2, Navigation } from 'lucide-react';
import { useMemo, useState } from 'react';
import { HUB_LOCATIONS } from '../data';
import type { HubOption, HubRegion } from '../types';
import { syncSpotlightPointer } from './spotlightBorder';

interface KazakhstanHubMapProps {
  activeRegion: HubRegion;
  hubs: HubOption[];
  onRegionChange: (region: HubRegion) => void;
  t: Record<string, string>;
}

export interface UserGeoPoint {
  lat: number;
  lng: number;
}

const LeafletMap = dynamic(() => import('./KazakhstanHubMapLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="h-[330px] w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950/70 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  ),
});

function distanceKm(from: UserGeoPoint, to: UserGeoPoint): number {
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
  if (km < 1) return `${Math.round(km * 1000)} ${t.meterUnit}`;
  if (km < 100) return `${km.toFixed(1)} ${t.kilometerUnit}`;
  return `${Math.round(km)} ${t.kilometerUnit}`;
}

function buildTwoGisRouteUrl(from: UserGeoPoint, to: UserGeoPoint): string {
  return `https://2gis.kz/routeSearch/rsType/car/from/${from.lng},${from.lat}/to/${to.lng},${to.lat}`;
}

export default function KazakhstanHubMap({
  activeRegion,
  hubs,
  onRegionChange,
  t,
}: KazakhstanHubMapProps) {
  const [userLocation, setUserLocation] = useState<UserGeoPoint | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'ready' | 'denied' | 'error' | 'unsupported'>('idle');
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-180, 180], [2.5, -2.5]);
  const rotateY = useTransform(mouseX, [-180, 180], [-2.5, 2.5]);
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  const selectedHub = HUB_LOCATIONS[activeRegion] ?? HUB_LOCATIONS.astana;
  const selectedPoint = selectedHub.coordinates;

  const distance = useMemo(() => {
    if (!userLocation) return null;
    return distanceKm(userLocation, selectedPoint);
  }, [selectedPoint, userLocation]);

  const routeUrl = userLocation
    ? buildTwoGisRouteUrl(userLocation, selectedPoint)
    : null;

  const handleLocate = () => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('unsupported');
      return;
    }

    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeoStatus('ready');
      },
      (error) => {
        setGeoStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  const geoMessage =
    geoStatus === 'denied'
      ? t.locationDenied
      : geoStatus === 'unsupported'
        ? t.locationUnsupported
        : geoStatus === 'error'
          ? t.locationError
          : null;

  const handleCardPointerMove = (event: PointerEvent<HTMLElement>) => {
    syncSpotlightPointer(event);

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  const handleCardPointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <motion.section
      data-spotlight-card
      onPointerMove={handleCardPointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={handleCardPointerLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className="z-20 rounded-3xl bg-white/85 dark:bg-neutral-900/75 border border-neutral-200 dark:border-neutral-800/80 backdrop-blur-xl p-4 shadow-xl shadow-neutral-200/40 dark:shadow-black/20 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none">
        <svg width="100%" height="100%" className="absolute inset-0" aria-hidden="true">
          <defs>
            <pattern id="hub-map-grid" width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M 22 0 L 0 0 0 22" fill="none" className="stroke-neutral-950 dark:stroke-white" strokeWidth="0.7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hub-map-grid)" />
        </svg>
      </div>

      <div className="relative z-10 flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                filter: isHovered
                  ? 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.55))'
                  : 'drop-shadow(0 0 3px rgba(52, 211, 153, 0.25))',
              }}
              transition={{ duration: 0.2 }}
            >
              <MapIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </motion.div>
            <h3 className="text-sm font-semibold font-sans uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              {t.hubMapTitle}
            </h3>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {t.hubsOnMap}: {hubs.length}
          </p>
          {isExpanded && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-[11px] font-mono text-neutral-500 dark:text-neutral-500"
            >
              {selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}
            </motion.p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            aria-label={isExpanded ? t.collapseMap : t.expandMap}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white/70 text-neutral-600 transition hover:text-neutral-950 hover:bg-white dark:border-neutral-800 dark:bg-neutral-950/50 dark:text-neutral-400 dark:hover:text-white"
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleLocate}
            disabled={geoStatus === 'locating'}
            className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 px-3 py-2 text-xs font-medium transition hover:opacity-85 disabled:cursor-wait disabled:opacity-70"
          >
            {geoStatus === 'locating' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LocateFixed className="w-3.5 h-3.5" />
            )}
            {geoStatus === 'locating' ? t.locating : t.myLocation}
          </button>
        </div>
      </div>

      <motion.div
        className="h-px bg-gradient-to-r from-emerald-500/50 via-emerald-400/30 to-transparent mb-4"
        initial={false}
        animate={{ scaleX: isHovered || isExpanded ? 1 : 0.3 }}
        style={{ originX: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />

      <div className="relative z-10">
        <LeafletMap
          activeRegion={activeRegion}
          hubs={hubs}
          onRegionChange={onRegionChange}
          userLocation={userLocation}
          expanded={isExpanded}
          t={t}
        />
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-1 gap-3">
        <div
          data-spotlight-card
          onPointerMove={syncSpotlightPointer}
          className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 p-3"
        >
          <div className="flex items-start gap-2">
            <MapPinned className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                {t.selectedHub}
              </p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {selectedHub.name}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                {selectedHub.fullAddress}
              </p>
              <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-500">
                {selectedHub.addressPrecision === 'exact' ? t.exactAddress : t.cityAddressFallback}
              </p>
            </div>
          </div>
        </div>

        {(distance || routeUrl || geoMessage) && (
          <div
            data-spotlight-card
            onPointerMove={syncSpotlightPointer}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 p-3"
          >
            {geoMessage ? (
              <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{geoMessage}</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                      {t.routeDistance}
                    </p>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {distance ? formatDistance(distance, t) : '—'}
                    </p>
                  </div>
                </div>

                {routeUrl && (
                  <a
                    href={routeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-medium text-neutral-950 transition hover:bg-emerald-300"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t.open2gisRoute}
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
}
