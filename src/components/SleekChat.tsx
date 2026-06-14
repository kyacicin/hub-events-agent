"use client";

import { useCallback, useState, useEffect, useRef } from 'react';
import { Send, ExternalLink } from 'lucide-react';
import { HUB_LOCATIONS, hasMapRoute, isStaffQuery, toUiEvent, toUiMember } from '../data';
import { ChatMessage, HubOption, HubRegion, UiEvent } from '../types';
import { Lang, localizeCity } from '../i18n';
import type { HubEvent, HubStaff } from '@/lib/schemas';
import MiniMap from './MiniMap';

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
  externalPrompt?: string | null;
  onClearExternalPrompt?: () => void;
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
  isSimulating,
  setIsSimulating,
  lang,
  t,
  externalPrompt,
  onClearExternalPrompt,
}: SleekChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => introMessages(t));
  const [inputText, setInputText] = useState('');
  const [inlineMapEventId, setInlineMapEventId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastRegionRef = useRef<HubRegion>(activeRegion);

  // Auto-greeting when active hub is switched
  useEffect(() => {
    if (lastRegionRef.current !== activeRegion) {
      lastRegionRef.current = activeRegion;
      const hubName = HUB_LOCATIONS[activeRegion]?.name ?? activeRegion;
      const greeting = lang === 'kk'
        ? `Сіз ${hubName} таңдадыңыз. Осы өңір бойынша сізге қалай көмектесе аламын?`
        : lang === 'en'
          ? `You have selected ${hubName}. How can I help you with this region?`
          : `Вы выбрали ${hubName}. Чем могу помочь по этому региону?`;

      setMessages(prev => [
        ...prev,
        makeMessage('assistant', greeting)
      ]);
    }
  }, [activeRegion, lang]);

  const handleSendMessage = useCallback(async (textToSend: string) => {
    if (!textToSend.trim() || isSimulating) return;

    const userMsg = makeMessage('user', textToSend.trim());

    const history = [...messages, userMsg];
    setMessages(history);
    setInputText('');
    setIsSimulating(true);

    try {
      const activeCity = hubs.find(h => h.region === activeRegion)?.cityName;
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
  }, [
    activeRegion,
    hubs,
    isSimulating,
    messages,
    onRegionChanged,
    onSaveToast,
    onSetAuxView,
    setIsSimulating,
    t.agentRequestError,
    t.chatError,
    t.chatTryLater,
  ]);

  // Handle external prompts (e.g. from TeamDeck or EventCarousel Ask AI clicks)
  useEffect(() => {
    if (externalPrompt) {
      const timer = window.setTimeout(() => {
        void handleSendMessage(externalPrompt);
        onClearExternalPrompt?.();
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [externalPrompt, handleSendMessage, onClearExternalPrompt]);

  // Scroll to bottom when messages load or the inline mini-map expands
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSimulating, inlineMapEventId]);

  const toggleInlineMap = (eventId?: string) => {
    const eId = eventId ?? null;
    setInlineMapEventId(prev => (prev === eId ? null : eId));
    onSaveToast(t.plottingInline);
  };

  // Modern quick command actions as requested
  const quickActions = lang === 'kk' ? [
    { label: "Астанада не өтеді?", prompt: "Астанада не өтеді?" },
    { label: "Координатор кім?", prompt: "Координатор кім?" },
    { label: "Қандай жеңілдіктер бар?", prompt: "Қандай жеңілдіктер бар?" },
  ] : lang === 'en' ? [
    { label: "What is happening in Astana?", prompt: "What is happening in Astana?" },
    { label: "Who is the coordinator?", prompt: "Who is the coordinator?" },
    { label: "What are the benefits?", prompt: "What are the benefits?" },
  ] : [
    { label: "Что проходит в Астане?", prompt: "Что проходит в Астане?" },
    { label: "Кто координатор?", prompt: "Кто координатор?" },
    { label: "Какие льготы?", prompt: "Какие льготы?" },
  ];

  return (
    <div
      id="sleek-chat-container"
      className="flex flex-col w-full h-[calc(100vh-90px)] min-h-[500px] shrink-0 rounded-3xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl shadow-neutral-300/40 dark:shadow-black/40 relative overflow-hidden transition-colors duration-300"
    >
      {/* Messages Canvas Area */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4 select-text panel-scroll">
        {messages.map((message, index) => {
          const isAI = message.sender === 'assistant';
          const hasInlineEvents = isAI && !!message.carouselEvents?.length;

          return (
            <div
              key={`${message.id}-${index}`}
              className="flex flex-col w-full"
            >
              <div className={`text-[10px] font-mono text-neutral-400 dark:text-neutral-500 mb-1 ${isAI ? 'text-left' : 'text-right'}`}>
                {isAI ? (lang === 'kk' ? 'ЖИ ассистенті' : lang === 'en' ? 'AI Assistant' : 'ИИ-ассистент') : t.chatYou} • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>

              {/* Chat Bubble */}
              <div
                className={`rounded-2xl p-4 text-xs leading-relaxed max-w-[85%] ${
                  isAI
                    ? 'bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 text-neutral-800 dark:text-neutral-200 self-start'
                    : 'bg-emerald-500 text-neutral-950 font-bold self-end shadow-md shadow-emerald-500/10'
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {message.text}
                </div>

                {isAI && message.modelStatus === 'fallback' && (
                  <p className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-amber-600 dark:text-amber-500/85">
                    {t.chatFallbackNote}
                  </p>
                )}

                {/* Inline Events inside Chat */}
                {hasInlineEvents && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {message.carouselEvents!.slice(0, MAX_INLINE_EVENTS).map((event) => {
                      const formatBadge =
                        event.format === 'ONLINE'
                          ? '🟢 ОНЛАЙН'
                          : event.format === 'HYBRID'
                            ? '🟡 ГИБРИД'
                            : '🔴 ОФЛАЙН';

                      return (
                        <div
                          key={event.id}
                          className="rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-3 flex flex-col gap-1.5 hover:border-emerald-500/40 transition-colors"
                        >
                        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold">
                          <span className="text-neutral-600 dark:text-neutral-300">{formatBadge}</span>
                          <span className="ml-auto text-emerald-600 dark:text-emerald-500 uppercase">{localizeCity(event.cityName, lang)}</span>
                        </div>
                        <h5 className="text-xs font-sans font-bold leading-tight text-neutral-900 dark:text-neutral-100 line-clamp-2">
                          {event.title}
                        </h5>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-2 font-sans">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-900 mt-auto">
                          {event.format !== 'ONLINE' && hasMapRoute(event.hub) && (
                            <button
                              onClick={() => toggleInlineMap(event.id)}
                              className="inline-flex items-center justify-center h-6 px-2 text-[9px] font-mono font-semibold rounded bg-emerald-500 text-neutral-950 hover:bg-emerald-400 cursor-pointer"
                            >
                              {inlineMapEventId === event.id ? t.hideRoute : t.route}
                            </button>
                          )}
                          <a
                            href={event.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[9px] font-mono text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>Instagram</span>
                          </a>
                        </div>

                        {inlineMapEventId === event.id && (
                          <div className="mt-2 h-[120px] rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 relative z-40">
                            <MiniMap
                              targetRegion={event.hub}
                              eventName={event.title}
                              locationName={event.locationName}
                              t={t}
                              lang={lang}
                            />
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSimulating && (
          <div className="flex flex-col items-start gap-1">
            <span className="text-[9px] font-mono text-amber-500 font-bold tracking-wider uppercase">
              {t.chatThinking}
            </span>
            <div className="rounded-2xl p-4 bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
              <p className="text-xs font-mono">{t.chatSearching}...</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick user actions */}
      <div className="p-2.5 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-900 flex gap-2 overflow-x-auto select-none">
        {quickActions.map(({ label, prompt }) => (
          <button
            key={label}
            onClick={() => void handleSendMessage(prompt)}
            disabled={isSimulating}
            className="shrink-0 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 hover:border-emerald-500/50 hover:text-emerald-500 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sleek Input Dock */}
      <div className="p-3 bg-neutral-50/80 dark:bg-neutral-900/80 border-t border-neutral-200 dark:border-neutral-800 backdrop-blur-md relative">
        <div className="relative flex items-end gap-3 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 px-4 py-3 focus-within:border-emerald-500/50 dark:focus-within:border-neutral-800 transition-colors">
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
            className="min-h-10 flex-1 bg-transparent text-xs font-sans leading-relaxed text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none resize-none border-0 p-0 focus:ring-0"
          />

          <button
            disabled={!inputText.trim() || isSimulating}
            onClick={() => void handleSendMessage(inputText)}
            className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all ${
              inputText.trim() && !isSimulating
                ? 'bg-emerald-500 hover:bg-emerald-400 scale-105 shadow-md shadow-emerald-500/25 active:scale-95 text-neutral-950'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
            }`}
            title={t.chatSend}
          >
            <Send className="w-3.5 h-3.5 rotate-45 transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
