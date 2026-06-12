"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, ChevronDown, Eye, EyeOff, Send, BadgeCheck, MapPin, Mail } from 'lucide-react';
import InstagramIcon from './InstagramIcon';
import { HUB_LOCATIONS } from '../data';
import { HubRegion, UiMember } from '../types';
import { Lang, localizeAddress, localizeCity, localizeName, localizeRole } from '../i18n';

interface TeamDeckProps {
  members: UiMember[];
  activeRegion: HubRegion;
  onSaveToast?: (message: string) => void;
  lang: Lang;
  t: Record<string, string>;
}

export default function TeamDeck({ members, activeRegion, onSaveToast, lang, t }: TeamDeckProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);

  // Active-hub members float to the top of the deck
  const sorted = [...members].sort((a, b) =>
    Number(b.hub === activeRegion) - Number(a.hub === activeRegion)
  );

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const toggleReveal = (id: string, name: string) => {
    const willReveal = !revealedIds.includes(id);
    setRevealedIds(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
    if (willReveal && onSaveToast) {
      onSaveToast(`🔓 ${t.contactsRevealed} ${name}`);
    }
  };

  if (!members.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/70 dark:bg-neutral-900/40 rounded-3xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
        <Users className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-2" />
        <p className="text-sm font-sans">{t.noTeam}</p>
      </div>
    );
  }

  return (
    <div id="team-deck-component" className="w-full bg-white/70 dark:bg-neutral-900/40 p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 backdrop-blur-xl relative select-none transition-colors duration-300">
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <h3 className="text-sm font-semibold font-sans uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
            {t.teamDeck} ({members.length})
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {t.directorySynced}
        </span>
      </div>

      {/* Profile Chips */}
      <div className="space-y-2.5">
        {sorted.map((member) => {
          const isExpanded = expandedId === member.id;
          const isRevealed = revealedIds.includes(member.id);
          const isActiveHub = member.hub === activeRegion;
          const hubLocation = HUB_LOCATIONS[member.hub];
          const channels = [member.telegram, member.instagram, member.contact].filter(Boolean);
          const displayName = localizeName(member.name, lang);
          const displayRole = localizeRole(member.role, lang);
          const displayCity = localizeCity(member.cityName, lang);

          return (
            <div
              key={member.id}
              className={`relative rounded-2xl p-[1px] transition-all duration-500 ${
                isExpanded
                  ? 'bg-gradient-to-r from-emerald-500/60 via-blue-500/40 to-emerald-500/60 shadow-lg shadow-emerald-500/10'
                  : isActiveHub
                  ? 'bg-gradient-to-r from-emerald-500/40 via-neutral-300 dark:via-neutral-800 to-blue-500/40'
                  : 'bg-neutral-200 dark:bg-neutral-800/80'
              }`}
            >
              <div className="rounded-2xl bg-white dark:bg-neutral-950/95 overflow-hidden">
                {/* Chip Row (always visible) */}
                <button
                  onClick={() => toggleExpand(member.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer focus:outline-none"
                >
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-10 h-10 rounded-xl object-cover bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                    />
                    {isActiveHub && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-neutral-950" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-sans font-bold text-neutral-900 dark:text-neutral-100 truncate">{displayName}</p>
                      <BadgeCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                    </div>
                    <p className="text-[11px] font-mono text-neutral-500 truncate">{displayRole} · {displayCity}</p>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0 transition-transform duration-300 ${
                      isExpanded ? 'rotate-180 text-emerald-500 dark:text-emerald-400' : ''
                    }`}
                  />
                </button>

                {/* Smooth Drawer Expander (vertical interpolation) */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-1 border-t border-neutral-100 dark:border-neutral-900">
                        {/* Dossier */}
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans mt-2">
                          {displayRole} — {member.hubName}, {displayCity}. {t.bioSource}
                        </p>

                        {/* Focus tags */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {[member.hubName, displayCity].map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Hub assignment */}
                        {hubLocation && (
                          <div className="flex items-center gap-1.5 mt-3 text-[10px] font-mono text-neutral-500">
                            <MapPin className="w-3 text-emerald-500 dark:text-emerald-400" />
                            <span>{hubLocation.name} — {localizeAddress(hubLocation.fullAddress, lang)}</span>
                          </div>
                        )}

                        {/* Contact Reveal */}
                        <button
                          onClick={() => toggleReveal(member.id, displayName)}
                          className={`mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-sans font-medium rounded-xl transition-all cursor-pointer ${
                            isRevealed
                              ? 'bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                              : 'bg-emerald-400 hover:bg-emerald-300 text-neutral-900 shadow-lg shadow-emerald-400/10'
                          }`}
                        >
                          {isRevealed ? <EyeOff className="w-3.5" /> : <Eye className="w-3.5" />}
                          {isRevealed ? t.hideContacts : t.showContacts}
                        </button>

                        {/* Social Revelation: sliding handles */}
                        <AnimatePresence initial={false}>
                          {isRevealed && (
                            <motion.div
                              initial={{ height: 0, opacity: 0, x: -10 }}
                              animate={{ height: 'auto', opacity: 1, x: 0 }}
                              exit={{ height: 0, opacity: 0, x: -10 }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                              className="overflow-hidden"
                            >
                              {channels.length ? (
                                <div className={`grid gap-2 mt-2 ${channels.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                  {member.telegram && (
                                    <a
                                      href={`https://t.me/${member.telegram.replace('@', '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 rounded-xl bg-blue-100/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200/70 dark:hover:bg-blue-950/50 transition-all"
                                    >
                                      <Send className="w-3.5 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-[9px] font-mono uppercase text-blue-500/70">Telegram</p>
                                        <p className="text-[11px] font-mono font-bold truncate">{member.telegram}</p>
                                      </div>
                                    </a>
                                  )}
                                  {member.instagram && (
                                    <a
                                      href={`https://www.instagram.com/${member.instagram.replace('@', '')}/`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 rounded-xl bg-pink-100/70 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/40 text-pink-600 dark:text-pink-400 hover:bg-pink-200/70 dark:hover:bg-pink-950/50 transition-all"
                                    >
                                      <InstagramIcon className="w-3.5 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-[9px] font-mono uppercase text-pink-500/70">Instagram</p>
                                        <p className="text-[11px] font-mono font-bold truncate">{member.instagram}</p>
                                      </div>
                                    </a>
                                  )}
                                  {member.contact && (
                                    <a
                                      href={`mailto:${member.contact}`}
                                      className="flex items-center gap-2 p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200/70 dark:hover:bg-emerald-950/50 transition-all"
                                    >
                                      <Mail className="w-3.5 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-[9px] font-mono uppercase text-emerald-500/70">Email</p>
                                        <p className="text-[11px] font-mono font-bold truncate">{member.contact}</p>
                                      </div>
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <p className="mt-2 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-500">
                                  {t.noContacts}
                                </p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
