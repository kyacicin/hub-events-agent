"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MapPin, Paperclip, Clipboard, Code, ChevronDown, Check } from 'lucide-react';
import { HUB_LOCATIONS, CHUBS, EVENTS } from '../data';
import { HubCity, ChatMessage, HubEvent, TeamMember } from '../types';
import MiniMap from './MiniMap';

interface SleekChatProps {
  activeCity: HubCity;
  onCityChanged: (city: HubCity) => void;
  onSaveToast: (message: string) => void;
  onSetAuxView: (view: 'events' | 'team' | 'schedule') => void;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
}

export default function SleekChat({
  activeCity,
  onCityChanged,
  onSaveToast,
  onSetAuxView,
  isSimulating,
  setIsSimulating
}: SleekChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [inlineMapEventId, setInlineMapEventId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialize with introductory assistant messages after hydration —
  // timestamps use the client clock/timezone, so creating them during the
  // server prerender would mismatch on hydrate.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages([
      {
        id: 'init-1',
        sender: 'assistant',
        text: `👋 Hello! I'm your interactive AI Assistant. I can help you parse, schedule, and navigate events, directory channels, and calendars across our regional Kazakhstani hubs!`,
        timestamp: new Date(),
      },
      {
        id: 'init-2',
        sender: 'assistant',
        text: `Try querying something specific or tap one of the workspace visualizer presets down below to test the advanced card carousels, profile chips, and tennis-style grids!`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Scroll to bottom when messages load or the inline mini-map expands
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSimulating, inlineMapEventId]);

  const handleSendMessage = (textToSend: string, cityOverride?: HubCity) => {
    if (!textToSend.trim() || isSimulating) return;

    const targetCity = cityOverride ?? activeCity;

    // Send user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsSimulating(true);

    // Simulate AI scraper / JSON database parsing logic
    setTimeout(() => {
      const criteria = textToSend.toLowerCase();
      let aiText = '';
      let parsedEvents: HubEvent[] | undefined;
      let parsedMembers: TeamMember[] | undefined;
      let inlineMapId: string | null = null;

      // 1. Check for Team / Director / Contact queries (checked first so
      // "who is the director of X hub" doesn't match the event branch)
      if (criteria.includes('director') || criteria.includes('who is') || criteria.includes('aziz') || criteria.includes('elena') || criteria.includes('team') || criteria.includes('contacts')) {
        // Find directory members for the current city
        const matchingMember = CHUBS.filter(m => m.role.toLowerCase().includes(targetCity.toLowerCase()) || m.id.includes(targetCity.toLowerCase()));

        if (matchingMember.length > 0) {
          parsedMembers = matchingMember;
          aiText = `⚡ **CONTACT CHIP CONSTRUCTED**: ${matchingMember.map(m => m.name).join(' and ')} verified for ${HUB_LOCATIONS[targetCity].name}. You can click on the specialized "Team Chip" below to expand their full glassmorphism dossier, and tap the reveal details toggle for Telegram links.`;
        } else {
          // Send active manager profile
          const regionalManager = CHUBS.find(m => m.id === 'aziz_seytkali') || CHUBS[0];
          parsedMembers = [regionalManager];
          aiText = `⚡ **CONTACT PARSING ACTIVE**: Regional contact parsed. Showing profile cards for Hub Leads, including **${regionalManager.name}**. Tapping below opens their encrypted biographical card details in-chat.`;
        }
      }
      // 2. Check for Event / Location queries
      else if (criteria.includes('event') || criteria.includes('happen') || criteria.includes('hubs') || criteria.includes('show') || criteria.includes('what') || criteria.includes('taraz') || criteria.includes('pavlodar') || criteria.includes('astana') || criteria.includes('kyzylorda') || criteria.includes('zhambyl')) {
        // Find events in the current active city
        const matchEvents = EVENTS.filter(e => e.hub.toLowerCase() === targetCity.toLowerCase());
        parsedEvents = matchEvents;

        aiText = `🔍 **DATABASE ACQUIRED**: I have parsed the local Instagram feeds and highlights for **${HUB_LOCATIONS[targetCity].name}**. I found **${matchEvents.length} upcoming events**! They are loaded in the swipeable carousel card below.`;

        // If there's an offline event, let's suggest map coordinates
        const offlineMatch = matchEvents.find(e => e.format === 'OFFLINE');
        if (offlineMatch) {
          inlineMapId = offlineMatch.id;
        }
      }
      // 3. Fallback standard Chat reaction
      else {
        aiText = `💡 **SYSTEM OK STATE**: Thanks for your request! I am prepared for parsing. Let's switch our auxiliary deck view to check this week's **Schedule Grid** or query events directly. Try using these quick template clicks below for instant formatting tests.`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: aiText,
        timestamp: new Date(),
        carouselEvents: parsedEvents,
        teamMembers: parsedMembers,
        showMapForEventId: inlineMapId || undefined,
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsSimulating(false);

      // Auto switch Auxiliary side panels as visual cues
      if (parsedEvents) onSetAuxView('events');
      else if (parsedMembers) onSetAuxView('team');
    }, 1500); // Pulse delay
  };

  const handlePresetTrigger = (promptText: string, suggestedCity?: HubCity) => {
    if (suggestedCity) {
      onCityChanged(suggestedCity);
    }
    handleSendMessage(promptText, suggestedCity);
  };

  const executeAction = (actionType: string, payload?: string) => {
    if (actionType === 'show_map') {
      const eId = payload ?? null;
      setInlineMapEventId(prev => prev === eId ? null : eId);
      onSaveToast("Plotting interactive route inside chat thread...");
    } else if (actionType === 'add_cal') {
      onSaveToast(`🗓 Saved "${payload}" to your device calendar! (Simulated ICS download)`);
    } else if (actionType === 'show_team') {
      onSetAuxView('team');
      onSaveToast("Switched Auxiliary Panel to Team Deck!");
    } else if (actionType === 'connect_social') {
      onSaveToast(`🔗 Parsed bio links unlocked: Redirecting to Telegram encrypted feed.`);
    }
  };

  const cities: HubCity[] = ['Astana', 'Zhambyl', 'Pavlodar', 'Taraz', 'Kyzylorda'];

  return (
    <div id="sleek-chat-container" className="flex flex-col h-[600px] rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl relative overflow-hidden">

      {/* Top Embedded Location Selector Dropdown */}
      <div className="px-4 py-3 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between text-xs z-30">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-neutral-400">Hub Scanner Status</span>
        </div>

        {/* Custom Dropdown for City selection within Input Bar area */}
        <div className="relative">
          <button
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            className="flex items-center gap-1.5 px-3 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-emerald-400 font-mono font-bold hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <MapPin className="w-3" />
            <span>{activeCity} Hub Selected</span>
            <ChevronDown className="w-3" />
          </button>

          <AnimatePresence>
            {showLocationDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute right-0 mt-1.5 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl p-1 z-40"
              >
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      onCityChanged(city);
                      setShowLocationDropdown(false);
                      onSaveToast(`Switched active parsing parameters to ${city} Hub`);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-sans rounded-lg flex items-center justify-between ${
                      activeCity === city
                        ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                        : 'text-neutral-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{city} IT Hub</span>
                    {activeCity === city && <Check className="w-3 text-emerald-400" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages Canvas Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
        {messages.map((message) => {
          const isAI = message.sender === 'assistant';

          return (
            <div
              key={message.id}
              className={`flex flex-col ${isAI ? 'items-start' : 'items-end'} gap-1`}
            >
              <div className="text-[10px] font-mono text-neutral-500 px-1">
                {isAI ? '🤖 AI Assistant' : '👤 You'} • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>

              {/* Chat Bubble card container */}
              <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs text-left ${
                isAI
                  ? 'bg-neutral-900/60 border border-neutral-800 text-neutral-200'
                  : 'bg-emerald-500 text-neutral-950 font-medium font-sans shadow-md shadow-emerald-500/5'
              }`}>
                {/* Text string parsing markdown-like titles */}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {message.text}
                </div>

                {/* Inline Map Showcase IF Offline event direction is active (The "Wow" Factor) */}
                {isAI && message.showMapForEventId && (
                  <div className="mt-3">
                    <button
                      onClick={() => executeAction('show_map', message.showMapForEventId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold bg-neutral-950 border border-neutral-800 hover:border-emerald-500/40 text-emerald-400 transition-all cursor-pointer"
                    >
                      <MapPin className="w-3" />
                      {inlineMapEventId === message.showMapForEventId ? 'Collapse In-Chat Map' : '📍 Show Route Vector Mini-Map'}
                    </button>

                    {inlineMapEventId === message.showMapForEventId && (
                      <div className="mt-2 text-neutral-100">
                        {(() => {
                          const associatedEvent = EVENTS.find(e => e.id === message.showMapForEventId);
                          return (
                            <MiniMap
                              targetCity={associatedEvent?.hub || activeCity}
                              eventName={associatedEvent?.title || 'Parsed Target Node'}
                              locationName={associatedEvent?.locationName || 'Coworking Lounge'}
                            />
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Simulated inline widgets if relevant components are parsed back */}
                {isAI && message.teamMembers && (
                  <div className="mt-3 p-1 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-tight px-3 py-1 border-b border-neutral-900 mb-1">
                      Rendered Contact Cards
                    </div>
                    {message.teamMembers.map(m => (
                      <div key={m.id} className="p-2 border-b last:border-b-0 border-neutral-900/60 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.avatarUrl} alt="" className="w-6 h-6 rounded-md object-cover" />
                          <div>
                            <p className="font-bold text-neutral-200">{m.name}</p>
                            <p className="text-[9px] text-neutral-500">{m.role}</p>
                          </div>
                        </div>
                        <a
                          href={`https://t.me/${m.telegram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-blue-950/40 text-blue-400 hover:bg-blue-900/40 text-[9px] font-mono font-bold transition-all border border-blue-900/50"
                        >
                          Send Ping
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action-First Contextual Buttons block rendered ONLY right underneath AI responses! */}
              {isAI && (
                <div className="flex flex-wrap gap-1.5 mt-1 ml-1">
                  {message.carouselEvents ? (
                    <>
                      <button
                        onClick={() => executeAction('show_map', message.carouselEvents?.[0]?.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border border-neutral-800 hover:border-emerald-500/40 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-emerald-400 transition-all cursor-pointer"
                      >
                        📍 Show on Map
                      </button>
                      <button
                        onClick={() => executeAction('add_cal', message.carouselEvents?.[0]?.title)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer"
                      >
                        🗓 Add to Calendar
                      </button>
                      <a
                        href={message.carouselEvents?.[0]?.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer"
                      >
                        📸 View Post
                      </a>
                    </>
                  ) : message.teamMembers ? (
                    <>
                      <button
                        onClick={() => executeAction('connect_social')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border border-neutral-800 hover:border-blue-500/40 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-blue-400 transition-all cursor-pointer"
                      >
                        👋 Send Telegram Ping
                      </button>
                      <button
                        onClick={() => executeAction('show_team')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer"
                      >
                        📁 Switch View (Team Deck)
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handlePresetTrigger("Who is the director of Zhambyl hub?", "Zhambyl")}
                        className="px-2.5 py-1 text-[10px] font-mono rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-500 hover:text-neutral-300 transition-all cursor-pointer"
                      >
                        🔍 Test Dynamic Director parsing
                      </button>
                      <button
                        onClick={() => onSetAuxView('schedule')}
                        className="px-2.5 py-1 text-[10px] font-mono rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-500 hover:text-neutral-300 transition-all cursor-pointer"
                      >
                        🗓 Open Weekly Tennis Grid
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Live Scraper Parsing pulsing dot loader */}
        {isSimulating && (
          <div className="flex flex-col items-start gap-1">
            <span className="text-[9px] font-mono text-amber-500 animate-pulse font-bold tracking-wider uppercase">
              ⚡ LIVE QUERY IN PROGRESS: Scouring JSON DB...
            </span>
            <div className="rounded-2xl p-4 bg-neutral-900/40 border border-neutral-800 text-neutral-300 flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <p className="text-xs font-mono">Parsing Instagram handles and schedule tables for {activeCity} Hub...</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Preset Fast Testing panel */}
      <div className="p-3 bg-neutral-950 border-t border-neutral-900 flex gap-2 overflow-x-auto select-none">
        <button
          onClick={() => handlePresetTrigger("Show upcoming events for Zhambyl", "Zhambyl")}
          className="shrink-0 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 text-[10px] font-sans font-medium hover:bg-neutral-800 text-neutral-300 transition-all cursor-pointer active:scale-95"
        >
          📍 Events: Zhambyl Hub
        </button>
        <button
          onClick={() => handlePresetTrigger("Who is the director of Pavlodar Hub?", "Pavlodar")}
          className="shrink-0 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 text-[10px] font-sans font-medium hover:bg-neutral-800 text-neutral-300 transition-all cursor-pointer active:scale-95"
        >
          👤 Director: Pavlodar Hub
        </button>
        <button
          onClick={() => handlePresetTrigger("Who is the director of Zhambyl hub?", "Zhambyl")}
          className="shrink-0 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 text-[10px] font-sans font-medium hover:bg-neutral-800 text-neutral-300 transition-all cursor-pointer active:scale-95"
        >
          👤 Director: Aziz Seytkali
        </button>
      </div>

      {/* Sleek Input Dock with Character Limits */}
      <div className="p-4 bg-neutral-900/80 border-t border-neutral-800 backdrop-blur-md relative">
        <div className="relative rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 pb-2 focus-within:border-neutral-700 transition-colors">
          <textarea
            value={inputText}
            onChange={(e) => {
              if (e.target.value.length <= 2000) setInputText(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(inputText);
              }
            }}
            placeholder="Query events, schedules, or directors... (Shift+Enter for newline)"
            className="w-full h-11 bg-transparent text-xs font-sans text-neutral-100 placeholder-neutral-500 outline-none resize-none border-0 p-0 focus:ring-0"
          />

          {/* Sub Dock bar containing Link items + counter + Hot Send circular button */}
          <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-neutral-900/60 font-mono">
            {/* Dock symbols */}
            <div className="flex items-center gap-2.5 text-neutral-500">
              <button className="hover:text-neutral-300 transition-colors" title="Attach code"><Code className="w-3.5" /></button>
              <button className="hover:text-neutral-300 transition-colors" title="Attach file"><Paperclip className="w-3.5" /></button>
              <button className="hover:text-neutral-300 transition-colors" title="Attach board"><Clipboard className="w-3.5" /></button>
              <span className="text-[9px] text-neutral-600 font-mono">Shift + Enter for new line</span>
            </div>

            {/* Right-aligned Character limits + Hot Sender button */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-neutral-500 font-medium">
                {inputText.length}/2000
              </span>
              <button
                disabled={!inputText.trim() || isSimulating}
                onClick={() => handleSendMessage(inputText)}
                className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all ${
                  inputText.trim() && !isSimulating
                    ? 'bg-red-500 hover:bg-red-400 scale-105 shadow-md shadow-red-500/20 active:scale-95 text-white'
                    : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                }`}
                title="Send Message"
              >
                <Send className="w-3.5 h-3.5 rotate-45 transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Operational light indicator below input block */}
        <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono mt-2.5 px-1.5 select-none">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSimulating ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulating ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span>{isSimulating ? 'Database scraping active...' : 'All systems operational'}</span>
          </div>
          <span>Active scraping protocol secure</span>
        </div>
      </div>
    </div>
  );
}
