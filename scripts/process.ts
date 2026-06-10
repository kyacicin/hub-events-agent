import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  processInstagramPosts,
  writeScrapeData,
  type ApifyInstagramPost,
} from "../src/lib/scraper";

await loadLocalEnv();

const rawPosts = JSON.parse(
  await readFile(path.join(process.cwd(), "data/raw_posts.json"), "utf8"),
) as ApifyInstagramPost[];
const processLimit = Number.parseInt(process.env.PROCESS_LIMIT ?? "", 10);
const selectedPosts =
  Number.isFinite(processLimit) && processLimit > 0
    ? rawPosts.slice(0, processLimit)
    : rawPosts;
const result = await processInstagramPosts(selectedPosts);

await writeScrapeData(result.events, result.staff, {
  eventsPath: resolveOutputPath(process.env.PROCESS_OUTPUT ?? "data/events.json"),
  staffPath: resolveOutputPath(process.env.PROCESS_STAFF_OUTPUT ?? "data/staff.json"),
});

console.log(
  JSON.stringify(
    {
      events: result.events.length,
      staff: result.staff.length,
      rawPosts: result.rawPostsCount,
      written: true,
    },
    null,
    2,
  ),
);

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

function resolveOutputPath(value: string) {
  return path.isAbsolute(value) ? value : path.join(process.cwd(), value);
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
