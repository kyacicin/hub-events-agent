import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateGeminiText } from "@/lib/gemini";
import { HUB_ACCOUNTS, type HubAccount } from "@/lib/hubAccounts";
import type { EventFormat, HubEvent, HubStaff } from "@/lib/schemas";

export type { EventFormat, HubEvent, HubStaff } from "@/lib/schemas";

type ApifyInstagramPost = {
  id?: string;
  shortCode?: string;
  caption?: string;
  text?: string;
  url?: string;
  timestamp?: string;
  takenAtIso?: string;
  takenAt?: number;
  scrapedAt?: string;
  hashtags?: string[];
  ownerUsername?: string;
  parentData?: {
    username?: string;
    userName?: string;
    url?: string;
  };
};

type ExtractedPost = {
  is_event: boolean;
  event: {
    title: string | null;
    date: string | null;
    time: string | null;
    format: EventFormat | null;
    address: string | null;
    zoom_link: string | null;
    description: string | null;
  };
  staff: Array<{
    name: string;
    role: string | null;
    instagram: string | null;
    contact: string | null;
  }>;
};

type ScrapeOptions = {
  writeToDisk?: boolean;
  now?: Date;
};

export type ScrapeResult = {
  events: HubEvent[];
  staff: HubStaff[];
  rawPostsCount: number;
  parsedPostsCount: number;
  written: boolean;
};

const APIFY_API_BASE_URL = "https://api.apify.com/v2";

export async function scrapeHubEvents(
  options: ScrapeOptions = {},
): Promise<ScrapeResult> {
  const now = options.now ?? new Date();
  const parsedAt = now.toISOString();
  const today = formatDateInAlmaty(now);
  const rawPosts = await fetchInstagramPosts();
  const events: HubEvent[] = [];
  const staff: HubStaff[] = [];

  for (const post of rawPosts) {
    const account = accountForPost(post);

    if (!account) {
      continue;
    }

    const extracted = await extractPostWithGemini(post, account, today);

    if (extracted.is_event && extracted.event.title && extracted.event.date) {
      const event = toHubEvent(post, account, extracted, parsedAt);

      if (event && event.date >= today) {
        events.push(event);
      }
    }

    for (const person of extracted.staff) {
      if (person.name.trim()) {
        staff.push(toHubStaff(person, account));
      }
    }
  }

  const result: ScrapeResult = {
    events: dedupeEvents(events).sort((a, b) =>
      `${a.date} ${a.time ?? ""}`.localeCompare(`${b.date} ${b.time ?? ""}`),
    ),
    staff: dedupeStaff(staff),
    rawPostsCount: rawPosts.length,
    parsedPostsCount: events.length + staff.length,
    written: false,
  };

  if (options.writeToDisk ?? true) {
    await writeScrapeData(result.events, result.staff);
    result.written = true;
  }

  return result;
}

async function fetchInstagramPosts(): Promise<ApifyInstagramPost[]> {
  const token = requiredEnv("APIFY_API_TOKEN");
  const actorId = process.env.APIFY_INSTAGRAM_ACTOR_ID ?? "apify/instagram-scraper";
  const actorPathId = encodeURIComponent(actorId.replace("/", "~"));
  const resultsLimit = numberFromEnv("APIFY_RESULTS_LIMIT", 5);
  const onlyPostsNewerThan = process.env.APIFY_ONLY_POSTS_NEWER_THAN ?? "30 days";
  const directUrls = HUB_ACCOUNTS.map(
    (account) => `https://www.instagram.com/${account.instagram}/`,
  );
  const response = await fetch(
    `${APIFY_API_BASE_URL}/acts/${actorPathId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=300`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        directUrls,
        resultsType: "posts",
        resultsLimit,
        onlyPostsNewerThan,
        addParentData: true,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Apify Instagram scraper failed: ${response.status} ${await response.text()}`,
    );
  }

  const data = (await response.json()) as unknown;

  if (!Array.isArray(data)) {
    throw new Error("Apify returned an unexpected non-array dataset response.");
  }

  return data as ApifyInstagramPost[];
}

async function extractPostWithGemini(
  post: ApifyInstagramPost,
  account: HubAccount,
  today: string,
): Promise<ExtractedPost> {
  const caption = post.caption ?? post.text ?? "";
  const text = await generateGeminiText({
    maxOutputTokens: 1200,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: buildExtractionPrompt(post, account, caption, today),
      },
    ],
  });
  const parsed = extractJson(text);

  if (parsed && isExtractedPost(parsed)) {
    return normalizeExtraction(parsed);
  }

  return emptyExtraction();
}

function buildExtractionPrompt(
  post: ApifyInstagramPost,
  account: HubAccount,
  caption: string,
  today: string,
) {
  return `
Из этого Instagram-поста извлеки данные о событии и сотрудниках хаба.
Верни только валидный JSON без markdown и пояснений.
Если это не анонс конкретного события, поставь is_event=false и null в полях event.
Если дата относительная ("завтра", "в эту пятницу"), рассчитай ее от сегодняшней даты.

Правила:
- date только в формате YYYY-MM-DD
- time только в формате HH:MM или null
- format строго offline, online, hybrid или null
- address null для онлайн-событий без адреса
- staff заполняй только если пост явно называет человека из команды хаба
- не выдумывай людей, контакты, даты или адреса
- JSON должен иметь ровно такую структуру:
{
  "is_event": true,
  "event": {
    "title": "string или null",
    "date": "YYYY-MM-DD или null",
    "time": "HH:MM или null",
    "format": "offline|online|hybrid или null",
    "address": "string или null",
    "zoom_link": "string или null",
    "description": "string или null"
  },
  "staff": [
    {
      "name": "string",
      "role": "string или null",
      "instagram": "string или null",
      "contact": "string или null"
    }
  ]
}

Хаб: ${account.hub}
Город: ${account.city}
Регион: ${account.region}
Instagram: @${account.instagram}
Сегодня: ${today}
Дата публикации: ${post.takenAtIso ?? post.timestamp ?? post.takenAt ?? "unknown"}
URL поста: ${post.url ?? "unknown"}

Текст поста:
${caption}
`.trim();
}

function toHubEvent(
  post: ApifyInstagramPost,
  account: HubAccount,
  extracted: ExtractedPost,
  parsedAt: string,
): HubEvent | null {
  const event = extracted.event;
  const title = event.title?.trim();
  const date = event.date?.trim();

  if (!title || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  return {
    id: eventId(post, account, title, date),
    hub: account.hub,
    instagram: `@${account.instagram}`,
    city: account.city,
    region: account.region,
    title,
    date,
    time: normalizeNullable(event.time),
    format: event.format ?? inferFormat(event),
    address: normalizeNullable(event.address),
    zoom_link: normalizeNullable(event.zoom_link),
    description: normalizeNullable(event.description) ?? title,
    hashtags: normalizeHashtags(post.hashtags),
    source_post_url: post.url ?? instagramProfileUrl(account),
    parsed_at: parsedAt,
  };
}

function toHubStaff(
  person: ExtractedPost["staff"][number],
  account: HubAccount,
): HubStaff {
  return {
    id: staffId(account, person.name, person.role),
    hub: account.hub,
    city: account.city,
    region: account.region,
    name: person.name.trim(),
    role: normalizeNullable(person.role),
    instagram: normalizeInstagram(person.instagram),
    contact: normalizeNullable(person.contact),
    source: "instagram_post",
  };
}

function accountForPost(post: ApifyInstagramPost): HubAccount | undefined {
  const usernames = [
    post.ownerUsername,
    post.parentData?.username,
    post.parentData?.userName,
    usernameFromUrl(post.parentData?.url),
    usernameFromUrl(post.url),
  ]
    .filter(Boolean)
    .map((value) => normalizeUsername(value));

  return HUB_ACCOUNTS.find((account) =>
    usernames.includes(normalizeUsername(account.instagram)),
  );
}

function usernameFromUrl(url?: string | null): string | undefined {
  if (!url) {
    return undefined;
  }

  const match = url.match(/instagram\.com\/([^/?#]+)/i);
  return match?.[1];
}

function dedupeEvents(events: HubEvent[]) {
  return Array.from(new Map(events.map((event) => [event.id, event])).values());
}

function dedupeStaff(staff: HubStaff[]) {
  return Array.from(
    new Map(staff.map((person) => [person.id, person])).values(),
  ).sort((a, b) => `${a.region} ${a.name}`.localeCompare(`${b.region} ${b.name}`));
}

async function writeScrapeData(events: HubEvent[], staff: HubStaff[]) {
  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });
  await Promise.all([
    writeJson(path.join(dataDir, "events.json"), events),
    writeJson(path.join(dataDir, "staff.json"), staff),
  ]);
}

async function writeJson(filePath: string, data: unknown) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function eventId(
  post: ApifyInstagramPost,
  account: HubAccount,
  title: string,
  date: string,
) {
  if (post.shortCode) {
    return `evt_${account.region}_${post.shortCode}`;
  }

  return `evt_${account.region}_${hash(`${title}:${date}:${post.url ?? ""}`)}`;
}

function staffId(account: HubAccount, name: string, role: string | null) {
  return `staff_${account.region}_${hash(`${name}:${role ?? ""}`)}`;
}

function hash(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}

function inferFormat(event: ExtractedPost["event"]): EventFormat {
  if (event.zoom_link && !event.address) {
    return "online";
  }

  return "offline";
}

function normalizeNullable(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeInstagram(value?: string | null) {
  const trimmed = normalizeNullable(value);

  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function normalizeHashtags(hashtags?: string[]) {
  return Array.from(
    new Set(
      (hashtags ?? [])
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)),
    ),
  );
}

function normalizeUsername(value?: string | null) {
  return (value ?? "").replace(/^@/, "").toLowerCase();
}

function instagramProfileUrl(account: HubAccount) {
  return `https://www.instagram.com/${account.instagram}/`;
}

function numberFromEnv(name: string, fallback: number) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function formatDateInAlmaty(date: Date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function isExtractedPost(value: unknown): value is ExtractedPost {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.is_event === "boolean" &&
    Boolean(record.event) &&
    typeof record.event === "object" &&
    Array.isArray(record.staff)
  );
}

function normalizeExtraction(extraction: ExtractedPost): ExtractedPost {
  return {
    is_event: extraction.is_event,
    event: {
      title: normalizeNullable(extraction.event.title),
      date: normalizeNullable(extraction.event.date),
      time: normalizeNullable(extraction.event.time),
      format: extraction.event.format,
      address: normalizeNullable(extraction.event.address),
      zoom_link: normalizeNullable(extraction.event.zoom_link),
      description: normalizeNullable(extraction.event.description),
    },
    staff: extraction.staff.filter((person) => person.name?.trim()),
  };
}

function emptyExtraction(): ExtractedPost {
  return {
    is_event: false,
    event: {
      title: null,
      date: null,
      time: null,
      format: null,
      address: null,
      zoom_link: null,
      description: null,
    },
    staff: [],
  };
}

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]) as unknown;
  } catch {
    return null;
  }
}
