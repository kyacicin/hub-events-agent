import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Sparkles, Calendar, Building, ChevronDown, Compass, 
  AlertTriangle, ArrowUpRight, LogIn, LogOut, User, Map, BookOpen, Trash2,
  Mail, MapPin, Github, Linkedin, Sun, Moon
} from "lucide-react";
import { HUBS_DATA, GENERAL_FAQ, Hub, EventItem } from "./data";
import {
  isDemoMode,
  loginWithGoogle,
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
} from "./firebase";
import { AiChat } from "./components/AiChat";
import { KazakhstanMap, HUB_COORDINATES } from "./components/KazakhstanMap";
import { EventCards } from "./components/EventCards";
import { TeamCards } from "./components/TeamCards";
import { CabinetPanel } from "./components/CabinetPanel";
import { AstanaHubLogo } from "./components/AstanaHubLogo";
import { TRANSLATIONS } from "./translations";

export default function App() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<"map" | "events" | "team" | "cabinet">("map");
  
  // Theme state ("dark" | "light") and Language state ("RU" | "KZ" | "EN")
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("ah-theme") as "dark" | "light") || "dark";
  });
  const [lang, setLang] = useState<"RU" | "KZ" | "EN">(() => {
    return (localStorage.getItem("ah-lang") as "RU" | "KZ" | "EN") || "RU";
  });

  const [activeHubId, setActiveHubId] = useState<string>("astana");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
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

  // Sliding Chat States (Keep true by default for permanent view scrolling)
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [chatHistory, setChatHistory] = useState<AppChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // UI Status feedbacks
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showStatusBanner, setShowStatusBanner] = useState<boolean>(true);
  
  // DOM reference for auto scroll
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Memoized current active hub
  const activeHub = useMemo(() => {
    return HUBS_DATA.find(h => h.id === activeHubId) || HUBS_DATA[0];
  }, [activeHubId]);

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
    if (!currentUser) {
      setUserRsvps([]);
      setUserLikes([]);
      setChatHistory([
        {
          id: "init-welcome",
          role: "assistant",
          content: TRANSLATIONS[lang].aiWelcome,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      return;
    }

    const loadUserData = async () => {
      try {
        const [rsvps, likes, msgs] = await Promise.all([
          fetchUserRsvps(currentUser.uid),
          fetchUserLikes(currentUser.uid),
          fetchChatMessages(currentUser.uid)
        ]);
        
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
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch (err) {
        console.warn("Error loading user state packages:", err);
      }
    };

    loadUserData();
  }, [currentUser, activeHubId, lang]);

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
      setLoginError("Пожалуйста, введите профиль или ID");
      return;
    }
    
    try {
      setLoginError(null);
      const user = await loginWithAstanaHub(astanaHubProfileInput, astanaHubNameInput);
      if (user && !user.favoriteHubId) {
        await updateUserFavoriteHub(user.uid, activeHubId);
      }
      setIsLoginModalOpen(false);
    } catch (err: any) {
      setLoginError(err.message || "Ошибка авторизации");
    }
  };

  // LogOut Handler
  const handleLogout = async () => {
    if (confirm("Вы уверены, что хотите выйти из учетной записи?")) {
      await logoutUser();
      setActiveTab("map");
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

  // Send speech to backend Gemini pipeline
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
      // Build previous messages to context history limit
      const serverHistoryFormat = chatHistory
        .filter(m => !m.id.startsWith("init")) // skip welcomes
        .map(h => ({
          role: h.role,
          content: h.content
        }))
        .slice(-10); // last 10 turns max payload

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: serverHistoryFormat,
          activeHubId: activeHub.id
        })
      });

      if (!response.ok) {
        throw new Error("Не удалось связаться с сервером AI.");
      }

      const resData = await response.json();
      const botReply = resData.reply || "Извините, возникла заминка. Попробуйте переформулировать.";

      const botMsgLocal: AppChatMessage = {
        id: `msg-bot-${Date.now()}`,
        role: "assistant",
        content: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory(prev => [...prev, botMsgLocal]);

      if (currentUser) {
        try {
          await addChatMessage(currentUser.uid, "assistant", botReply);
        } catch (e) {
          console.error("Error storing bot reply row:", e);
        }
      }

    } catch (error: any) {
      console.error("Gemini connection error:", error);
      const errBotMsg: AppChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: "assistant",
        content: `Извините, не удалось подключиться к серверу ИИ. Проверьте соединение.\n\n*(Детали: ${error.message || "Сервер временно недоступен"})*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, errBotMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear Chats helper
  const handleClearChatLogs = async () => {
    if (confirm("Вы уверены, что хотите полностью стереть историю переписки с ИИ?")) {
      if (currentUser) {
        await clearChatMessages(currentUser.uid);
      }
      setChatHistory([
        {
          id: "init-user-welcome-clean",
          role: "assistant",
          content: `Я стер историю переписки. Чем я могу помочь тебе сегодня по ИТ-хабу **${activeHub.name}**?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // Locate closest hub algorithm across all 19 available hubs
  const [locatingUser, setLocatingUser] = useState<boolean>(false);
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("Геолокация не поддерживается вашим браузером");
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocatingUser(false);
        const { latitude, longitude } = position.coords;
        
        // Store user geolocation globally in App state
        setUserLocation({ lat: latitude, lng: longitude });

        let minDistance = Infinity;
        let bestMatchId = "astana";

        // Calculate math distance across all 19 regional coordinates safely
        Object.entries(HUB_COORDINATES).forEach(([id, coords]) => {
          const distance = Math.pow(latitude - coords.lat, 2) + Math.pow(longitude - coords.lng, 2);
          if (distance < minDistance) {
            minDistance = distance;
            bestMatchId = id;
          }
        });

        setActiveHubId(bestMatchId);
        
        // Append a notification block to system chat log
        const matched = HUBS_DATA.find((h) => h.id === bestMatchId);
        if (matched) {
          setChatHistory((prev) => [
            ...prev,
            {
              id: `geo-match-${Date.now()}`,
              role: "assistant",
              content: `Я определил твою геопозицию! Ближайший к тебе ИТ-хаб это **${matched.name}** в г. **${matched.city}** (выбрано на интерактивной карте).\n\nЯ автоматически переключил текущий активный регион на **${matched.city}**! Желаешь узнать о его резидентах или программах акселерации?`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }
          ]);
        }
      },
      (error) => {
        setLocatingUser(false);
        console.warn("Location check failed:", error);
        alert("Не удалось определить координаты автоматически. Пожалуйста, выберите город в правом верхнем углу или кликните прямо на интерактивную карту ниже!");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
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
    return [
      `Какие акселераторы сейчас проходят в ${activeHub.city}?`,
      "Как получить ИТ-грант Tech Orda?",
      "Какие налоговые льготы у резидентов Astana Hub?",
      `Покажи контактные лица хаба ${activeHub.name}`
    ];
  }, [activeHub]);

   return (
    <div className={`min-h-screen ${theme === "light" ? "light-theme bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-100"} font-sans selection:bg-slate-200 selection:text-slate-950 relative overflow-x-hidden transition-colors duration-300`}>
      
      {/* Background neon grid effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(148,163,184,0.03),rgba(0,0,0,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Decorative localized ambient glowing orbs */}
      <div className="absolute top-10 w-[400px] h-[400px] bg-slate-500/5 blur-[120px] rounded-full -left-52 pointer-events-none" />
      <div className="absolute bottom-40 w-[450px] h-[450px] bg-slate-500/4 blur-[130px] rounded-full -right-48 pointer-events-none" />


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
                  <p className="text-xs font-semibold text-slate-100 truncate max-w-[120px] mt-0.5">{currentUser.name}</p>
                </div>
                {currentUser.photoURL ? (
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
                  className="p-1 px-2 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                  title={TRANSLATIONS[lang].buttonLogout}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-955 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-white hover:to-slate-100 px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer font-sans"
              >
                <LogIn className="h-3.8 w-3.8 text-slate-900" />
                <span>{TRANSLATIONS[lang].buttonLogin}</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* MAIN LAYOUT WRAPPER */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 relative z-10 font-sans">
        
        {/* TOP DESCRIPTION INTRO */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/10 border border-slate-900/40 p-4 rounded-3xl backdrop-blur-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-100 uppercase tracking-tight flex items-center gap-2">
              <span>{TRANSLATIONS[lang].welcomeTitle}</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed font-sans">
              {TRANSLATIONS[lang].welcomeDesc}
            </p>
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
                {HUBS_DATA.map((h) => (
                  <option key={h.id} value={h.id} className="bg-slate-950 text-slate-305">
                    {h.city} • {h.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-100">
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>

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
            />
          </div>

          {/* COLUMN 2: TABBED COMPANION TOOLS (Active widgets map/events - Right Column, 7 grid columns) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            
            {/* Tab switchers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
              
              <button
                onClick={() => setActiveTab("map")}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer group ${
                  activeTab === "map" 
                    ? "bg-slate-900 border-slate-700 shadow-md text-slate-100" 
                    : "bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${activeTab === "map" ? "bg-slate-800 text-slate-100" : "bg-slate-950 text-slate-500 group-hover:text-slate-300"} transition-colors`}>
                    <Map className="h-4.5 w-4.5" />
                  </div>
                </div>
                <h3 className="font-bold text-xs tracking-tight">{TRANSLATIONS[lang].navMap}</h3>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5 leading-none uppercase">
                  {activeHub.city} • {activeHub.residentsCount} {TRANSLATIONS[lang].residents}
                </p>
                {activeTab === "map" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white animate-fade-in" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("events")}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer group ${
                  activeTab === "events" 
                    ? "bg-slate-900 border-slate-700 shadow-md text-slate-100" 
                    : "bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${activeTab === "events" ? "bg-slate-800 text-slate-100" : "bg-slate-950 text-slate-500 group-hover:text-slate-300"} transition-colors`}>
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                </div>
                <h3 className="font-bold text-xs tracking-tight">{TRANSLATIONS[lang].navEvents}</h3>
                <p className="text-[9px] text-slate-505 font-mono mt-0.5 leading-none uppercase">
                  Хакатоны & сессии ({activeHub.events.length})
                </p>
                {activeTab === "events" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white animate-fade-in" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("team")}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer group ${
                  activeTab === "team" 
                    ? "bg-slate-900 border-slate-700 shadow-md text-slate-100" 
                    : "bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${activeTab === "team" ? "bg-slate-800 text-slate-100" : "bg-slate-955 text-slate-500 group-hover:text-slate-300"} transition-colors`}>
                    <Building className="h-4.5 w-4.5" />
                  </div>
                </div>
                <h3 className="font-bold text-xs tracking-tight">{TRANSLATIONS[lang].navTeam}</h3>
                <p className="text-[9px] text-slate-505 font-mono mt-0.5 leading-none uppercase">
                  {TRANSLATIONS[lang].guides}
                </p>
                {activeTab === "team" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white animate-fade-in" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("cabinet")}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer group ${
                  activeTab === "cabinet" 
                    ? "bg-slate-900 border-slate-700 shadow-md text-slate-100" 
                    : "bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${activeTab === "cabinet" ? "bg-slate-800 text-slate-100" : "bg-slate-955 text-slate-500 group-hover:text-slate-300"} transition-colors`}>
                    <User className="h-4.5 w-4.5" />
                  </div>
                </div>
                <h3 className="font-bold text-xs tracking-tight">{TRANSLATIONS[lang].navCabinet}</h3>
                <p className="text-[9px] text-slate-505 font-mono mt-0.5 leading-none uppercase">
                  {currentUser ? `${TRANSLATIONS[lang].cabinetBookings}: ${userRsvps.length}` : TRANSLATIONS[lang].cabinetLoginPrompt}
                </p>
                {activeTab === "cabinet" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white animate-fade-in" />
                )}
              </button>

            </div>

            {/* TAB-CORRESPONDING CONTEXT WRAPPER AREA */}
            <div className="flex-1 bg-slate-900/5 border border-slate-900/90 rounded-3xl p-4 md:p-5 relative overflow-hidden min-h-[480px]">
              
              {activeTab === "map" && (
                <div className="space-y-4 flex flex-col justify-between h-full font-sans">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                        <Building className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Региональный ИТ-хаб</h4>
                        <h3 className="text-base font-black text-slate-100 uppercase leading-tight">{activeHub.name}</h3>
                      </div>
                    </div>
                    
                    <div className="bg-slate-950/40 border border-slate-900 p-4.5 rounded-2xl space-y-3.5">
                      <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">О региональном хабе</h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {activeHub.about}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900">
                          <span className="block text-[10px] text-slate-500 font-bold uppercase">Резиденты</span>
                          <span className="text-sm font-black text-slate-100 mt-1 block">{activeHub.residentsCount} стартапов</span>
                        </div>
                        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900">
                          <span className="block text-[10px] text-slate-500 font-bold uppercase">Мероприятия</span>
                          <span className="text-sm font-black text-slate-100 mt-1 block">{activeHub.eventsCount} программ</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        const el = document.getElementById("hubs-map-section");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider active:scale-98"
                    >
                      <Map className="h-4.5 w-4.5" />
                      <span>Открыть на интерактивной карте ↓</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "events" && (
                <EventCards
                  activeHub={activeHub}
                  filteredEventsList={filteredEventsList}
                  filterFormat={filterFormat}
                  setFilterFormat={setFilterFormat}
                  userLikes={userLikes}
                  userRsvps={userRsvps}
                  handleToggleLike={handleToggleLike}
                  handleToggleRsvp={handleToggleRsvp}
                  handleSendChatMessage={handleSendChatMessage}
                />
              )}

              {activeTab === "team" && (
                <TeamCards
                  activeHub={activeHub}
                  copyToClipboard={copyToClipboard}
                  copiedText={copiedText}
                  handleSendChatMessage={handleSendChatMessage}
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
                />
              )}

            </div>

          </div>

        </div>

        {/* REGIONAL HUBS INTERACTIVE MAP SECTION */}
        <div id="hubs-map-section" className="bg-slate-900/10 border border-slate-900/90 p-5 rounded-[32px] mb-12 relative overflow-hidden">
          <KazakhstanMap
            activeHubId={activeHubId}
            activeHub={activeHub}
            handleSelectHubManual={handleSelectHubManual}
            handleLocateUser={handleLocateUser}
            locatingUser={locatingUser}
            copyToClipboard={copyToClipboard}
            copiedText={copiedText}
            handleSendChatMessage={handleSendChatMessage}
            setActiveTab={setActiveTab}
            userLocation={userLocation}
          />
        </div>

        {/* GENERAL FAQ ACCORDION PANEL (Horizontal bento widget grid) */}
        <div className="bg-slate-900/20 border border-slate-900/80 p-5 rounded-3xl mb-12">
          
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-4.5 w-4.5 text-emerald-450" />
            <h2 className="font-bold text-sm uppercase tracking-tight text-slate-100 font-sans">Полезно знать о программах Astana Hub</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
            {GENERAL_FAQ.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-slate-950/40 border border-slate-900/95 p-4 rounded-xl flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-[12px] text-slate-100 leading-snug flex items-start gap-1">
                    <span className="text-emerald-500 font-mono">Q:</span>
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
                
                <button
                  onClick={() => handleSendChatMessage(`Расскажи подробнее в деталях: ${faq.question}`)}
                  className="text-[10px] uppercase font-mono text-emerald-500 hover:text-emerald-400 font-extrabold text-left mt-4 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  СПРОСИТЬ AI ДЕТАЛИ
                  <ArrowUpRight className="h-3.5 w-3.5 font-bold" />
                </button>
              </div>
            ))}
          </div>

        </div>

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
                  ? "Инновационная цифровая экосистема и единый портал регионального взаимодействия стартапов, ИТ-хабов и инвесторов в Республике Казахстан." 
                  : lang === "KZ" 
                  ? "Қазақстан Республикасындағы стартаптардың, ИТ-хабтардың және инвесторлардың өңірлык өзара іс-қимылының инновациялық цифрлық экожүйесі және бірыңғай порталы." 
                  : "Innovative digital ecosystem and single portal for regional interaction of startups, IT hubs and investors in the Republic of Kazakhstan."}
              </p>
              <div className="space-y-2 mt-4 text-xs text-slate-400 font-sans">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="h-3.8 w-3.8 text-slate-400 shrink-0" />
                  <span>г. Астана, пр. Мәңгілік Ел, С4.6</span>
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
                {lang === "RU" ? "Ресурсы разработчика" : lang === "KZ" ? "Әзірлеуші ресурстары" : "Developer Resources"}
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

            {/* Column 3: Interactive Selectors */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200 font-sans">
                {lang === "RU" ? "Параметры интерфейса" : lang === "KZ" ? "Интерфейс параметрлері" : "Interface Options"}
              </h4>
              
              {/* Language Selector */}
              <div className="space-y-2 font-sans">
                <p className="text-[10px] font-medium uppercase text-slate-400">
                  {lang === "RU" ? "Язык платформы" : lang === "KZ" ? "Патформа тілі" : "Platform Language"}
                </p>
                <div className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  {(["KZ", "EN", "RU"] as const).map((langId) => (
                    <button
                      key={langId}
                      onClick={() => setLang(langId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        lang === langId 
                          ? "bg-slate-100 text-slate-950 shadow-md font-extrabold scale-102" 
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
                  {lang === "RU" ? "Цветовая тема" : lang === "KZ" ? "Түс тақырыбы" : "Interface Theme"}
                </p>
                <div className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      theme === "light" 
                        ? "bg-slate-100 text-slate-950 shadow-md font-extrabold" 
                        : "text-slate-400 hover:text-slate-250 hover:bg-slate-800"
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span>{lang === "RU" ? "Светлая" : lang === "KZ" ? "Жарық" : "Light"}</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      theme === "dark" 
                        ? "bg-slate-100 text-slate-950 shadow-md font-extrabold" 
                        : "text-slate-400 hover:text-slate-250 hover:bg-slate-800"
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
              © 2026 Astana Hub Regional Network. Международный технопарк IT-стартапов.
            </p>

          </div>

        </div>
      </footer>

      {/* ASTANA HUB LOG-IN PROFILE POPUP MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 md:p-8 relative overflow-hidden shadow-2xl space-y-5 animate-in fade-in zoom-in duration-250 font-sans">
            
            {/* Ambient Background decoration */}
            <div className="absolute -top-12 -right-12 h-32 w-32 bg-slate-500/10 blur-2xl rounded-full" />
            
            <div className="text-center relative">
              <div className="mb-3.5 flex justify-center">
                <AstanaHubLogo variant="grayscale" size={56} />
              </div>
              <h2 className="text-lg font-extrabold text-slate-100 uppercase tracking-tight">
                Профиль Astana Hub
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Для персонификации, синхронизации RSVPs и постоянного диалога с ИИ укажите данные своего аккаунта технопарка
              </p>
            </div>

            <form onSubmit={handleSubmitAstanaHubLogin} className="space-y-4 relative">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5 gray-300">
                  Ссылка на профиль или ID *
                </label>
                <input
                  type="text"
                  required
                  value={astanaHubProfileInput}
                  onChange={(e) => setAstanaHubProfileInput(e.target.value)}
                  placeholder="Например: 301374 или полная ссылка"
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Вы можете вставить URL своего личного кабинета, например: <br />
                  <span className="text-emerald-500/80 break-all select-all font-mono">
                    https://astanahub.com/account/v2/user/301374/profile/activity/
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ваше имя или никнейм (Необязательно)
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
                <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs leading-relaxed flex items-start gap-1.5">
                  <span className="font-bold">Внимание:</span>
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
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs font-semibold text-slate-955 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl transition-all shadow shadow-emerald-400/10 active:scale-95 cursor-pointer text-center"
                >
                  Подтвердить вход
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
