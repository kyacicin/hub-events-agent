import { readFile } from "node:fs/promises";
import path from "node:path";

await loadLocalEnv();

const { scrapeHubEvents } = await import("../src/lib/scraper");
const result = await scrapeHubEvents();

console.log(
  JSON.stringify(
    {
      events: result.events.length,
      staff: result.staff.length,
      rawPosts: result.rawPostsCount,
      written: result.written,
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

function unquote(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
