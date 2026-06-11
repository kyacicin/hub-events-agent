"use client";

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarRange, LayoutGrid, Users, X } from 'lucide-react';
import { EVENTS } from '../data';
import { HubCity, HubEvent } from '../types';
import GlassmorphicHeader from './GlassmorphicHeader';
import SleekChat from './SleekChat';
import EventCarousel from './EventCarousel';
import TeamDeck from './TeamDeck';
import ScheduleGrid from './ScheduleGrid';
import MiniMap from './MiniMap';

type AuxView = 'events' | 'team' | 'schedule';

interface Toast {
  id: number;
  message: string;
}

const AUX_TABS: Array<{ key: AuxView; label: string; icon: typeof LayoutGrid }> = [
  { key: 'events', label: 'Event Carousel', icon: LayoutGrid },
  { key: 'team', label: 'Team Deck', icon: Users },
  { key: 'schedule', label: 'Smart Schedule', icon: CalendarRange },
];

export default function HubVibePortal() {
  const [activeCity, setActiveCity] = useState<HubCity>('Zhambyl');
  const [auxView, setAuxView] = useState<AuxView>('events');
  const [isSimulating, setIsSimulating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [directionsEvent, setDirectionsEvent] = useState<HubEvent | null>(null);
  const toastId = useRef(0);

  const pushToast = useCallback((message: string) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev.slice(-2), { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const handleShowDirections = useCallback((event: HubEvent) => {
    setDirectionsEvent(event);
    pushToast(`📍 Plotting route to ${event.locationName.split(',')[0]}...`);
  }, [pushToast]);

  const cityEvents = EVENTS.filter(e => e.hub === activeCity);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <GlassmorphicHeader
        activeCity={activeCity}
        onCityChange={setActiveCity}
        isSimulating={isSimulating}
      />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-6 items-start">
        {/* Action-First Chat Interface */}
        <SleekChat
          activeCity={activeCity}
          onCityChanged={setActiveCity}
          onSaveToast={pushToast}
          onSetAuxView={setAuxView}
          isSimulating={isSimulating}
          setIsSimulating={setIsSimulating}
        />

        {/* Auxiliary Deck Panel */}
        <section className="flex flex-col gap-4">
          {/* Aux View Switcher */}
          <div className="flex gap-1.5 bg-neutral-900/60 border border-neutral-800/80 p-1.5 rounded-2xl self-start">
            {AUX_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setAuxView(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl transition-all duration-300 focus:outline-none ${
                  auxView === key
                    ? 'bg-emerald-500 text-neutral-950 font-medium shadow-md shadow-emerald-500/10'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
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
                <EventCarousel
                  events={cityEvents}
                  onShowDirections={handleShowDirections}
                  onSaveToast={pushToast}
                />
              )}
              {auxView === 'team' && (
                <TeamDeck activeCity={activeCity} onSaveToast={pushToast} />
              )}
              {auxView === 'schedule' && (
                <ScheduleGrid
                  // Remount on city change so the grid filter follows the header pills
                  key={activeCity}
                  initialCity={activeCity}
                  onShowDirections={handleShowDirections}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* Directions Mini-Map Overlay */}
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
                className="absolute -top-2 -right-2 z-10 p-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-white transition-colors"
                aria-label="Close directions"
              >
                <X className="w-4 h-4" />
              </button>
              <MiniMap
                targetCity={directionsEvent.hub}
                eventName={directionsEvent.title}
                locationName={directionsEvent.locationName}
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
              className="px-4 py-2.5 rounded-xl bg-neutral-900/95 border border-emerald-500/30 text-xs font-sans text-neutral-200 shadow-2xl backdrop-blur-md max-w-xs"
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
