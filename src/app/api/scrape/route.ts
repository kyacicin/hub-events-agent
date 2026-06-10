import { NextResponse, type NextRequest } from "next/server";
import { scrapeHubEvents } from "@/lib/scraper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.SCRAPE_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "SCRAPE_SECRET is required before scraping can run." },
      { status: 503 },
    );
  }

  if (request.headers.get("x-scrape-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Persists to Vercel KV when configured, otherwise the local filesystem.
    // On Vercel without a KV store, writeData throws a clear error instead of
    // discarding the scrape into the ephemeral serverless filesystem.
    const result = await scrapeHubEvents({ persist: true });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
