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
    const result = await scrapeHubEvents({ persist: true });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.SCRAPE_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("Authorization");

  const isCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isHeaderAuth = secret && request.headers.get("x-scrape-secret") === secret;
  const isQueryAuth = secret && request.nextUrl.searchParams.get("secret") === secret;

  if (!isCronAuth && !isHeaderAuth && !isQueryAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await scrapeHubEvents({ persist: true });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
