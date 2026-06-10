/**
 * Durable data layer for hub events and staff.
 *
 * Read priority:
 *   1. Vercel KV / Upstash (when KV_REST_API_URL + KV_REST_API_TOKEN are set)
 *   2. Bundled seed JSON (always available, keeps the app rendering)
 *
 * Write priority:
 *   1. Vercel KV / Upstash, when configured (persists across serverless calls)
 *   2. Local filesystem `data/*.json`, for local development
 *
 * On Vercel without a KV store, writes throw a clear error instead of
 * silently discarding scraped data into the ephemeral serverless filesystem.
 */
import path from "node:path";
import seedEventsRaw from "../../data/events.json";
import seedStaffRaw from "../../data/staff.json";
import { isKvConfigured, kvGet, kvSet } from "@/lib/kv";
import { isHubEvent, isHubStaff, type HubEvent, type HubStaff } from "@/lib/schemas";

export const EVENTS_KEY = "hub:events";
export const STAFF_KEY = "hub:staff";

export type StorageBackend = "kv" | "filesystem";

const SEED_EVENTS: HubEvent[] = (seedEventsRaw as unknown[]).filter(isHubEvent);
const SEED_STAFF: HubStaff[] = (seedStaffRaw as unknown[]).filter(isHubStaff);

export async function readEvents(): Promise<HubEvent[]> {
  return (await readCollection(EVENTS_KEY, isHubEvent)) ?? SEED_EVENTS;
}

export async function readStaff(): Promise<HubStaff[]> {
  return (await readCollection(STAFF_KEY, isHubStaff)) ?? SEED_STAFF;
}

export async function writeData(
  events: HubEvent[],
  staff: HubStaff[],
): Promise<{ backend: StorageBackend }> {
  if (isKvConfigured()) {
    await kvSet(EVENTS_KEY, JSON.stringify(events));
    await kvSet(STAFF_KEY, JSON.stringify(staff));
    return { backend: "kv" };
  }

  if (process.env.VERCEL) {
    throw new Error(
      "No durable store configured. Attach a Vercel KV store and set " +
        "KV_REST_API_URL and KV_REST_API_TOKEN so scraped data persists across requests.",
    );
  }

  await writeFilesystem(events, staff);
  return { backend: "filesystem" };
}

async function readCollection<T>(
  key: string,
  guard: (value: unknown) => value is T,
): Promise<T[] | null> {
  if (!isKvConfigured()) {
    return null;
  }

  try {
    const raw = await kvGet(key);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    const valid = Array.isArray(parsed) ? parsed.filter(guard) : [];
    return valid.length ? valid : null;
  } catch (error) {
    console.error(
      `Failed to read "${key}" from KV, falling back to seed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
}

async function writeFilesystem(events: HubEvent[], staff: HubStaff[]) {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(dataDir, "events.json"),
      `${JSON.stringify(events, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      path.join(dataDir, "staff.json"),
      `${JSON.stringify(staff, null, 2)}\n`,
      "utf8",
    ),
  ]);
}
