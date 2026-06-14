import { NextResponse, type NextRequest } from "next/server";
import { scrapeHubEvents } from "@/lib/scraper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return runCronScrape(request);
}

export async function POST(request: NextRequest) {
  return runCronScrape(request);
}

async function runCronScrape(request: NextRequest) {
  if (!isAuthorized(request)) {
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

function isAuthorized(request: NextRequest) {
  const scrapeSecret = process.env.SCRAPE_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const scrapeHeader = request.headers.get("x-scrape-secret");
  const secretQuery = request.nextUrl.searchParams.get("secret");

  return Boolean(
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (scrapeSecret && scrapeHeader === scrapeSecret) ||
      (scrapeSecret && secretQuery === scrapeSecret),
  );
}
