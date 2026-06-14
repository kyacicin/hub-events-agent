"use client";

import { Users, Mail, Sparkles, Copy, Crown, Handshake, BriefcaseBusiness, UserRound, type LucideIcon } from 'lucide-react';
import { HUB_LOCATIONS } from '../data';
import { HubRegion, UiMember } from '../types';
import { Lang, localizeCity, localizeName, localizeRole } from '../i18n';

interface TeamDeckProps {
  members: UiMember[];
  activeRegion: HubRegion;
  onSaveToast?: (message: string) => void;
  onAskAI?: (prompt: string) => void;
  lang: Lang;
  t: Record<string, string>;
}

function teamIconForRole(role: string): LucideIcon {
  const normalizedRole = role.toLowerCase();

  if (normalizedRole.includes('ceo') || normalizedRole.includes('директор')) {
    return Crown;
  }

  if (normalizedRole.includes('координатор') || normalizedRole.includes('coordinator')) {
    return Handshake;
  }

  if (
    normalizedRole.includes('менеджер') ||
    normalizedRole.includes('manager') ||
    normalizedRole.includes('комьюнити') ||
    normalizedRole.includes('community')
  ) {
    return Users;
  }

  if (normalizedRole.includes('эксперт') || normalizedRole.includes('expert')) {
    return BriefcaseBusiness;
  }

  return UserRound;
}

export default function TeamDeck({
  members,
  activeRegion,
  onSaveToast,
  onAskAI,
  lang,
  t,
}: TeamDeckProps) {
  const currentHub = HUB_LOCATIONS[activeRegion];
  const localizedCity = currentHub ? localizeCity(currentHub.cityName, lang) : '';

  // Sort: active hub representatives first, then others
  const sortedMembers = [...members].sort((a, b) => {
    if (a.hub === activeRegion && b.hub !== activeRegion) return -1;
    if (a.hub !== activeRegion && b.hub === activeRegion) return 1;
    return 0;
  });

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text).then(() => {
      if (onSaveToast) {
        onSaveToast(type === 'email' ? `${t.copied || 'Скопировано!'} Email` : `${t.copied || 'Скопировано!'} Телефон`);
      }
    });
  };

  if (!members.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-neutral-400 text-center font-mono">
        <Users className="w-8 h-8 text-neutral-600 mb-2" />
        <p>{t.noTeamData || 'Данные о команде пока не загружены.'}</p>
      </div>
    );
  }

  const gradientPairs = [
    { border: 'card-gradient-border', text: 'from-emerald-400 to-cyan-400' },
    { border: 'card-gradient-blue', text: 'from-blue-400 to-purple-400' },
    { border: 'card-gradient-pink', text: 'from-pink-400 to-rose-400' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Title Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800 pb-3">
        <div>
          <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
            {localizedCity || 'АСТАНА'} · {t.tabTeam || 'КОМАНДА'}
          </p>
          <h2 className="text-lg font-bold text-neutral-100 font-sans tracking-tight">
            {t.hubStaffTitle || 'Представители хаба'}
          </h2>
        </div>
        <span className="self-start sm:self-center inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
          {members.filter(m => m.hub === activeRegion).length} {t.staffUnit || 'представителей'}
        </span>
      </div>

      {/* Cards Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedMembers.map((member, index) => {
          const isCurrentHub = member.hub === activeRegion;
          const gradient = gradientPairs[index % gradientPairs.length];
          const RoleIcon = teamIconForRole(member.role);

          return (
            <div
              key={member.id}
              className={`card-gradient-border ${gradient.border} hover:brightness-110 transition-all duration-300 ${
                !isCurrentHub ? 'opacity-50 hover:opacity-100' : ''
              }`}
            >
              <div className="card-inner p-4 flex flex-col justify-between h-full min-h-[190px]">
                {/* Top Section */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Role Icon Avatar */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-neutral-950 font-mono text-sm shrink-0 bg-gradient-to-tr ${gradient.text}`}>
                      <div className="flex h-[calc(100%-2px)] w-[calc(100%-2px)] items-center justify-center rounded-[10px] bg-neutral-950/92">
                        <RoleIcon className="h-4.5 w-4.5 text-emerald-300" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-neutral-100 text-sm truncate">
                        {localizeName(member.name, lang)}
                      </h3>
                      <p className="text-emerald-400 text-xs font-mono font-medium mt-0.5 truncate">
                        {localizeRole(member.role, lang)}
                      </p>
                    </div>
                  </div>

                  <span className="text-[9px] font-mono border border-neutral-800 rounded px-1.5 py-0.5 text-neutral-500 bg-neutral-950/60 shrink-0">
                    ID-{(index + 1).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Info and Contacts */}
                <div className="flex flex-col gap-1.5 my-3 text-xs text-neutral-400 font-mono">
                  {member.contact && (
                    <button
                      onClick={() => handleCopy(member.contact!, 'email')}
                      className="group flex items-center gap-2 hover:text-emerald-400 transition-colors w-full text-left"
                    >
                      <Mail className="w-3.5 h-3.5 text-neutral-600 group-hover:text-emerald-400 shrink-0" />
                      <span className="truncate flex-1">{member.contact}</span>
                      <Copy className="w-3 h-3 text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}

                  {member.telegram && (
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-600 font-bold shrink-0">TG:</span>
                      <span className="truncate">{member.telegram}</span>
                    </div>
                  )}

                  {!member.contact && !member.telegram && (
                    <p className="text-[10px] text-neutral-600 italic">
                      {t.noContacts || 'Контакты скрыты или отсутствуют'}
                    </p>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-neutral-900 mt-auto flex items-center justify-between">
                  <span className="text-[8px] font-mono text-neutral-500 uppercase">
                    {member.hubName || member.hub}
                  </span>

                  {onAskAI && (
                    <button
                      onClick={() =>
                        onAskAI?.(
                          `Расскажи подробнее о роли "${member.role}" в ${member.hubName}`
                        )
                      }
                      className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold tracking-tight transition-colors"
                    >
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      <span>{t.askAIAboutRole || 'Спросить ИИ об этой роли'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
