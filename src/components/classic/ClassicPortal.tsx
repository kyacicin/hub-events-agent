"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Calendar, Building, ChevronDown, Compass,
  ArrowUpRight, LogIn, LogOut, User, BookOpen,
  Mail, MapPin, Sun, Moon
} from "lucide-react";
import { GithubIcon as Github, LinkedinIcon as Linkedin } from "./BrandIcons";
import { Hub, EventItem, GENERAL_FAQ } from "../../lib/classic-data";
import {
  loginWithAstanaHub,
  logoutUser,
  subscribeToAuthChanges,
  rsvpToEvent,
  cancelRsvp,
  fetchUserRsvps,
  likeEvent,
  unlikeEvent,
  fetchUserLikes,
  addChatMessage,
  fetchChatMessages,
  clearChatMessages,
  updateUserFavoriteHub,
  UserProfile,
  HubEventRsvp,
  HubEventLike,
  AppChatMessage
} from "../../lib/classic-firebase";
import { AiChat } from "./AiChat";
import { KazakhstanMap } from "./KazakhstanMap";
import { EventCards } from "./EventCards";
import { TeamCards } from "./TeamCards";
import { CabinetPanel } from "./CabinetPanel";
import { AstanaHubLogo } from "./AstanaHubLogo";
import { ShineBorder } from "./ShineBorder";
import { TRANSLATIONS, localizeClassicAddress, localizeClassicCity, localizeClassicName, localizeClassicRole } from "../../lib/classic-translations";
import { HUB_ACCOUNTS } from "../../lib/hubAccounts";
import { REGION_COORDS, HUB_LOCATIONS } from "../../data";
import type { HubEvent, HubStaff } from "../../lib/schemas";

interface ClassicPortalProps {
  initialEvents: HubEvent[];
  initialStaff: HubStaff[];
}

type ClassicLang = "RU" | "KZ" | "EN";
type ClassicTheme = "dark" | "light";

function isClassicLang(value: string | null): value is ClassicLang {
  return value === "RU" || value === "KZ" || value === "EN";
}

function isClassicTheme(value: string | null): value is ClassicTheme {
  return value === "dark" || value === "light";
}

function currentTimeLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const CLASSIC_EVENT_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&q=80&auto=format&fit=crop",
];

function initialWelcomeMessage(lang: ClassicLang, stableTimestamp = false): AppChatMessage {
  return {
    id: "init-welcome",
    role: "assistant",
    content: TRANSLATIONS[lang].aiWelcome,
    timestamp: stableTimestamp ? "--:--" : currentTimeLabel(),
  };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

type ChatRouteResponse = {
  reply?: string;
};

export default function ClassicPortal({ initialEvents, initialStaff }: ClassicPortalProps) {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<"events" | "team" | "cabinet">("events");

  // Theme state ("dark" | "light") and Language state ("RU" | "KZ" | "EN")
  const [theme, setTheme] = useState<ClassicTheme>("dark");
  const [lang, setLang] = useState<ClassicLang>("RU");

  // Load theme and lang safely on client side
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTheme = localStorage.getItem("ah-theme");
      const savedLang = localStorage.getItem("ah-lang");
      if (isClassicTheme(savedTheme)) setTheme(savedTheme);
      if (isClassicLang(savedLang)) setLang(savedLang);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // Dynamically map all 19 hubs from parsed JSON files
  const hubsDataList = useMemo<Hub[]>(() => {
    return HUB_ACCOUNTS.map((account) => {
      // Find events for this hub region
      const hubEvents: EventItem[] = initialEvents
        .filter((e) => e.region === account.region)
        .map((e) => {
          const hash = e.id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
          const GRADIENTS = [
            "from-teal-900/60 to-emerald-850/60",
            "from-violet-900/60 to-indigo-850/60",
            "from-rose-900/60 to-red-850/60",
            "from-cyan-900/60 to-blue-850/60",
            "from-orange-900/60 to-amber-850/60",
            "from-pink-900/60 to-rose-850/60"
          ];
          return {
            id: e.id,
            title: e.title,
            date: e.date,
            time: e.time ?? undefined,
            type: e.hashtags?.[0] ?? (lang === "KZ" ? "Іс-шара" : lang === "EN" ? "Event" : "Событие"),
            format: e.format.toUpperCase() === "ONLINE" ? "ONLINE" as const : "OFFLINE" as const,
            venue: e.address
              ? localizeClassicAddress(e.address, lang)
              : (e.format.toUpperCase() === "ONLINE" ? (lang === "KZ" ? "Онлайн" : "ONLINE") : (lang === "KZ" ? "Офлайн" : "OFFLINE")),
            description: e.description,
            imageColor: GRADIENTS[hash % GRADIENTS.length],
            imageUrl: CLASSIC_EVENT_IMAGE_POOL[hash % CLASSIC_EVENT_IMAGE_POOL.length],
            instagramUrl: e.source_post_url ?? undefined,
            likes: 10 + (hash % 100)
          };
        });

      // Find staff for this hub region
      const hubTeam = initialStaff
        .filter((s) => s.region === account.region)
        .map((s) => {
          const shash = s.id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
          const AVATAR_GRADIENTS = [
            "from-teal-400 to-emerald-600",
            "from-sky-400 to-indigo-600",
            "from-purple-400 to-pink-600",
            "from-amber-400 to-orange-600",
            "from-rose-400 to-red-600",
            "from-blue-400 to-cyan-600"
          ];
          const telegram = s.contact && /^@/.test(s.contact) ? s.contact : undefined;
          const email = s.contact && s.contact.includes("@") && !telegram ? s.contact : undefined;
          const phone = s.contact && !s.contact.includes("@") && !telegram ? s.contact : undefined;
          return {
            name: localizeClassicName(s.name, lang),
            role: s.role ? localizeClassicRole(s.role, lang) : (lang === "KZ" ? "Қызметкер" : lang === "EN" ? "Team member" : "Команда хаба"),
            email: email ?? "info@astanahub.com",
            phone: phone,
            avatarColor: AVATAR_GRADIENTS[shash % AVATAR_GRADIENTS.length]
          };
        });

      // Find geo coordinates and address
      const loc = HUB_LOCATIONS[account.region];
      const lat = loc?.coordinates?.lat ?? 48.0196;
      const lng = loc?.coordinates?.lng ?? 66.9237;
      const displayCity = localizeClassicCity(account.city, lang);
      const address = localizeClassicAddress(loc?.fullAddress ?? `${account.city}, Казахстан`, lang);

      return {
        id: account.region,
        name: account.hub,
        city: displayCity,
        region: account.region,
        address,
        telegram: undefined,
        instagram: account.instagram,
        coordinates: {
          x: REGION_COORDS[account.region]?.x ?? 0,
          y: REGION_COORDS[account.region]?.y ?? 0
        },
        lat,
        lng,
        workingHours: lang === "KZ" ? "09:00 - 18:30 (дс-жм)" : lang === "EN" ? "09:00 AM - 06:30 PM (Mon-Fri)" : "09:00 - 18:30 (пн-пт)",
        residentsCount: hubTeam.length > 0 ? `${hubTeam.length * 5}+` : "10+",
        eventsCount: `${hubEvents.length}`,
        teamCount: `${hubTeam.length}`,
        team: hubTeam,
        events: hubEvents,
        about: lang === "KZ"
          ? `${account.hub} — ${displayCity} қаласындағы Astana Hub технопаркінің өңірлік филиалы. IT кәсіпкерлікті, стартап қауымдастығын және инновациялық іс-шараларды дамытуға көмектеседі.`
          : lang === "EN"
          ? `${account.hub} is a regional Astana Hub technopark branch in ${displayCity}. It supports IT entrepreneurship, the startup community, and innovation events.`
          : `${account.hub} — региональный филиал технопарка Astana Hub в городе ${account.city}. Содействует развитию ИТ-предпринимательства, стартап-сообщества и проведению инновационных мероприятий.`
      };
    });
  }, [initialEvents, initialStaff, lang]);

  const [activeHubId, setActiveHubId] = useState<string>("astana");
  const [filterFormat, setFilterFormat] = useState<"ALL" | "ONLINE" | "OFFLINE">("ALL");

  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Astana Hub profile login modal controls
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [astanaHubProfileInput, setAstanaHubProfileInput] = useState<string>("");
  const [astanaHubNameInput, setAstanaHubNameInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Firestore Sync user states
  const [userRsvps, setUserRsvps] = useState<HubEventRsvp[]>([]);
  const [userLikes, setUserLikes] = useState<HubEventLike[]>([]);

  // Sliding Chat States
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [chatHistory, setChatHistory] = useState<AppChatMessage[]>(() => [
    initialWelcomeMessage("RU", true),
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const [copiedText, setCopiedText] = useState<string | null>(null);

  // DOM reference for auto scroll
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Memoized current active hub
  const activeHub = useMemo(() => {
    return hubsDataList.find(h => h.id === activeHubId) || hubsDataList[0];
  }, [activeHubId, hubsDataList]);

  // Synchronization for theme and lang persistence
  useEffect(() => {
    localStorage.setItem("ah-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("ah-lang", lang);
  }, [lang]);

  // Handle Auth Subscription
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch user specific RSVPs, Likes and Chats once user changes or language switches
  useEffect(() => {
    let cancelled = false;

    if (!currentUser) {
      const timer = window.setTimeout(() => {
        if (cancelled) return;
        setUserRsvps([]);
        setUserLikes([]);
        setChatHistory([initialWelcomeMessage(lang)]);
      }, 0);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    const loadUserData = async () => {
      try {
        const [rsvps, likes, msgs] = await Promise.all([
          fetchUserRsvps(currentUser.uid),
          fetchUserLikes(currentUser.uid),
          fetchChatMessages(currentUser.uid)
        ]);

        if (cancelled) return;

        setUserRsvps(rsvps);
        setUserLikes(likes);

        if (msgs && msgs.length > 0) {
          setChatHistory(msgs);
        } else {
          setChatHistory([
            {
              id: "init-user-welcome",
              role: "assistant",
              content: TRANSLATIONS[lang].aiWelcomeLogged(currentUser.name, activeHub.name, activeHub.city),
              timestamp: currentTimeLabel()
            }
          ]);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("Error loading user state packages:", err);
        }
      }
    };

    loadUserData();
    return () => {
      cancelled = true;
    };
  }, [currentUser, activeHubId, lang, activeHub.name, activeHub.city]);

  // Scroll chat to bottom on modifications
  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isGenerating, isChatOpen]);

  // Copy to clipboard helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Astana Hub LogIn Handler (Triggers modal form)
  const handleLogin = () => {
    setLoginError(null);
    setAstanaHubProfileInput("");
    setAstanaHubNameInput("");
    setIsLoginModalOpen(true);
  };

  const handleSubmitAstanaHubLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!astanaHubProfileInput.trim()) {
      setLoginError(lang === "KZ" ? "Профиль сілтемесін немесе ID енгізіңіз" : lang === "EN" ? "Please enter profile or ID" : "Пожалуйста, введите профиль или ID");
      return;
    }

    try {
      setLoginError(null);
      const user = await loginWithAstanaHub(astanaHubProfileInput, astanaHubNameInput);
      if (user && !user.favoriteHubId) {
        await updateUserFavoriteHub(user.uid, activeHubId);
      }
      setIsLoginModalOpen(false);
    } catch (err) {
      setLoginError(errorMessage(err, lang === "KZ" ? "Кіру қатесі" : lang === "EN" ? "Auth error" : "Ошибка авторизации"));
    }
  };

  // LogOut Handler
  const handleLogout = async () => {
    const confirmText = lang === "KZ"
      ? "Аккаунттан шыққыңыз келетініне сенімдісіз бе?"
      : lang === "EN"
      ? "Are you sure you want to log out?"
      : "Вы уверены, что хотите выйти из учетной записи?";
    if (confirm(confirmText)) {
      await logoutUser();
      setActiveTab("events");
    }
  };

  // RSVP Trigger
  const handleToggleRsvp = async (event: EventItem) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }

    const isAttached = userRsvps.some(r => r.eventId === event.id);
    try {
      if (isAttached) {
        await cancelRsvp(currentUser.uid, event.id);
        setUserRsvps(prev => prev.filter(r => r.eventId !== event.id));
      } else {
        const newRsvp = await rsvpToEvent(currentUser.uid, event.id, activeHub.id, event.title);
        setUserRsvps(prev => [...prev, newRsvp]);
      }
    } catch (err) {
      console.error("RSVP adjustment failed:", err);
    }
  };

  // Like Trigger
  const handleToggleLike = async (event: EventItem) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }

    const isLiked = userLikes.some(l => l.eventId === event.id);
    try {
      if (isLiked) {
        await unlikeEvent(currentUser.uid, event.id);
        setUserLikes(prev => prev.filter(l => l.eventId !== event.id));
      } else {
        const newLike = await likeEvent(currentUser.uid, event.id, activeHub.id);
        setUserLikes(prev => [...prev, newLike]);
      }
    } catch (err) {
      console.error("Like toggle crashed:", err);
    }
  };

  // Send speech to Next.js API chatbot route
  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim() || isGenerating) return;

    if (!isChatOpen) {
      setIsChatOpen(true);
    }

    const userText = textToSend.trim();
    setChatInput("");
    setIsGenerating(true);

    // Set UI User comment immediately
    const userMsgLocal: AppChatMessage = {
      id: `msg-usr-${Date.now()}`,
      role: "user",
      content: userText,
      timestamp: currentTimeLabel()
    };

    setChatHistory(prev => [...prev, userMsgLocal]);

    // Save to Firestore permanently if authenticated
    if (currentUser) {
      try {
        await addChatMessage(currentUser.uid, "user", userText);
      } catch (e) {
        console.error("Error storing message row:", e);
      }
    }

    try {
      // Build previous messages list to fit endpoint format
      const messagesToSend = [
        ...chatHistory
          .filter(m => !m.id.startsWith("init")) // skip welcomes
          .map(h => ({
            role: h.role === "assistant" ? "assistant" as const : "user" as const,
            content: h.content
          }))
          .slice(-9), // last 9 turns
        { role: "user" as const, content: userText }
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToSend,
          lang: lang
        })
      });

      if (!response.ok) {
        throw new Error(lang === "KZ" ? "ЖИ серверімен байланысу мүмкін болмады." : lang === "EN" ? "Could not reach the AI server." : "Не удалось связаться с сервером ИИ.");
      }

      const resData = (await response.json()) as ChatRouteResponse;
      const botReply = resData.reply || (lang === "KZ" ? "Кешіріңіз, кідіріс болды. Сұрағыңызды басқаша жазып көріңіз." : lang === "EN" ? "Sorry, something went wrong. Please try rephrasing." : "Извините, возникла заминка. Попробуйте переформулировать.");

      const botMsgLocal: AppChatMessage = {
        id: `msg-bot-${Date.now()}`,
        role: "assistant",
        content: botReply,
        timestamp: currentTimeLabel()
      };

      setChatHistory(prev => [...prev, botMsgLocal]);

      if (currentUser) {
        try {
          await addChatMessage(currentUser.uid, "assistant", botReply);
        } catch (e) {
          console.error("Error storing bot reply row:", e);
        }
      }

    } catch (error) {
      console.info("AI connection fallback:", error);
      const details = errorMessage(error, lang === "KZ" ? "Сервер уақытша қолжетімсіз" : lang === "EN" ? "Server temporarily offline" : "Сервер временно недоступен");
      const errBotMsg: AppChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: "assistant",
        content: lang === "KZ"
          ? `Кешіріңіз, ЖИ серверіне қосылу мүмкін болмады.\n\n*(Мәліметтер: ${details})*`
          : lang === "EN"
          ? `Sorry, could not connect to the AI server.\n\n*(Details: ${details})*`
          : `Извините, не удалось подключиться к серверу ИИ. Проверьте соединение.\n\n*(Детали: ${details})*`,
        timestamp: currentTimeLabel()
      };
      setChatHistory(prev => [...prev, errBotMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear Chats helper
  const handleClearChatLogs = async () => {
    const confirmClearText = lang === "KZ"
      ? "ЖИ-мен чат тарихын толық тазартқыңыз келетініне сенімдісіз бе?"
      : lang === "EN"
      ? "Are you sure you want to clear your chat history with AI?"
      : "Вы уверены, что хотите полностью стереть историю переписки с ИИ?";
    if (confirm(confirmClearText)) {
      if (currentUser) {
        await clearChatMessages(currentUser.uid);
      }
      setChatHistory([
        {
          id: "init-user-welcome-clean",
          role: "assistant",
          content: lang === "KZ"
            ? `Мен чат тарихын тазарттым. Бүгін сізге **${activeHub.name}** бойынша қалай көмектесе аламын?`
            : lang === "EN"
            ? `I have cleared the chat history. How can I help you today regarding **${activeHub.name}**?`
            : `Я стер историю переписки. Чем я могу помочь тебе сегодня по ИТ-хабу **${activeHub.name}**?`,
          timestamp: currentTimeLabel()
        }
      ]);
    }
  };

  // Handlers for switching Hubs
  const handleSelectHubManual = (id: string) => {
    setActiveHubId(id);
    if (currentUser) {
      updateUserFavoriteHub(currentUser.uid, id).catch(e => console.warn(e));
    }
  };

  // Filter events inside active hub
  const filteredEventsList = useMemo(() => {
    const raw = activeHub.events;
    if (filterFormat === "ALL") return raw;
    return raw.filter(ev => ev.format === filterFormat);
  }, [activeHub, filterFormat]);

  // Suggestions for AI chip questions
  const suggestionsList = useMemo(() => {
    return lang === "KZ" ? [
      `Қазір ${activeHub.city} қаласында қандай акселераторлар өтіп жатыр?`,
      "Tech Orda IT грантын қалай алуға болады?",
      "Astana Hub резиденттеріне қандай салық жеңілдіктері бар?",
      `${activeHub.name} командасының мүшелерін көрсет`
    ] : lang === "EN" ? [
      `What accelerators are currently running in ${activeHub.city}?`,
      "How to get Tech Orda IT grant?",
      "What tax benefits do Astana Hub residents have?",
      `Show contact team members of ${activeHub.name}`
    ] : [
      `Какие акселераторы сейчас проходят в ${activeHub.city}?`,
      "Как получить ИТ-грант Tech Orda?",
      "Какие налоговые льготы у резидентов Astana Hub?",
      `Покажи контактные лица хаба ${activeHub.name}`
    ];
  }, [activeHub, lang]);

  return (
    <div className={`classic-portal min-h-screen ${theme === "light" ? "light-theme bg-slate-50 text-slate-900" : "dark-theme bg-slate-955 text-slate-100"} font-sans selection:bg-emerald-500 selection:text-slate-955 relative overflow-x-hidden transition-colors duration-300`}>

      {/* MAIN TOP HEADER BAR */}
      <header className="border-b border-slate-900/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Trademark & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center relative select-none">
              <AstanaHubLogo variant="grayscale" size={40} className="hover:scale-105 transition-transform duration-200" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-lg text-slate-100">{TRANSLATIONS[lang].heroTitle}</span>
                <span className="font-extrabold tracking-tight text-lg text-slate-100">{TRANSLATIONS[lang].heroHub}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase leading-none mt-0.5">
                {TRANSLATIONS[lang].heroDesc}
              </p>
            </div>
          </div>

          {/* RIGHT SIDE AUTH ACTIONS */}
          <div className="flex items-center gap-2.5">
            {authLoading ? (
              <div className="h-8 w-28 bg-slate-900 rounded-xl" />
            ) : currentUser ? (
              <div className="flex items-center gap-2.5 bg-slate-900/40 border border-slate-900 pr-1 pl-3.5 py-1 rounded-xl">
                <div className="text-right font-sans">
                  <p className="text-[11px] text-slate-400 leading-none">{TRANSLATIONS[lang].cabinetLoginPrompt}</p>
                  <p className="text-xs font-semibold text-emerald-450 truncate max-w-[120px] mt-0.5">{currentUser.name}</p>
                </div>
                {currentUser.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-lg border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-100 border border-slate-700 font-bold">
                    {currentUser.name[0]}
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="p-1 px-2 text-slate-505 hover:text-red-400 transition-colors cursor-pointer"
                  title={TRANSLATIONS[lang].buttonLogout}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 text-xs md:text-sm font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300 px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-950/20 active:scale-95 cursor-pointer font-sans border border-emerald-600/60 dark:border-emerald-200/60"
              >
                <LogIn className="h-3.8 w-3.8 text-current" />
                <span>{TRANSLATIONS[lang].buttonLogin}</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* MAIN LAYOUT WRAPPER */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 relative z-10 font-sans">

        {/* TOP DESCRIPTION INTRO */}
        <ShineBorder borderRadius={12} color={["rgba(0,98,57,0.12)", "#006239", "#72e3ad"]} className="mb-6 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/10 border border-slate-900/40 p-4 rounded-3xl backdrop-blur-sm">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-100 uppercase tracking-tight flex items-center gap-2">
                <span>{TRANSLATIONS[lang].welcomeTitle}</span>
              </h1>
            </div>

            {/* Quick select dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium text-slate-400 uppercase">{TRANSLATIONS[lang].selectedRegionLabel}:</span>
              <div className="relative">
                <select
                  value={activeHubId}
                  onChange={(e) => handleSelectHubManual(e.target.value)}
                  className="appearance-none bg-slate-900 hover:bg-slate-850 hover:border-slate-500 text-slate-100 border border-slate-800 px-3.5 py-2 pr-9 rounded-xl text-xs font-semibold cursor-pointer min-w-[170px] focus:outline-none"
                >
                  {hubsDataList.map((h) => (
                    <option key={h.id} value={h.id} className="bg-slate-955 text-slate-300">
                      {h.city} • {h.name.replace(/\s*Hub$/i, '')}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </ShineBorder>

        {/* PRIMARY CHAT-FIRST SPLIT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-8">
          <div className="lg:col-span-5">
            <AiChat
              chatHistory={chatHistory}
              chatInput={chatInput}
              setChatInput={setChatInput}
              isGenerating={isGenerating}
              activeHub={activeHub}
              suggestionsList={suggestionsList}
              handleSendChatMessage={handleSendChatMessage}
              handleClearChatLogs={handleClearChatLogs}
              currentUser={currentUser}
              chatEndRef={chatEndRef}
              lang={lang}
            />
          </div>

          {/* COLUMN 2: TABBED COMPANION TOOLS */}
          <div className="lg:col-span-7 flex flex-col justify-between">

            {/* Tab switchers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
              <button
                onClick={() => setActiveTab("events")}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer group ${
                  activeTab === "events"
                    ? "bg-slate-900 border-emerald-500/45 shadow-lg shadow-emerald-500/5 text-emerald-400"
                    : "bg-slate-900/30 border-slate-900 hover:border-slate-855 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${activeTab === "events" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-955 text-slate-500 group-hover:text-slate-300"} transition-colors`}>
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                </div>
                <h3 className="font-bold text-xs tracking-tight">{TRANSLATIONS[lang].navEvents}</h3>
                <p className="text-[9px] text-slate-505 font-mono mt-0.5 leading-none uppercase">
                  {lang === "KZ" ? `Іс-шаралар мен сессиялар (${activeHub.events.length})` : lang === "EN" ? `Events & sessions (${activeHub.events.length})` : `Хакатоны & сессии (${activeHub.events.length})`}
                </p>
                {activeTab === "events" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-500" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("team")}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer group ${
                  activeTab === "team"
                    ? "bg-slate-900 border-emerald-500/45 shadow-lg shadow-emerald-500/5 text-emerald-400"
                    : "bg-slate-900/30 border-slate-900 hover:border-slate-855 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${activeTab === "team" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-955 text-slate-500 group-hover:text-slate-300"} transition-colors`}>
                    <Building className="h-4.5 w-4.5" />
                  </div>
                </div>
                <h3 className="font-bold text-xs tracking-tight">{TRANSLATIONS[lang].navTeam}</h3>
                <p className="text-[9px] text-slate-505 font-mono mt-0.5 leading-none uppercase">
                  {TRANSLATIONS[lang].guides}
                </p>
                {activeTab === "team" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-500" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("cabinet")}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer group ${
                  activeTab === "cabinet"
                    ? "bg-slate-900 border-emerald-500/45 shadow-lg shadow-emerald-500/5 text-emerald-400"
                    : "bg-slate-900/30 border-slate-900 hover:border-slate-855 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${activeTab === "cabinet" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-955 text-slate-500 group-hover:text-slate-300"} transition-colors`}>
                    <User className="h-4.5 w-4.5" />
                  </div>
                </div>
                <h3 className="font-bold text-xs tracking-tight">{TRANSLATIONS[lang].navCabinet}</h3>
                <p className="text-[9px] text-slate-505 font-mono mt-0.5 leading-none uppercase">
                  {currentUser ? `${TRANSLATIONS[lang].cabinetBookings}: ${userRsvps.length}` : TRANSLATIONS[lang].cabinetLoginPrompt}
                </p>
                {activeTab === "cabinet" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-500" />
                )}
              </button>

            </div>

            {/* TAB-CORRESPONDING CONTEXT WRAPPER AREA */}
            <ShineBorder
              borderRadius={12}
              duration={18}
              color={["rgba(0,98,57,0.14)", "#006239", "#72e3ad"]}
              className="flex-1 w-full min-h-[480px]"
            >
              <div className="h-full bg-slate-900/5 border border-slate-900/90 rounded-3xl p-4 md:p-5 relative overflow-hidden min-h-[480px]">

                {activeTab === "events" && (
                  <div className="space-y-6">
                    <EventCards
                      activeHub={activeHub}
                      filteredEventsList={filteredEventsList}
                      filterFormat={filterFormat}
                      setFilterFormat={setFilterFormat}
                      lang={lang}
                    />
                    <KazakhstanMap
                      activeHub={activeHub}
                      onSelectHub={handleSelectHubManual}
                      lang={lang}
                      hubsList={hubsDataList}
                    />
                  </div>
                )}

                {activeTab === "team" && (
                  <TeamCards
                    activeHub={activeHub}
                    copyToClipboard={copyToClipboard}
                    copiedText={copiedText}
                    handleSendChatMessage={handleSendChatMessage}
                    lang={lang}
                  />
                )}

                {activeTab === "cabinet" && (
                  <CabinetPanel
                    currentUser={currentUser}
                    activeHub={activeHub}
                    userRsvps={userRsvps}
                    userLikes={userLikes}
                    handleLogout={handleLogout}
                    handleLogin={handleLogin}
                    handleSendChatMessage={handleSendChatMessage}
                    handleToggleLike={handleToggleLike}
                    handleToggleRsvp={handleToggleRsvp}
                    setActiveTab={setActiveTab}
                    lang={lang}
                  />
                )}

              </div>
            </ShineBorder>

          </div>

        </div>

        {/* GENERAL FAQ ACCORDION PANEL */}
        <ShineBorder borderRadius={12} color={["rgba(0,98,57,0.12)", "#006239", "#72e3ad"]} className="mb-12 w-full">
          <div className="bg-slate-900/20 border border-slate-900/80 p-5 rounded-3xl">

            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4.5 w-4.5 text-emerald-455" style={{ color: '#34d399' }} />
              <h2 className="font-bold text-sm uppercase tracking-tight text-slate-100 font-sans">
                {lang === "KZ" ? "Astana Hub бағдарламалары туралы пайдалы мәліметтер" : lang === "EN" ? "Useful to know about Astana Hub programs" : "Полезно знать о программах Astana Hub"}
              </h2>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
            {GENERAL_FAQ.map((faq, idx) => {
              // Quick translations for FAQ items since they are in Russian by default
              let q = faq.question;
              let a = faq.answer;
              if (lang === "KZ") {
                if (idx === 0) {
                  q = "Өңірлік хабтардың стартаптарға қандай пайдасы бар?";
                  a = "Өңірлік хабтар тегін коворкингтер, тегін білім беру бағдарламаларын ұсынады және қаржыландыруға өтінім беруге көмектеседі (Tech Orda бағдарламасы 600 000 теңгеге дейін оқуды субсидиялайды).";
                } else if (idx === 1) {
                  q = "Astana Hub резиденті қалай атануға болады?";
                  a = "Заңды тұлғалар (ЖШС) astanahub.com порталында онлайн өтінім бере алады. Резиденттер негізгі салықтардан (ҚҚС, КТС, ЖТС, әлеуметтік салық) босатылады.";
                } else if (idx === 2) {
                  q = "Tech Orda бағдарламасы дегеніміз не?";
                  a = "Tech Orda — ҚР Цифрлық даму министрлігі мен Astana Hub-тың IT-мамандықтар бойынша оқуды субсидиялау бағдарламасы. 18-35 жас аралығындағы азаматтарға 600 000 теңгеге дейінгі гранттар беріледі.";
                }
              } else if (lang === "EN") {
                if (idx === 0) {
                  q = "What are the benefits of regional hubs for startups?";
                  a = "Regional hubs provide free co-working spaces, free educational programs, assistance in applying for funding (Tech Orda subsidizes IT education up to 600,000 KZT), tax exemption consultations, and a strong community.";
                } else if (idx === 1) {
                  q = "How to become an Astana Hub resident?";
                  a = "Legal entities (LLP) can apply online at astanahub.com. Residents are exempted from most taxes (Corporate Income Tax, Individual Income Tax, VAT, Social Tax) and enjoy simplified visas.";
                } else if (idx === 2) {
                  q = "What is the Tech Orda program?";
                  a = "Tech Orda is a program subsidizing IT education from MDDIAI and Astana Hub. Citizens of Kazakhstan aged 18 to 35 can receive grants up to 600,000 KZT for studying in leading private IT schools.";
                }
              }
              return (
                <div
                  key={idx}
                  className="bg-slate-950/40 border border-slate-900/95 p-4 rounded-xl flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-[12px] text-slate-100 leading-snug flex items-start gap-1">
                      <span className="text-emerald-500 font-mono">Q:</span>
                      <span>{q}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                      {a}
                    </p>
                  </div>

                  <button
                    onClick={() => handleSendChatMessage(lang === "KZ" ? `Толығырақ ақпарат бер: ${q}` : lang === "EN" ? `Tell me more details about: ${q}` : `Расскажи подробнее в деталях: ${q}`)}
                    className="text-[10px] uppercase font-mono text-emerald-500 hover:text-emerald-450 font-extrabold text-left mt-4 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {lang === "KZ" ? "ЖИ-дан толығырақ сұрау" : lang === "EN" ? "ASK AI FOR DETAILS" : "СПРОСИТЬ ИИ ДЕТАЛИ"}
                    <ArrowUpRight className="h-3.5 w-3.5 font-bold" />
                  </button>
                </div>
              );
            })}
          </div>

          </div>
        </ShineBorder>

      </main>

      {/* FOOTER BANNER ACCENTS */}
      <footer className="border-t border-slate-800/40 bg-slate-950 px-4 md:px-8 py-10 relative z-10 font-sans transition-colors duration-300">
        <div className="max-w-7xl mx-auto">

          {/* Top layout columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-slate-900 text-left">

            {/* Column 1: Brand Info */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <AstanaHubLogo variant="grayscale" size={32} />
                <span className="font-extrabold tracking-tight text-md text-slate-100 font-sans">Astana Hub</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {lang === "RU"
                  ? "Инновационная цифровая экосистема и единый portal регионального взаимодействия стартапов, ИТ-хабов и инвесторов в Республике Казахстан."
                  : lang === "KZ"
                  ? "Қазақстан Республикасындағы стартаптар, IT-хабтар және инвесторлар арасындағы өңірлік өзара іс-қимылға арналған инновациялық цифрлық экожүйе және бірыңғай портал."
                  : "Innovative digital ecosystem and single portal for regional interaction of startups, IT hubs and investors in the Republic of Kazakhstan."}
              </p>
              <div className="space-y-2 mt-4 text-xs text-slate-400 font-sans">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="h-3.8 w-3.8 text-slate-400 shrink-0" />
                  <span>{lang === "KZ" ? "Астана қ., Мәңгілік Ел даңғылы, C4.6" : lang === "EN" ? "Astana, Mangilik El Ave, C4.6" : "г. Астана, пр. Мәңгілік Ел, С4.6"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="h-3.8 w-3.8 text-slate-400 shrink-0" />
                  <a href="mailto:rezervkunsulu@gmail.com" className="hover:text-slate-100 transition-colors select-all">
                    rezervkunsulu@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Column 2: Useful Links */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200 font-sans">
                {lang === "RU" ? "Ресурсы разработчика" : lang === "KZ" ? "Әзірлеушіге арналған ресурстар" : "Developer Resources"}
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-medium font-sans">
                <li>
                  <a
                    href="https://github.com/kyacicin"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 hover:text-slate-100 transition-colors"
                  >
                    <Github className="h-4 w-4 text-slate-400" />
                    <span>GitHub (@kyacicin)</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/in/kunsulu-yerbatyrova/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 hover:text-slate-100 transition-colors"
                  >
                    <Linkedin className="h-4 w-4 text-slate-400" />
                    <span>LinkedIn (Kunsulu Yerbatyrova)</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://astanahub.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 hover:text-slate-100 transition-colors"
                  >
                    <Compass className="h-4 w-4 text-slate-400" />
                    <span>Astana Hub Portal</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Interface Selectors */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200 font-sans">
                {lang === "RU" ? "Параметры интерфейса" : lang === "KZ" ? "Интерфейс параметрлері" : "Interface Options"}
              </h4>

              {/* Language Selector */}
              <div className="space-y-2 font-sans">
                <p className="text-[10px] font-medium uppercase text-slate-400">
                  {lang === "RU" ? "Язык платформы" : lang === "KZ" ? "Платформа тілі" : "Platform Language"}
                </p>
                <div className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  {(["KZ", "EN", "RU"] as const).map((langId) => (
                    <button
                      key={langId}
                      onClick={() => setLang(langId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        lang === langId
                          ? "bg-slate-100 text-slate-955 shadow-md font-extrabold scale-102"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {langId}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-2 pt-2 font-sans">
                <p className="text-[10px] font-medium uppercase text-slate-400">
                  {lang === "RU" ? "Цветовая тема" : lang === "KZ" ? "Интерфейс тақырыбы" : "Interface Theme"}
                </p>
                <div className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      theme === "light"
                        ? "bg-slate-100 text-slate-950 shadow-md font-extrabold"
                        : "text-slate-400 hover:text-slate-250 hover:bg-slate-850"
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span>{lang === "RU" ? "Светлая" : lang === "KZ" ? "Ашық" : "Light"}</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      theme === "dark"
                        ? "bg-slate-100 text-slate-950 shadow-md font-extrabold"
                        : "text-slate-400 hover:text-slate-250 hover:bg-slate-850"
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    <span>{lang === "RU" ? "Темная" : lang === "KZ" ? "Қараңғы" : "Dark"}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Copyright bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-slate-505 text-[11px] font-mono pt-2">
            <p className="font-sans">
              {lang === "KZ" ? "© 2026 Astana Hub өңірлік желісі. Халықаралық IT-стартаптар технопаркі." : lang === "EN" ? "© 2026 Astana Hub Regional Network. International technopark of IT startups." : "© 2026 Astana Hub Regional Network. Международный технопарк IT-стартапов."}
            </p>
          </div>

        </div>
      </footer>

      {/* ASTANA HUB LOG-IN PROFILE POPUP MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-955/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 md:p-8 relative overflow-hidden shadow-2xl space-y-5 animate-in fade-in zoom-in duration-250 font-sans">

            {/* Ambient Background decoration */}
            <div className="absolute -top-12 -right-12 h-32 w-32 bg-slate-500/10 blur-2xl rounded-full" />

            <div className="text-center relative">
              <div className="mb-3.5 flex justify-center">
                <AstanaHubLogo variant="grayscale" size={56} />
              </div>
              <h2 className="text-lg font-extrabold text-slate-100 uppercase tracking-tight">
                {lang === "KZ" ? "Astana Hub профилі" : lang === "EN" ? "Astana Hub Profile" : "Профиль Astana Hub"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {lang === "KZ"
                  ? "Деректерді жекелендіру, тіркелулерді синхрондау және ЖИ-мен тұрақты чат жүргізу үшін технопарк аккаунтыңыздың деректерін көрсетіңіз."
                  : lang === "EN"
                  ? "Specify your technopark account details for personal sync, event RSVPs, and permanent chat history with AI"
                  : "Для персонификации, синхронизации RSVPs и постоянного диалога с ИИ укажите данные своего аккаунта технопарка"}
              </p>
            </div>

            <form onSubmit={handleSubmitAstanaHubLogin} className="space-y-4 relative">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5 gray-300">
                  {lang === "KZ" ? "Профиль сілтемесі немесе ID *" : lang === "EN" ? "Profile Link or ID *" : "Ссылка на профиль или ID *"}
                </label>
                <input
                  type="text"
                  required
                  value={astanaHubProfileInput}
                  onChange={(e) => setAstanaHubProfileInput(e.target.value)}
                  placeholder={lang === "KZ" ? "Мысалы: 301374 немесе толық сілтеме" : lang === "EN" ? "For example: 301374 or full URL" : "Например: 301374 или полная ссылка"}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  {lang === "KZ" ? "Жеке кабинетіңіздің сілтемесін қоюға болады, мысалы:" : lang === "EN" ? "You can paste your personal account URL, for example:" : "Вы можете вставить URL своего личного кабинета, например:"} <br />
                  <span className="text-emerald-500/80 break-all select-all font-mono">
                    https://astanahub.com/account/v2/user/301374/profile/activity/
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {lang === "KZ" ? "Есіміңіз немесе лақап атыңыз (міндетті емес)" : lang === "EN" ? "Your name or nickname (Optional)" : "Ваше имя или никнейм (Необязательно)"}
                </label>
                <input
                  type="text"
                  value={astanaHubNameInput}
                  onChange={(e) => setAstanaHubNameInput(e.target.value)}
                  placeholder="Алихан Бокейхан"
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>

              {loginError && (
                <div className="p-3 bg-red-955/20 border border-red-900/30 text-red-400 rounded-xl text-xs leading-relaxed flex items-start gap-1.5">
                  <span className="font-bold">{lang === "KZ" ? "Назар аударыңыз:" : lang === "EN" ? "Warning:" : "Внимание:"}</span>
                  <span>{loginError}</span>
                </div>
              )}

              {/* Action Actions Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    setLoginError(null);
                  }}
                  className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-xl transition-all cursor-pointer text-center"
                >
                  {lang === "KZ" ? "Бас тарту" : lang === "EN" ? "Cancel" : "Отмена"}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs font-semibold text-slate-955 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl transition-all shadow shadow-emerald-400/10 active:scale-95 cursor-pointer text-center"
                >
                  {lang === "KZ" ? "Кіруді растау" : lang === "EN" ? "Confirm Log In" : "Подтвердить вход"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
