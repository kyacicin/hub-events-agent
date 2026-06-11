import { HUB_ACCOUNTS } from "@/lib/hubAccounts";
import type { HubEvent, HubStaff } from "@/lib/schemas";

type EventFilterOptions = {
  city?: string | null;
  region?: string | null;
  today?: string | Date;
  includePast?: boolean;
};

type StaffFilterOptions = {
  city?: string | null;
  region?: string | null;
};

const REGION_KEYS: Set<string> = new Set(
  HUB_ACCOUNTS.map((account) => account.region),
);

const CITY_ALIASES: Record<string, string> = {
  "aktau": "mangystau",
  "aktobe": "aktobe",
  "alatau": "alatau",
  "alma ata": "almaty",
  "almaty": "almaty",
  "aqtobe": "aktobe",
  "astana": "astana",
  "atyrau": "atyrau",
  "jetisu": "jetisu",
  "kostanay": "kostanay",
  "kyzylorda": "kyzylorda",
  "nur sultan": "astana",
  "nursultan": "astana",
  "oral": "west_kazakhstan",
  "oskemen": "east_kazakhstan",
  "pavlodar": "pavlodar",
  "petropavl": "north_kazakhstan",
  "petropavlovsk": "north_kazakhstan",
  "qostanai": "kostanay",
  "semey": "abai",
  "shymkent": "shymkent",
  "taldykorgan": "jetisu",
  "taraz": "zhambyl",
  "turkistan": "turkistan",
  "uralsk": "west_kazakhstan",
  "ust kamenogorsk": "east_kazakhstan",
  "zhezkazgan": "ulytau",
  "акмола": "aqmola",
  "ақмола": "aqmola",
  "актау": "mangystau",
  "ақтау": "mangystau",
  "актобе": "aktobe",
  "ақтөбе": "aktobe",
  "алма ата": "almaty",
  "алмата": "almaty",
  "алматыда": "almaty",
  "алматыдағы": "almaty",
  "астана": "astana",
  "астане": "astana",
  "астаны": "astana",
  "астанада": "astana",
  "астанадағы": "astana",
  "атырау": "atyrau",
  "жамбыл": "zhambyl",
  "жезказган": "ulytau",
  "жезказгана": "ulytau",
  "жезқазған": "ulytau",
  "жетісу": "jetisu",
  "жетису": "jetisu",
  "кокшетау": "aqmola",
  "көкшетау": "aqmola",
  "костанай": "kostanay",
  "қостанай": "kostanay",
  "кызылорда": "kyzylorda",
  "қызылорда": "kyzylorda",
  "нур султан": "astana",
  "нурсултан": "astana",
  "оскемен": "east_kazakhstan",
  "өскемен": "east_kazakhstan",
  "павлодара": "pavlodar",
  "павлодардағы": "pavlodar",
  "петропавл": "north_kazakhstan",
  "петропавловск": "north_kazakhstan",
  "петропавловска": "north_kazakhstan",
  "семей": "abai",
  "тараз": "zhambyl",
  "тараза": "zhambyl",
  "тараздағы": "zhambyl",
  "туркестан": "turkistan",
  "туркестана": "turkistan",
  "түркістан": "turkistan",
  "уральск": "west_kazakhstan",
  "уральска": "west_kazakhstan",
  "орал": "west_kazakhstan",
  "шымкент": "shymkent",
  "шымкента": "shymkent",
  "шымкентте": "shymkent",
  "шымкенттегі": "shymkent",
};

export const CITY_TO_REGION: Record<string, string> = {
  ...Object.fromEntries(
    HUB_ACCOUNTS.map((account) => [normalizeLocation(account.city), account.region]),
  ),
  ...CITY_ALIASES,
};

export function cityToRegion(city: string | null | undefined) {
  if (!city) {
    return null;
  }

  const raw = city.trim().toLowerCase();

  if (REGION_KEYS.has(raw)) {
    return raw;
  }

  return CITY_TO_REGION[normalizeLocation(city)] ?? null;
}

export function regionFromText(text: string | null | undefined) {
  if (!text) {
    return null;
  }

  const normalized = normalizeLocation(text);
  const candidates = Object.entries(CITY_TO_REGION).sort(
    ([left], [right]) => right.length - left.length,
  );

  for (const [city, region] of candidates) {
    if (hasLocationToken(normalized, city)) {
      return region;
    }
  }

  for (const region of REGION_KEYS) {
    if (hasLocationToken(normalized, region)) {
      return region;
    }
  }

  // Kazakh is agglutinative: "Таразданмын" = Тараз + дан + мын. Allow a short
  // letter tail after longer city stems so case/person suffixes still match.
  for (const [city, region] of candidates) {
    if (city.length >= 5 && hasLocationStem(normalized, city)) {
      return region;
    }
  }

  return null;
}

export function filterEvents(
  events: readonly HubEvent[],
  options: EventFilterOptions = {},
) {
  const targetRegion = normalizeRegion(options.region) ?? cityToRegion(options.city);
  const today = dateKey(options.today ?? new Date());

  return events
    .filter((event) => !targetRegion || event.region === targetRegion)
    .filter((event) => options.includePast || isUpcomingEvent(event, today))
    .sort(compareEventsByDate);
}

export function filterUpcomingEvents(
  events: readonly HubEvent[],
  today: string | Date = new Date(),
) {
  const todayKey = dateKey(today);
  return events.filter((event) => isUpcomingEvent(event, todayKey)).sort(compareEventsByDate);
}

export function filterStaff(
  staff: readonly HubStaff[],
  options: StaffFilterOptions = {},
) {
  const targetRegion = normalizeRegion(options.region) ?? cityToRegion(options.city);

  return staff
    .filter((person) => !targetRegion || person.region === targetRegion)
    .sort((a, b) => `${a.region} ${a.name}`.localeCompare(`${b.region} ${b.name}`));
}

export function isUpcomingEvent(event: HubEvent, today: string | Date = new Date()) {
  return event.date >= dateKey(today);
}

export function dateKey(value: string | Date) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${byType.year}-${byType.month}-${byType.day}`;
}

function normalizeRegion(region: string | null | undefined) {
  if (!region) {
    return null;
  }

  const normalized = region.trim().toLowerCase();
  return REGION_KEYS.has(normalized) ? normalized : cityToRegion(normalized);
}

function normalizeLocation(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
}

function hasLocationToken(text: string, token: string) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, "iu").test(
    text,
  );
}

function hasLocationStem(text: string, token: string) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(^|[^\\p{L}\\p{N}])${escaped}\\p{L}{1,7}(?=$|[^\\p{L}\\p{N}])`,
    "iu",
  ).test(text);
}

function compareEventsByDate(a: HubEvent, b: HubEvent) {
  return `${a.date} ${a.time ?? ""}`.localeCompare(`${b.date} ${b.time ?? ""}`);
}
