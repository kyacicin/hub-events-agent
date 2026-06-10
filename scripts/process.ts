import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateGeminiText } from "../src/lib/gemini";
import { HUB_ACCOUNTS } from "../src/lib/hubAccounts";

type RawPost = {
  caption?: string;
  text?: string;
  ownerUsername?: string;
  url?: string;
  shortCode?: string;
  timestamp?: string;
  takenAtIso?: string;
  takenAt?: number;
  hashtags?: string[];
};

type HubMeta = {
  hub: string;
  city: string;
  region: string;
  instagram: string;
};

type ExtractedEvent = {
  title: string;
  date: string | null;
  time: string | null;
  format: "offline" | "online" | "hybrid";
  address: string | null;
  description: string;
};

type EventRecord = ExtractedEvent & {
  id: string;
  hub: string;
  instagram: string;
  city: string;
  region: string;
  hashtags: string[];
  source_post_url: string;
  parsed_at: string;
};

const today = formatDateInAlmaty(new Date());
const hubMap = buildHubMap();

async function extractEventFromPost(
  post: RawPost,
  caption: string,
) {
  const publishedAt = postPublishedAt(post) ?? "не указана";
  const text = await generateGeminiText({
    maxOutputTokens: 700,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `Из этого Instagram-поста извлеки данные о предстоящем событии.
Если это не анонс события - верни null.
Если событие уже прошло относительно сегодняшней даты - верни null.
Если дата относительная ("завтра", "в пятницу"), используй дату публикации как контекст.
Верни ТОЛЬКО JSON без пояснений:

{
  "title": "название события",
  "date": "YYYY-MM-DD или null",
  "time": "HH:MM или null",
  "format": "offline или online или hybrid",
  "address": "адрес или null",
  "description": "1-2 предложения о событии"
}

Дата публикации: ${publishedAt}
Сегодняшняя дата: ${today}

Текст поста:
${caption}`,
      },
    ],
  });
  const clean = text.replace(/```json|```/g, "").trim();

  if (!clean || clean === "null") {
    return null;
  }

  try {
    const parsed = JSON.parse(clean) as Partial<ExtractedEvent> | null;

    if (!parsed?.title) {
      return null;
    }

    return {
      title: parsed.title.trim(),
      date: nullableText(parsed.date),
      time: nullableText(parsed.time),
      format: normalizeFormat(parsed.format),
      address: nullableText(parsed.address),
      description: nullableText(parsed.description) ?? parsed.title.trim(),
    } satisfies ExtractedEvent;
  } catch {
    return null;
  }
}

async function main() {
  await loadLocalEnv();

  const rawPosts = JSON.parse(
    await readFile(path.join(process.cwd(), "data/raw_posts.json"), "utf8"),
  ) as RawPost[];
  const events: EventRecord[] = [];
  const processLimit = Number.parseInt(process.env.PROCESS_LIMIT ?? "", 10);
  const outputPath = path.join(
    process.cwd(),
    process.env.PROCESS_OUTPUT ?? "data/events.json",
  );
  let processed = 0;

  for (const post of rawPosts) {
    const caption = post.caption ?? post.text;
    const username = normalizeUsername(post.ownerUsername);
    const hub = hubMap[username];

    if (!caption || !hub) {
      continue;
    }

    processed += 1;
    console.log(`Обрабатываю пост от @${username}...`);

    const event = await extractEventFromPost(post, caption);

    if (event && isUpcoming(event.date)) {
      events.push({
        ...event,
        id: makeEventId(post, hub, event),
        hub: hub.hub,
        instagram: `@${hub.instagram}`,
        city: hub.city,
        region: hub.region,
        hashtags: normalizeHashtags(post.hashtags),
        source_post_url: post.url ?? `https://www.instagram.com/${hub.instagram}/`,
        parsed_at: new Date().toISOString(),
      });
    }

    if (Number.isFinite(processLimit) && processed >= processLimit) {
      break;
    }
  }

  const uniqueEvents = dedupeEvents(events).sort((a, b) =>
    `${a.date ?? ""} ${a.time ?? ""}`.localeCompare(`${b.date ?? ""} ${b.time ?? ""}`),
  );

  await writeFile(outputPath, `${JSON.stringify(uniqueEvents, null, 2)}\n`);
  console.log(`Готово. Сохранено ${uniqueEvents.length} событий в ${outputPath}`);
}

function buildHubMap(): Record<string, HubMeta> {
  const entries = Object.fromEntries(
    HUB_ACCOUNTS.map((account) => [
      normalizeUsername(account.instagram),
      {
        hub: account.hub,
        city: account.city,
        region: account.region,
        instagram: account.instagram,
      },
    ]),
  ) as Record<string, HubMeta>;

  return {
    ...entries,
    astanahub: entries["astana.hub"],
    zhambylinnovation: entries.zhambyl_hub,
    almatyhub: entries.almaty_hub,
    shymkenthub: entries.shymkent__hub,
    pavlodarhub: entries["pavlodar.hub"],
    aktobehub: entries["aqtobe.hub"],
  } satisfies Record<string, HubMeta>;
}

async function loadLocalEnv() {
  for (const fileName of [".env.local", ".env"]) {
    try {
      const file = await readFile(path.join(process.cwd(), fileName), "utf8");

      for (const line of file.split(/\r?\n/)) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith("#")) {
          continue;
        }

        const separatorIndex = trimmed.indexOf("=");

        if (separatorIndex === -1) {
          continue;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();

        if (key && !process.env[key]) {
          process.env[key] = unquote(value);
        }
      }
    } catch {
      // Optional env file.
    }
  }
}

function normalizeUsername(value?: string | null) {
  return (value ?? "").replace(/^@/, "").toLowerCase();
}

function normalizeFormat(value?: string | null): ExtractedEvent["format"] {
  if (value === "online" || value === "hybrid") {
    return value;
  }

  return "offline";
}

function nullableText(value?: string | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.toLowerCase() === "null") {
    return null;
  }

  return trimmed;
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

function isUpcoming(date: string | null) {
  return !date || date >= today;
}

function makeEventId(post: RawPost, hub: HubMeta, event: ExtractedEvent) {
  if (post.shortCode) {
    return `evt_${hub.region}_${post.shortCode}`;
  }

  return `evt_${hub.region}_${hash(`${event.title}:${event.date ?? ""}:${post.url ?? ""}`)}`;
}

function dedupeEvents(events: EventRecord[]) {
  return Array.from(new Map(events.map((event) => [event.id, event])).values());
}

function hash(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}

function postPublishedAt(post: RawPost) {
  if (post.takenAtIso) {
    return post.takenAtIso;
  }

  if (post.timestamp) {
    return post.timestamp;
  }

  if (post.takenAt) {
    return new Date(post.takenAt * 1000).toISOString();
  }

  return null;
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

function unquote(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
