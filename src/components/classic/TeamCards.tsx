import React from "react";
import { Users, Mail, Copy, Check, Phone, Sparkles, HelpCircle, Crown, Handshake, BriefcaseBusiness, UserRound, type LucideIcon } from "lucide-react";
import { Hub } from "../../lib/classic-data";

interface TeamCardsProps {
  activeHub: Hub;
  copyToClipboard: (text: string, id: string) => void;
  copiedText: string | null;
  handleSendChatMessage: (text: string) => void;
  lang: "RU" | "KZ" | "EN";
}

function teamIconForRole(role: string): LucideIcon {
  const normalizedRole = role.toLowerCase();

  if (normalizedRole.includes("ceo") || normalizedRole.includes("директор")) {
    return Crown;
  }

  if (normalizedRole.includes("координатор") || normalizedRole.includes("coordinator")) {
    return Handshake;
  }

  if (
    normalizedRole.includes("менеджер") ||
    normalizedRole.includes("manager") ||
    normalizedRole.includes("комьюнити") ||
    normalizedRole.includes("community")
  ) {
    return Users;
  }

  if (normalizedRole.includes("эксперт") || normalizedRole.includes("expert")) {
    return BriefcaseBusiness;
  }

  return UserRound;
}

export function TeamCards({
  activeHub,
  copyToClipboard,
  copiedText,
  handleSendChatMessage,
  lang
}: TeamCardsProps) {
  return (
    <div className="space-y-6 font-sans">

      <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-3xl">
        <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-400" />
          {lang === "KZ" ? `Хаб өкілдері (${activeHub.city})` : lang === "EN" ? `Hub representatives (${activeHub.city})` : `Представители хаба (${activeHub.city})`}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {lang === "KZ" ? "Кеңес алу үшін өңіріңіздегі технопарк өкілдерімен тікелей байланысыңыз." : lang === "EN" ? "Contact the technopark coordinators in your region directly for consultations." : "Свяжитесь напрямую с координаторами технопарка в Вашем регионе для получения консультаций."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeHub.team.map((member, index) => {
          const RoleIcon = teamIconForRole(member.role);

          return (
            <div
              key={index}
              className="bg-slate-900/30 border border-slate-900 hover:border-emerald-500/20 p-5 rounded-2xl flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Profile header with role icon */}
                <div className="flex items-start gap-3.5 mb-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-tr ${member.avatarColor} p-0.5 shrink-0 flex items-center justify-center`}>
                    <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                      <RoleIcon className="h-5.5 w-5.5 text-emerald-400" aria-hidden="true" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors leading-snug">
                      {member.name}
                    </h3>
                    <p className="text-[11px] text-emerald-500 font-mono mt-0.5">{member.role}</p>
                  </div>
                </div>

                {/* Contacts methods */}
                <div className="space-y-2 mt-4 bg-slate-950/40 p-3 rounded-xl border border-slate-900">

                  <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono group/item justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <a href={`mailto:${member.email}`} className="hover:text-slate-200 transition-colors truncate">
                        {member.email}
                      </a>
                    </div>
                    <button
                      onClick={() => copyToClipboard(member.email, `mail_${index}`)}
                      className="text-slate-600 hover:text-emerald-400 transition-colors p-1 cursor-pointer"
                      title={lang === "KZ" ? "Поштаны көшіру" : lang === "EN" ? "Copy email" : "Копировать почту"}
                    >
                      {copiedText === `mail_${index}` ? <Check className="h-3.5 w-3.5 text-emerald-450" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {member.phone && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono group/item justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <a href={`tel:${member.phone}`} className="hover:text-slate-200 transition-colors">
                          {member.phone}
                        </a>
                      </div>
                      <button
                        onClick={() => copyToClipboard(member.phone!, `phone_${index}`)}
                        className="text-slate-600 hover:text-emerald-400 transition-colors p-1 cursor-pointer"
                        title={lang === "KZ" ? "Телефонды көшіру" : lang === "EN" ? "Copy phone number" : "Копировать телефон"}
                      >
                        {copiedText === `phone_${index}` ? <Check className="h-3.5 w-3.5 text-emerald-455" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* Prompt shortcut */}
              <button
                onClick={() => handleSendChatMessage(
                  lang === "KZ"
                    ? `${member.name} ${activeHub.city} хабында қандай міндеттерге жауап береді? Оған қалай хабарласуға болады?`
                    : lang === "EN"
                    ? `What is the area of responsibility of coordinator ${member.name} in ${activeHub.city} hub? How can I contact them?`
                    : `Какая сфера ответственности у координатора ${member.name} в хабе ${activeHub.city}? Как я могу к нему обратиться?`
                )}
                className="text-[10px] font-mono font-semibold text-slate-505 hover:text-emerald-400 text-right mt-5 pt-3 border-t border-slate-900/60 flex items-center justify-end gap-1 transition-colors ml-auto cursor-pointer"
              >
                {lang === "KZ" ? "ЖИ-дан рөлі туралы сұрау" : lang === "EN" ? "ASK AI ABOUT ROLE" : "СПРОСИТЬ ИИ О РОЛИ"}
                <Sparkles className="h-3.5 w-3.5 text-emerald-455" style={{ color: '#34d399' }} />
              </button>

            </div>
          );
        })}
      </div>

      <div className="flex gap-4 p-5 bg-slate-900/10 border border-dashed border-slate-900 rounded-2xl max-w-full items-start mt-6">
        <HelpCircle className="h-6 w-6 text-slate-550 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-xs text-slate-300">
            {lang === "KZ" ? "Өз қалаңызда IT қауымдастығын ашқыңыз келе ме?" : lang === "EN" ? "Want to launch an IT community in your city?" : "Хотите запустить ИТ-комьюнити в своем городе?"}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-4xl leading-relaxed">
            {lang === "KZ"
              ? "Егер қалаңыз біздің картада әлі жоқ болса, Astana Hub өңірлік кеңсесіне немесе ЖИ ассистентімізге жаза аласыз. Біз сараптамамен, франшиза моделімен, қауымдастық менеджерлерін оқытумен және іске қосу әдістемесімен көмектесеміз."
              : lang === "EN"
              ? "If your city is not yet on our map, you can always write to the Astana Hub regional office or to our AI assistant. We help with expertise, franchise, training of community managers, and launch methodology."
              : "Если вашего города еще нет на нашей карте, вы всегда можете написать об этом региональному офису Astana Hub или нашему ИИ-ассистенту. Мы помогаем с экспертизой, франшизой, обучением комьюнити-менеджеров и методологией запуска."}
          </p>
        </div>
      </div>

    </div>
  );
}
