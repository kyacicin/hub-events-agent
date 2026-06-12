"use client";

import { useEffect } from 'react';
import type { LatLngBoundsExpression } from 'leaflet';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { HUB_LOCATIONS } from '../data';
import type { HubOption, HubRegion } from '../types';
import type { UserGeoPoint } from './KazakhstanHubMap';

interface KazakhstanHubMapLeafletProps {
  activeRegion: HubRegion;
  hubs: HubOption[];
  onRegionChange: (region: HubRegion) => void;
  userLocation: UserGeoPoint | null;
  expanded: boolean;
  t: Record<string, string>;
}

interface ViewportSyncProps {
  activeRegion: HubRegion;
  userLocation: UserGeoPoint | null;
  expanded: boolean;
}

const KAZAKHSTAN_CENTER: [number, number] = [48.0196, 66.9237];

function ViewportSync({ activeRegion, userLocation, expanded }: ViewportSyncProps) {
  const map = useMap();
  const activeHub = HUB_LOCATIONS[activeRegion] ?? HUB_LOCATIONS.astana;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize({ animate: true });
    }, 260);

    return () => window.clearTimeout(timer);
  }, [expanded, map]);

  useEffect(() => {
    if (!activeHub) return;

    const activeCenter: [number, number] = [
      activeHub.coordinates.lat,
      activeHub.coordinates.lng,
    ];

    if (userLocation) {
      const bounds: LatLngBoundsExpression = [
        [userLocation.lat, userLocation.lng],
        activeCenter,
      ];
      map.fitBounds(bounds, {
        animate: true,
        maxZoom: 12,
        padding: [44, 44],
      });
      return;
    }

    map.flyTo(activeCenter, activeRegion === 'astana' ? 5 : 6, {
      animate: true,
      duration: 0.8,
    });
  }, [activeHub, activeRegion, map, userLocation]);

  return null;
}

export default function KazakhstanHubMapLeaflet({
  activeRegion,
  hubs,
  onRegionChange,
  userLocation,
  expanded,
  t,
}: KazakhstanHubMapLeafletProps) {
  const activeHub = HUB_LOCATIONS[activeRegion] ?? HUB_LOCATIONS.astana;
  const routePositions: Array<[number, number]> | null =
    userLocation && activeHub
      ? [
          [userLocation.lat, userLocation.lng],
          [activeHub.coordinates.lat, activeHub.coordinates.lng],
        ]
      : null;

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 transition-[height] duration-300 dark:border-neutral-800 dark:bg-neutral-950 ${
        expanded ? 'h-[430px]' : 'h-[330px]'
      }`}
    >
      <MapContainer
        center={KAZAKHSTAN_CENTER}
        zoom={4}
        minZoom={4}
        maxZoom={14}
        scrollWheelZoom={false}
        className="hub-leaflet-map h-full w-full bg-neutral-100 dark:bg-neutral-950"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ViewportSync activeRegion={activeRegion} userLocation={userLocation} expanded={expanded} />

        {hubs.map((hub) => {
          const location = HUB_LOCATIONS[hub.region];
          if (!location) return null;

          const isActive = hub.region === activeRegion;
          return (
            <CircleMarker
              key={hub.region}
              center={[location.coordinates.lat, location.coordinates.lng]}
              radius={isActive ? 11 : 7}
              pathOptions={{
                color: isActive ? '#10b981' : '#1d4ed8',
                fillColor: isActive ? '#34d399' : '#60a5fa',
                fillOpacity: isActive ? 0.95 : 0.78,
                opacity: 0.95,
                weight: isActive ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onRegionChange(hub.region),
              }}
            >
              <Popup>
                <div className="min-w-44">
                  <p className="m-0 text-sm font-semibold text-neutral-950">
                    {location.name}
                  </p>
                  <p className="m-0 mt-1 text-xs text-neutral-600">
                    {location.fullAddress}
                  </p>
                  <p className="m-0 mt-1 text-[11px] text-neutral-500">
                    {location.instagram}
                  </p>
                  {!isActive && (
                    <button
                      type="button"
                      className="mt-2 rounded-md bg-neutral-950 px-2 py-1 text-[11px] font-medium text-white"
                      onClick={() => onRegionChange(hub.region)}
                    >
                      {t.selectHub}
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={8}
            pathOptions={{
              color: '#f59e0b',
              fillColor: '#fbbf24',
              fillOpacity: 0.95,
              opacity: 1,
              weight: 3,
            }}
          >
            <Popup>{t.myLocation}</Popup>
          </CircleMarker>
        )}

        {routePositions && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#10b981',
              dashArray: '8 10',
              opacity: 0.9,
              weight: 4,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
