"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MessageSquare, Map } from 'lucide-react';
import { HubOption, HubRegion, UiEvent, UiMember, MobileTab } from '../types';
import { Lang, getDict } from '../i18n';
import GlassmorphicHeader from './GlassmorphicHeader';
import SleekChat from './SleekChat';
import EventCarousel from './EventCarousel';
import TeamDeck from './TeamDeck';
import KazakhstanHubMap from './KazakhstanHubMap';
import AstanaHubFooter from './AstanaHubFooter';
import MiniMap from './MiniMap';

interface Toast {
  id: number;
  message: string;
}

interface HubVibePortalProps {
  events: UiEvent[];
  members: UiMember[];
  hubs: HubOption[];
}

export default function HubVibePortal({ events, members, hubs }: HubVibePortalProps) {
  const [activeRegion, setActiveRegion] = useState<HubRegion>(
    hubs[0]?.region ?? 'astana',
  );
  const [auxView, setAuxView] = useState<'events' | 'team'>('events');
  const [mobileTab, setMobileTab] = useState<MobileTab>('content');
  const [isSimulating, setIsSimulating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [directionsEvent, setDirectionsEvent] = useState<UiEvent | null>(null);
  const [lang, setLang] = useState<Lang>(readStoredLang);
  const [theme, setTheme] = useState<'dark' | 'light'>(readStoredTheme);
  const [externalPrompt, setExternalPrompt] = useState<string | null>(null);

  const toastId = useRef(0);

  // Geolocation state — shared between components
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'ready' | 'denied' | 'error' | 'unsupported'>('idle');

  const t = getDict(lang);

  const pushToast = useCallback((message: string) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev.slice(-2), { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3200);
  }, []);

  const changeLang = useCallback((next: Lang) => {
    setLang(next);
    try { localStorage.setItem('portal_lang', next); } catch { /* noop */ }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('portal_theme', next); } catch { /* noop */ }
      return next;
    });
  }, []);

  // Check for new events since last visit and notify
  useEffect(() => {
    try {
      const lastVisit = localStorage.getItem('last_visit_time');
      const nowStr = new Date().toISOString();
      localStorage.setItem('last_visit_time', nowStr);

      if (lastVisit) {
        const lastVisitDate = new Date(lastVisit);
        const newEventsCount = events.filter(e => {
          if (!e.parsedAt) return false;
          return new Date(e.parsedAt) > lastVisitDate;
        }).length;

        if (newEventsCount > 0) {
          const msg = lang === 'kk'
            ? `Соңғы кіргеніңізден бері ${newEventsCount} жаңа іс-шара табылды! 🔔`
            : lang === 'en'
              ? `Found ${newEventsCount} new events since your last visit! 🔔`
              : `Найдено ${newEventsCount} новых событий с вашего последнего визита! 🔔`;

          setTimeout(() => {
            pushToast(msg);
          }, 1500);
        }
      } else {
        // First visit: set initial timestamp
        localStorage.setItem('last_visit_time', nowStr);
      }
    } catch {
      // LocalStorage unavailable
    }
  }, [events, lang, pushToast]);


  const handleShowDirections = useCallback((event: UiEvent) => {
    setDirectionsEvent(event);
    pushToast(`${t.plottingRoute || 'Строю маршрут к'} ${event.locationName.split(',')[0]}...`);
  }, [pushToast, t.plottingRoute]);

  const handleLocate = useCallback(() => {
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const handleAskAI = (prompt: string) => {
    setExternalPrompt(prompt);
    setMobileTab('chat');
  };

  const regionEvents = events.filter(e => e.hub === activeRegion);
  const regionMembers = members.filter(m => m.hub === activeRegion);

  return (
    <div className="dark">
      <div className="relative min-h-screen bg-[#060a10] text-neutral-100 font-sans pb-16 lg:pb-0 transition-colors duration-300">

        {/* Header */}
        <GlassmorphicHeader
          hubs={hubs}
          activeRegion={activeRegion}
          onRegionChange={setActiveRegion}
          lang={lang}
          onLangChange={changeLang}
          theme={theme}
          onThemeToggle={toggleTheme}
          t={t}
        />

        {/* main layout: 3 columns on desktop */}
        <main className="relative z-10 max-w-[1400px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[340px_1fr_310px] gap-4 items-start">

          {/* ZONE 1 — AI Assistant (Left) */}
          <div className={`min-w-0 w-full lg:sticky lg:top-[72px] ${mobileTab === 'chat' ? 'block' : 'hidden lg:block'}`}>
            <SleekChat
              hubs={hubs}
              activeRegion={activeRegion}
              onRegionChanged={setActiveRegion}
              onSaveToast={pushToast}
              onSetAuxView={setAuxView}
              onShowDirections={handleShowDirections}
              isSimulating={isSimulating}
              setIsSimulating={setIsSimulating}
              lang={lang}
              t={t}
              externalPrompt={externalPrompt}
              onClearExternalPrompt={() => setExternalPrompt(null)}
            />
          </div>

          {/* ZONE 2 — Events & Team (Center) */}
          <section className={`w-full min-w-0 flex flex-col gap-4 ${mobileTab === 'content' ? 'block' : 'hidden lg:block'}`}>
            {/* Pill Tabs Switcher */}
            <div className="flex gap-1.5 p-1 bg-neutral-900/60 border border-neutral-800 rounded-2xl self-start">
              <button
                onClick={() => setAuxView('events')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold rounded-xl transition-all duration-300 ${
                  auxView === 'events'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/10'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                📅 {t.tabEvents || 'События'} ({regionEvents.length})
              </button>
              <button
                onClick={() => setAuxView('team')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold rounded-xl transition-all duration-300 ${
                  auxView === 'team'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/10'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                👥 {t.tabTeam || 'Команда'} ({regionMembers.length})
              </button>
            </div>

            {/* View Switcher Panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={auxView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {auxView === 'events' ? (
                  <EventCarousel
                    events={regionEvents}
                    activeRegion={activeRegion}
                    onShowDirections={handleShowDirections}
                    lang={lang}
                    t={t}
                  />
                ) : (
                  <TeamDeck
                    members={members}
                    activeRegion={activeRegion}
                    onSaveToast={pushToast}
                    onAskAI={handleAskAI}
                    lang={lang}
                    t={t}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </section>

          {/* ZONE 3 — Map & Info (Right) */}
          <aside className={`w-full min-w-0 flex flex-col gap-4 lg:sticky lg:top-[72px] ${mobileTab === 'map' ? 'block' : 'hidden lg:block'}`}>
            <KazakhstanHubMap
              activeRegion={activeRegion}
              hubs={hubs}
              onRegionChange={setActiveRegion}
              userLocation={userLocation}
              geoStatus={geoStatus}
              onLocate={handleLocate}
              activeEventsCount={regionEvents.length}
              activeStaffCount={regionMembers.length}
              t={t}
              lang={lang}
            />
          </aside>
        </main>

        {/* Footer */}
        <div className="relative z-10 border-t border-neutral-900 mt-12 bg-neutral-950/40">
          <AstanaHubFooter
            lang={lang}
            onLangChange={changeLang}
            theme={theme}
            onThemeToggle={toggleTheme}
          />
        </div>

        {/* Mobile Fixed Tab Bar */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-neutral-950/90 border-t border-neutral-900 flex items-center justify-around z-50 backdrop-blur-md">
          <button
            onClick={() => setMobileTab('content')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full font-mono text-[10px] ${
              mobileTab === 'content' ? 'text-emerald-400 font-bold' : 'text-neutral-500'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>{t.tabEvents || 'События'}</span>
          </button>

          <button
            onClick={() => setMobileTab('chat')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full font-mono text-[10px] ${
              mobileTab === 'chat' ? 'text-emerald-400 font-bold' : 'text-neutral-500'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>{lang === 'kk' ? 'ЖИ-чат' : lang === 'en' ? 'AI Chat' : 'ИИ-чат'}</span>
          </button>

          <button
            onClick={() => setMobileTab('map')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full font-mono text-[10px] ${
              mobileTab === 'map' ? 'text-emerald-400 font-bold' : 'text-neutral-500'
            }`}
          >
            <Map className="w-5 h-5" />
            <span>{t.hubMapTitle || 'Карта'}</span>
          </button>
        </div>

        {/* Route Mini-Map Overlay */}
        <AnimatePresence>
          {directionsEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setDirectionsEvent(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="w-full max-w-lg relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setDirectionsEvent(null)}
                  className="absolute -top-2 -right-2 z-10 p-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                  aria-label={t.close || 'Закрыть'}
                >
                  <X className="w-4 h-4" />
                </button>
                <MiniMap
                  targetRegion={directionsEvent.hub}
                  eventName={directionsEvent.title}
                  locationName={directionsEvent.locationName}
                  t={t}
                  lang={lang}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Stack */}
        <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2 items-end pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="px-4 py-2.5 rounded-xl bg-neutral-900/95 border border-emerald-500/40 text-xs font-mono text-neutral-200 shadow-2xl backdrop-blur-md max-w-xs"
              >
                {toast.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function readStoredLang(): Lang {
  if (typeof window === 'undefined') {
    return 'ru';
  }

  try {
    const storedLang = localStorage.getItem('portal_lang');
    return storedLang === 'ru' || storedLang === 'kk' || storedLang === 'en'
      ? storedLang
      : 'ru';
  } catch {
    return 'ru';
  }
}

function readStoredTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  try {
    const storedTheme = localStorage.getItem('portal_theme');
    return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark';
  } catch {
    return 'dark';
  }
}
