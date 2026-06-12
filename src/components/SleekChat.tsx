"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, MapPin, Clock, Calendar, ExternalLink } from 'lucide-react';
import { HUB_LOCATIONS, hasMapRoute, isStaffQuery, toUiEvent, toUiMember } from '../data';
import { ChatMessage, HubOption, HubRegion, UiEvent } from '../types';
import { Lang, formatDay, localizeCity, localizeName, localizeRole } from '../i18n';
import type { HubEvent, HubStaff } from '@/lib/schemas';
import MiniMap from './MiniMap';
import { syncSpotlightPointer } from './spotlightBorder';

interface SleekChatProps {
  hubs: HubOption[];
  activeRegion: HubRegion;
  onRegionChanged: (region: HubRegion) => void;
  onSaveToast: (message: string) => void;
  onSetAuxView: (view: 'events' | 'team') => void;
  onShowDirections: (event: UiEvent) => void;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  lang: Lang;
  t: Record<string, string>;
}

type ChatApiResponse = {
  reply: string;
  events: HubEvent[];
  staff: HubStaff[];
  region: string | null;
  city: string | null;
  modelStatus: 'ok' | 'fallback';
};

const MAX_INLINE_EVENTS = 4;

// Keep generated ids independent from module reloads. Fast Refresh preserves
// React state but re-runs module scope, so counters can create duplicate keys.
function uniqueMessageId(sender: ChatMessage['sender']): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${sender}-${crypto.randomUUID()}`;
  }

  return `${sender}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeMessage(
  sender: ChatMessage['sender'],
  text: string,
  extras?: Partial<ChatMessage>,
): ChatMessage {
  return {
    id: extras?.id ?? uniqueMessageId(sender),
    sender,
    text,
    timestamp: extras?.timestamp ?? new Date(),
    ...extras,
  };
}

function introMessages(t: Record<string, string>): ChatMessage[] {
  return [
    makeMessage('assistant', t.chatIntro1, { id: 'init-1' }),
    makeMessage('assistant', t.chatIntro2, { id: 'init-2' }),
  ];
}

export default function SleekChat({
  hubs,
  activeRegion,
  onRegionChanged,
  onSaveToast,
  onSetAuxView,
  onShowDirections,
  isSimulating,
  setIsSimulating,
  lang,
  t,
}: SleekChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [inlineMapEventId, setInlineMapEventId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // (Re)initialize the intro messages after hydration and whenever the UI
  // language changes while the conversation is still untouched.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(prev =>
      prev.some(m => !m.id.startsWith('init')) ? prev : introMessages(t),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Scroll to bottom when messages load or the inline mini-map expands
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSimulating, inlineMapEventId]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSimulating) return;

    const userMsg = makeMessage('user', textToSend.trim());

    const history = [...messages, userMsg];
    setMessages(history);
    setInputText('');
    setIsSimulating(true);

    try {
      const activeCity = hubs.find(h => h.region === activeRegion)?.cityName;
      // The selected hub acts as a fallback location: region detection walks
      // the history from newest to oldest, so an explicit city in the user's
      // text always wins over this hint.
      const apiMessages = [
        ...(activeCity ? [{ role: 'user' as const, content: `Мой город: ${activeCity}.` }] : []),
        ...history.slice(-9).map(m => ({
          role: m.sender === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: m.text,
        })),
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(error?.error ?? t.chatError);
      }

      const data = (await response.json()) as ChatApiResponse;
      const uiEvents = data.events.map(toUiEvent);
      const staffQuestion = isStaffQuery(userMsg.text);
      const uiMembers = staffQuestion ? data.staff.map(toUiMember) : [];
      const mappableEvent = uiEvents.find(
        e => e.format !== 'ONLINE' && hasMapRoute(e.hub),
      );

      const aiMsg = makeMessage('assistant', data.reply.replace(/\*\*/g, ''), {
        carouselEvents: uiEvents.length ? uiEvents : undefined,
        teamMembers: uiMembers.length ? uiMembers : undefined,
        showMapForEventId: mappableEvent?.id,
        modelStatus: data.modelStatus,
      });

      setMessages(prev => [...prev, aiMsg]);

      // Sync the portal with the region the agent detected
      if (data.region && hubs.some(h => h.region === data.region)) {
        onRegionChanged(data.region);
      }

      if (uiMembers.length) onSetAuxView('team');
      else if (uiEvents.length) onSetAuxView('events');
    } catch (error) {
      const text = error instanceof Error ? error.message : t.chatError;
      setMessages(prev => [
        ...prev,
        makeMessage('assistant', `${text} ${t.chatTryLater}`),
      ]);
      onSaveToast(t.agentRequestError);
    } finally {
      setIsSimulating(false);
    }
  };

  const toggleInlineMap = (eventId?: string) => {
    const eId = eventId ?? null;
    setInlineMapEventId(prev => (prev === eId ? null : eId));
    onSaveToast(t.plottingInline);
  };

  const quickActions: Array<{ label: string; prompt: string }> = [
    { label: t.actionFindEvents, prompt: t.promptFindEvents },
    { label: t.actionAllCities, prompt: t.promptAllCities },
    { label: t.actionOnline, prompt: t.promptOnline },
    { label: t.actionThisWeek, prompt: t.promptThisWeek },
  ];

  const activeHubName = HUB_LOCATIONS[activeRegion]?.name ?? activeRegion;

  return (
    <div
      id="sleek-chat-container"
      data-spotlight-card
      onPointerMove={syncSpotlightPointer}
      className="flex flex-col w-full h-[700px] min-h-[700px] max-h-[700px] shrink-0 rounded-3xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl shadow-neutral-300/40 dark:shadow-black/40 relative overflow-hidden transition-colors duration-300"
    >

      {/* Slim status bar */}
      <div className="px-4 py-3 bg-neutral-50/90 dark:bg-neutral-900/90 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-sm z-30">
        <div />
        <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
          <MapPin className="w-3" />
          {activeHubName}
        </span>
      </div>

      {/* Messages Canvas Area */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4 select-text">
        {messages.map((message, index) => {
          const isAI = message.sender === 'assistant';
          const hasInlineEvents = isAI && !!message.carouselEvents?.length;

          return (
            <div
              key={`${message.id}-${index}`}
              className={`flex flex-col ${isAI ? 'items-start' : 'items-end'} gap-1`}
            >
              <div className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 px-1">
                {isAI ? 'AI Assistant' : t.chatYou} • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>

              {/* Chat Bubble */}
              <div
                data-spotlight-card
                onPointerMove={syncSpotlightPointer}
                className={`${hasInlineEvents ? 'w-full' : 'max-w-[88%]'} rounded-2xl p-4 text-sm text-left ${
                isAI
                  ? 'bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
                  : 'bg-emerald-500 text-neutral-950 font-medium font-sans shadow-md shadow-emerald-500/10'
              }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {message.text}
                </div>

                {isAI && message.modelStatus === 'fallback' && (
                  <p className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-amber-600 dark:text-amber-500/80">
                    {t.chatFallbackNote}
                  </p>
                )}

                {/* Events as the result of the answer — compact in-chat cards */}
                {hasInlineEvents && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {message.carouselEvents!.slice(0, MAX_INLINE_EVENTS).map((event) => (
                      <div
                        key={event.id}
                        data-spotlight-card
                        onPointerMove={syncSpotlightPointer}
                        className="rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-3 flex flex-col gap-1.5 hover:border-emerald-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider">
                          <span className="text-neutral-500 dark:text-neutral-400">{event.format}</span>
                          <span className="ml-auto text-emerald-600 dark:text-emerald-500 uppercase">{localizeCity(event.cityName, lang)}</span>
                        </div>
                        <h5 className="text-sm font-sans font-bold leading-tight text-neutral-900 dark:text-neutral-100 line-clamp-2">
                          {event.title}
                        </h5>
                        <div className="flex items-center gap-2.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                          <span className="flex items-center gap-1"><Calendar className="w-2.5" />{formatDay(event.date, lang)}</span>
                          {event.time && <span className="flex items-center gap-1"><Clock className="w-2.5" />{event.time}</span>}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-500 truncate">{event.locationName}</p>
                        <div className="flex items-center gap-1.5 mt-auto pt-1">
                          {event.format !== 'ONLINE' && hasMapRoute(event.hub) && (
                            <button
                              onClick={() => onShowDirections(event)}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-mono font-bold rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
                            >
                              <MapPin className="w-2.5" />
                              {t.route}
                            </button>
                          )}
                          <a
                            href={event.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-mono font-bold rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-all"
                          >
                            <ExternalLink className="w-2.5" />
                            {t.openPost}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Overflow hint -> secondary events panel */}
                {hasInlineEvents && message.carouselEvents!.length > MAX_INLINE_EVENTS && (
                  <button
                    onClick={() => onSetAuxView('events')}
                    className="mt-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    +{message.carouselEvents!.length - MAX_INLINE_EVENTS} {t.moreInPanel}
                  </button>
                )}

                {/* Inline vector mini-map for offline events */}
                {isAI && message.showMapForEventId && (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleInlineMap(message.showMapForEventId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer"
                    >
                      <MapPin className="w-3" />
                      {inlineMapEventId === message.showMapForEventId ? t.hideMap : t.showMap}
                    </button>

                    {inlineMapEventId === message.showMapForEventId && (
                      <div className="mt-2">
                        {(() => {
                          const associatedEvent = message.carouselEvents?.find(e => e.id === message.showMapForEventId);
                          return (
                            <MiniMap
                              targetRegion={associatedEvent?.hub || activeRegion}
                              eventName={associatedEvent?.title || ''}
                              locationName={associatedEvent?.locationName || ''}
                              t={t}
                            />
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Inline contact cards when the agent returns staff */}
                {isAI && message.teamMembers && (
                  <div
                    data-spotlight-card
                    onPointerMove={syncSpotlightPointer}
                    className="mt-3 p-1 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800"
                  >
                    <div className="text-[11px] font-mono font-bold text-neutral-500 uppercase tracking-tight px-3 py-1 border-b border-neutral-200 dark:border-neutral-900 mb-1">
                      {t.teamContacts}
                    </div>
                    {message.teamMembers.map(m => (
                      <div key={m.id} className="p-2 border-b last:border-b-0 border-neutral-100 dark:border-neutral-900/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.avatarUrl} alt="" className="w-6 h-6 rounded-md object-cover" />
                          <div>
                            <p className="font-bold text-neutral-900 dark:text-neutral-200">{localizeName(m.name, lang)}</p>
                            <p className="text-[10px] text-neutral-500">{localizeRole(m.role, lang)} · {localizeCity(m.cityName, lang)}</p>
                          </div>
                        </div>
                        {m.instagram && (
                          <a
                            href={`https://www.instagram.com/${m.instagram.replace('@', '')}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/40 text-[10px] font-mono font-bold transition-all border border-pink-200 dark:border-pink-900/50"
                          >
                            {m.instagram}
                          </a>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => onSetAuxView('team')}
                      className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {t.openTeamDeck}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live parsing pulsing dot loader */}
        {isSimulating && (
          <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-500 font-bold tracking-wider uppercase">
              {t.chatThinking}
            </span>
            <div className="rounded-2xl p-4 bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-3">
              <p className="text-sm font-mono">{t.chatSearching} {activeHubName}...</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick user actions */}
      <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-900 flex gap-2 overflow-x-auto select-none">
        {quickActions.map(({ label, prompt }) => (
          <button
            key={label}
            onClick={() => void handleSendMessage(prompt)}
            disabled={isSimulating}
            className="shrink-0 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-sans font-medium hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sleek Input Dock with Character Limits */}
      <div className="p-4 bg-neutral-50/80 dark:bg-neutral-900/80 border-t border-neutral-200 dark:border-neutral-800 backdrop-blur-md relative">
        <div className="relative flex items-end gap-3 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 px-4 py-3 focus-within:border-emerald-500/50 dark:focus-within:border-neutral-700 transition-colors">
          <textarea
            value={inputText}
            onChange={(e) => {
              if (e.target.value.length <= 2000) setInputText(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSendMessage(inputText);
              }
            }}
            placeholder={t.chatPlaceholder}
            className="min-h-12 flex-1 bg-transparent text-sm font-sans leading-relaxed text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none resize-none border-0 p-0 focus:ring-0"
          />

          <button
            disabled={!inputText.trim() || isSimulating}
            onClick={() => void handleSendMessage(inputText)}
            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all ${
              inputText.trim() && !isSimulating
                ? 'bg-emerald-500 hover:bg-emerald-400 scale-105 shadow-md shadow-emerald-500/25 active:scale-95 text-neutral-950'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
            }`}
            title={t.chatSend}
          >
            <Send className="w-4 h-4 rotate-45 transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
