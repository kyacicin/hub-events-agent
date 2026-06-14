import React from "react";
import { LogOut, Sparkles, Calendar, Trash2, Heart, User, LogIn, Building, ArrowUpRight } from "lucide-react";
import { UserProfile, HubEventRsvp, HubEventLike } from "../firebase";
import { Hub, EventItem } from "../data";
import { AstanaHubLogo } from "./AstanaHubLogo";

interface CabinetPanelProps {
  currentUser: UserProfile | null;
  activeHub: Hub;
  userRsvps: HubEventRsvp[];
  userLikes: HubEventLike[];
  handleLogout: () => void;
  handleLogin: () => void;
  handleSendChatMessage: (text: string) => void;
  handleToggleLike: (event: EventItem) => void;
  handleToggleRsvp: (event: EventItem) => void;
  setActiveTab: (tab: "map" | "events" | "team" | "cabinet") => void;
}

export function CabinetPanel({
  currentUser,
  activeHub,
  userRsvps,
  userLikes,
  handleLogout,
  handleLogin,
  handleSendChatMessage,
  handleToggleLike,
  handleToggleRsvp,
  setActiveTab
}: CabinetPanelProps) {
  return (
    <div className="space-y-6 font-sans">
      {currentUser ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Profile Sheet Left (4 columns) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Avatar Card */}
            <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-3xl text-center relative overflow-hidden">
              <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                ID: #{currentUser.astanaHubId || "301374"} ✓
              </div>

              <div className="h-20 w-20 rounded-2xl mx-auto bg-gradient-to-tr from-slate-700 to-slate-400 p-0.5 shadow-lg relative my-2">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.name} 
                    referrerPolicy="no-referrer"
                    className="h-full w-full rounded-[14px] object-cover" 
                  />
                ) : (
                  <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center font-bold text-2xl text-slate-305">
                    {currentUser.name[0]}
                  </div>
                )}
              </div>

              <h3 className="font-bold text-base text-slate-100 mt-3">{currentUser.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
              
              {currentUser.astanaHubUrl && (
                <div className="mt-2">
                   <a
                    href={currentUser.astanaHubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-slate-150 hover:underline transition-colors"
                  >
                    <span>Мой профиль Astana Hub</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-slate-900 bg-slate-950/30 p-3 rounded-xl text-left">
                <p className="text-[10px] font-mono text-slate-500 uppercase leading-none mb-1">ПРЕДПОЧТИТЕЛЬНЫЙ ХАБ:</p>
                <p className="font-bold text-xs text-slate-100 mt-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {activeHub.city} ({activeHub.name})
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="mt-4 w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-mono text-slate-405 hover:text-red-400 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Выйти из аккаунта</span>
              </button>
            </div>

            {/* Smart AI Startup Coach card */}
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800 p-5 rounded-3xl relative overflow-hidden">
              <div className="absolute -top-3.5 -right-3.5 h-16 w-16 bg-slate-400/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-1.5 text-slate-300 mb-2">
                <Sparkles className="h-4 w-4" />
                <h4 className="font-bold text-xs uppercase font-mono tracking-wider">AI Трекер Рекомендаций</h4>
              </div>
              
              <p className="text-xs text-slate-300 leading-relaxed">
                Привет! Основываясь на том, что твой активный регион — <strong>{activeHub.city}</strong>, я подобрал для тебя ИТ-направление:
              </p>

              <div className="mt-4 p-3.5 bg-slate-950 border border-slate-900 rounded-xl space-y-2">
                <p className="text-xs font-bold text-slate-250">План действий в {activeHub.city}:</p>
                <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>Подать заявку на ИТ-курс финансирования <strong>Tech Orda</strong>;</li>
                  <li>Посетить предстоящий: <strong>{activeHub.events[0]?.title || "Ближайший митап"}</strong>;</li>
                  <li>Получить освобождение от налогов КПН/ИПН до <strong>0%</strong>.</li>
                </ul>
              </div>

              <button
                onClick={() => handleSendChatMessage(`Подготовь мне пошаговый трек развития моего стартапа в городе ${activeHub.city}.`)}
                className="w-full mt-4 py-2 bg-white hover:bg-slate-200 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 sticky cursor-pointer active:scale-95 shadow"
              >
                Запустить AI-аудит
              </button>
            </div>

          </div>

          {/* Registrations list Right (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* RSVPs section */}
            <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-3xl backdrop-blur-sm">
              <h3 className="font-bold text-base text-slate-200 flex items-center gap-2 mb-4">
                <Calendar className="h-4.5 w-4.5 text-slate-300" />
                Мои активные бронирования (RSVPs) ({userRsvps.length})
              </h3>

              {userRsvps.length > 0 ? (
                <div className="space-y-3">
                  {userRsvps.map((rsvp, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative group hover:border-slate-700 transition-all"
                    >
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-100 group-hover:text-white transition-colors">
                          {rsvp.eventTitle}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3.5 mt-1.5 text-[11px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Building className="h-3 w-3" />
                            Хаб: {rsvp.hubId.toUpperCase()}
                          </span>
                          <span>
                            Зарегистрирован: {new Date(rsvp.registeredAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleRsvp({ id: rsvp.eventId } as EventItem)}
                        className="text-xs font-mono font-bold text-red-400 hover:text-red-300 px-3 py-1.5 bg-red-955/20 border border-red-900/30 hover:border-red-900/60 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Отменить запись</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed border-slate-800 rounded-2xl">
                  <Calendar className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-mono">Вы пока не зарегистрировались ни на одно событие.</p>
                  <button
                    onClick={() => setActiveTab("events")}
                    className="text-xs font-bold text-slate-300 hover:text-white mt-2 cursor-pointer"
                  >
                    Выбрать событие в календаре →
                  </button>
                </div>
              )}
            </div>

            {/* Liked favorites section */}
            <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-3xl backdrop-blur-sm">
              <h3 className="font-bold text-base text-slate-200 flex items-center gap-2 mb-4">
                <Heart className="h-4.5 w-4.5 text-rose-500" />
                Избранные мероприятия ({userLikes.length})
              </h3>

              {userLikes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userLikes.map((like, index) => (
                    <div 
                      key={index}
                      className="bg-slate-950/60 border border-slate-900/80 p-3.5 rounded-xl flex items-center justify-between gap-2 group hover:border-rose-550/20 transition-all font-mono text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-100 truncate">Событие ID: {like.eventId}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Регион: {like.hubId.toUpperCase()}</p>
                      </div>

                      <button
                        onClick={() => handleToggleLike({ id: like.eventId } as EventItem)}
                        className="text-[10px] font-bold text-rose-450 hover:text-rose-350 bg-rose-950/20 p-2 rounded-lg border border-rose-900/40 hover:border-rose-900/60 cursor-pointer"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed border-slate-800 rounded-2xl">
                  <Heart className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-mono">В Вашем списке избранного пока пусто.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="max-w-md mx-auto text-center p-10 bg-slate-900/40 border border-slate-900 rounded-3xl relative overflow-hidden shadow-xl font-sans">
          <div className="mb-4 flex justify-center">
            <AstanaHubLogo variant="neon" size={64} />
          </div>
          <h2 className="font-extrabold text-lg text-slate-100">Личный кабинет Astana Hub</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Авторизуйтесь с помощью Вашего профиля Astana Hub (например, по ID или вставив ссылку), чтобы записываться на хакатоны, сохранять историю ИИ-консультаций и отмечать избранные события!
          </p>

          <button
            onClick={handleLogin}
            className="mt-6 flex items-center gap-2 mx-auto text-xs md:text-sm font-semibold text-slate-955 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-white hover:to-slate-100 px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer font-sans"
          >
            <LogIn className="h-4.5 w-4.5" />
            <span>Указать профиль Astana Hub</span>
          </button>
          
          <p className="text-[10px] text-slate-500 font-mono mt-4">
            Простая авторизация по ID пользователя (например, 301374).
          </p>
        </div>
      )}
    </div>
  );
}
