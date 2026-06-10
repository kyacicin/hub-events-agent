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

  if (process.env.VERCEL === "1") {
    return NextResponse.json(
      {
        error:
          "Production scraping needs durable storage before Apify/Gemini runs are enabled.",
      },
      { status: 501 },
    );
  }

  try {
    const result = await scrapeHubEvents({ writeToDisk: true });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
