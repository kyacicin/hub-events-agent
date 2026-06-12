"use client";

import Image from 'next/image';
import { ExternalLink, Languages, Link2, Mail, Moon, Sun } from 'lucide-react';
import { LANGS, Lang } from '../i18n';

const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    href: 'https://github.com/kyacicin',
    icon: Link2,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/kunsulu-yerbatyrova/',
    icon: ExternalLink,
  },
];

interface AstanaHubFooterProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

export default function AstanaHubFooter({
  lang,
  onLangChange,
  theme,
  onThemeToggle,
}: AstanaHubFooterProps) {
  return (
    <footer className="relative z-10 mt-8 w-full overflow-hidden px-4 pb-8 pt-12 sm:px-6">
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 rounded-2xl border border-emerald-500/15 bg-white/75 px-6 py-9 text-neutral-900 shadow-2xl shadow-emerald-950/10 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-100 dark:shadow-black/30 md:flex-row md:items-start md:justify-between md:gap-12">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <a href="https://astanahub.com" className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/30 bg-neutral-950 shadow-md shadow-emerald-500/15 dark:bg-neutral-950">
              <Image
                src="/astanahub_logo.png"
                alt="Astana Hub"
                width={34}
                height={34}
                className="rounded-full"
              />
            </span>
            <span className="bg-gradient-to-br from-emerald-300 via-emerald-500 to-blue-400 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
              Astana Hub
            </span>
          </a>

          <a
            href="mailto:info@astanahub.com"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 transition hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-300"
          >
            <Mail className="h-4 w-4 text-emerald-500" />
            info@astanahub.com
          </a>

          <div className="mt-6 flex gap-3">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/70 text-neutral-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-400 dark:hover:border-emerald-400/60 dark:hover:text-emerald-300"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <nav className="flex w-full flex-col gap-7 text-center sm:flex-row sm:items-start sm:justify-between md:w-auto md:gap-12 md:text-left">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-500 dark:text-emerald-300">
              Links
            </div>
            <ul className="space-y-2 text-sm">
              {SOCIAL_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-neutral-600 transition hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-300"
                  >
                    {label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-500 dark:text-emerald-300">
              Language
            </div>
            <div className="inline-flex items-center gap-1 rounded-2xl border border-neutral-200 bg-white/70 p-1 dark:border-white/10 dark:bg-white/[0.04]">
              <Languages className="ml-2 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              {LANGS.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onLangChange(code)}
                  className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                    lang === code
                      ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                      : 'text-neutral-600 hover:bg-neutral-900/5 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-500 dark:text-emerald-300">
              Theme
            </div>
            <button
              type="button"
              onClick={onThemeToggle}
              className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white/70 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300 dark:hover:border-emerald-400/60 dark:hover:text-emerald-300"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </nav>
      </div>

      <div className="relative z-10 mt-7 text-center text-xs text-neutral-500 dark:text-neutral-500">
        <span>&copy; 2026 Astana Hub. All rights reserved.</span>
      </div>
    </footer>
  );
}
