import React from "react";
import { Calendar, MapPin, Instagram, Heart, Sparkles, Check, AlertTriangle } from "lucide-react";
import { Hub, EventItem } from "../data";
import { HubEventLike, HubEventRsvp } from "../firebase";

interface EventCardsProps {
  activeHub: Hub;
  filteredEventsList: EventItem[];
  filterFormat: "ALL" | "ONLINE" | "OFFLINE";
  setFilterFormat: (val: "ALL" | "ONLINE" | "OFFLINE") => void;
  userLikes: HubEventLike[];
  userRsvps: HubEventRsvp[];
  handleToggleLike: (event: EventItem) => void;
  handleToggleRsvp: (event: EventItem) => void;
  handleSendChatMessage: (text: string) => void;
}

export function EventCards({
  activeHub,
  filteredEventsList,
  filterFormat,
  setFilterFormat,
  userLikes,
  userRsvps,
  handleToggleLike,
  handleToggleRsvp,
  handleSendChatMessage
}: EventCardsProps) {
  return (
    <div className="space-y-6 font-sans">
      
      {/* Headers and format filtering buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900/40 border border-slate-900 rounded-3xl">
        <div>
          <h2 className="font-black text-lg text-slate-100 flex items-center gap-2">
            <span>Предстоящие события ({activeHub.city})</span>
            <span className="font-mono text-xs text-slate-500 bg-slate-950 px-2 py-0.5 rounded">
              {filteredEventsList.length} активных
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Вы можете забронировать место (RSVP), поставить лайк и запустить разбор темы с ИИ.
          </p>
        </div>

        {/* Format Filter Bar */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-900 rounded-xl text-xs font-semibold self-start md:self-auto uppercase shrink-0">
          <button
            onClick={() => setFilterFormat("ALL")}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-[11px] ${
              filterFormat === "ALL" 
                ? "bg-slate-900 text-white font-bold" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setFilterFormat("ONLINE")}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-[11px] ${
              filterFormat === "ONLINE" 
                ? "bg-slate-900 text-white font-bold" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Онлайн
          </button>
          <button
            onClick={() => setFilterFormat("OFFLINE")}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-[11px] ${
              filterFormat === "OFFLINE" 
                ? "bg-slate-900 text-white font-bold" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Офлайн
          </button>
        </div>
      </div>

      {/* EVENTS CONTAINER WITH MAXIMUM CLARITY GRID */}
      {filteredEventsList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEventsList.map((event) => {
            const isLiked = userLikes.some(l => l.eventId === event.id);
            const isRsvpd = userRsvps.some(r => r.eventId === event.id);

            return (
              <div
                key={event.id}
                className="bg-slate-900/30 border border-slate-900/90 hover:border-slate-700 rounded-2xl p-5 transition-all duration-300 relative group flex flex-col justify-between shadow-xl"
              >
                {/* Event gradient tag card header banner */}
                <div>
                  <div className={`h-32 w-full rounded-xl bg-gradient-to-br ${event.imageColor} mb-4 relative overflow-hidden flex flex-col justify-between p-4 border border-slate-800/50`}>
                    <div className="absolute inset-0 bg-slate-950/20" />
                    
                    {/* Banner upper row */}
                    <div className="flex items-center justify-between z-10 relative">
                      <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border leading-none font-extrabold ${
                        event.format === "ONLINE" 
                          ? "border-slate-500/30 text-slate-100 bg-slate-950/90 shadow-sm" 
                          : "border-sky-500/30 text-sky-300 bg-sky-950/90 shadow-sm"
                      }`}>
                        ● {event.format}
                      </span>
                      
                      <span className="text-[10px] font-bold bg-slate-950 border border-slate-800 text-slate-100 px-2.5 py-1 rounded leading-none">
                        {event.type}
                      </span>
                    </div>

                    {/* Banner lower row */}
                    <div className="z-10 relative flex items-baseline justify-between">
                      <div className="font-mono text-xs flex items-center gap-1.5 text-slate-200 bg-slate-950/70 px-2.5 py-1 rounded-lg font-bold">
                        <Calendar className="h-3.5 w-3.5 text-slate-300" />
                        <span>{event.date} {event.time && `в ${event.time}`}</span>
                      </div>
                      
                      {event.instagramUrl && (
                        <a 
                          href={event.instagramUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-slate-950/80 hover:bg-rose-600 text-rose-450 hover:text-slate-100 border border-slate-800 shadow transition-all active:scale-90"
                          title="Смотреть в Instagram"
                        >
                          <Instagram className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Title & Details */}
                  <h3 className="font-extrabold text-lg text-slate-100 group-hover:text-white transition-colors leading-snug">
                    {event.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-mono">
                    <MapPin className="h-4 w-4 text-slate-550 shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    {event.description}
                  </p>
                </div>



              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-12 bg-slate-900/20 border border-slate-900 rounded-3xl">
          <AlertTriangle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-200">События не обнаружены</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
            В хабе {activeHub.city} пока нет активных событий формата "{filterFormat}". Измените фильтр в меню выше или выберите другой хаб на карте Казахстана!
          </p>
        </div>
      )}

    </div>
  );
}
