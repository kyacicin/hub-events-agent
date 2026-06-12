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

const HUB_GEO_OVERRIDES: Record<
  string,
  Pick<HubLocation, 'fullAddress' | 'coordinates' | 'addressPrecision'>
> = {
  turkistan: {
    fullAddress: 'ул. Бекзат Саттарханова 36, Туркестан',
    coordinates: { lat: 43.3021, lng: 68.2699 },
    addressPrecision: 'exact',
  },
  west_kazakhstan: {
    fullAddress: 'ул. Исатая-Махамбета 84, ЦОН, 4 этаж, Уральск',
    coordinates: { lat: 51.2259, lng: 51.3876 },
    addressPrecision: 'exact',
  },
  astana: {
    fullAddress: 'пр. Мангилик Ел 55/8, павильон C1 EXPO, Астана',
    coordinates: { lat: 51.0902, lng: 71.4167 },
    addressPrecision: 'exact',
  },
  almaty: {
    fullAddress: 'ул. Зенкова 24, 4 этаж, Алматы',
    coordinates: { lat: 43.257, lng: 76.9563 },
    addressPrecision: 'exact',
  },
  zhambyl: {
    fullAddress: 'пр. Толе би 35, Тараз',
    coordinates: { lat: 42.9007, lng: 71.3677 },
    addressPrecision: 'exact',
  },
  alatau: {
    fullAddress: 'ул. Кунаева 5Б, Конаев',
    coordinates: { lat: 43.8827, lng: 77.0637 },
    addressPrecision: 'exact',
  },
  atyrau: {
    fullAddress: 'Atyrau Hub, Атырау, Казахстан',
    coordinates: { lat: 47.0945, lng: 51.9238 },
    addressPrecision: 'city',
  },
  shymkent: {
    fullAddress: 'мкр. Север 66/2, Шымкент',
    coordinates: { lat: 42.3592, lng: 69.6039 },
    addressPrecision: 'exact',
  },
  kostanay: {
    fullAddress: 'ул. Абая 28/1, Костанай',
    coordinates: { lat: 53.2144, lng: 63.6246 },
    addressPrecision: 'exact',
  },
  pavlodar: {
    fullAddress: 'ул. Генерала Дюсенова 80, 2 этаж, Павлодар',
    coordinates: { lat: 52.2869, lng: 76.9674 },
    addressPrecision: 'exact',
  },
  east_kazakhstan: {
    fullAddress: 'ул. Казахстан 59/1, Оскемен',
    coordinates: { lat: 49.9516, lng: 82.6119 },
    addressPrecision: 'exact',
  },
  aktobe: {
    fullAddress: 'пр. Абилкайыр-хана 52А, 3 этаж, Актобе',
    coordinates: { lat: 50.2839, lng: 57.1668 },
    addressPrecision: 'exact',
  },
  aqmola: {
    fullAddress: 'ул. Гагарина 7, Кокшетау',
    coordinates: { lat: 53.2838, lng: 69.3974 },
    addressPrecision: 'exact',
  },
  mangystau: {
    fullAddress: 'Mangystau Hub, Актау, Казахстан',
    coordinates: { lat: 43.6411, lng: 51.1985 },
    addressPrecision: 'city',
  },
  kyzylorda: {
    fullAddress: 'ул. Айтеке би 29А, Кызылорда',
    coordinates: { lat: 44.8488, lng: 65.4823 },
    addressPrecision: 'exact',
  },
  ulytau: {
    fullAddress: 'ул. Момышулы 3А, Жезказган',
    coordinates: { lat: 47.8043, lng: 67.7143 },
    addressPrecision: 'exact',
  },
  north_kazakhstan: {
    fullAddress: 'SKO Hub, Петропавловск, Казахстан',
    coordinates: { lat: 54.8732, lng: 69.1505 },
    addressPrecision: 'city',
  },
  jetisu: {
    fullAddress: 'ул. Кунаева 47, IT HUB Jetisu Digital, Талдыкорган',
    coordinates: { lat: 45.0178, lng: 78.3797 },
    addressPrecision: 'exact',
  },
  abai: {
    fullAddress: 'Semey Hub, Семей, Казахстан',
    coordinates: { lat: 50.4111, lng: 80.2275 },
    addressPrecision: 'city',
  },
};

export const HUB_LOCATIONS: Record<HubRegion, HubLocation> = Object.fromEntries(
  HUB_ACCOUNTS.map((account) => [
    account.region,
    {
      name: account.hub,
      cityName: account.city,
      instagram: `@${account.instagram}`,
      fullAddress:
        HUB_GEO_OVERRIDES[account.region]?.fullAddress ?? `${account.city}, Казахстан`,
      coordinates: HUB_GEO_OVERRIDES[account.region]?.coordinates ?? {
        lat: 48.0196,
        lng: 66.9237,
      },
      addressPrecision:
        HUB_GEO_OVERRIDES[account.region]?.addressPrecision ?? 'city',
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

/** Every regional hub, Astana first, then alphabetically by label. */
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
  return /(команд|сотрудник|работник|директор|менеджер|руководител|организатор|ответственн|контакт|кто\s|staff|team|employee|director|manager|lead|contact|кім\s|қызметкер|басшы|жетекші|ұйымдастырушы|жауапты|байланыс)/i.test(
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

/** Backbone links drawn from Astana to the major regional nodes. */
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
