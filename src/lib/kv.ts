/**
 * Minimal Vercel KV / Upstash Redis REST client.
 *
 * Implemented with `fetch` and zero dependencies to match the existing
 * hand-rolled API clients (see `gemini.ts`, `scraper.ts`). Configure by
 * setting `KV_REST_API_URL` and `KV_REST_API_TOKEN` (provided automatically
 * when you attach a Vercel KV / Upstash store to the project).
 */

function kvCredentials() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

export function isKvConfigured() {
  return kvCredentials() !== null;
}

export async function kvGet(key: string): Promise<string | null> {
  const credentials = requireCredentials();
  const response = await fetch(
    `${credentials.url}/get/${encodeURIComponent(key)}`,
    {
      headers: { Authorization: `Bearer ${credentials.token}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `KV GET ${key} failed: ${response.status} ${await response.text()}`,
    );
  }

  const data = (await response.json()) as { result?: string | null };
  return data.result ?? null;
}

export async function kvSet(key: string, value: string): Promise<void> {
  const credentials = requireCredentials();
  const response = await fetch(
    `${credentials.url}/set/${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${credentials.token}` },
      body: value,
    },
  );

  if (!response.ok) {
    throw new Error(
      `KV SET ${key} failed: ${response.status} ${await response.text()}`,
    );
  }
}

function requireCredentials() {
  const credentials = kvCredentials();

  if (!credentials) {
    throw new Error(
      "KV is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN.",
    );
  }

  return credentials;
}
