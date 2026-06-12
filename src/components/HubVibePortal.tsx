"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Users, X } from 'lucide-react';
import { HubOption, HubRegion, UiEvent, UiMember } from '../types';
import { Lang, getDict } from '../i18n';
import GlassmorphicHeader from './GlassmorphicHeader';
import SleekChat from './SleekChat';
import EventCarousel from './EventCarousel';
import TeamDeck from './TeamDeck';
import MiniMap from './MiniMap';
import KazakhstanHubMap from './KazakhstanHubMap';
import AstanaHubFooter from './AstanaHubFooter';
import DottedSurface from './DottedSurface';

type AuxView = 'events' | 'team';
type Theme = 'dark' | 'light';

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
  const [auxView, setAuxView] = useState<AuxView>('events');
  const [isSimulating, setIsSimulating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [directionsEvent, setDirectionsEvent] = useState<UiEvent | null>(null);
  const [lang, setLang] = useState<Lang>('ru');
  const [theme, setTheme] = useState<Theme>('dark');
  const toastId = useRef(0);

  const t = getDict(lang);

  // Restore persisted language/theme after hydration (server render can't
  // read localStorage, so the markup must match the defaults on hydrate).
  useEffect(() => {
    try {
      const storedLang = localStorage.getItem('portal_lang');
      const storedTheme = localStorage.getItem('portal_theme');
      if (storedLang === 'ru' || storedLang === 'kk' || storedLang === 'en') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLang(storedLang);
      }
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setTheme(storedTheme);
      }
    } catch {
      // localStorage unavailable — keep defaults
    }
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

  const pushToast = useCallback((message: string) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev.slice(-2), { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3200);
  }, []);

  const handleShowDirections = useCallback((event: UiEvent) => {
    setDirectionsEvent(event);
    pushToast(`${t.plottingRoute} ${event.locationName.split(',')[0]}...`);
  }, [pushToast, t.plottingRoute]);

  const regionEvents = events.filter(e => e.hub === activeRegion);

  const AUX_TABS: Array<{ key: AuxView; label: string; icon: typeof LayoutGrid }> = [
    { key: 'events', label: t.tabEvents, icon: LayoutGrid },
    { key: 'team', label: t.tabTeam, icon: Users },
  ];

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="relative min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-300">
        <DottedSurface theme={theme} />

        <GlassmorphicHeader
          hubs={hubs}
          activeRegion={activeRegion}
          onRegionChange={setActiveRegion}
          lang={lang}
          t={t}
        />

        {/* Chat-first layout: chat, events, and map share equal column widths. */}
        <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="min-w-0 w-full flex">
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
            />
          </div>

          {/* Secondary Deck Panel */}
          <aside className="w-full min-w-0 flex flex-col gap-4">
            <div className="flex gap-1.5 bg-white/70 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 p-1.5 rounded-2xl self-start backdrop-blur-md">
              {AUX_TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setAuxView(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl transition-all duration-300 focus:outline-none ${
                    auxView === key
                      ? 'bg-emerald-500 text-neutral-950 font-medium shadow-md shadow-emerald-500/10'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={auxView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {auxView === 'events' && (
                  <div className="flex flex-col gap-4">
                    <EventCarousel
                      events={regionEvents}
                      onShowDirections={handleShowDirections}
                      onSaveToast={pushToast}
                      lang={lang}
                      t={t}
                    />
                    <KazakhstanHubMap
                      activeRegion={activeRegion}
                      hubs={hubs}
                      onRegionChange={setActiveRegion}
                      t={t}
                    />
                  </div>
                )}
                {auxView === 'team' && (
                  <TeamDeck
                    members={members}
                    activeRegion={activeRegion}
                    onSaveToast={pushToast}
                    lang={lang}
                    t={t}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </aside>
        </main>

        <div className="relative z-10">
          <AstanaHubFooter
            lang={lang}
            onLangChange={changeLang}
            theme={theme}
            onThemeToggle={toggleTheme}
          />
        </div>

        {/* Directions Mini-Map Overlay */}
        <AnimatePresence>
          {directionsEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-neutral-950/60 dark:bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4"
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
                  className="absolute -top-2 -right-2 z-10 p-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  aria-label={t.close}
                >
                  <X className="w-4 h-4" />
                </button>
                <MiniMap
                  targetRegion={directionsEvent.hub}
                  eventName={directionsEvent.title}
                  locationName={directionsEvent.locationName}
                  t={t}
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
                className="px-4 py-2.5 rounded-xl bg-white/95 dark:bg-neutral-900/95 border border-emerald-500/40 dark:border-emerald-500/30 text-xs font-sans text-neutral-800 dark:text-neutral-200 shadow-2xl backdrop-blur-md max-w-xs"
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
