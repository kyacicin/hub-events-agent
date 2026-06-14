"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import {
  ArrowUpRight,
  Compass,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Navigation,
} from "lucide-react";
import { InstagramIcon as Instagram } from "./BrandIcons";
import { Hub } from "../../lib/classic-data";
import { TRANSLATIONS } from "../../lib/classic-translations";
import { ShineBorder } from "./ShineBorder";

interface KazakhstanMapProps {
  activeHub: Hub;
  onSelectHub: (id: string) => void;
  lang: "RU" | "KZ" | "EN";
  hubsList: Hub[];
}

type UserLocation = {
  lat: number;
  lng: number;
};

const KAZAKHSTAN_CENTER: [number, number] = [48.0196, 66.9237];

function distanceKm(from: UserLocation, to: UserLocation) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number, lang: "RU" | "KZ" | "EN") {
  const unit = lang === "EN" ? "km" : "км";
  if (km < 10) {
    return `${km.toFixed(1)} ${unit}`;
  }
  return `${Math.round(km)} ${unit}`;
}

function get2gisRouteUrl(from: UserLocation | null, to: UserLocation) {
  if (!from) {
    return `https://2gis.kz/search/${encodeURIComponent(`${to.lat},${to.lng}`)}`;
  }

  return `https://2gis.kz/routeSearch/rsType/car/from/${from.lng},${from.lat}/to/${to.lng},${to.lat}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function KazakhstanMap({
  activeHub,
  onSelectHub,
  lang,
  hubsList,
}: KazakhstanMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "ready" | "denied" | "error" | "unsupported">("idle");
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const overlayRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  const activePosition = useMemo<UserLocation>(() => ({
    lat: activeHub.lat ?? KAZAKHSTAN_CENTER[0],
    lng: activeHub.lng ?? KAZAKHSTAN_CENTER[1],
  }), [activeHub.lat, activeHub.lng]);

  const routeDistance = userLocation ? distanceKm(userLocation, activePosition) : null;
  const routeUrl = get2gisRouteUrl(userLocation, activePosition);

  useEffect(() => {
    let cancelled = false;

    async function setupMap() {
      try {
        const leaflet = await import("leaflet");

        if (cancelled || !mapElementRef.current || mapRef.current) return;

        leafletRef.current = leaflet;
        const map = leaflet
          .map(mapElementRef.current, {
            center: KAZAKHSTAN_CENTER,
            zoom: 5,
            minZoom: 4,
            maxZoom: 14,
            scrollWheelZoom: false,
            attributionControl: true,
          });

        leaflet
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          })
          .addTo(map);

        overlayRef.current = leaflet.layerGroup().addTo(map);
        mapRef.current = map;
        setMapReady(true);

        window.setTimeout(() => map.invalidateSize(), 0);
      } catch {
        if (!cancelled) {
          setMapError(true);
        }
      }
    }

    setupMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      overlayRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const timer = window.setTimeout(() => {
      map.invalidateSize({ animate: true });
    }, 260);

    return () => window.clearTimeout(timer);
  }, [isFullscreen]);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    const overlays = overlayRef.current;
    if (!leaflet || !map || !overlays || !mapReady) return;

    overlays.clearLayers();

    const hubPoints = hubsList
      .filter((hub) => typeof hub.lat === "number" && typeof hub.lng === "number")
      .map((hub) => [hub.lat as number, hub.lng as number] as [number, number]);

    hubsList.forEach((hub) => {
      const lat = hub.lat ?? KAZAKHSTAN_CENTER[0];
      const lng = hub.lng ?? KAZAKHSTAN_CENTER[1];
      const isActive = hub.id === activeHub.id;
      const marker = leaflet.circleMarker([lat, lng], {
        radius: isActive ? 11 : 7,
        color: isActive ? "#006239" : "#2563eb",
        fillColor: isActive ? "#72e3ad" : "#60a5fa",
        fillOpacity: isActive ? 0.96 : 0.78,
        opacity: 0.95,
        weight: isActive ? 4 : 2,
      });

      marker.bindTooltip(hub.city, {
        direction: "top",
        opacity: 0.94,
        sticky: true,
      });

      marker.bindPopup(`
        <div class="classic-leaflet-popup">
          <strong>${escapeHtml(hub.name)}</strong>
          <span>${escapeHtml(hub.city)}</span>
          <p>${escapeHtml(hub.address)}</p>
          ${hub.instagram ? `<small>@${escapeHtml(hub.instagram)}</small>` : ""}
        </div>
      `);

      marker.on("click", () => onSelectHub(hub.id));
      marker.addTo(overlays);
    });

    if (userLocation) {
      leaflet
        .circleMarker([userLocation.lat, userLocation.lng], {
          radius: 8,
          color: "#f59e0b",
          fillColor: "#fbbf24",
          fillOpacity: 0.95,
          opacity: 1,
          weight: 3,
        })
        .bindTooltip(
          lang === "KZ" ? "Менің орналасқан жерім" : lang === "EN" ? "My location" : "Моё местоположение",
          { direction: "top", opacity: 0.94 },
        )
        .addTo(overlays);

      leaflet
        .polyline(
          [
            [userLocation.lat, userLocation.lng],
            [activePosition.lat, activePosition.lng],
          ],
          {
            color: "#006239",
            dashArray: "8 10",
            opacity: 0.88,
            weight: 4,
          },
        )
        .addTo(overlays);

      map.fitBounds(
        [
          [userLocation.lat, userLocation.lng],
          [activePosition.lat, activePosition.lng],
        ],
        { animate: true, maxZoom: 11, padding: [42, 42] },
      );
      return;
    }

    if (hubPoints.length) {
      map.fitBounds(hubPoints, { animate: true, maxZoom: 5, padding: [36, 36] });
    }
  }, [activeHub.id, activePosition, hubsList, lang, mapReady, onSelectHub, userLocation]);

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setGeoStatus("unsupported");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeoStatus("ready");
        setIsLocating(false);
      },
      (error) => {
        setGeoStatus(error.code === error.PERMISSION_DENIED ? "denied" : "error");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  };

  const statusLabel =
    geoStatus === "ready" && routeDistance !== null
      ? formatDistance(routeDistance, lang)
      : geoStatus === "denied"
        ? (lang === "KZ" ? "Рұқсат жоқ" : lang === "EN" ? "Permission denied" : "Нет доступа")
        : geoStatus === "unsupported"
          ? (lang === "KZ" ? "Қолдамайды" : lang === "EN" ? "Unsupported" : "Не поддерживается")
          : geoStatus === "error"
            ? (lang === "KZ" ? "Қате" : lang === "EN" ? "Error" : "Ошибка")
            : (lang === "KZ" ? "GPS күтілуде" : lang === "EN" ? "Waiting for GPS" : "Ожидает GPS");

  return (
    <div className={`classic-map-panel space-y-4 font-sans transition-all duration-300 ${
      isFullscreen ? "fixed inset-4 z-50 overflow-y-auto rounded-3xl bg-slate-950 p-4 md:p-6 shadow-2xl" : ""
    }`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="classic-icon-button p-2.5 rounded-xl">
            <MapIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-wider uppercase text-slate-100">
              {lang === "KZ" ? "ҚАЗАҚСТАНДАҒЫ ХАБТАР КАРТАСЫ" : lang === "EN" ? "MAP OF KAZAKHSTAN IT HUBS" : "КАРТА ХАБОВ КАЗАХСТАНА"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === "KZ" ? `${hubsList.length} хаб, белсенді: ${activeHub.city}` : lang === "EN" ? `${hubsList.length} hubs, active: ${activeHub.city}` : `${hubsList.length} хабов, активный: ${activeHub.city}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="classic-icon-button p-2.5 rounded-xl transition-colors cursor-pointer"
            title={isFullscreen ? (lang === "KZ" ? "Кішірейту" : lang === "EN" ? "Minimize" : "Свернуть") : (lang === "KZ" ? "Картаны толық экранға шығару" : lang === "EN" ? "Maximize map" : "Развернуть карту")}
          >
            <Maximize2 className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={handleLocateUser}
            disabled={isLocating}
            className="classic-primary-button px-4 py-2 disabled:opacity-50 font-bold text-xs rounded-full shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <LocateFixed className={`h-4 w-4 ${isLocating ? "animate-spin" : ""}`} />
            <span>
              {isLocating
                ? (lang === "KZ" ? "Іздеу..." : lang === "EN" ? "Locating..." : "Поиск...")
                : (lang === "KZ" ? "Менің орналасқан жерім" : lang === "EN" ? "My location" : "Моё местоположение")}
            </span>
          </button>
        </div>
      </div>

      <ShineBorder
        borderRadius={12}
        duration={18}
        color={["rgba(0,98,57,0.16)", "#006239", "#72e3ad"]}
        className="w-full"
      >
        <div className={`classic-map-canvas relative overflow-hidden rounded-[24px] shadow-lg ${isFullscreen ? "h-[70vh] min-h-[460px]" : "h-[430px] min-h-[360px]"}`}>
          <div ref={mapElementRef} className="classic-leaflet-map h-full w-full" />

          {!mapReady && !mapError && (
            <div className="absolute inset-0 grid place-items-center bg-slate-950/70 text-xs font-bold uppercase tracking-wider text-slate-300">
              {lang === "KZ" ? "Карта жүктелуде" : lang === "EN" ? "Loading map" : "Загрузка карты"}
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 grid place-items-center bg-slate-950/90 p-6 text-center">
              <p className="text-sm font-bold text-slate-100">
                {lang === "KZ" ? "Картаны жүктеу мүмкін болмады" : lang === "EN" ? "Could not load map" : "Не удалось загрузить карту"}
              </p>
            </div>
          )}
        </div>
      </ShineBorder>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <ShineBorder borderRadius={10} className="w-full">
          <div className="classic-map-card p-4 rounded-2xl flex items-start gap-3.5 transition-all h-full">
            <div className="classic-icon-button p-2.5 rounded-full mt-0.5">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1 flex-1">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {TRANSLATIONS[lang].selectedRegionLabel.toUpperCase()}
              </span>
              <h3 className="text-sm font-black text-slate-100 leading-snug">
                {activeHub.id === "astana" ? "Astana Hub (HQ)" : activeHub.name}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {activeHub.address}
              </p>
              {activeHub.instagram && (
                <a
                  href={`https://instagram.com/${activeHub.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 hover:underline"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  <span>@{activeHub.instagram}</span>
                </a>
              )}
            </div>
          </div>
        </ShineBorder>

        <ShineBorder borderRadius={10} className="w-full">
          <div className="classic-map-card p-4 rounded-2xl flex items-center justify-between gap-3.5 transition-all h-full">
            <div className="flex items-start gap-3.5">
              <div className="classic-icon-button p-2.5 rounded-full mt-0.5">
                <Navigation className="h-4.5 w-4.5 rotate-45" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {lang === "KZ" ? "ҚАШЫҚТЫҚ" : lang === "EN" ? "DISTANCE" : "РАССТОЯНИЕ"}
                </span>
                <p className="text-lg font-black text-slate-100 leading-tight">
                  {statusLabel}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {lang === "KZ" ? "Таңдалған хабқа дейін" : lang === "EN" ? "To selected hub" : "До выбранного хаба"}
                </p>
              </div>
            </div>

            <a
              href={routeUrl}
              target="_blank"
              rel="noreferrer"
              className="classic-primary-button px-4 py-2.5 active:scale-95 font-black text-xs rounded-full shadow-md flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
            >
              <span>{userLocation ? (lang === "KZ" ? "2GIS бағыты" : lang === "EN" ? "2GIS route" : "Маршрут 2GIS") : (lang === "KZ" ? "2GIS-та ашу" : lang === "EN" ? "Open in 2GIS" : "Открыть в 2GIS")}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </ShineBorder>
      </div>

      <ShineBorder borderRadius={10} className="w-full">
        <div className="classic-map-card p-4 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Compass className="h-4 w-4" />
              <span className="font-semibold">
                {lang === "KZ" ? "OpenStreetMap қабаты, API-кілтсіз" : lang === "EN" ? "OpenStreetMap layer, no API keys" : "Слой OpenStreetMap, без API-ключей"}
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              {lang === "KZ" ? "19 белгі" : lang === "EN" ? "19 markers" : "19 маркеров"}
            </span>
          </div>
        </div>
      </ShineBorder>
    </div>
  );
}
