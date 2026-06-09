import { NextResponse, type NextRequest } from "next/server";
import { scrapeHubEvents } from "@/lib/scraper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return handleScrape(request);
}

export async function POST(request: NextRequest) {
  return handleScrape(request);
}

async function handleScrape(request: NextRequest) {
  const secret = process.env.SCRAPE_SECRET;

  if (secret) {
    const providedSecret =
      request.headers.get("x-scrape-secret") ??
      request.nextUrl.searchParams.get("secret");

    if (providedSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await scrapeHubEvents({
      writeToDisk: process.env.VERCEL !== "1",
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
