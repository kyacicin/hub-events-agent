import React from "react";
import { Calendar, MapPin, AlertTriangle } from "lucide-react";
import { InstagramIcon as Instagram } from "./BrandIcons";
import { Hub, EventItem } from "../../lib/classic-data";
import { TRANSLATIONS } from "../../lib/classic-translations";
import { ShineBorder } from "./ShineBorder";

interface EventCardsProps {
  activeHub: Hub;
  filteredEventsList: EventItem[];
  filterFormat: "ALL" | "ONLINE" | "OFFLINE";
  setFilterFormat: (val: "ALL" | "ONLINE" | "OFFLINE") => void;
  lang: "RU" | "KZ" | "EN";
}

export function EventCards({
  activeHub,
  filteredEventsList,
  filterFormat,
  setFilterFormat,
  lang
}: EventCardsProps) {
  return (
    <div className="space-y-6 font-sans">

      {/* Headers and format filtering buttons */}
      <ShineBorder borderRadius={12} color={["rgba(0,98,57,0.14)", "#006239", "#72e3ad"]} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900/40 border border-slate-900 rounded-3xl">
          <div>
            <h2 className="font-black text-lg text-slate-100 flex items-center gap-2">
              <span>{lang === "KZ" ? `Алдағы іс-шаралар (${activeHub.city})` : lang === "EN" ? `Upcoming Events (${activeHub.city})` : `Предстоящие события (${activeHub.city})`}</span>
              <span className="font-mono text-xs text-slate-500 bg-slate-950 px-2 py-0.5 rounded">
                {filteredEventsList.length} {lang === "KZ" ? "белсенді" : lang === "EN" ? "active" : "активных"}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === "KZ" ? "Таңдалған хабтағы алдағы іс-шаралар тізімі." : lang === "EN" ? "Upcoming events for the selected hub." : "Предстоящие события выбранного хаба."}
            </p>
          </div>

          {/* Format Filter Bar */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-900 rounded-xl text-xs font-semibold self-start md:self-auto uppercase shrink-0">
            <button
              onClick={() => setFilterFormat("ALL")}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-[11px] ${
                filterFormat === "ALL"
                  ? "bg-slate-900 text-emerald-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {TRANSLATIONS[lang].formatAll}
            </button>
            <button
              onClick={() => setFilterFormat("ONLINE")}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-[11px] ${
                filterFormat === "ONLINE"
                  ? "bg-slate-900 text-emerald-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {TRANSLATIONS[lang].formatOnline}
            </button>
            <button
              onClick={() => setFilterFormat("OFFLINE")}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-[11px] ${
                filterFormat === "OFFLINE"
                  ? "bg-slate-900 text-emerald-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {TRANSLATIONS[lang].formatOffline}
            </button>
          </div>
        </div>
      </ShineBorder>

      {/* EVENTS CONTAINER WITH MAXIMUM CLARITY GRID */}
      {filteredEventsList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEventsList.map((event) => {
            const postUrl = sourcePostUrl(event.instagramUrl);
            const cardClassName =
              "bg-slate-900/30 border border-slate-900/90 hover:border-emerald-500/30 rounded-2xl p-5 transition-all duration-300 relative group flex flex-col shadow-xl h-full focus:outline-none focus:ring-2 focus:ring-emerald-400/70";
            const content = (
              <>
                {/* Event photo header banner */}
                <div>
                  <div className={`h-32 w-full rounded-xl bg-gradient-to-br ${event.imageColor} mb-4 relative overflow-hidden flex flex-col justify-between p-4 border border-slate-800/50`}>
                    {event.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.imageUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-slate-950/45" />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/85 to-transparent" />

                    {/* Banner upper row */}
                    <div className="flex items-center justify-between z-10 relative">
                      <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border leading-none font-extrabold ${
                        event.format === "ONLINE"
                          ? "border-emerald-500/30 text-emerald-200 bg-emerald-950/90 shadow-sm"
                          : "border-red-500/30 text-red-200 bg-red-950/90 shadow-sm"
                      }`}>
                        {event.format === "ONLINE" ? "🟢 ОНЛАЙН" : "🔴 ОФЛАЙН"}
                      </span>

                      <span className="text-[10px] font-bold bg-slate-950/90 border border-slate-800 text-emerald-300 px-2.5 py-1 rounded leading-none">
                        {event.type}
                      </span>
                    </div>

                    {/* Banner lower row */}
                    <div className="z-10 relative flex items-baseline justify-between gap-3">
                      <div className="font-mono text-xs flex items-center gap-1.5 text-slate-100 bg-slate-950/75 px-2.5 py-1 rounded-lg font-bold">
                        <Calendar className="h-3.5 w-3.5 text-emerald-300" />
                        <span>{event.date} {event.time && (lang === "KZ" ? `${event.time}-де` : lang === "EN" ? `at ${event.time}` : `в ${event.time}`)}</span>
                      </div>

                      {postUrl && (
                        <span
                          className="p-2 rounded-lg bg-slate-950/85 text-rose-300 border border-slate-800 shadow transition-all group-hover:bg-rose-600 group-hover:text-slate-100"
                          title={lang === "KZ" ? "Instagram-да көру" : lang === "EN" ? "View Instagram post" : "Смотреть пост в Instagram"}
                        >
                          <Instagram className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Details */}
                  <h3 className="font-extrabold text-lg text-slate-100 group-hover:text-emerald-400 transition-colors leading-snug">
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
              </>
            );

            return (
              <ShineBorder
                key={event.id}
                borderRadius={10}
                duration={18}
                color={["rgba(0,98,57,0.12)", "#006239", "#72e3ad"]}
                className="w-full h-full"
              >
                {postUrl ? (
                  <a
                    href={postUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cardClassName}
                    aria-label={lang === "KZ" ? `${event.title} Instagram постын ашу` : lang === "EN" ? `Open Instagram post for ${event.title}` : `Открыть пост Instagram: ${event.title}`}
                  >
                    {content}
                  </a>
                ) : (
                  <div className={cardClassName}>
                    {content}
                  </div>
                )}
              </ShineBorder>
            );
          })}
        </div>
      ) : (
        <ShineBorder borderRadius={12} className="w-full">
          <div className="text-center p-12 bg-slate-900/20 border border-slate-900 rounded-3xl">
            <AlertTriangle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <h3 className="font-bold text-slate-200">{lang === "KZ" ? "Іс-шаралар табылмады" : lang === "EN" ? "No events found" : "События не обнаружены"}</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
              {lang === "KZ"
                ? `${activeHub.city} хабында "${filterFormat === 'ALL' ? 'Барлығы' : filterFormat === 'ONLINE' ? 'Онлайн' : 'Офлайн'}" форматындағы белсенді іс-шаралар әлі жоқ. Басқа форматты таңдаңыз немесе картадан басқа хабты көріңіз.`
                : lang === "EN"
                ? `There are no active "${filterFormat === 'ALL' ? 'All' : filterFormat === 'ONLINE' ? 'Online' : 'Offline'}" events in "${activeHub.city}" hub yet. Change the filter above or choose another hub on the map!`
                : `В хабе ${activeHub.city} пока нет активных событий формата "${filterFormat === 'ALL' ? 'Все' : filterFormat === 'ONLINE' ? 'Онлайн' : 'Офлайн'}". Измените фильтр в меню выше или выберите другой хаб на карте Казахстана!`}
            </p>
          </div>
        </ShineBorder>
      )}

    </div>
  );
}

function sourcePostUrl(url?: string) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const isInstagram = /(^|\.)instagram\.com$/i.test(parsed.hostname);
    const isPostPath = /^\/(p|reel|tv)\//i.test(parsed.pathname);
    return isInstagram && isPostPath ? parsed.toString() : null;
  } catch {
    return null;
  }
}
