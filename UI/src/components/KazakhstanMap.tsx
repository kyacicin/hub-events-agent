import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { Compass, Building, MapPin, Clock, Instagram, ArrowUpRight, Map as MapIcon, Maximize2, Navigation } from "lucide-react";
import { Hub, HUBS_DATA } from "../data";

// Detailed geographic coordinates matching the 19 regional hubs
export const HUB_COORDINATES: Record<string, { lat: number; lng: number }> = {
  astana: { lat: 51.0908, lng: 71.4184 },
  almaty: { lat: 43.2389, lng: 76.8897 },
  shymkent: { lat: 42.3249, lng: 69.5901 },
  karaganda: { lat: 49.8056, lng: 73.0858 },
  taraz: { lat: 42.9024, lng: 71.3784 },
  pavlodar: { lat: 52.2873, lng: 76.9671 },
  aktobe: { lat: 50.2839, lng: 57.1670 },
  uralsk: { lat: 51.2333, lng: 51.3667 },
  kyzylorda: { lat: 44.8398, lng: 65.5120 },
  kokshetau: { lat: 53.2847, lng: 69.3864 },
  kostanay: { lat: 53.2144, lng: 63.6246 },
  petropavl: { lat: 54.8753, lng: 69.1629 },
  ust_kamenogorsk: { lat: 49.9500, lng: 82.6167 },
  semey: { lat: 50.4111, lng: 80.2275 },
  aktau: { lat: 43.6500, lng: 51.1500 },
  atyrau: { lat: 47.1167, lng: 51.8833 },
  zhezkazgan: { lat: 47.7833, lng: 67.7167 },
  konaev: { lat: 43.8733, lng: 77.0625 },
  taldykorgan: { lat: 45.0117, lng: 78.3739 }
};

// Precise Haversine formula to calculate the distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface KazakhstanMapProps {
  activeHubId: string;
  activeHub: Hub;
  handleSelectHubManual: (id: string) => void;
  handleLocateUser: () => void;
  locatingUser: boolean;
  copyToClipboard: (text: string, id: string) => void;
  copiedText: string | null;
  handleSendChatMessage: (text: string) => void;
  setActiveTab: (tab: "map" | "events" | "team" | "cabinet") => void;
  userLocation: { lat: number; lng: number } | null;
}

export function KazakhstanMap({
  activeHubId,
  activeHub,
  handleSelectHubManual,
  handleLocateUser,
  locatingUser,
  userLocation
}: KazakhstanMapProps) {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [distance, setDistance] = useState<string>("—");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Custom visual components for Leaflet markers leveraging Tailwind class selectors
  const hubIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute h-5 w-5 bg-emerald-500 rounded-full opacity-20 animate-pulse"></div>
        <div class="relative h-3 w-3 bg-emerald-500 border border-slate-900 rounded-full shadow-md"></div>
      </div>
    `,
    className: "custom-hub-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const activeHubIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute h-10 w-10 bg-emerald-400 rounded-full opacity-35 animate-ping"></div>
        <div class="relative h-5 w-5 bg-white border-2 border-emerald-500 rounded-full shadow-2xl flex items-center justify-center">
          <div class="h-2 w-2 bg-emerald-500 rounded-full"></div>
        </div>
      </div>
    `,
    className: "custom-hub-icon-active",
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  const userIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute h-8 w-8 bg-sky-500 rounded-full opacity-45 animate-ping"></div>
        <div class="relative h-4.5 w-4.5 bg-sky-500 border-2 border-white rounded-full shadow-lg"></div>
      </div>
    `,
    className: "custom-user-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  // Map mounting initialization
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center view geographically to cover Kazakhstan
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false,
    }).setView([48.0196, 66.9237], 5);

    // Dark-slate map tiles matching original aesthetic perfectly
     L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: "abcd",
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    // Load markers for all 19 hubs in Kazakhstan database
    HUBS_DATA.forEach((hub) => {
      const coords = HUB_COORDINATES[hub.id] || { lat: 48, lng: 66 };
      const isActive = hub.id === activeHubId;

      const marker = L.marker([coords.lat, coords.lng], {
        icon: isActive ? activeHubIcon : hubIcon
      }).addTo(map);

      // Programmatic popup markup definition
      const popupContent = document.createElement("div");
      popupContent.className = "p-1.5 text-slate-100 font-sans";
      popupContent.innerHTML = `
        <h3 class="font-extrabold text-xs text-white uppercase">${hub.name}</h3>
        <p class="text-[10px] text-slate-400 mt-1 leading-snug">${hub.address}</p>
        <div class="flex items-center gap-1.5 mt-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <span class="text-[9px] text-slate-400 font-semibold">Резидентов:</span>
          <span class="text-[10px] font-bold text-emerald-400">${hub.residentsCount}</span>
        </div>
        <button id="map-select-${hub.id}" class="mt-2 text-center w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[9px] py-1 px-2 rounded cursor-pointer transition-all uppercase tracking-wide">
          Выбрать этот хаб
        </button>
      `;

      // Assign onClick select handler inside popup node
      popupContent.querySelector(`#map-select-${hub.id}`)?.addEventListener("click", () => {
        handleSelectHubManual(hub.id);
        marker.closePopup();
      });

      marker.bindPopup(popupContent, {
        className: "custom-leaflet-popup",
        closeButton: false,
        minWidth: 200
      });

      marker.on("click", () => {
        handleSelectHubManual(hub.id);
      });

      markersRef.current[hub.id] = marker;
    });

    return () => {
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      Object.keys(markersRef.current).forEach((key) => {
        const m = markersRef.current[key];
        if (m) m.remove();
      });
      markersRef.current = {};
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Synchronize map state (active hub highlighted, zoom, user position marker plot, polyline routing, and distance calculation)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Highlight selected hub and focus view
    HUBS_DATA.forEach((hub) => {
      const marker = markersRef.current[hub.id];
      const isActive = hub.id === activeHubId;
      if (marker) {
        marker.setIcon(isActive ? activeHubIcon : hubIcon);
        if (isActive) {
          marker.openPopup();
          if (!userLocation) {
            const coords = HUB_COORDINATES[hub.id];
            if (coords) {
              map.setView([coords.lat, coords.lng], 11, { animate: true });
            }
          }
        }
      }
    });

    // Clear previous user layers
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Process user geolocation tracking properties
    if (userLocation) {
      const activeCoords = HUB_COORDINATES[activeHubId] || { lat: 48, lng: 66 };

      // Render GPS location beacon
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon
      })
        .addTo(map)
        .bindPopup(`
          <div class="text-slate-950 font-sans p-1 text-xs font-bold text-center">
            📍 Моя геопозиция
          </div>
        `);
      userMarkerRef.current = userMarker;

      // Render dashed geodesic routing line
      const line = L.polyline(
        [[userLocation.lat, userLocation.lng], [activeCoords.lat, activeCoords.lng]],
        {
          color: "#1fb981",
          weight: 3.5,
          dashArray: "6, 8",
          opacity: 0.90
        }
      ).addTo(map);
      polylineRef.current = line;

      // Fit bounds to display route overview
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        [activeCoords.lat, activeCoords.lng]
      ]);
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 12, animate: true });

      // Run distance computation
      const d = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        activeCoords.lat,
        activeCoords.lng
      );
      setDistance(`${d.toFixed(1)} км`);
    } else {
      setDistance("—");
    }
  }, [activeHubId, userLocation]);

  // Handle toggle map resize re-evaluations
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 300);
    }
  }, [isFullscreen]);

  // Construct official 2GIS Search or direct router navigation URLs
  const get2gisUrl = () => {
    const activeCoords = HUB_COORDINATES[activeHubId] || { lat: 51.0908, lng: 71.4184 };
    if (userLocation) {
      return `https://2gis.kz/routeSearch/rsType/car/from/${userLocation.lng},${userLocation.lat}/to/${activeCoords.lng},${activeCoords.lat}`;
    }
    return `https://2gis.kz/search/${encodeURIComponent(activeHub.address)}`;
  };

  return (
    <div className={`space-y-4 flex flex-col justify-between h-full font-sans transition-all duration-300 ${
      isFullscreen ? "fixed inset-4 z-50 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl" : ""
    }`}>
      
      {/* HEADER ROW */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100">
            <MapIcon className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase text-slate-100">
              ИНТЕРАКТИВНАЯ КАРТА ХАБОВ КАЗАХСТАНА (LEAFLET + OSM)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Maximize Switcher */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all cursor-pointer"
            title={isFullscreen ? "Свернуть" : "Развернуть на весь экран"}
          >
            <Maximize2 className="h-4.5 w-4.5" />
          </button>

          {/* GPS Location Button */}
          <button
            onClick={handleLocateUser}
            disabled={locatingUser}
            className="px-4 py-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50 font-bold text-xs rounded-full shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Compass className={`h-4 w-4 ${locatingUser ? "animate-spin text-slate-950" : "text-slate-950"}`} />
            <span>{locatingUser ? "Поиск..." : "Моё местоположение"}</span>
          </button>
        </div>
      </div>

      {/* MAP CANVAS VIEWPORT */}
      <div className="relative rounded-[24px] overflow-hidden border border-slate-800 bg-slate-950 shadow-lg flex-1 min-h-[360px] md:min-h-[440px] z-10">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* ANALYTICS SECTION DECK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        
        {/* CARD 1: ACTIVE TARGET HUB INFO */}
        <div className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-900 p-4 rounded-2xl flex items-start gap-3.5 transition-all">
          <div className="p-2.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 mt-0.5">
            <MapPin className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <div className="space-y-1 flex-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ВЫБРАННЫЙ ХАБ
            </span>
            <h2 className="text-sm font-black text-slate-100 leading-snug">
              {activeHub.id === "astana" ? "Astana Hub (HQ)" : activeHub.name}
            </h2>
            <p className="text-xs text-slate-450 leading-relaxed font-semibold">
              {activeHub.address}
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
              Регион: {activeHub.region}
            </p>
          </div>
        </div>

        {/* CARD 2: MEASURED GEODETIC VALUE & ROUTING LINKS */}
        <div className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-900 p-4 rounded-2xl flex items-center justify-between gap-3.5 transition-all">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 mt-0.5">
              <Navigation className="h-4.5 w-4.5 text-emerald-500 transform rotate-45" />
            </div>
            <div className="space-y-0.5">
              <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                РАССТОЯНИЕ ДО ХАБА
              </span>
              <p className="text-lg font-black text-slate-100 leading-tight">
                {distance}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                {userLocation ? "Настоящие замеры по прямой линии" : "Нажми 'Моё местоположение' для расчета по GPS"}
              </p>
            </div>
          </div>

          <a
            href={get2gisUrl()}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-white hover:bg-slate-200 active:scale-95 text-slate-950 font-black text-xs rounded-full shadow-md flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <span>{userLocation ? "Маршрут в 2GIS" : "Открыть в 2GIS"}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

      </div>

      {/* METRICS ACCORDIONS */}
      <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold">Время работы: {activeHub.workingHours}</span>
          </div>
          {activeHub.instagram && (
            <a
              href={`https://instagram.com/${activeHub.instagram}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 hover:underline transition-all flex items-center gap-1 font-bold"
            >
              <Instagram className="h-3.5 w-3.5 text-emerald-400" />
              <span>@{activeHub.instagram}</span>
            </a>
          )}
        </div>
      </div>

    </div>
  );
}
