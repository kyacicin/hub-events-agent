// Data layer for the HubVibe Portal front end.
// Adapts parsed Instagram data (src/lib/schemas.ts shapes) into the UI card
// models, and holds presentation-only data: hub addresses, mini-map geometry
// and the schedule grid builder. Everything here is client-safe (no node APIs).

import { HUB_ACCOUNTS } from '@/lib/hubAccounts';
import type { HubEvent, HubStaff } from '@/lib/schemas';
import {
  HubLocation,
  HubOption,
  HubRegion,
  TimeSlot,
  UiEvent,
  UiEventFormat,
  UiMember,
  Weekday,
} from './types';

// ---------------------------------------------------------------------------
// Hub directory
// ---------------------------------------------------------------------------

const HUB_ADDRESS_OVERRIDES: Record<string, string> = {
  astana: 'пр. Мангилик Ел 55/8, павильон C1 EXPO, Астана',
  zhambyl: 'пр. Толе би 35, Тараз',
  pavlodar: 'ул. Генерала Дюсенова 80, 2 этаж, Павлодар',
};

export const HUB_LOCATIONS: Record<HubRegion, HubLocation> = Object.fromEntries(
  HUB_ACCOUNTS.map((account) => [
    account.region,
    {
      name: account.region === 'astana' ? `${account.hub} (HQ)` : account.hub,
      fullAddress:
        HUB_ADDRESS_OVERRIDES[account.region] ?? `${account.city}, Казахстан`,
    },
  ]),
);

export function hubOptionFor(region: HubRegion): HubOption | null {
  const account = HUB_ACCOUNTS.find((a) => a.region === region);
  if (!account) return null;
  return {
    region,
    label: account.hub.replace(/\s*Hub$/i, ''),
    cityName: account.city,
  };
}

/** Every regional hub, HQ first, then alphabetically by label. */
export function buildHubOptions(): HubOption[] {
  return [...HUB_ACCOUNTS]
    .map((a) => ({
      region: a.region,
      label: a.hub.replace(/\s*Hub$/i, ''),
      cityName: a.city,
    }))
    .sort((a, b) =>
      a.region === 'astana' ? -1 : b.region === 'astana' ? 1 : a.label.localeCompare(b.label),
    );
}

// ---------------------------------------------------------------------------
// Adapters: parsed data -> UI cards
// ---------------------------------------------------------------------------

const WEEKDAYS: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Curated covers; a real post photo is not exposed by the parser, so cards get
// a deterministic image from this pool keyed by event id.
const EVENT_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=640&q=80&auto=format&fit=crop',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const DAY_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

export function toUiEvent(event: HubEvent): UiEvent {
  const parsed = new Date(`${event.date}T00:00:00Z`);
  const format = event.format.toUpperCase() as UiEventFormat;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    day: DAY_FORMAT.format(parsed),
    weekday: WEEKDAYS[parsed.getUTCDay()],
    time: event.time ?? '',
    hub: event.region,
    hubName: event.hub,
    cityName: event.city,
    format,
    imageUrl: EVENT_IMAGE_POOL[hashString(event.id) % EVENT_IMAGE_POOL.length],
    instagramUrl: event.source_post_url,
    locationName:
      event.address ??
      event.zoom_link ??
      `Онлайн — ссылка в Instagram ${event.instagram}`,
  };
}

const AVATAR_COLORS = ['10b981', '3b82f6', 'f59e0b', '8b5cf6', 'ec4899', '14b8a6'];

export function toUiMember(person: HubStaff): UiMember {
  const telegram =
    person.contact && /^@/.test(person.contact) ? person.contact : null;
  const email =
    person.contact && person.contact.includes('@') && !telegram
      ? person.contact
      : null;

  return {
    id: person.id,
    name: person.name,
    role: person.role ?? 'Команда хаба',
    hub: person.region,
    hubName: person.hub,
    cityName: person.city,
    bio: `${person.role ?? 'Контакт'} — ${person.hub}, ${person.city}. Данные собраны из Instagram (${person.source}).`,
    telegram,
    instagram: person.instagram,
    contact: email,
    avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
      person.id,
    )}&backgroundColor=${AVATAR_COLORS[hashString(person.id) % AVATAR_COLORS.length]}`,
    focus: [person.hub, person.city],
  };
}

/** RU/KZ/EN heuristic: is the user asking about people rather than events? */
export function isStaffQuery(text: string): boolean {
  return /(команд|сотрудник|директор|менеджер|контакт|кто |кім|қызметкер|басшы|байланыс|staff|team|director|contact)/i.test(
    text,
  );
}

// ---------------------------------------------------------------------------
// Mini-map geometry (approximate Kazakhstan layout on a 500x320 canvas)
// ---------------------------------------------------------------------------

export interface MapNode {
  region: HubRegion;
  x: number;
  y: number;
  label: string;
}

export const REGION_COORDS: Record<HubRegion, { x: number; y: number }> = {
  astana: { x: 300, y: 115 },
  north_kazakhstan: { x: 295, y: 50 },
  aqmola: { x: 270, y: 95 },
  pavlodar: { x: 385, y: 80 },
  abai: { x: 415, y: 125 },
  east_kazakhstan: { x: 455, y: 150 },
  kostanay: { x: 195, y: 80 },
  aktobe: { x: 130, y: 140 },
  west_kazakhstan: { x: 60, y: 105 },
  atyrau: { x: 70, y: 175 },
  mangystau: { x: 60, y: 245 },
  ulytau: { x: 250, y: 170 },
  kyzylorda: { x: 185, y: 225 },
  turkistan: { x: 235, y: 272 },
  shymkent: { x: 255, y: 287 },
  zhambyl: { x: 295, y: 277 },
  almaty: { x: 380, y: 262 },
  alatau: { x: 392, y: 250 },
  jetisu: { x: 412, y: 225 },
};

export function mapNodes(): MapNode[] {
  return Object.entries(REGION_COORDS)
    .filter(([region]) => HUB_LOCATIONS[region])
    .map(([region, { x, y }]) => ({
      region,
      x,
      y,
      label: hubOptionFor(region)?.label ?? region,
    }));
}

/** Backbone links drawn from HQ to the major regional nodes. */
export const MAP_BACKBONE: HubRegion[] = [
  'pavlodar',
  'east_kazakhstan',
  'kostanay',
  'aktobe',
  'kyzylorda',
  'zhambyl',
  'almaty',
];

export function hasMapRoute(region: HubRegion): boolean {
  return region !== 'astana' && region in REGION_COORDS;
}

// ---------------------------------------------------------------------------
// Smart Schedule grid
// ---------------------------------------------------------------------------

const SCHEDULE_DAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BASE_TIMES = ['09:00', '11:00', '14:00', '16:00', '18:00'];
const FALLBACK_SLOT_TIME = '14:00';

/**
 * Builds the weekly grid for one hub from its real upcoming events. Free slots
 * get deterministic availability noise so the grid renders identically on
 * server and client.
 */
export function getSchedule(region: HubRegion, events: UiEvent[]): TimeSlot[] {
  const hubEvents = events.filter((e) => e.hub === region);
  const times = [
    ...new Set([...BASE_TIMES, ...hubEvents.map((e) => e.time || FALLBACK_SLOT_TIME)]),
  ].sort();

  return SCHEDULE_DAYS.flatMap((day) =>
    times.map((time) => {
      const event = hubEvents.find(
        (e) => e.weekday === day && (e.time || FALLBACK_SLOT_TIME) === time,
      );
      return {
        day,
        time,
        // Roughly a quarter of free slots show as blocked-out rooms.
        available: !!event || hashString(`${region}|${day}|${time}`) % 4 !== 0,
        event,
      };
    }),
  );
}
